import { z } from "zod";

/** Eén teamgoal: één scorer, optioneel assist (zelfde wedstrijd-selectie). */
export const matchEntryGoalRowSchema = z.object({
  scorer_player_id: z.string().min(1),
  assist_player_id: z.string().optional().or(z.literal("")),
});

export const matchEntryPayloadSchema = z
  .object({
    season_id: z.string().min(1),
    opponent: z.string().trim().min(1, "Tegenstander is verplicht"),
    match_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Kies een geldige datum"),
    is_home: z.boolean(),
    goals_against: z.coerce.number().int().min(0).max(99),
    selected_player_ids: z.array(z.string().min(1)).min(1, "Selecteer minstens één speler"),
    goals: z.array(matchEntryGoalRowSchema),
    wotm_player_id: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const sel = new Set(data.selected_player_ids);

    const assistNorm = (a: string | undefined) => (a && a.trim() ? a.trim() : undefined);

    data.goals.forEach((g, i) => {
      if (!sel.has(g.scorer_player_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Doelpuntenmaker moet bij de geselecteerde spelers horen",
          path: ["goals", i, "scorer_player_id"],
        });
      }
      const ast = assistNorm(g.assist_player_id);
      if (ast && !sel.has(ast)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Assistent moet bij de geselecteerde spelers horen",
          path: ["goals", i, "assist_player_id"],
        });
      }
      if (ast && ast === g.scorer_player_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Scorer en assist kunnen niet dezelfde speler zijn",
          path: ["goals", i, "assist_player_id"],
        });
      }
    });

    const seen = new Set<string>();
    for (const id of data.selected_player_ids) {
      if (seen.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Dubbele speelster in selectie — elke speelster kan maar één keer voorkomen.",
          path: ["selected_player_ids"],
        });
        break;
      }
      seen.add(id);
    }

    const wotm = data.wotm_player_id?.trim();
    if (!wotm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Kies een MVP (speelster van de wedstrijd).",
        path: ["wotm_player_id"],
      });
    } else if (!sel.has(wotm)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "MVP niet in selectie",
        path: ["wotm_player_id"],
      });
    }
  });

export type MatchEntryGoalRow = z.infer<typeof matchEntryGoalRowSchema>;
export type MatchEntryPayload = z.infer<typeof matchEntryPayloadSchema>;
