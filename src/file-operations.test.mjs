import assert from "node:assert/strict";
import test from "node:test";

async function boundary() {
  const value = await import("./file-operations.ts").catch(() => null);
  assert.equal(typeof value?.deleteDocumentSafely, "function", "missing safe document-deletion boundary");
  return value;
}
for (const outcome of ["returned-error", "rejected-promise", "unconfirmed-empty", "unconfirmed-other-path"]) {
  test(`document reference survives ${outcome} after a future release of the hold`, async () => {
    const { deleteDocumentSafely } = await boundary();
    let metadataDeletes = 0;
    await assert.rejects(deleteDocumentSafely({ path: "synthetic/file.pdf", removeFile: async () => {
      if (outcome === "rejected-promise") throw new Error("synthetic denied");
      return outcome === "returned-error" ? { data: null, error: new Error("synthetic denied") } : { data: outcome === "unconfirmed-empty" ? [] : [{ name: "other-file" }], error: null };
    }, removeReference: async () => { metadataDeletes++; return { error: null }; } }, false));
    assert.equal(metadataDeletes, 0);
  });
}
test("confirmed file removal permits metadata removal only when hold is explicitly released", async () => {
  const { deleteDocumentSafely } = await boundary();
  const calls = [];
  const deps = { path: "synthetic/file.pdf", removeFile: async () => { calls.push("file"); return { data: [{ name: "synthetic/file.pdf" }], error: null }; }, removeReference: async () => { calls.push("reference"); return { error: null }; } };
  await assert.rejects(deleteDocumentSafely(deps), /eingeschränkt/);
  assert.deepEqual(calls, []);
  await deleteDocumentSafely(deps, false);
  assert.deepEqual(calls, ["file", "reference"]);
});
