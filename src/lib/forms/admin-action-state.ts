import type { z } from "zod";

/** Standaard status voor beheerformulieren met useActionState. */
export type AdminFormState =
  | { status: "idle" }
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "success"; message: string };

export const initialAdminFormState: AdminFormState = { status: "idle" };

export function normalizeMutationError(message: string): string {
  if (/concurrente wijziging|optimistic lock|schema_version/i.test(message)) {
    return "Iemand anders heeft intussen gegevens gewijzigd. Vernieuw de pagina (F5) en probeer opnieuw.";
  }
  return message;
}

export function flattenZodIssues(err: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const path = issue.path.length ? issue.path.join(".") : "_root";
    if (!out[path]) out[path] = [];
    out[path].push(issue.message);
  }
  return out;
}

export function firstFieldMessage(fieldErrors: Record<string, string[]> | undefined): string | undefined {
  if (!fieldErrors) return undefined;
  for (const msgs of Object.values(fieldErrors)) {
    if (msgs[0]) return msgs[0];
  }
  return undefined;
}

export function fieldMessage(
  fieldErrors: Record<string, string[]> | undefined,
  path: string,
): string | undefined {
  return fieldErrors?.[path]?.[0];
}

/** Alle doelpunt-gerelateerde serverfouten (Zod-paden goals.0.scorer_player_id, …). */
export function collectGoalFieldMessages(fieldErrors: Record<string, string[]> | undefined): string[] {
  if (!fieldErrors) return [];
  const out: string[] = [];
  for (const [key, msgs] of Object.entries(fieldErrors)) {
    if (key === "goals" || key.startsWith("goals.")) {
      for (const m of msgs) out.push(m);
    }
  }
  return out;
}
