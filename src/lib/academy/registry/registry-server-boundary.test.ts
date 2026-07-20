/**
 * T-03-03 — server boundary smoke: yaml-io must not be browser-safe to import.
 * Node/tsx loads fine; accidental client import is blocked by `typeof window` guard
 * plus Node-only `fs`/`yaml` (fails client bundling).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const yamlIoPath = path.join(process.cwd(), "src/lib/academy/registry/yaml-io.ts");
const source = fs.readFileSync(yamlIoPath, "utf8");

assert.match(source, /typeof window/, "window guard present");
assert.match(source, /server-only/, "documents server-only boundary");
assert.match(source, /from "node:fs"/, "uses Node fs");
assert.match(source, /from "yaml"/, "uses yaml package");

const indexPath = path.join(process.cwd(), "src/lib/academy/registry/index.ts");
const indexSrc = fs.readFileSync(indexPath, "utf8");
assert.match(indexSrc, /loaders/, "barrel re-exports loaders (server path)");
assert.doesNotMatch(indexSrc, /"use client"/, "registry barrel is not a client module");

console.log("registry-server-boundary.test.ts: ok");
