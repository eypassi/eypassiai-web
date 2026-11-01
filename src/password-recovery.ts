import { createClient } from "@supabase/supabase-js";

type RecoverySession = { user: { id: string }; access_token: string; refresh_token: string; expires_at?: number };
type RecoveryState = { accountId: string | null; password: string; confirmation: string; busy: boolean; complete: boolean; error: string | null };
type Update = (session: RecoverySession, password: string, current: () => boolean, signal: AbortSignal) => Promise<{ error?: unknown }>;
type Dependencies = { getSession: () => Promise<{ data: { session: RecoverySession | null }; error?: unknown }>; updateUser: Update };
const initial = (): RecoveryState => ({ accountId: null, password: "", confirmation: "", busy: false, complete: false, error: null });
const message = (error: unknown) => typeof (error as { message?: unknown })?.message === "string" ? (error as { message: string }).message : "Das Passwort konnte nicht geändert werden. Bitte versuche es erneut.";

export function createPasswordRecovery(dependencies: Dependencies) {
  let state = initial(), generation = 0, pending: AbortController | null = null;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<RecoveryState>) => { state = { ...state, ...patch }; listeners.forEach(listener => listener()); };
  function cancel() { generation++; pending?.abort(); pending = null; state = initial(); listeners.forEach(listener => listener()); }
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => state,
    cancel,
    invalidateForTeardown() {
      // Effect replay is not an explicit end to the recovery session. Keep its
      // account intent while discarding secrets and all work from the old UI.
      generation++; pending?.abort(); pending = null;
      publish({ password: "", confirmation: "", busy: false, error: null });
    },
    handleAuth(event: string, session: { user: { id: string } } | null) {
      if (event === "PASSWORD_RECOVERY" && session) { cancel(); publish({ accountId: session.user.id }); }
      else if (event === "SIGNED_OUT" || (state.accountId && session?.user.id !== state.accountId)) cancel();
    },
    setPassword(password: string) { if (state.accountId && !state.busy && !state.complete) publish({ password, error: null }); },
    setConfirmation(confirmation: string) { if (state.accountId && !state.busy && !state.complete) publish({ confirmation, error: null }); },
    async submit() {
      if (!state.accountId || state.busy) return;
      if (state.password.length < 8 || state.password.length > 1024) { publish({ error: "Bitte verwende ein Passwort mit 8 bis 1024 Zeichen." }); return; }
      if (state.password !== state.confirmation) { publish({ error: "Die beiden Passwörter stimmen nicht überein." }); return; }
      const accountId = state.accountId, password = state.password, revision = generation;
      pending = new AbortController();
      const signal = pending.signal;
      const current = () => generation === revision && state.accountId === accountId && !signal.aborted;
      publish({ busy: true, error: null });
      try {
        const { data: { session }, error } = await dependencies.getSession();
        if (!current()) return;
        if (error) throw error;
        if (!session || session.user.id !== accountId) { cancel(); return; }
        const result = await dependencies.updateUser(session, password, current, signal);
        if (!current()) return;
        if (result.error) throw result.error;
        publish({ password: "", confirmation: "", complete: true });
      } catch (error) { if (current()) publish({ error: message(error) }); }
      finally { if (current()) { pending = null; publish({ busy: false }); } }
    },
  };
}

/** A separate SDK client holds only the captured session in private memory. */
export function createRecoveryPasswordUpdater(dependencies: { supabaseUrl: string; supabaseAnonKey: string; fetch?: typeof globalThis.fetch }): Update {
  const transport = dependencies.fetch ?? globalThis.fetch.bind(globalThis);
  return async (session, password, current, signal) => {
    const storageKey = `recovery-${crypto.randomUUID()}`;
    const memory = new Map([[storageKey, JSON.stringify(session)]]);
    try {
      if (!current()) throw new DOMException("Wiederherstellung nicht mehr gültig", "AbortError");
      const endpoint = `${dependencies.supabaseUrl.replace(/\/$/, "")}/auth/v1/user`;
      const client = createClient(dependencies.supabaseUrl, dependencies.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, storageKey, storage: { getItem: key => memory.get(key) ?? null, setItem: (key, value) => { memory.set(key, value); }, removeItem: key => { memory.delete(key); } } },
        global: { fetch: (input, init) => {
          // A local error response lets the SDK return an AuthApiError without
          // its network-error logger printing a rejected transport exception.
          if (!current() || signal.aborted || String(input) !== endpoint || init?.method !== "PUT") return Promise.resolve(new Response(JSON.stringify({ msg: "Wiederherstellung nicht mehr gültig. Bitte öffne den Link erneut.", code: "recovery_invalidated" }), { status: 409, headers: { "Content-Type": "application/json" } }));
          const headers = new Headers(init.headers);
          headers.set("Authorization", `Bearer ${session.access_token}`);
          return transport(input, { ...init, headers, signal });
        } },
      });
      const result = await client.auth.updateUser({ password });
      if (result.error) return { error: result.error };
      if (result.data.user?.id !== session.user.id) return { error: new Error("Das Wiederherstellungskonto konnte nicht bestätigt werden.") };
      return { error: null };
    } catch (error) { return { error }; }
    finally { memory.clear(); }
  };
}
