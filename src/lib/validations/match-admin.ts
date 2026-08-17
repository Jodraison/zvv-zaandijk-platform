import { z } from "zod";
import { matchStatusSchema, matchTypeSchema } from "@/lib/validations/forms";
import { matchLineupPayloadSchema } from "@/lib/validations/match-lineup";
import { matchCardEventsPayloadSchema, matchMinuteSchema } from "@/lib/validations/match-events";
import { matchSubstitutionsPayloadSchema } from "@/lib/validations/match-substitutions";

/**
 * Optionele tekstvelden: string | "" | null | undefined → trim of null.
 * Belangrijk: null mag niet falen (formulier stuurt lege optionals als null).
 */
const optionalMatchText = (max: number, label: string) =>
  z.preprocess(
    (raw) => (raw == null ? "" : String(raw)),
    z
      .string()
      .trim()
      .max(max, `${label}: maximaal ${max} tekens.`)
      .transform((t) => t || null),
  );

export const matchAdminGoalRowSchema = z.object({
  scorer_player_id: z.string().min(1),
  assist_player_id: z.string().optional().or(z.literal("")).nullable(),
  minute: matchMinuteSchema,
});

export const matchAdminPayloadSchema = z
  .object({
    match_id: z.string().optional().or(z.literal("")),
    season_id: z.string().min(1, "Seizoen ontbreekt"),
    opponent: z.string().trim().min(1, "Vul een tegenstander in."),
    kickoff_at: z.string().min(1, "Kies een geldige wedstrijddatum en aanvangstijd."),
    is_home: z.boolean(),
    match_type: matchTypeSchema,
    location: optionalMatchText(200, "Locatie"),
    referee: optionalMatchText(120, "Scheidsrechter"),
    notes: optionalMatchText(2000, "Notities"),
    status: matchStatusSchema,
    goals_for: z.coerce.number().int().min(0, "Doelpunten voor kunnen niet negatief zijn.").max(99),
    goals_against: z.coerce.number().int().min(0, "Doelpunten tegen kunnen niet negatief zijn.").max(99),
    selected_player_ids: z.array(z.string().min(1)),
    goals: z.array(matchAdminGoalRowSchema),
    wotm_player_id: z.string().optional().or(z.literal("")),
    lineup: matchLineupPayloadSchema,
    cards: matchCardEventsPayloadSchema,
    substitutions: matchSubstitutionsPayloadSchema,
    /** Wanneer true: wissels/positiewijzigingen worden via MatchShapeEventsEditor beheerd. */
    preserve_shape_events: z.boolean().optional().default(false),
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
          message: "Een geplande wedstrijd hoeft nog geen uitslag te hebben.",
          path: ["goals_for"],
        });
      }
      if (data.goals_against !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Een geplande wedstrijd hoeft nog geen uitslag te hebben.",
          path: ["goals_against"],
        });
      }
      if (data.goals.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Doelpunten pas na de wedstrijd — kies eerst ‘Wedstrijd afronden’.",
          path: ["goals"],
        });
      }
      if (data.cards.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Alleen bij status ‘gespeeld’ kun je kaarten invoeren",
          path: ["cards"],
        });
      }
      if (data.substitutions.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Alleen bij status ‘gespeeld’ kun je wissels invoeren",
          path: ["substitutions"],
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
          message: "Assistgever moet in de wedstrijdselectie zitten",
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

    const goalKeys = new Set<string>();
    data.goals.forEach((g, i) => {
      const ast = assistNorm(g.assist_player_id) ?? "";
      const key = `${g.scorer_player_id}:${g.minute}:${ast}`;
      if (goalKeys.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Dubbel doelpunt (zelfde scorer, minuut en assist).",
          path: ["goals", i, "minute"],
        });
      }
      goalKeys.add(key);
    });

    const cardKeys = new Set<string>();
    data.cards.forEach((c, i) => {
      const key = `${c.player_id}:${c.card_type}:${c.minute}`;
      if (cardKeys.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Dubbele kaart op dezelfde minuut.",
          path: ["cards", i, "minute"],
        });
      }
      cardKeys.add(key);
      if (!sel.has(c.player_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Speelster moet in de wedstrijdselectie zitten",
          path: ["cards", i, "player_id"],
        });
      }
    });

    const subKeys = new Set<string>();
    data.substitutions.forEach((s, i) => {
      if (s.player_in_id === s.player_out_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Speelster erin en eruit mogen niet dezelfde zijn",
          path: ["substitutions", i, "player_out_id"],
        });
      }
      const key = `${s.player_in_id}:${s.player_out_id}:${s.minute}`;
      if (subKeys.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Dubbele identieke wissel.",
          path: ["substitutions", i, "minute"],
        });
      }
      subKeys.add(key);
      if (!sel.has(s.player_in_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Speelster erin moet in de wedstrijdselectie zitten",
          path: ["substitutions", i, "player_in_id"],
        });
      }
      if (!sel.has(s.player_out_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Speelster eruit moet in de wedstrijdselectie zitten",
          path: ["substitutions", i, "player_out_id"],
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
