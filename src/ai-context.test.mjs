import assert from "node:assert/strict";
import test from "node:test";
import { buildAgentContext } from "./ai-context.ts";

test("assistant retains the fields needed for property and rent matching and strips unrelated personal data", () => {
  const context = buildAgentContext({
    properties: [{ id: "p1", address: "Musterweg 1", type: "Wohnung", user_id: "a", purchase_price: 300000, image_url: "secret.jpg" }],
    tenants: [{ id: "t1", name: "Testperson", property_id: "p1", user_id: "a", email: "private@example.test", phone: "secret phone", profile_image_url: "portrait.jpg" }],
    contracts: [{ id: "c1", tenant_id: "t1", monthly_rent: 750, deposit: 1500, notes: "private notes", start_date: "2020-01-01" }],
  }, ["Mieteinnahmen"], "2026-10-30");
  assert.deepEqual(context, {
    properties: [{ id: "p1", address: "Musterweg 1", type: "Wohnung" }],
    tenants: [{ id: "t1", name: "Testperson", property_id: "p1" }],
    contracts: [{ tenant_id: "t1", monthly_rent: 750 }],
    categories: [{ name: "Mieteinnahmen" }],
    today: "2026-10-30",
  });
  const serialized = JSON.stringify(context);
  for (const excluded of ["user_id", "private@example.test", "secret phone", "portrait.jpg", "private notes", "purchase_price", "deposit", "start_date"])
    assert.equal(serialized.includes(excluded), false, excluded);
});
