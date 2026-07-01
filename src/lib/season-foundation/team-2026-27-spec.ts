/**
 * Phase 2 — Season Foundation (Stap 4): staf + teaminformatie 2026/27.
 *
 * Architectuur-inventaris (bestaande implementatie):
 * - Seizoensmetadata: `seasons` (name, starts_on, ends_on, is_active) — enige seizoengebonden DB-velden.
 * - Clubbreed (niet per seizoen): `constants/club.ts`, `club_profile.team_photo_url`, hardcoded homepage-copy.
 * - Staf: geen opslag (geen tabel, geen admin-pagina; zie docs/repository-audit/14_CURRENT_FEATURES.md).
 */

import { CLUB_NAME, TEAM_DISPLAY_LABEL, TEAM_LABEL } from "@/constants/club";
import { SEASON_2025_26_ID, SEASON_2026_27_ID } from "./squad-2026-27-spec";

export { SEASON_2025_26_ID, SEASON_2026_27_ID };

/** Stafrol zoals die in een toekomstige opslaglaag zou staan — nu alleen documentatie. */
export type StaffMemberSpec = {
  full_name: string;
  role?: string;
  email?: string;
  phone?: string;
  status: "active" | "archived";
};

/**
 * Staf 2026/27 — leeg: geen brondata en geen bestaande opslagstructuur om te vullen.
 * Voeg hier alleen rijen toe wanneer namen/rollen officieel zijn bevestigd.
 */
export const STAFF_2026_27: StaffMemberSpec[] = [];

/** Teamgegevens afgeleid uit bestaande constants (clubbreed, niet seizoenspecifiek). */
export const TEAM_INFO_KNOWN_FROM_CODE = {
  club_name: CLUB_NAME,
  teamnaam_ui: TEAM_DISPLAY_LABEL,
  teamnaam_internal: TEAM_LABEL,
} as const;

/**
 * Seizoensgebonden metadata voor 2026/27 — enige velden die Stap 4 in de database bijwerkt.
 * Competitie staat in `seasons.name` (conventie uit seed: "JJJJ/JJ Competitie").
 */
export const SEASON_2026_27_TEAM_METADATA = {
  id: SEASON_2026_27_ID,
  name: "2026/27 Competitie",
  starts_on: "2026-08-01",
  ends_on: "2027-06-30",
} as const;

/** Referentie 2025/26 — alleen ter verificatie; Stap 4 wijzigt deze rij niet. */
export const SEASON_2025_26_REFERENCE = {
  id: SEASON_2025_26_ID,
  name: "2025/26 Competitie",
  starts_on: "2025-08-01",
  ends_on: "2026-06-30",
} as const;

/** Openstaande gegevens na Stap 4 (voor rapportage). */
export const TEAM_2026_27_DATA_GAPS = [
  "Staf: geen opslaglaag in platform — STAFF_2026_27 is leeg; geen toevoegingen/wijzigingen/archiveringen mogelijk.",
  "Klasse: niet vastgelegd in database of constants.",
  "Omschrijving: alleen hardcoded in club-home-hero.tsx (niet seizoengebonden; buiten scope Stap 4).",
  "Contactinformatie: geen opslag in database.",
  "Teamfoto: club_profile.team_photo_url is clubbreed, niet per seizoen.",
] as const;
