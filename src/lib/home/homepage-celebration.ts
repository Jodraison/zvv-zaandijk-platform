/**
 * Homepage celebration — één centraal triggercontract.
 * Read-only: geen mutatie van spelers, scores, wedstrijden of verjaardagen.
 * Europe/Amsterdam is canoniek.
 */
import type { Match } from "@/types";
import { resolveMatchScore } from "@/lib/domain/match-score";
import { isProductionMatch } from "@/lib/match/match-data-scope";
import { clubDateKeyAmsterdam, todayInClubTz } from "@/lib/season/season-operations-2026-27";
import { isPublicBirthdayPreviewAllowed } from "@/lib/players/birthdays";

export type CelebrationType = "birthday" | "victory" | "birthday_victory" | null;

export type HomepageCelebrationDecision = {
  type: CelebrationType;
  calendarDay: string;
  birthday: boolean;
  victory: boolean;
};

export function isPublicCelebrationPreviewAllowed(
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  return isPublicBirthdayPreviewAllowed(nodeEnv);
}

/** Preview query: birthday | victory | combined. Productie-publiek negeert altijd. */
export function resolveCelebrationPreviewType(
  raw: string | undefined,
  opts: { allowPreview: boolean },
): CelebrationType {
  if (!opts.allowPreview) return null;
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "birthday") return "birthday";
  if (v === "victory") return "victory";
  if (v === "combined" || v === "birthday_victory") return "birthday_victory";
  return null;
}

export function resolveCelebrationHoldPreview(
  raw: string | undefined,
  opts: { allowPreview: boolean },
): boolean {
  if (!opts.allowPreview) return false;
  const v = (raw ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "hold";
}

export function celebrationSessionKey(type: Exclude<CelebrationType, null>, calendarDay: string): string {
  return `zvv-celebration-${calendarDay}-${type}`;
}

/** Soft-nav cooldown only. Full page load resets module state so refresh always replays. */
export const CELEBRATION_NAV_COOLDOWN_MS = 45_000;

let lastCelebrationGuardKey: string | null = null;
let lastCelebrationGuardAt = 0;

export function shouldReplayHomepageCelebration(key: string, now: number = Date.now()): boolean {
  if (lastCelebrationGuardKey !== key) return true;
  return now - lastCelebrationGuardAt >= CELEBRATION_NAV_COOLDOWN_MS;
}

export function markHomepageCelebrationStarted(key: string, now: number = Date.now()): void {
  lastCelebrationGuardKey = key;
  lastCelebrationGuardAt = now;
}

export function resetHomepageCelebrationGuardForTests(): void {
  lastCelebrationGuardKey = null;
  lastCelebrationGuardAt = 0;
}

/** Full page load / visible tab: never start while the user cannot see the page. */
export async function waitUntilCelebrationCanStart(delayMs: number): Promise<void> {
  if (typeof document !== "undefined" && document.visibilityState !== "visible") {
    await new Promise<void>((resolve) => {
      const onChange = () => {
        if (document.visibilityState === "visible") {
          document.removeEventListener("visibilitychange", onChange);
          resolve();
        }
      };
      document.addEventListener("visibilitychange", onChange);
    });
  }
  if (typeof requestAnimationFrame === "function") {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  }
  await new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

export function hasBirthdayCelebrationToday(birthdayCount: number): boolean {
  return birthdayCount > 0;
}

/**
 * Officiële overwinning vandaag:
 * - zelfde actieve seizoen
 * - status played
 * - production data-scope (QA/demo telt niet)
 * - geen invalid integrity
 * - kalenderdag kickoff == vandaag (Europe/Amsterdam)
 * - Zaandijk wint via goals_for > goals_against (thuis én uit)
 */
export function isTodayOfficialVictory(
  match: Pick<
    Match,
    | "season_id"
    | "status"
    | "kickoff_at"
    | "goals_for"
    | "goals_against"
    | "is_home"
    | "opponent"
    | "notes"
    | "data_scope"
    | "integrity_state"
  >,
  seasonId: string,
  now: Date = new Date(),
): boolean {
  if (!seasonId || match.season_id !== seasonId) return false;
  if (match.status !== "played") return false;
  if (!isProductionMatch(match)) return false;
  if ((match.integrity_state ?? "verified") === "invalid") return false;
  if (clubDateKeyAmsterdam(match.kickoff_at) !== todayInClubTz(now)) return false;
  return resolveMatchScore(match as Match).result === "win";
}

export function findTodayOfficialVictory(
  matches: readonly Match[],
  seasonId: string,
  now: Date = new Date(),
): Match | null {
  if (!seasonId) return null;
  for (const match of matches) {
    if (isTodayOfficialVictory(match, seasonId, now)) return match;
  }
  return null;
}

export function hasVictoryCelebrationToday(
  matches: readonly Match[],
  seasonId: string,
  now: Date = new Date(),
): boolean {
  return findTodayOfficialVictory(matches, seasonId, now) != null;
}

export function getHomepageCelebration(input: {
  birthdayCount: number;
  matches: readonly Match[];
  seasonId: string;
  now?: Date;
  /** Alleen development/test of authenticated beheer-preview. */
  previewType?: CelebrationType;
}): HomepageCelebrationDecision {
  const now = input.now ?? new Date();
  const calendarDay = todayInClubTz(now);
  if (input.previewType) {
    return {
      type: input.previewType,
      calendarDay,
      birthday: input.previewType === "birthday" || input.previewType === "birthday_victory",
      victory: input.previewType === "victory" || input.previewType === "birthday_victory",
    };
  }

  const birthday = hasBirthdayCelebrationToday(input.birthdayCount);
  const victory = hasVictoryCelebrationToday(input.matches, input.seasonId, now);
  const type: CelebrationType =
    birthday && victory ? "birthday_victory" : victory ? "victory" : birthday ? "birthday" : null;

  return { type, calendarDay, birthday, victory };
}

export function buildCelebrationHomepagePreviewHref(opts: {
  seasonId: string;
  kind: "birthday" | "victory" | "combined";
  hold?: boolean;
  vandaag?: string;
}): string {
  const q = new URLSearchParams({
    season: opts.seasonId,
    celebration: opts.kind,
  });
  if (opts.hold) q.set("celebrationHold", "1");
  if (opts.vandaag) q.set("vandaag", opts.vandaag.slice(0, 10));
  return `/?${q.toString()}`;
}

export function buildCelebrationAdminPreviewHref(opts: {
  seasonId: string;
  kind: "birthday" | "victory" | "combined";
  hold?: boolean;
  datum?: string;
}): string {
  const q = new URLSearchParams({
    season: opts.seasonId,
    kind: opts.kind,
  });
  if (opts.hold) q.set("hold", "1");
  if (opts.datum) q.set("datum", opts.datum.slice(0, 10));
  return `/beheer/voorbeeld/celebration?${q.toString()}`;
}
