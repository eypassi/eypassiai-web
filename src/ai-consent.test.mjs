import assert from "node:assert/strict";
import test from "node:test";
import { AI_CONSENT_VERSION, consentStorageKey, createAiConsentStore } from "./ai-consent.ts";

function fixture(initial = {}) {
  const values = new Map(Object.entries(initial));
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  return { values, storage, store: createAiConsentStore(storage, () => "2026-10-30T12:00:00.000Z") };
}

test("account B cannot inherit account A approval; logout blocks every account", () => {
  const { store, values } = fixture();
  store.activateAccount("account-a");
  assert.equal(store.grant("account-a"), true);
  assert.equal(store.isApproved("account-a"), true);
  const record = JSON.parse(values.get(consentStorageKey("account-a")));
  assert.deepEqual(record, { accountId: "account-a", version: AI_CONSENT_VERSION, acceptedAt: "2026-10-30T12:00:00.000Z" });
  store.activateAccount(null);
  assert.equal(store.isApproved("account-a"), false);
  assert.equal(store.grant("account-a"), false);
  store.activateAccount("account-b");
  assert.equal(store.isApproved("account-b"), false);
  assert.equal(store.isApproved("account-a"), false);
  assert.equal(store.requestApproval("account-a"), null);
});

test("legacy global approval is discarded and never migrated", () => {
  const { store, values } = fixture({ "eypassiai.aiConsent": "true" });
  store.activateAccount("account-a");
  assert.equal(store.isApproved("account-a"), false);
  assert.equal(values.has("eypassiai.aiConsent"), false);
});

test("revoke blocks new requests and invalidates an in-flight request", () => {
  const { store, values } = fixture();
  store.activateAccount("account-a");
  store.grant("account-a");
  const request = store.requestApproval("account-a");
  assert.equal(request.isCurrent(), true);
  store.revoke("account-a");
  assert.equal(store.isApproved("account-a"), false);
  assert.equal(store.requestApproval("account-a"), null);
  assert.equal(request.isCurrent(), false);
  assert.equal(values.has(consentStorageKey("account-a")), false);
  store.grant("account-a");
  assert.equal(request.isCurrent(), false, "reapproval cannot revive a previous request");
});

test("switching accounts invalidates pending requests even after returning to A", async () => {
  const { store } = fixture();
  store.activateAccount("account-a");
  store.grant("account-a");
  const request = store.requestApproval("account-a");
  let release;
  let providerCalls = 0;
  const preparation = new Promise(resolve => { release = resolve; });
  const operation = preparation.then(() => { if (request.isCurrent()) providerCalls++; });
  store.activateAccount("account-b");
  store.activateAccount("account-a");
  release();
  await operation;
  assert.equal(providerCalls, 0);
  assert.equal(store.isApproved("account-a"), false, "returning to A requires new approval after a known account switch");
});

test("wrong account, old version, malformed records and missing timestamps fail closed", () => {
  for (const record of [
    "true", "{bad", JSON.stringify({ accountId: "account-b", version: AI_CONSENT_VERSION, acceptedAt: "2026-10-30T12:00:00Z" }),
    JSON.stringify({ accountId: "account-a", version: "old", acceptedAt: "2026-10-30T12:00:00Z" }),
    JSON.stringify({ accountId: "account-a", version: AI_CONSENT_VERSION }),
  ]) {
    const { store } = fixture({ [consentStorageKey("account-a")]: record });
    store.activateAccount("account-a");
    assert.equal(store.isApproved("account-a"), false);
  }
});

test("revocation from another browser tab updates state and invalidates requests", () => {
  const { store, storage } = fixture();
  store.activateAccount("account-a");
  store.grant("account-a");
  const request = store.requestApproval("account-a");
  let notifications = 0;
  const unsubscribe = store.subscribe(() => notifications++);
  storage.removeItem(consentStorageKey("account-a"));
  store.storageChanged(consentStorageKey("account-a"));
  assert.equal(store.isApproved("account-a"), false);
  assert.equal(request.isCurrent(), false);
  assert.equal(notifications, 1);
  unsubscribe();
});

test("unavailable storage cannot accidentally grant approval", () => {
  const store = createAiConsentStore({
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); },
  });
  store.activateAccount("account-a");
  assert.equal(store.grant("account-a"), false);
  assert.equal(store.isApproved("account-a"), false);
});

test("another account's consent update does not interrupt an approved request", () => {
  const { store } = fixture();
  store.activateAccount("account-a");
  store.grant("account-a");
  const request = store.requestApproval("account-a");
  store.storageChanged(consentStorageKey("account-b"));
  assert.equal(request.isCurrent(), true);
});

test("revocation and account changes abort the associated network signal", () => {
  for (const invalidate of [store => store.revoke("account-a"), store => store.activateAccount("account-b")]) {
    const { store } = fixture();
    store.activateAccount("account-a");
    store.grant("account-a");
    const request = store.requestApproval("account-a");
    assert.equal(request.signal?.aborted, false);
    invalidate(store);
    assert.equal(request.signal.aborted, true);
  }
});

test("explicit logout withdraws A's approval, including on the next page load", () => {
  const { store, storage, values } = fixture();
  store.activateAccount("account-a");
  store.grant("account-a");
  store.activateAccount(null);
  assert.equal(values.has(consentStorageKey("account-a")), false);
  store.activateAccount("account-a");
  assert.equal(store.isApproved("account-a"), false);
  const reloaded = createAiConsentStore(storage);
  reloaded.activateAccount("account-a");
  assert.equal(reloaded.isApproved("account-a"), false);
});

test("same-account auth events and a normal page reload retain that account's approval", () => {
  const { store, storage } = fixture();
  store.activateAccount("account-a");
  store.grant("account-a");
  const request = store.requestApproval("account-a");
  store.activateAccount("account-a");
  assert.equal(store.isApproved("account-a"), true);
  assert.equal(request.isCurrent(), true);
  const reloaded = createAiConsentStore(storage);
  reloaded.activateAccount("account-a");
  assert.equal(reloaded.isApproved("account-a"), true);
});

test("UI teardown invalidates pending work without withdrawing the same account's approval", () => {
  const { store } = fixture();
  store.activateAccount("account-a");
  store.grant("account-a");
  const request = store.requestApproval("account-a");
  store.invalidateRequests();
  assert.equal(request.isCurrent(), false);
  assert.equal(request.signal.aborted, true);
  store.activateAccount("account-a");
  assert.equal(store.isApproved("account-a"), true);
});

test("an account switch fails closed when persisted approval cannot be removed", () => {
  const { store, storage, values } = fixture();
  store.activateAccount("account-a");
  store.grant("account-a");
  storage.removeItem = () => { throw new Error("browser storage blocked"); };
  store.activateAccount("account-b");
  assert.equal(values.has(consentStorageKey("account-a")), true, "simulate a failed durable removal");
  store.activateAccount("account-a");
  assert.equal(store.isApproved("account-a"), false);
  assert.equal(store.requestApproval("account-a"), null);
});
