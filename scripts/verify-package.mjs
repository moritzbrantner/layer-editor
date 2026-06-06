import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const packageJsonPath = path.join(rootDir, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

const expectedExports = [
  "@moritzbrantner/layer-editor",
  "@moritzbrantner/layer-editor/core",
  "@moritzbrantner/layer-editor/react",
  "@moritzbrantner/layer-editor/history",
  "@moritzbrantner/layer-editor/serialization",
];

for (const [subpath, exportTarget] of Object.entries(packageJson.exports)) {
  if (typeof exportTarget === "string") {
    assertExists(exportTarget, `Missing export target for ${subpath}`);
    continue;
  }

  assertExists(exportTarget.import, `Missing import target for ${subpath}`);
  assertExists(exportTarget.types, `Missing types target for ${subpath}`);
}

for (const specifier of expectedExports) {
  await import(specifier);
}

const stylesheetUrl = import.meta.resolve("@moritzbrantner/layer-editor/styles.css");
if (!existsSync(fileURLToPath(stylesheetUrl))) {
  fail(`CSS export did not resolve to an existing file: ${stylesheetUrl}`);
}

const packOutput = execFileSync("npm", ["pack", "--dry-run", "--ignore-scripts", "--json"], {
  cwd: rootDir,
  encoding: "utf8",
});
const [packInfo] = JSON.parse(packOutput);
const packedFiles = new Set(packInfo.files.map((file) => file.path));
const requiredPackedFiles = [
  "package.json",
  "README.md",
  "styles.css",
  "dist/index.js",
  "dist/index.d.ts",
  "dist/core.js",
  "dist/core.d.ts",
  "dist/react.js",
  "dist/react.d.ts",
  "dist/history.js",
  "dist/history.d.ts",
  "dist/serialization.js",
  "dist/serialization.d.ts",
];

for (const file of requiredPackedFiles) {
  if (!packedFiles.has(file)) {
    fail(`npm pack is missing ${file}`);
  }
}

function assertExists(target, message) {
  if (!target || !existsSync(path.resolve(rootDir, target))) {
    fail(`${message}: ${target}`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
