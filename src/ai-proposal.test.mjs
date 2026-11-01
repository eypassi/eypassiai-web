import assert from "node:assert/strict";
import test from "node:test";
import { createAiConsentStore } from "./ai-consent.ts";

async function boundary() { const module = await import("./ai-proposal.ts").catch(() => null); assert.equal(typeof module?.buildAiProposal, "function", "missing proposal field/ownership boundary"); return module; }
const accountId = "synthetic-a";
const own = { properties: [{ id: "own-property", user_id: accountId }], categories: ["Sonstiges"] };
const proposal = (data = {}) => ({ action_type: "create_transaction", data: { amount: 12, category: "Sonstiges", date: "2026-11-01", ...data } });
test("proposal fields are allowlisted and ownership cannot be overwritten", async () => {
  const { buildAiProposal } = await boundary();
  const built = buildAiProposal(accountId, proposal({ user_id: "synthetic-b", admin: true, property_id: "own-property", notes: "synthetic note" }), own);
  assert.deepEqual(built, { table: "transactions", payload: { amount: 12, category: "Sonstiges", date: "2026-11-01", property_id: "own-property", notes: "synthetic note", is_verified: false, import_source: "web_agent", user_id: accountId } });
});
for (const value of [{ amount: Infinity }, { amount: "12" }, { date: "2026-02-30" }, { category: "unloaded category" }, { property_id: "foreign-property" }, { notes: { invalid: true } }]) {
  test(`invalid proposal data is rejected: ${Object.keys(value)[0]}`, async () => { const { buildAiProposal } = await boundary(); assert.throws(() => buildAiProposal(accountId, proposal(value), own)); });
}
test("an ID loaded under another owner still cannot be selected", async () => { const { buildAiProposal } = await boundary(); assert.throws(() => buildAiProposal(accountId, proposal({ property_id: "other-property" }), { ...own, properties: [{ id: "other-property", user_id: "synthetic-b" }] })); });
test("travel proposal accepts only valid finite values and known own property", async () => { const { buildAiProposal } = await boundary(); const valid = { action_type: "create_travel_expense", data: { km: 5, purpose: "synthetic trip", date: "2026-11-01", property_id: "own-property", user_id: "synthetic-b" } }; assert.equal(buildAiProposal(accountId, valid, own).payload.user_id, accountId); for (const km of [-1, Infinity, "5"]) assert.throws(() => buildAiProposal(accountId, { ...valid, data: { ...valid.data, km } }, own)); assert.throws(() => buildAiProposal(accountId, { action_type: "unknown", data: {} }, own)); });
test("proposal writer fixes transport identity and blocks consent changes during SDK preparation", async () => {
  const { createAiProposalApplier } = await boundary();
  const storage = new Map(); const consent = createAiConsentStore({ getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) }); consent.activateAccount(accountId); consent.grant(accountId);
  const sent = []; const applier = createAiProposalApplier({ getSession: async () => ({ data: { session: { user: { id: accountId }, access_token: "synthetic-a-token" } }, error: null }), supabaseUrl: "https://fixture.invalid", supabaseAnonKey: "synthetic-anon", fetch: async (url, init) => { sent.push({ url, init }); return new Response(null, { status: 201 }); } });
  const result = await applier(accountId, proposal(), own, consent.requestApproval(accountId));
  assert.equal(result.error, null); assert.equal(sent.length, 1); assert.equal(new Headers(sent[0].init.headers).get("Authorization"), "Bearer synthetic-a-token");
  consent.grant(accountId);
  const blocked = createAiProposalApplier({ getSession: async () => { queueMicrotask(() => queueMicrotask(() => consent.revoke(accountId))); return { data: { session: { user: { id: accountId }, access_token: "synthetic-a-token" } } }; }, supabaseUrl: "https://fixture.invalid", supabaseAnonKey: "synthetic-anon", fetch: async () => { assert.fail("revoked proposal reached transport"); } });
  assert.ok((await blocked(accountId, proposal(), own, consent.requestApproval(accountId))).error);
});
