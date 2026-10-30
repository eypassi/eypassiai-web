import { createClient } from "@supabase/supabase-js";
import type { AiRequestApproval } from "./ai-consent";

type AccountSession = { user: { id: string }; access_token: string };
type AiFunction = "scan-receipt" | "doc-chat" | "agent-command";
type InvocationOptions = { body: Record<string, unknown>; headers?: Record<string, string> };
type InvocationDependencies = {
  getSession: () => Promise<{ data: { session: AccountSession | null }; error?: unknown }>;
  supabaseUrl: string;
  supabaseAnonKey: string;
  fetch?: typeof globalThis.fetch;
};

/** Bind data, approval and authorization to one account through the actual fetch boundary. */
export function createApprovedAiInvoker(dependencies: InvocationDependencies) {
  const transport = dependencies.fetch ?? globalThis.fetch.bind(globalThis);
  return async function invoke<T = unknown>(
    accountId: string,
    approval: AiRequestApproval | null,
    functionName: AiFunction,
    options: InvocationOptions,
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      if (!approval?.isCurrent()) throw new DOMException("KI-Freigabe nicht mehr gültig", "AbortError");
      const { data: { session }, error } = await dependencies.getSession();
      if (error) throw new Error("Die Anmeldung konnte nicht geprüft werden. Bitte erneut versuchen.");
      if (!session || session.user.id !== accountId || !session.access_token) {
        throw new Error("Das angemeldete Konto hat sich geändert. Bitte prüfe die Anmeldung vor einer neuen KI-Anfrage.");
      }
      if (!approval.isCurrent()) throw new DOMException("KI-Freigabe nicht mehr gültig", "AbortError");

      // The shared SDK client awaits its live session before sending. A separate
      // client keeps this request's identity fixed, and its fetch checks again
      // after the SDK's asynchronous preparation has finished.
      const client = createClient(dependencies.supabaseUrl, dependencies.supabaseAnonKey, {
        accessToken: async () => session.access_token,
        global: {
          fetch: (input, init) => {
            if (!approval.isCurrent()) return Promise.reject(new DOMException("KI-Freigabe nicht mehr gültig", "AbortError"));
            const headers = new Headers(init?.headers);
            headers.set("Authorization", `Bearer ${session.access_token}`);
            return transport(input, { ...init, headers, signal: approval.signal });
          },
        },
      });
      return await client.functions.invoke<T>(functionName, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${session.access_token}` },
        signal: approval.signal,
      });
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error("Die KI-Anfrage konnte nicht ausgeführt werden.") };
    } finally {
      approval?.release();
    }
  };
}
