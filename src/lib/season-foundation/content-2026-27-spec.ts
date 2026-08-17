/**
 * Phase 2 — Content & Media (Stap 1): inventaris publieke content 2026/27.
 *
 * Bronnen: bestaande UI-componenten, `constants/club.ts`, `seasons.name` in DB.
 * Geen CMS; seizoensdata komt uit Supabase + `readResolvedSeasonId`.
 */

import { CLUB_NAME, TEAM_DISPLAY_LABEL, TEAM_DISPLAY_LABEL_UPPER } from "@/constants/club";
import { SEASON_2026_27_ID } from "./squad-2026-27-spec";

/** Publiek label — afgeleid van `seasons.name` "2026/27 Competitie" (`season:foundation`). */
export const ACTIVE_SEASON_PUBLIC_LABEL = "2026/2027";

/** Canoniek actief seizoen-ID. */
export const ACTIVE_SEASON_ID = SEASON_2026_27_ID;

export type PublicContentSurface = {
  id: string;
  route: string;
  label: string;
  seasonBound: boolean;
  notes: string;
};

/** Openbare pagina's en content-oppervlakken (geen beheer). */
export const PUBLIC_CONTENT_SURFACES: PublicContentSurface[] = [
  { id: "home", route: "/", label: "Homepage", seasonBound: true, notes: "Hero, teamfoto, selectie-showcase, ranking-pod — data per seizoen." },
  { id: "selectie", route: "/selectie", label: "Selectie (teampagina)", seasonBound: true, notes: "Speelsters + foto's uit player_season_memberships." },
  { id: "selectie-player", route: "/selectie/[playerId]", label: "Spelersprofiel", seasonBound: true, notes: "Captain-badges uit membership; stats per seizoen." },
  { id: "wedstrijden", route: "/wedstrijden", label: "Wedstrijden", seasonBound: true, notes: "Programma uit matches per season_id." },
  { id: "ranking", route: "/ranking", label: "Ranking", seasonBound: true, notes: "Leaderboard uit seizoenslidmaatschappen." },
  { id: "training", route: "/training", label: "Training", seasonBound: true, notes: "Aanwezigheid per seizoen." },
  { id: "fitheid", route: "/fitheid", label: "Fitheid", seasonBound: true, notes: "Sprintdata per seizoen." },
  { id: "seizoenen", route: "/seizoenen", label: "Seizoenen", seasonBound: true, notes: "Toont seasons.name uit DB (bijv. 2026/27 Competitie)." },
  { id: "maintenance", route: "/maintenance", label: "Onderhoud", seasonBound: false, notes: "Statische melding; verwijst naar voorbereiding 2026/2027." },
  { id: "login", route: "/login", label: "Login", seasonBound: false, notes: "Geen seizoentekst." },
];

/** Statische clubcopy (niet per seizoen) — `constants/club.ts` + hardcoded componenten. */
export const STATIC_CLUB_COPY = {
  club_name: CLUB_NAME,
  team_display: TEAM_DISPLAY_LABEL,
  team_display_upper: TEAM_DISPLAY_LABEL_UPPER,
  homepage_tagline: "Een team. Een standaard.",
  homepage_subline: "Samen strijden. Samen groeien. Alles volgen in één platform.",
  selectie_tagline: "Een team. Een standaard.",
  team_photo_overlay: "EEN TEAM. EEN STANDAARD.",
} as const;

/** Social media — enige link in codebase (`club-moments-grid.tsx`; component niet op homepage gemount). */
export const SOCIAL_LINKS = {
  instagram: "https://instagram.com/zaandijkzaterdagdames1",
} as const;

/** Fotoplaceholders — bestaande fallback-logica (`photo-with-fallback.tsx`). */
export const MEDIA_PLACEHOLDERS = {
  team_photo_db: "club_profile.team_photo_url",
  team_photo_local_fallback: null,
  team_photo_empty_copy: "Nieuwe teamfoto volgt binnenkort",
  player_photo_empty: "Rugnummer-initialen in PlayerCard / SelectieClient",
} as const;

/**
 * Captain-vermeldingen: uitsluitend via `is_captain` / `is_vice_captain` op player_season_membership.
 * 2026/27: nog niet toegewezen (`season:squad` zet alles op false).
 */
export const CAPTAIN_CONTENT_SOURCE = "player_season_memberships (per seizoen, via beheer)";

/** Contact: geen contactpagina of contactvelden in DB (audit 14_CURRENT_FEATURES). */
export const CONTACT_CONTENT_STATUS = "niet aanwezig in platform";

/** Regex-patronen voor audit op verouderde seizoentekst in publieke UI. */
export const STALE_SEASON_TEXT_PATTERNS = [
  /2025\s*\/\s*26/gi,
  /2025\s*\/\s*2026/gi,
  /seizoen\s+2025/gi,
  /season\s+2025/gi,
] as const;

/** Openstaande content na Stap 1. */
export const CONTENT_2026_27_DATA_GAPS = [
  "Contactpagina / contactgegevens: niet aanwezig — geen wijziging mogelijk.",
  "Aanvoerder / vice 2026/27: nog niet toegewezen in DB (beheer → spelers).",
  "Teamfoto 2026/27: upload via beheer wanneer beschikbaar (club_profile.team_photo_url).",
  "Spelersfoto's ontbrekend: per speelster via beheer; placeholders blijven actief.",
  "ClubMomentsGrid (Instagram-CTA): component bestaat maar is niet op homepage gemount.",
  "Statische marketingcopy (hero, selectie): clubbreed — geen seizoensupdate nodig.",
] as const;
