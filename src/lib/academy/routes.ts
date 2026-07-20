/**
 * Central Academy routing (T-01-02 / T-02-02).
 * All Academy hrefs MUST go through this module — no scattered path strings.
 * Physical mount: `/academy` (T-01-01). Logical ARCH routes nest under the mount.
 */
import { ACADEMY_MOUNT_PATH } from "@/lib/academy/feature-flag";
import type { LayerId } from "@/lib/academy/schema/layers";

function encodeSegment(segment: string): string {
  // encodeURIComponent keeps kebab slugs and pb.27 stable; strips accidental slashes.
  return encodeURIComponent(segment.replace(/^\/+|\/+$/g, ""));
}

function joinMount(...segments: string[]): string {
  const rest = segments
    .map((s) => encodeSegment(s))
    .filter(Boolean)
    .join("/");
  return rest ? `${ACADEMY_MOUNT_PATH}/${rest}` : ACADEMY_MOUNT_PATH;
}

/** Canonical Academy paths — single source of truth. */
export const academyRoutes = {
  root: ACADEMY_MOUNT_PATH,
  positie: joinMount("positie"),
  situatie: joinMount("situatie"),
  probleem: joinMount("probleem"),
  wedstrijd: joinMount("wedstrijd"),
  seizoen: joinMount("seizoen"),
  zoek: joinMount("zoek"),
  onboardingPositie: joinMount("onboarding", "positie"),
  onboardingProblemen: joinMount("onboarding", "problemen"),
  teamCaptain: joinMount("team", "captain"),
  teamTrainer: joinMount("team", "trainer"),
} as const;

export type AcademyTabRoute =
  | typeof academyRoutes.positie
  | typeof academyRoutes.situatie
  | typeof academyRoutes.probleem
  | typeof academyRoutes.wedstrijd
  | typeof academyRoutes.seizoen;

export type AcademyWedstrijdFase = "voor" | "rust" | "na";

/** Push-week deep link: `/positie?highlight=week` (T-02-02 acceptatie). */
export function academyPositiePath(options?: { highlight?: "week" }): string {
  const base = academyRoutes.positie;
  if (!options?.highlight) return base;
  const params = new URLSearchParams();
  params.set("highlight", options.highlight);
  return `${base}?${params.toString()}`;
}

export function academySituatiePoortPath(poortSlug: string): string {
  return joinMount("situatie", poortSlug);
}

export function academySituatieDetailPath(poortSlug: string, subSlug: string): string {
  return joinMount("situatie", poortSlug, subSlug);
}

export function academyProbleemPath(problemSlug: string): string {
  return joinMount("probleem", problemSlug);
}

export function academyContentPath(
  pbId: string,
  options?: { layer?: LayerId; highlight?: string; origin?: string },
): string {
  const base = joinMount("content", pbId);
  const params = new URLSearchParams();
  if (options?.layer) params.set("layer", options.layer);
  if (options?.highlight) params.set("highlight", options.highlight);
  if (options?.origin) params.set("origin", options.origin);
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

export function academyWedstrijdFasePath(fase: AcademyWedstrijdFase): string {
  return joinMount("wedstrijd", fase);
}

export function academyOefeningPath(exerciseId: string): string {
  return joinMount("oefening", exerciseId);
}

export function academyReflectiePath(matchId: string): string {
  return joinMount("reflectie", matchId);
}

export function academySeizoenReflectiesPath(): string {
  return joinMount("seizoen", "reflecties");
}

export function academySeizoenSpeelboekPath(): string {
  return joinMount("seizoen", "speelboek");
}

export function isAcademyRoutePath(pathname: string): boolean {
  return pathname === ACADEMY_MOUNT_PATH || pathname.startsWith(`${ACADEMY_MOUNT_PATH}/`);
}
