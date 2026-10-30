import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(project, process.argv[2] || "dist");
const pages = ["index.html", "app/index.html", "privacy.html", "terms.html", "impressum.html", "avv.html", "knie/index.html"];

for (const page of pages) {
  const html = await readFile(resolve(output, page), "utf8");
  assert.ok(!/(?:src|href)=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com/i.test(html), `${page}: remote fonts must not be requested`);
  if (page === "index.html" || page === "app/index.html") {
    const modules = [...html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/g)];
    assert.ok(modules.length > 0, `${page}: missing application bundle`);
    for (const [, source] of modules) {
      assert.match(source, /\.js(?:[?#]|$)/, `${page}: deploy compiled JavaScript, not ${source}`);
      assert.ok(!source.startsWith("/src/"), `${page}: source files must not be deployed as bundles`);
    }
  }

  for (const [, reference] of html.matchAll(/\b(?:src|href|poster)=["']([^"']+)["']/g)) {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference)) continue;
    const url = new URL(reference, `https://pages.test/${page}`);
    let target = resolve(output, `.${decodeURIComponent(url.pathname)}`);
    const info = await stat(target).catch(() => null);
    assert.ok(info, `${page}: missing local asset or link target ${reference}`);
    if (info.isDirectory()) target = resolve(target, "index.html");
    assert.ok((await stat(target)).isFile(), `${page}: invalid link target ${reference}`);
  }
  console.log(`Verified /${page}`);
}

// Existing static content must survive the switch from repository-root hosting.
async function verifyCopy(relative) {
  const source = resolve(project, relative);
  if ((await stat(source)).isDirectory()) {
    for (const entry of await readdir(source)) await verifyCopy(`${relative}/${entry}`);
    return;
  }
  assert.deepEqual(await readFile(resolve(output, relative)), await readFile(source), `${relative}: static content changed or missing`);
}

for (const relative of ["CNAME", "app-ads.txt", "knie"]) await verifyCopy(relative);
await stat(resolve(output, ".nojekyll"));
console.log("Pages artifact verified: compiled app, local assets, legal pages and existing static content.");
