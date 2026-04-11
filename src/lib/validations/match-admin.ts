import { z } from "zod";
import { matchStatusSchema } from "@/lib/validations/forms";

export const matchAdminGoalRowSchema = z.object({
  scorer_player_id: z.string().min(1),
  assist_player_id: z.string().optional().or(z.literal("")).nullable(),
});

export const matchAdminPayloadSchema = z
  .object({
    match_id: z.string().optional().or(z.literal("")),
    season_id: z.string().min(1, "Seizoen ontbreekt"),
    opponent: z.string().trim().min(1, "Tegenstander is verplicht"),
    kickoff_at: z.string().min(1, "Datum en tijd zijn verplicht"),
    is_home: z.boolean(),
    status: matchStatusSchema,
    goals_for: z.coerce.number().int().min(0).max(99),
    goals_against: z.coerce.number().int().min(0).max(99),
    selected_player_ids: z.array(z.string().min(1)),
    goals: z.array(matchAdminGoalRowSchema),
    wotm_player_id: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const assistNorm = (a: string | null | undefined) => (typeof a === "string" && a.trim() ? a.trim() : undefined);
    const sel = new Set(data.selected_player_ids);

    if (data.status === "played") {
      if (data.selected_player_ids.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecteer minstens één speelster voor de wedstrijdselectie",
          path: ["selected_player_ids"],
        });
      }
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
    }

    if (data.status !== "played") {
      if (data.goals_for !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Goals voor moet 0 zijn als wedstrijd niet gespeeld is",
          path: ["goals_for"],
        });
      }
      if (data.goals.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Alleen bij status ‘gespeeld’ kun je doelpunten invoeren",
          path: ["goals"],
        });
      }
      if (data.wotm_player_id?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "MVP alleen bij een gespeelde wedstrijd",
          path: ["wotm_player_id"],
        });
      }
    }

    if (data.status !== "played") return;

    if (data.goals.length !== data.goals_for) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Aantal goal-events moet gelijk zijn aan goals voor.",
        path: ["goals_for"],
      });
    }

    data.goals.forEach((g, i) => {
      if (!sel.has(g.scorer_player_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Scorer moet in de wedstrijdselectie zitten",
          path: ["goals", i, "scorer_player_id"],
        });
      }
      const ast = assistNorm(g.assist_player_id);
      if (ast && !sel.has(ast)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Assistent moet in de wedstrijdselectie zitten",
          path: ["goals", i, "assist_player_id"],
        });
      }
      if (ast && ast === g.scorer_player_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Scorer en assist kunnen niet dezelfde speelster zijn",
          path: ["goals", i, "assist_player_id"],
        });
      }
    });

    const wotm = data.wotm_player_id?.trim();
    if (data.status === "played") {
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
    }
  });

export type MatchAdminPayload = z.infer<typeof matchAdminPayloadSchema>;
