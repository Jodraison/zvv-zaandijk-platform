/**
 * Centraal wedstrijdstatuscontract.
 * DB/API gebruikt `scheduled` (= planned in producttaal).
 */

export const MATCH_STATUSES = ["scheduled", "played", "cancelled", "postponed"] as const;
export type MatchStatusCode = (typeof MATCH_STATUSES)[number];

/** Productlabel: scheduled ≡ planned / Gepland */
export const MATCH_STATUS_LABEL_NL: Record<MatchStatusCode, string> = {
  scheduled: "Gepland",
  played: "Gespeeld",
  cancelled: "Afgelast",
  postponed: "Uitgesteld",
};

export function isMatchStatus(value: string): value is MatchStatusCode {
  return (MATCH_STATUSES as readonly string[]).includes(value);
}

export function isPlannedMatchStatus(status: string): boolean {
  return status === "scheduled" || status === "postponed" || status === "cancelled";
}

/** Uitslag / events alleen bij gespeelde wedstrijden. */
export function matchAllowsScoreAndEvents(status: string): boolean {
  return status === "played";
}

export type MatchFieldRequirement = "required" | "optional" | "hidden";

export function matchFieldRequirements(status: MatchStatusCode): {
  opponent: MatchFieldRequirement;
  kickoff_at: MatchFieldRequirement;
  is_home: MatchFieldRequirement;
  match_type: MatchFieldRequirement;
  location: MatchFieldRequirement;
  referee: MatchFieldRequirement;
  notes: MatchFieldRequirement;
  goals_for: MatchFieldRequirement;
  goals_against: MatchFieldRequirement;
  goals: MatchFieldRequirement;
  assists: MatchFieldRequirement;
  mvp: MatchFieldRequirement;
  cards: MatchFieldRequirement;
  substitutions: MatchFieldRequirement;
  selection: MatchFieldRequirement;
  lineup: MatchFieldRequirement;
  cancel_reason: MatchFieldRequirement;
} {
  if (status === "played") {
    return {
      opponent: "required",
      kickoff_at: "required",
      is_home: "required",
      match_type: "required",
      location: "optional",
      referee: "optional",
      notes: "optional",
      goals_for: "required",
      goals_against: "required",
      goals: "required",
      assists: "optional",
      mvp: "optional",
      cards: "optional",
      substitutions: "optional",
      selection: "required",
      lineup: "optional",
      cancel_reason: "hidden",
    };
  }
  if (status === "cancelled") {
    return {
      opponent: "required",
      kickoff_at: "required",
      is_home: "required",
      match_type: "required",
      location: "optional",
      referee: "optional",
      notes: "optional",
      goals_for: "hidden",
      goals_against: "hidden",
      goals: "hidden",
      assists: "hidden",
      mvp: "hidden",
      cards: "hidden",
      substitutions: "hidden",
      selection: "optional",
      lineup: "optional",
      cancel_reason: "optional",
    };
  }
  // scheduled + postponed: plannen zonder uitslag
  return {
    opponent: "required",
    kickoff_at: "required",
    is_home: "required",
    match_type: "required",
    location: "optional",
    referee: "optional",
    notes: "optional",
    goals_for: "hidden",
    goals_against: "hidden",
    goals: "hidden",
    assists: "hidden",
    mvp: "hidden",
    cards: "hidden",
    substitutions: "hidden",
    selection: "optional",
    lineup: "optional",
    cancel_reason: "hidden",
  };
}
