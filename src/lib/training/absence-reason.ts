/** Canonieke afwezigheidsredenen. Persistatie: training_attendance.note. */

export const ABSENCE_REASONS = ["private", "sick", "injured", "work_school", "no_reason"] as const;
export type AbsenceReason = (typeof ABSENCE_REASONS)[number];

export const ABSENCE_REASON_LABELS_NL: Record<AbsenceReason, string> = {
  private: "Privé",
  sick: "Ziek",
  injured: "Geblesseerd",
  work_school: "Werk/School",
  no_reason: "Geen reden",
};

export function isAbsenceReason(value: string | null | undefined): value is AbsenceReason {
  return typeof value === "string" && (ABSENCE_REASONS as readonly string[]).includes(value);
}

/** Legacy absent + lege/onbekende note → Geen reden. Nooit fictief terugschrijven. */
export function parseAbsenceReason(note: string | null | undefined, present: boolean): AbsenceReason | null {
  if (present) return null;
  const raw = String(note ?? "").trim().toLowerCase();
  if (isAbsenceReason(raw)) return raw;
  return "no_reason";
}

export function serializeAbsenceReason(present: boolean, reason: AbsenceReason | null | undefined): string | null {
  if (present) return null;
  if (isAbsenceReason(reason)) return reason;
  return "no_reason";
}

export function absenceReasonLabelNl(reason: AbsenceReason | null | undefined): string {
  if (!reason) return "";
  return ABSENCE_REASON_LABELS_NL[reason] ?? ABSENCE_REASON_LABELS_NL.no_reason;
}

export function emptyAbsenceCounts(): Record<AbsenceReason, number> {
  return { private: 0, sick: 0, injured: 0, work_school: 0, no_reason: 0 };
}

export function incrementAbsenceCount(counts: Record<AbsenceReason, number>, reason: AbsenceReason) {
  counts[reason] += 1;
}
