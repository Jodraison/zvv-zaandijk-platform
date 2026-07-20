/**
 * Registry file path resolution + YAML parse (T-03-02).
 * Server-only boundary (T-03-03): Node fs + yaml — never import from Client Components.
 * (`import "server-only"` is not used here: it breaks Node/tsx CI scripts; webpack
 * client bundles still fail on `node:fs` / `yaml` if accidentally imported.)
 */
import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

if (typeof window !== "undefined") {
  throw new Error("Academy registry YAML loaders are server-only");
}

export function getAcademyDocsDir(): string {
  return path.join(process.cwd(), "docs", "academy");
}

export function readAcademyYamlFile(filename: string): unknown {
  const filePath = path.join(getAcademyDocsDir(), filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Academy registry missing: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf8");
  return parseYaml(raw);
}
