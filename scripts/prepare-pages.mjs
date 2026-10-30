import { access, cp, writeFile } from "node:fs/promises";

const projectRoot = new URL("../", import.meta.url);
const outputRoot = new URL("dist/", projectRoot);

// Run after Vite so the deployed entry points always contain compiled assets.
await access(new URL("index.html", outputRoot));
await access(new URL("app/index.html", outputRoot));

for (const path of ["CNAME", "app-ads.txt", "knie"]) {
  await cp(new URL(path, projectRoot), new URL(path, outputRoot), {
    recursive: true,
  });
}

await writeFile(new URL(".nojekyll", outputRoot), "");
console.log("Prepared GitHub Pages output in dist/.");
