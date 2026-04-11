"use server";

import { matchEntryPayloadSchema } from "@/lib/validations/match-entry";
import { saveMatchAdminAction } from "@/actions/match-admin";
import { readDb } from "@/lib/data/repository";

export type MatchEntryActionResult =
  | { ok: true; matchId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function flattenZodErrors(err: import("zod").ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const path = issue.path.length ? issue.path.join(".") : "_root";
    if (!out[path]) out[path] = [];
    out[path].push(issue.message);
  }
  return out;
}

/**
 * @deprecated Gebruik liever {@link saveMatchAdminAction} / MatchAdminForm.
 * Behouden voor backwards compatibility met MatchEntryForm.
 */
export async function createMatchEntryAction(raw: unknown): Promise<MatchEntryActionResult> {
  const parsed = matchEntryPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Controleer het formulier.", fieldErrors: flattenZodErrors(parsed.error) };
  }

  const data = parsed.data;
  const db = await readDb();
  const existingPlayerIds = new Set(db.players.map((p) => p.id));
  const unknownSelected = data.selected_player_ids.find((id) => !existingPlayerIds.has(id));
  if (unknownSelected) {
    return { ok: false, error: "Een of meer geselecteerde speelsters bestaan niet meer." };
  }
  const kickoff_at = new Date(`${data.match_date}T14:00:00.000Z`).toISOString();

  const goalsPayload = data.goals.map((g) => ({
    scorer_player_id: g.scorer_player_id,
    assist_player_id: g.assist_player_id?.trim() || "",
  }));

  return saveMatchAdminAction({
    match_id: "",
    season_id: data.season_id,
    opponent: data.opponent,
    kickoff_at,
    is_home: data.is_home,
    status: "played",
    goals_against: data.goals_against,
    selected_player_ids: data.selected_player_ids,
    goals: goalsPayload,
    wotm_player_id: data.wotm_player_id || "",
  });
}
