import type { MatchLineupStatus, MatchStatus } from "@/types";

/** Toekomstige / nog niet gespeelde wedstrijd: opstelling blijft bewerkbaar. */
export function isUnplayedMatchStatus(status: string): boolean {
  return status === "scheduled" || status === "postponed";
}

export function futureConfirmedLineupIsEditable(
  matchStatus: string,
  lineupStatus: MatchLineupStatus | undefined,
): boolean {
  return isUnplayedMatchStatus(matchStatus) && lineupStatus === "confirmed";
}

export function lineupSaveRequiresValidFormation(input: {
  matchStatus: string;
  currentLineupStatus: MatchLineupStatus;
  confirm: boolean;
}): boolean {
  if (input.confirm) return true;
  return futureConfirmedLineupIsEditable(input.matchStatus, input.currentLineupStatus);
}

/**
 * Bevestigde toekomstige XI blijft confirmed bij opslaan.
 * Geen automatische unconfirm op iedere klik/save.
 */
export function resolveLineupSaveStatus(input: {
  matchStatus: string;
  currentLineupStatus: MatchLineupStatus;
  confirm: boolean;
  formationValid: boolean;
}): MatchLineupStatus {
  if (!input.formationValid) return "draft";
  if (input.confirm) return "confirmed";
  if (futureConfirmedLineupIsEditable(input.matchStatus, input.currentLineupStatus)) {
    return "confirmed";
  }
  return "draft";
}

export function shouldStayOnLineupEditorAfterSave(matchStatus: MatchStatus | string): boolean {
  return isUnplayedMatchStatus(matchStatus);
}
