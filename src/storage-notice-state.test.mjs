import assert from "node:assert/strict";
import test from "node:test";

import { createStorageNoticeState } from "./storage-notice-state.ts";

const KEY = "eypassiai.storageNotice";
const VERSION = "2026-11-01";
const NOW = Date.parse("2026-11-01T12:00:00Z");
const MAX_AGE = 180 * 24 * 60 * 60 * 1000;

function fixture(initial = {}, timestamp = NOW) {
  const values = new Map(Object.entries(initial));
  const access = [];
  const storage = {
    getItem(key) { access.push(["get", key]); return values.get(key) ?? null; },
    setItem(key, value) { access.push(["set", key]); values.set(key, value); },
    removeItem(key) { access.push(["remove", key]); values.delete(key); },
  };
  const state = createStorageNoticeState(storage, () => timestamp);
  return { values, access, storage, state, setTime(value) { timestamp = value; } };
}

test("a fresh visit shows the notice without writing a preference", () => {
  const { state, access, values } = fixture();
  assert.equal(state.isDismissed(), false);
  assert.equal(values.size, 0);
  assert.ok(access.every(([operation]) => operation === "get"));
});

test("acknowledgement stores only the public version and numeric timestamp", () => {
  const { state, values } = fixture();
  state.dismiss();
  assert.equal(state.isDismissed(), true);
  assert.deepEqual(JSON.parse(values.get(KEY)), { version: VERSION, dismissedAt: NOW });
  assert.equal(values.size, 1);
});

test("a stored acknowledgement survives another page load until just before 180 days", () => {
  const { state, storage, setTime, values } = fixture();
  state.dismiss();
  setTime(NOW + MAX_AGE - 1);
  const nextPage = createStorageNoticeState(storage, () => NOW + MAX_AGE - 1);
  assert.equal(nextPage.isDismissed(), true);
  assert.equal(values.has(KEY), true);
});

test("at exactly 180 days the next visit shows the notice and tries to remove the record", () => {
  const { state, values, access } = fixture({ [KEY]: JSON.stringify({ version: VERSION, dismissedAt: NOW - MAX_AGE }) });
  assert.equal(state.isDismissed(), false);
  assert.equal(values.has(KEY), false);
  assert.ok(access.some(([operation, key]) => operation === "remove" && key === KEY));
});

test("unknown versions, malformed records and invalid or future timestamps are ignored and removed", () => {
  const invalidRecords = [
    "{bad", "null", "true", "[]", JSON.stringify({ version: "old", dismissedAt: NOW }),
    JSON.stringify({ version: VERSION }),
    JSON.stringify({ version: VERSION, dismissedAt: String(NOW) }),
    JSON.stringify({ version: VERSION, dismissedAt: null }),
    JSON.stringify({ version: VERSION, dismissedAt: -1 }),
    JSON.stringify({ version: VERSION, dismissedAt: NOW + 1 }),
    JSON.stringify({ version: VERSION, dismissedAt: NOW - MAX_AGE - 1 }),
    `{"version":"${VERSION}","dismissedAt":1e999}`,
  ];
  for (const record of invalidRecords) {
    const { state, values, access } = fixture({ [KEY]: record });
    assert.equal(state.isDismissed(), false, record);
    assert.equal(values.has(KEY), false, record);
    assert.ok(access.some(([operation]) => operation === "remove"), record);
  }
});

test("a failed removal still treats an invalid preference as unacknowledged", () => {
  const { state, storage, values } = fixture({ [KEY]: "invalid" });
  storage.removeItem = () => { throw new Error("removal blocked"); };
  assert.equal(state.isDismissed(), false);
  assert.equal(values.has(KEY), true);
});

test("blocked reads show the notice and a blocked write still dismisses the current page", () => {
  const { state, storage, values } = fixture();
  storage.getItem = () => { throw new Error("read blocked"); };
  storage.setItem = () => { throw new Error("write blocked"); };
  storage.removeItem = () => { throw new Error("removal blocked"); };
  assert.equal(state.isDismissed(), false);
  assert.doesNotThrow(() => state.dismiss());
  assert.equal(state.isDismissed(), true);
  assert.equal(values.size, 0);
});

test("a failed write does not make another page inherit the temporary dismissal", () => {
  const { state, storage } = fixture();
  storage.setItem = () => { throw new Error("quota exceeded"); };
  state.dismiss();
  assert.equal(state.isDismissed(), true);
  assert.equal(createStorageNoticeState(storage, () => NOW).isDismissed(), false);
});

test("reading, dismissing and invalid-record removal never touch auth or AI preferences", () => {
  const unrelated = {
    "sb-krrhegbikgusqubxcxbr-auth-token": "synthetic-session",
    "eypassiai.aiConsent.account.synthetic-account": "synthetic-approval",
    "another-site-preference": "retained",
  };
  const { state, values, access } = fixture({ ...unrelated, [KEY]: "invalid" });
  assert.equal(state.isDismissed(), false);
  state.dismiss();
  assert.equal(state.isDismissed(), true);
  for (const [key, value] of Object.entries(unrelated)) assert.equal(values.get(key), value);
  assert.ok(access.every(([, key]) => key === KEY));
});

test("a currently valid record is rechecked when the preference changes in another tab", () => {
  const { state, storage } = fixture({ [KEY]: JSON.stringify({ version: VERSION, dismissedAt: NOW }) });
  assert.equal(state.isDismissed(), true);
  storage.removeItem(KEY);
  assert.equal(state.isDismissed(), false);
});
