/**
 * Beheerregels voor fitheidstestmomenten.
 * Testdatum is trainer-beheerbaar. Gepubliceerde data mag niet stil verdwijnen.
 */

export function canEditFitnessSessionMeta(session: { status: string }): boolean {
  return session.status === "draft" || session.status === "published";
}

export function canDeleteFitnessSession(session: {
  status: string;
  published_at?: string | null;
}): boolean {
  return session.status === "draft" && !session.published_at;
}

export function isValidFitnessTestOn(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Geen hardcoded 17-08 meer: display volgt altijd session.test_on of nextFitnessMoment. */
export const FITNESS_DATE_FALLBACK_HARDCODE_FORBIDDEN = ["2026-08-17", "17-08-2026", "17 augustus 2026"] as const;
