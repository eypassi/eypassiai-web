import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { createAiConsentStore } from "./ai-consent.ts";
import { createApprovedAiInvoker } from "./ai-invoke.ts";

const sessionA = { user: { id: "account-a" }, access_token: "synthetic-token-a" };
const sessionB = { user: { id: "account-b" }, access_token: "synthetic-token-b" };
const jsonResponse = () => new Response(JSON.stringify({ text: "synthetic answer" }), { headers: { "Content-Type": "application/json" } });
function fixture() {
  const values = new Map();
  const consent = createAiConsentStore({ getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) });
  consent.activateAccount("account-a");
  consent.grant("account-a");
  return consent;
}
function invoker(getSession, transport) {
  return createApprovedAiInvoker({
    getSession, supabaseUrl: "https://fixture.invalid", supabaseAnonKey: "synthetic-anon-key", fetch: transport,
  });
}

test("regression control: the real SDK's previous unguarded send can cross accounts while awaiting its session", async () => {
  const consent = fixture();
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const sent = [];
  const client = createClient("https://fixture.invalid", "synthetic-anon-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (_url, options) => { sent.push(options); return jsonResponse(); } },
  });
  client.auth.getSession = async () => { await gate; return { data: { session: sessionB }, error: null }; };
  const approval = consent.requestApproval("account-a");
  assert.equal(approval.isCurrent(), true);
  const pending = client.functions.invoke("doc-chat", { body: { documentContext: "account A context" } });
  consent.revoke("account-a");
  consent.activateAccount("account-b");
  release();
  await pending;
  assert.equal(approval.isCurrent(), false);
  assert.equal(sent.length, 1, "positive control must reach the real SDK's deferred fetch");
  assert.equal(new Headers(sent[0].headers).get("Authorization"), "Bearer synthetic-token-b");
  assert.equal(JSON.parse(sent[0].body).documentContext, "account A context");
});

test("revocation during session resolution prevents every function request", async () => {
  for (const name of ["scan-receipt", "doc-chat", "agent-command"]) {
    const consent = fixture();
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    let sends = 0;
    const invoke = invoker(async () => { await gate; return { data: { session: sessionA }, error: null }; }, async () => { sends++; return jsonResponse(); });
    const pending = invoke("account-a", consent.requestApproval("account-a"), name, { body: { private: "A" } });
    consent.revoke("account-a");
    release();
    await pending;
    assert.equal(sends, 0, name);
  }
});

test("a session belonging to B cannot send A's data even before the auth-state event arrives", async () => {
  const consent = fixture();
  let sends = 0;
  const invoke = invoker(async () => ({ data: { session: sessionB }, error: null }), async () => { sends++; return jsonResponse(); });
  const result = await invoke("account-a", consent.requestApproval("account-a"), "doc-chat", { body: { private: "A" } });
  assert.equal(sends, 0);
  assert.ok(result.error);
});

test("revocation after session capture reaches the real SDK but cannot cross the guarded fetch boundary", async () => {
  const consent = fixture();
  let sends = 0;
  const invoke = invoker(async () => {
    // The first microtask precedes the invoker's await continuation. The second
    // runs while the real SDK is resolving its fixed access-token callback.
    queueMicrotask(() => queueMicrotask(() => consent.revoke("account-a")));
    return { data: { session: sessionA }, error: null };
  }, async () => { sends++; return jsonResponse(); });
  const result = await invoke("account-a", consent.requestApproval("account-a"), "agent-command", { body: { command: "A" } });
  assert.equal(sends, 0);
  assert.ok(result.error);
});

test("approved requests use the captured account token, local signal and unchanged function payloads", async () => {
  for (const name of ["scan-receipt", "doc-chat", "agent-command"]) {
    const consent = fixture();
    const approval = consent.requestApproval("account-a");
    let sessions = 0;
    const sent = [];
    const invoke = invoker(async () => { sessions++; return { data: { session: sessions === 1 ? sessionA : sessionB }, error: null }; }, async (url, options) => { sent.push({ url, options }); return jsonResponse(); });
    const result = await invoke("account-a", approval, name, { body: { value: name }, headers: { "X-User-Tier": "pro", Authorization: "Bearer untrusted-override" } });
    assert.equal(result.error, null);
    assert.equal(result.data.text, "synthetic answer");
    assert.equal(sessions, 1, "the SDK must not resolve a later account's session");
    assert.equal(sent.length, 1);
    assert.equal(sent[0].url, `https://fixture.invalid/functions/v1/${name}`);
    const headers = new Headers(sent[0].options.headers);
    assert.equal(headers.get("Authorization"), "Bearer synthetic-token-a");
    assert.equal(headers.get("apikey"), "synthetic-anon-key");
    assert.equal(headers.get("X-User-Tier"), "pro");
    assert.equal(sent[0].options.signal, approval.signal);
    assert.deepEqual(JSON.parse(sent[0].options.body), { value: name });
  }
});

test("revocation aborts a transport already in progress and does not return its stale result", async () => {
  const consent = fixture();
  const approval = consent.requestApproval("account-a");
  let started;
  const transportStarted = new Promise(resolve => { started = resolve; });
  const invoke = invoker(async () => ({ data: { session: sessionA }, error: null }), (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    started();
  }));
  const pending = invoke("account-a", approval, "scan-receipt", { body: { images: ["synthetic"] } });
  await transportStarted;
  consent.revoke("account-a");
  const result = await pending;
  assert.equal(approval.signal.aborted, true);
  assert.equal(approval.isCurrent(), false);
  assert.equal(result.data, null);
  assert.ok(result.error);
});
