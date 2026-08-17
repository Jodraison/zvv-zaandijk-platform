/**
 * Centrale profielcompleetheid — onderscheid essentieel / aanbevolen / optioneel.
 */
import type { ClubDatabase, Player, PlayerSeasonMembership } from "@/types";

export type CompletenessIssue = {
  code: "name" | "position" | "shirt" | "membership" | "photo" | "bio" | "birth_date";
  label: string;
  severity: "required" | "recommended";
};

export type ProfileCompleteness = {
  requiredMissing: CompletenessIssue[];
  recommendedMissing: CompletenessIssue[];
  isIncomplete: boolean;
  summaryLabel: string | null;
};

export function evaluateProfileCompleteness(
  player: Player,
  membership: PlayerSeasonMembership | null,
): ProfileCompleteness {
  const requiredMissing: CompletenessIssue[] = [];
  const recommendedMissing: CompletenessIssue[] = [];

  if (!player.full_name?.trim()) {
    requiredMissing.push({ code: "name", label: "Naam ontbreekt", severity: "required" });
  }
  if (!membership) {
    requiredMissing.push({
      code: "membership",
      label: "Niet in actuele selectie",
      severity: "required",
    });
  } else {
    if (!membership.display_position?.trim() && !membership.position) {
      requiredMissing.push({ code: "position", label: "Positie ontbreekt", severity: "required" });
    }
    if (!membership.shirt_number || membership.shirt_number < 1) {
      requiredMissing.push({ code: "shirt", label: "Rugnummer ontbreekt", severity: "required" });
    }
  }

  if (!player.photo_url?.trim()) {
    recommendedMissing.push({ code: "photo", label: "Foto ontbreekt", severity: "recommended" });
  }
  if (!player.birth_date?.trim()) {
    recommendedMissing.push({
      code: "birth_date",
      label: "Geboortedatum ontbreekt",
      severity: "recommended",
    });
  }
  // role_label / tagline / bio / card_note = intern of optioneel — geen publieke waarschuwing

  const isIncomplete = requiredMissing.length > 0;
  let summaryLabel: string | null = null;
  const all = [...requiredMissing, ...recommendedMissing];
  if (requiredMissing.length > 0) {
    summaryLabel =
      requiredMissing.length === 1
        ? requiredMissing[0]!.label
        : `${requiredMissing.length} verplichte punten aanvullen`;
  } else if (recommendedMissing.length === 1) {
    summaryLabel = recommendedMissing[0]!.label;
  } else if (recommendedMissing.length > 1) {
    summaryLabel = `${recommendedMissing.length} punten aanvullen`;
  }

  return { requiredMissing, recommendedMissing, isIncomplete, summaryLabel: all.length ? summaryLabel : null };
}

export function countIncompleteProfiles(db: ClubDatabase, seasonId: string) {
  const members = db.player_season_memberships.filter((m) => m.season_id === seasonId && !m.is_guest);
  let required = 0;
  let recommendedOnly = 0;
  for (const m of members) {
    const p = db.players.find((x) => x.id === m.player_id);
    if (!p || p.is_guest) continue;
    const c = evaluateProfileCompleteness(p, m);
    if (c.requiredMissing.length) required += 1;
    else if (c.recommendedMissing.length) recommendedOnly += 1;
  }
  return { required, recommendedOnly, active: members.length };
}
