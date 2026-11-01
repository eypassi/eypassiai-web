import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(project, process.argv[2] || "dist");
const pages = ["index.html", "app/index.html", "privacy.html", "terms.html", "impressum.html", "avv.html", "knie/index.html"];
const manifest = JSON.parse(await readFile(resolve(output, ".vite/manifest.json"), "utf8"));
const notice = Object.values(manifest).find(entry => entry.name === "storage-notice" && entry.file.endsWith(".js"));
const runtime = manifest["src/AppRuntime.tsx"];
assert.ok(notice, "missing shared storage notice bundle");
assert.ok(runtime?.isDynamicEntry, "authentication must remain a dynamic application entry");

function staticFiles(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  const entry = Object.values(manifest).find(item => item.file === file);
  assert.ok(entry, `unmapped compiled module ${file}`);
  for (const key of entry.imports ?? []) staticFiles(manifest[key].file, seen);
  return seen;
}

for (const page of pages) {
  const html = await readFile(resolve(output, page), "utf8");
  assert.ok(!/(?:src|href)=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com/i.test(html), `${page}: remote fonts must not be requested`);
  if (page !== "knie/index.html") {
    const modules = [...html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/g)];
    assert.ok(modules.some(([, source]) => source === `/${notice.file}`), `${page}: missing storage notice`);
    assert.ok(html.includes('/privacy.html#browserspeicher'), `${page}: missing non-JavaScript storage information link`);
    for (const [, source] of modules) {
      assert.match(source, /\.js(?:[?#]|$)/, `${page}: deploy compiled JavaScript, not ${source}`);
      assert.ok(!source.startsWith("/src/"), `${page}: source files must not be deployed as bundles`);
      for (const file of staticFiles(source.replace(/^\//, ""))) {
        assert.notEqual(file, runtime.file, `${page}: auth runtime must not be eagerly imported`);
        const code = await readFile(resolve(output, file), "utf8");
        assert.ok(!code.includes(".supabase.co") && !code.includes("supabase-js"), `${page}: public static graph must not initialize the auth SDK`);
      }
    }
    assert.ok(!html.includes(`href="/${runtime.file}"`), `${page}: do not preload auth on ordinary public visits`);
  }
  if (page === "privacy.html") assert.match(html, /id="browserspeicher"/, "missing storage disclosure anchor");

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
