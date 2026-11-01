import assert from "node:assert/strict";
import test from "node:test";

async function fixture(updateUser = async () => ({ error: null })) {
  const module = await import("./password-recovery.ts").catch(() => null);
  assert.equal(typeof module?.createPasswordRecovery, "function", "missing account-bound recovery controller");
  let session = { user: { id: "synthetic-a" }, access_token: "synthetic-a-token", refresh_token: "synthetic-refresh", expires_at: Math.floor(Date.now() / 1000) + 3600 };
  const store = module.createPasswordRecovery({ getSession: async () => ({ data: { session }, error: null }), updateUser });
  store.handleAuth("PASSWORD_RECOVERY", session);
  return { store, session, module, changeSession(value) { session = value; } };
}
test("recovery validates password length and confirmation before update", async () => {
  let calls = 0; const { store } = await fixture(async () => { calls++; return { error: null }; });
  store.setPassword("short"); store.setConfirmation("short"); await store.submit();
  assert.equal(calls, 0); assert.match(store.getSnapshot().error, /8/);
  store.setPassword("synthetic-new-password"); store.setConfirmation("different"); await store.submit();
  assert.equal(calls, 0); assert.match(store.getSnapshot().error, /überein/);
});
test("recovery success clears both secrets and exposes success", async () => {
  const { store } = await fixture();
  store.setPassword("synthetic-new-password"); store.setConfirmation("synthetic-new-password");
  await store.submit();
  assert.equal(store.getSnapshot().complete, true);
  assert.equal(store.getSnapshot().password, ""); assert.equal(store.getSnapshot().confirmation, "");
});
for (const kind of ["returned", "thrown"]) {
  test(`recovery displays ${kind} update errors without claiming success`, async () => {
    const { store } = await fixture(async () => { if (kind === "thrown") throw new Error("synthetic denied"); return { error: { message: "synthetic denied" } }; });
    store.setPassword("synthetic-new-password"); store.setConfirmation("synthetic-new-password"); await store.submit();
    assert.equal(store.getSnapshot().complete, false); assert.match(store.getSnapshot().error, /synthetic denied/);
  });
}
test("account switch or signout clears secrets and ignores late update results", async () => {
  let release, started; const gate = new Promise(resolve => { release = resolve; });
  const ready = new Promise(resolve => { started = resolve; });
  const { store } = await fixture(async (_session, _password, current, signal) => { started(); await gate; assert.equal(current(), false); assert.equal(signal.aborted, true); return { error: null }; });
  store.setPassword("synthetic-new-password"); store.setConfirmation("synthetic-new-password");
  const pending = store.submit(); await ready;
  store.handleAuth("SIGNED_IN", { user: { id: "synthetic-b" } }); release(); await pending;
  assert.equal(store.getSnapshot().accountId, null); assert.equal(store.getSnapshot().password, ""); assert.equal(store.getSnapshot().complete, false);
});
test("changed session before dispatch cannot update another recovery account", async () => {
  let calls = 0; const { store, changeSession } = await fixture(async () => { calls++; return { error: null }; });
  store.setPassword("synthetic-new-password"); store.setConfirmation("synthetic-new-password");
  changeSession({ user: { id: "synthetic-b" }, access_token: "synthetic-b-token" }); await store.submit();
  assert.equal(calls, 0); assert.equal(store.getSnapshot().password, ""); assert.equal(store.getSnapshot().accountId, null);
});
test("real SDK recovery update uses captured token and no shared browser storage", async () => {
  const { module, session } = await fixture(); const sent = [];
  const update = module.createRecoveryPasswordUpdater({ supabaseUrl: "https://fixture.invalid", supabaseAnonKey: "synthetic-anon", fetch: async (url, init) => { sent.push({ url, init }); return new Response(JSON.stringify({ id: session.user.id }), { headers: { "Content-Type": "application/json" } }); } });
  const signal = new AbortController().signal;
  const result = await update(session, "synthetic-new-password", () => true, signal);
  assert.equal(result.error, null); assert.equal(sent.length, 1);
  assert.equal(sent[0].url, "https://fixture.invalid/auth/v1/user");
  assert.equal(sent[0].init.method, "PUT"); assert.equal(new Headers(sent[0].init.headers).get("Authorization"), "Bearer synthetic-a-token");
  assert.deepEqual(JSON.parse(sent[0].init.body), { password: "synthetic-new-password", code_challenge: null, code_challenge_method: null });
});
test("SDK preparation cannot send a password after recovery is invalidated", async () => {
  const { module, session } = await fixture(); let sends = 0;
  const update = module.createRecoveryPasswordUpdater({ supabaseUrl: "https://fixture.invalid", supabaseAnonKey: "synthetic-anon", fetch: async () => { sends++; return new Response("{}"); } });
  let current = true; const pending = update(session, "synthetic-new-password", () => current, new AbortController().signal);
  current = false; const result = await pending;
  assert.equal(sends, 0); assert.ok(result.error);
});

test("late form events cannot retain passwords after signout", async () => {
  const { store } = await fixture();
  store.setPassword("synthetic-new-password"); store.setConfirmation("synthetic-new-password");
  store.handleAuth("SIGNED_OUT", null);
  store.setPassword("stale synthetic event"); store.setConfirmation("stale synthetic event");
  assert.equal(store.getSnapshot().password, ""); assert.equal(store.getSnapshot().confirmation, "");
});

test("effect teardown aborts pending work and clears secrets while retaining recovery intent", async () => {
  let release, started;
  const gate = new Promise(resolve => { release = resolve; }); const ready = new Promise(resolve => { started = resolve; });
  const { store } = await fixture(async (_session, _password, current, signal) => { started(); await gate; assert.equal(current(), false); assert.equal(signal.aborted, true); return { error: null }; });
  assert.equal(typeof store.invalidateForTeardown, "function", "recovery intent must survive effect replay separately from auth logout");
  store.setPassword("synthetic-new-password"); store.setConfirmation("synthetic-new-password");
  const pending = store.submit(); await ready;
  store.invalidateForTeardown();
  assert.equal(store.getSnapshot().accountId, "synthetic-a"); assert.equal(store.getSnapshot().password, ""); assert.equal(store.getSnapshot().confirmation, ""); assert.equal(store.getSnapshot().busy, false);
  release(); await pending;
  assert.equal(store.getSnapshot().complete, false);
  store.handleAuth("SIGNED_OUT", null); store.invalidateForTeardown();
  assert.equal(store.getSnapshot().accountId, null); assert.equal(store.getSnapshot().password, "");
});
