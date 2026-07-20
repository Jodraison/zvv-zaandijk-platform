/**
 * Registry file path resolution + YAML parse (T-03-02).
 */
import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

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
