/**
 * Phase 2 — Content & Media (Stap 1)
 *
 * Inventariseert publieke content voor seizoen 2026/27:
 * - scant UI op verouderde seizoentekst (2025/26)
 * - rapporteert content-oppervlakken, social, placeholders, captain-bron
 * - geen database- of bestandswijzigingen
 *
 *   cd platform && npm run season:content
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import {
  ACTIVE_SEASON_PUBLIC_LABEL,
  CAPTAIN_CONTENT_SOURCE,
  CONTACT_CONTENT_STATUS,
  CONTENT_2026_27_DATA_GAPS,
  MEDIA_PLACEHOLDERS,
  PUBLIC_CONTENT_SURFACES,
  SOCIAL_LINKS,
  STALE_SEASON_TEXT_PATTERNS,
  STATIC_CLUB_COPY,
} from "@/lib/season-foundation/content-2026-27-spec";

const PLATFORM_ROOT = join(__dirname, "..", "..");

const SCAN_DIRS = [
  join(PLATFORM_ROOT, "src", "app", "(site)"),
  join(PLATFORM_ROOT, "src", "app", "maintenance"),
  join(PLATFORM_ROOT, "src", "components", "home"),
  join(PLATFORM_ROOT, "src", "components", "players"),
  join(PLATFORM_ROOT, "src", "components", "layout"),
  join(PLATFORM_ROOT, "src", "components", "matches"),
  join(PLATFORM_ROOT, "src", "components", "ranking"),
  join(PLATFORM_ROOT, "src", "components", "fitness"),
  join(PLATFORM_ROOT, "src", "components", "media"),
];

function collectTsxFiles(dir: string, acc: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of entries) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "beheer") continue;
      collectTsxFiles(full, acc);
    } else if (/\.(tsx|ts)$/.test(name) && !name.endsWith(".test.ts")) {
      acc.push(full);
    }
  }
  return acc;
}

type StaleHit = { file: string; line: number; excerpt: string };

function scanStaleSeasonText(files: string[]): StaleHit[] {
  const hits: StaleHit[] = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      for (const pattern of STALE_SEASON_TEXT_PATTERNS) {
        if (pattern.test(line)) {
          hits.push({
            file: relative(PLATFORM_ROOT, file).replace(/\\/g, "/"),
            line: i + 1,
            excerpt: line.trim().slice(0, 120),
          });
          break;
        }
      }
    }
  }
  return hits;
}

function main() {
  console.log("[season:content] Stap 1 — content & media 2026/27 inventariseren…\n");

  const files = SCAN_DIRS.flatMap((d) => collectTsxFiles(d));
  const staleHits = scanStaleSeasonText(files);

  console.log(`[season:content] Doelseizoen: ${ACTIVE_SEASON_PUBLIC_LABEL}\n`);

  console.log("[season:content] Publieke pagina's:");
  for (const s of PUBLIC_CONTENT_SURFACES) {
    console.log(`  • ${s.route.padEnd(22)} ${s.label}${s.seasonBound ? " (seizoensdata)" : " (statisch)"}`);
  }

  console.log("\n[season:content] Statische clubcopy (ongewijzigd):");
  console.log(`  • Club:     ${STATIC_CLUB_COPY.club_name}`);
  console.log(`  • Team UI:  ${STATIC_CLUB_COPY.team_display}`);
  console.log(`  • Tagline:  ${STATIC_CLUB_COPY.homepage_tagline}`);

  console.log("\n[season:content] Social media:");
  console.log(`  • Instagram: ${SOCIAL_LINKS.instagram}`);

  console.log("\n[season:content] Contact:");
  console.log(`  • ${CONTACT_CONTENT_STATUS}`);

  console.log("\n[season:content] Captain-vermeldingen:");
  console.log(`  • Bron: ${CAPTAIN_CONTENT_SOURCE}`);

  console.log("\n[season:content] Fotoplaceholders:");
  console.log(`  • Team:   ${MEDIA_PLACEHOLDERS.team_photo_db} → fallback ${MEDIA_PLACEHOLDERS.team_photo_local_fallback}`);
  console.log(`  • Leeg:   "${MEDIA_PLACEHOLDERS.team_photo_empty_copy}"`);
  console.log(`  • Speler: ${MEDIA_PLACEHOLDERS.player_photo_empty}`);

  console.log("\n[season:content] Scan verouderde seizoentekst (2025/26) in publieke UI:");
  if (staleHits.length === 0) {
    console.log("  • Geen hits — geen expliciete 2025/26-vermeldingen in gescande bestanden.");
  } else {
    for (const h of staleHits) {
      console.log(`  • ${h.file}:${h.line} — ${h.excerpt}`);
    }
  }

  console.log(`\n[season:content] Gescande bestanden: ${files.length}`);

  console.log("\n[season:content] Ontbrekende content:");
  for (const gap of CONTENT_2026_27_DATA_GAPS) console.log(`    - ${gap}`);

  console.log("\n[season:content] Klaar.");
}

main();
