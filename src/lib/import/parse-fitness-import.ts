/**
 * Parseert fitheid-import (datumblokken + regels "naam tijd" / "a / b tijd").
 */

export type ParsedFitnessRow = { nameParts: string[]; timeRaw: string };
export type ParsedFitnessBlock = { testOn: string; rows: ParsedFitnessRow[] };

/** DD-MM-YYYY → YYYY-MM-DD */
export function dutchDateToIso(d: string): string | null {
  const m = d.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!m) return null;
  const dd = m[1].padStart(2, "0");
  const mm = m[2].padStart(2, "0");
  const yyyy = m[3];
  return `${yyyy}-${mm}-${dd}`;
}

const TIME_RE = /^(.+?)\s+(\d{1,2}:\d{2}[\.,]\d{1,2})\s*$/;

export function parseFitnessLine(line: string): ParsedFitnessRow | null {
  const t = line.trim();
  if (!t || t.startsWith("#") || t.startsWith("📊") || t.startsWith("🗓️")) return null;
  const tm = t.match(TIME_RE);
  if (!tm) return null;
  const nameBlob = tm[1].trim();
  const timeRaw = tm[2].trim();
  const nameParts = nameBlob
    .split(/\s*\/\s*/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (nameParts.length === 0) return null;
  return { nameParts, timeRaw };
}

export function parseFitnessImportText(text: string): ParsedFitnessBlock[] {
  const lines = text.split(/\n/).map((l) => l.replace(/\r$/, ""));
  const blocks: ParsedFitnessBlock[] = [];
  let currentDate: string | null = null;
  let currentRows: ParsedFitnessRow[] = [];

  const flush = () => {
    if (currentDate && currentRows.length) {
      blocks.push({ testOn: currentDate, rows: currentRows });
    }
    currentRows = [];
  };

  for (const line of lines) {
    const dateMatch = line.match(/datum\s*:\s*(\d{1,2}-\d{1,2}-\d{4})/i);
    if (dateMatch) {
      flush();
      const iso = dutchDateToIso(dateMatch[1]);
      if (iso) currentDate = iso;
      continue;
    }

    if (!currentDate) continue;

    const row = parseFitnessLine(line);
    if (row) currentRows.push(row);
  }
  flush();

  return blocks;
}
