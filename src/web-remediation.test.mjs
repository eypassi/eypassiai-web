import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const folder = dirname(new URL(import.meta.url).pathname);
const account = { id: "synthetic-account-a", email: "fixture@example.invalid" };
const empty = { properties: [], units: [], propertyImages: [], unitImages: [], tenants: [], contracts: [], transactions: [], documents: [], travel: [], afa: [], utility: [], portfolio: [], profile: null };

function fixture(initialStates = [], options = {}) {
  const calls = [], alerts = [], values = new Map(), states = [...initialStates], effects = [], cleanups = [];
  let cursor = 0;
  const authEvents = new Set();
  const session = { user: account, access_token: "synthetic-account-a-token", refresh_token: "synthetic-refresh", expires_at: Math.floor(Date.now() / 1000) + 3600 };
  const sdk = {
    auth: {
      getSession: async () => ({ data: { session: options.session === undefined ? session : options.session }, error: null }),
      onAuthStateChange: callback => { authEvents.add(callback); return { data: { subscription: { unsubscribe() { authEvents.delete(callback); } } } }; },
    },
    storage: { from: () => ({ remove: async () => { calls.push("storage.remove"); return { data: null, error: new Error("synthetic storage denied") }; }, upload: async () => { calls.push("storage.upload"); return { error: null }; } }) },
    from: table => ({
      insert: payload => { calls.push({ table, payload }); const response = { data: { id: "synthetic-created" }, error: options.insertError ?? null }; return Object.assign(Promise.resolve(response), { select: () => ({ single: async () => response }) }); },
      delete: () => ({ eq: async () => { calls.push(`delete:${table}`); return { error: null }; } }),
      update: () => ({ eq: async () => ({ error: null }) }),
      upsert: async payload => { calls.push({ table, payload }); return { error: null }; },
    }),
  };
  const react = {
    useState: initial => { const index = cursor++; if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial; return [states[index], value => { states[index] = typeof value === "function" ? value(states[index]) : value; }]; },
    useEffect: callback => effects.push(callback),
    useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
  };
  const cache = new Map();
  const sandbox = { console, Headers, Response, Request, URL, URLSearchParams, AbortController, DOMException, TextEncoder, TextDecoder, crypto, setTimeout, clearTimeout, fetch: async () => { throw new Error("Unexpected network in component fixture"); }, window: { addEventListener() {}, localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }, confirm: () => true, alert: value => alerts.push(String(value)) }, alert: value => alerts.push(String(value)), FormData: class { constructor(form) { this.form = form; } get(key) { return this.form.values[key] ?? null; } } };
  function load(path) {
    if (cache.has(path)) return cache.get(path).exports;
    const module = { exports: {} }; cache.set(path, module);
    let code = readFileSync(path, "utf8");
    if (path.endsWith("AppRuntime.tsx")) code += "\nexport const testBoundary = { AppRuntime, PropertiesView, UnitsView, TenantsView, DocumentsView, AgentView, ReceiptsView, ProfileView, removeDocument, remove, aiConsent };";
    const output = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const localRequire = name => name === "react" ? react : name === "react/jsx-runtime" ? { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) } : name === "@supabase/supabase-js" ? { createClient: () => sdk } : name === "./supabase" ? { supabase: sdk, supabaseUrl: "https://fixture.invalid", supabaseAnonKey: "synthetic-anon", publicObjectUrl: (_bucket, path) => path } : name.startsWith(".") ? load(resolve(dirname(path), name + ".ts")) : require(name);
    vm.runInNewContext(output, { ...sandbox, module, exports: module.exports, require: localRequire }, { filename: path });
    return module.exports;
  }
  const boundary = load(resolve(folder, "AppRuntime.tsx")).testBoundary;
  boundary.aiConsent.activateAccount(account.id); boundary.aiConsent.grant(account.id);
  return { ...boundary, calls, alerts, states, session, sdk, render(component, props = {}) { cursor = 0; return component(props); }, startEffects() { for (const effect of effects.splice(0)) { const cleanup = effect(); if (typeof cleanup === "function") cleanups.push(cleanup); } }, cleanupEffects() { for (const cleanup of cleanups.splice(0)) cleanup(); }, emit(event, nextSession = session) { for (const callback of authEvents) callback(event, nextSession); return authEvents.size > 0; }, form(values) { return { preventDefault() {}, currentTarget: { values, reset() {} } }; } };
}

function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  const children = [...[].concat(tree.props?.children ?? []), tree.props?.form];
  return [tree, ...children.flatMap(nodes)];
}
const node = (tree, name) => nodes(tree).find(item => item.type?.name === name || item.type === name);

test("file hold stops document file and reference deletion before SDK calls", async () => {
  const f = fixture();
  await f.removeDocument({ id: "synthetic-document", file_url: "synthetic/file.pdf" }, () => {});
  assert.equal(f.calls.length, 0, "hold must block both storage and metadata deletion");
  assert.ok(f.alerts.some(value => /Datei|eingeschränkt/.test(value)));
});

for (const component of ["PropertiesView", "UnitsView", "TenantsView"]) {
  test(`${component} blocks image-associated metadata creation before its first request`, async () => {
    const f = fixture();
    const tree = f.render(f[component], { data: empty, user: account, refresh() {} });
    await node(tree, "CrudLayout").props.form.props.onSubmit(f.form({ image: { size: 4, type: "image/png" }, address: "synthetic", name: "synthetic", property_id: "synthetic-property" }));
    assert.equal(f.calls.length, 0, "must not create metadata before discovering the upload is held");
    assert.ok(f.alerts.length);
  });
}

test("file hold does not stop a property creation without a file", async () => {
  const f = fixture();
  const tree = f.render(f.PropertiesView, { data: empty, user: account, refresh() {} });
  await node(tree, "CrudLayout").props.form.props.onSubmit(f.form({ address: "synthetic" }));
  assert.equal(f.calls[0].table, "properties");
});

test("ordinary profile editing does not rewrite its file association during the hold", async () => {
  const f = fixture();
  const tree = f.render(f.ProfileView, { data: { ...empty, profile: { id: account.id, avatar_url: "synthetic/avatar.png" } }, user: account, refresh() {} });
  await node(tree, "form").props.onSubmit(f.form({ display_name: "Synthetic display name" }));
  assert.equal(f.calls[0].table, "profiles");
  assert.equal("avatar_url" in f.calls[0].payload, false, "display-name edits must leave stored file associations untouched");
});

test("file hold stops document uploads before any SDK request", async () => {
  const f = fixture();
  const tree = f.render(f.DocumentsView, { data: empty, user: account, refresh() {} });
  await node(tree, "CrudLayout").props.form.props.onSubmit(f.form({ file: { size: 4, type: "application/pdf" } }));
  assert.equal(f.calls.length, 0);
});

test("file hold stops deletion of a parent with attached files but keeps non-file deletion", async () => {
  const f = fixture();
  const property = { id: "synthetic-property", user_id: account.id, address: "synthetic", type: "house", image_url: "synthetic/image.jpg" };
  const tree = f.render(f.PropertiesView, { data: { ...empty, properties: [property] }, user: account, refresh() {} });
  await node(tree, "DataCard").props.onDelete();
  assert.equal(f.calls.length, 0);
  await f.remove("travel_expenses", "synthetic-trip", () => {});
  assert.equal(f.calls[0], "delete:travel_expenses");
});

test("recovery auth event selects a dedicated recovery screen instead of workspace", () => {
  const f = fixture();
  f.render(f.AppRuntime); f.startEffects(); f.emit("PASSWORD_RECOVERY");
  const result = f.render(f.AppRuntime);
  assert.equal(result.type.name, "PasswordRecoveryScreen");
});

test("a recovery callback received before the React effect is retained", () => {
  const f = fixture();
  assert.equal(f.emit("PASSWORD_RECOVERY"), true, "subscribe during module initialization so fast callbacks cannot be lost");
  f.render(f.AppRuntime); f.startEffects(); f.emit("INITIAL_SESSION");
  assert.equal(f.render(f.AppRuntime).type.name, "PasswordRecoveryScreen");
});

test("StrictMode effect cleanup/setup retains an early recovery intent", () => {
  const f = fixture();
  f.emit("PASSWORD_RECOVERY"); f.render(f.AppRuntime); f.startEffects(); f.emit("INITIAL_SESSION");
  assert.equal(f.render(f.AppRuntime).type.name, "PasswordRecoveryScreen");
  f.cleanupEffects(); f.startEffects(); f.emit("INITIAL_SESSION");
  assert.equal(f.render(f.AppRuntime).type.name, "PasswordRecoveryScreen", "effect replay must not discard a valid recovery callback");
});

function proposalFixture(proposal, options) {
  const f = fixture(["synthetic command", proposal, false], options);
  const tree = f.render(f.AgentView, { data: { ...empty, properties: [{ id: "own-property", user_id: account.id }] }, user: account, refresh() {} });
  return { ...f, apply: () => nodes(tree).find(item => item.type === "button" && item.props.children === "Übernehmen").props.onClick() };
}

test("AI proposal only sends allowlisted fields and fixes ownership independently", async () => {
  const f = proposalFixture({ action_type: "create_transaction", data: { user_id: "synthetic-b", admin: true, amount: 2, category: "Sonstiges", date: "2026-11-01" } });
  await f.apply();
  const call = f.calls.find(item => typeof item === "object");
  assert.ok(!call || (call.payload.user_id === account.id && !("admin" in call.payload)));
});

test("AI proposal rejects a foreign parent before insertion", async () => {
  const f = proposalFixture({ action_type: "create_transaction", data: { amount: 2, category: "Sonstiges", date: "2026-11-01", property_id: "foreign-property" } });
  await f.apply();
  assert.equal(f.calls.length, 0);
});

test("failed AI insertion retains the proposal and exposes an error", async () => {
  const proposal = { action_type: "create_transaction", data: { amount: 2, category: "Sonstiges", date: "2026-11-01" } };
  const f = proposalFixture(proposal, { insertError: new Error("synthetic insertion denied") });
  await f.apply();
  assert.equal(f.states[1], proposal);
  assert.ok(f.states.some(value => typeof value === "string" && /synthetic insertion denied|speicher|übernehm/i.test(value)));
});

test("a changed session cannot dispatch an old account's AI proposal", async () => {
  const f = proposalFixture({ action_type: "create_transaction", data: { amount: 2, category: "Sonstiges", date: "2026-11-01" } }, { session: { user: { id: "synthetic-b" }, access_token: "synthetic-b-token" } });
  await f.apply();
  assert.equal(f.calls.length, 0);
});
