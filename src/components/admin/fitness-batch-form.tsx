"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { refreshAfterAdminSave } from "@/lib/admin-refresh";
import { saveFitnessBatchFormAction } from "@/actions/fitness";
import { initialAdminFormState, fieldMessage } from "@/lib/forms/admin-action-state";
import { AdminFormBanner } from "@/components/admin/admin-form-message";
import { normalizeTimeInputString, parseTimeInput } from "@/lib/fitness/parse-time-input";

const inputCls =
  "min-h-[40px] w-full rounded-lg border border-zvv-border bg-white px-2 py-1.5 text-sm text-zvv-ink tabular-nums outline-none focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/15";

export function FitnessBatchForm({
  seasonId,
  members,
}: {
  seasonId: string;
  members: { id: string; shirt: number; name: string }[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveFitnessBatchFormAction, initialAdminFormState);
  const [testOn, setTestOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [vals, setVals] = useState<Record<string, { total: string }>>(() => {
    const o: Record<string, { total: string }> = {};
    for (const m of members) o[m.id] = { total: "" };
    return o;
  });
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");

  useEffect(() => {
    if (state.status === "success") refreshAfterAdminSave(router);
  }, [state, router]);

  const normalizedRows = useMemo(() => {
    return members.flatMap((m) => {
      const rawInput = vals[m.id]?.total ?? "";
      const normalized = normalizeTimeInputString(rawInput);
      if (!normalized) return [];
      const parsedSeconds = parseTimeInput(rawInput);
      console.log("[fitness-batch] parse", { playerId: m.id, rawInput, normalized, parsedSeconds });
      if (parsedSeconds == null) return [];
      return [{ player_id: m.id, total_time_seconds: parsedSeconds }];
    });
  }, [members, vals]);

  const payload = useMemo(
    () =>
      JSON.stringify({
        season_id: seasonId,
        test_on: testOn,
        rows: normalizedRows,
      }),
    [seasonId, testOn, normalizedRows],
  );

  const fe = state.status === "error" ? state.fieldErrors : undefined;

  function validateRows(): { errors: Record<string, string>; hasAtLeastOneValid: boolean } {
    const errors: Record<string, string> = {};
    let validCount = 0;
    for (const m of members) {
      const rawInput = vals[m.id]?.total ?? "";
      const normalized = normalizeTimeInputString(rawInput);
      if (!normalized) continue;
      const parsedSeconds = parseTimeInput(rawInput);
      console.log("[fitness-batch] validate", { playerId: m.id, rawInput, normalized, parsedSeconds });
      if (parsedSeconds == null || parsedSeconds <= 0) {
        errors[m.id] = "Ongeldige tijd. Gebruik bijvoorbeeld 332.18 of 05:32.18";
      } else {
        validCount += 1;
      }
    }
    return { errors, hasAtLeastOneValid: validCount > 0 };
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    const { errors, hasAtLeastOneValid } = validateRows();
    setRowErrors(errors);
    if (!hasAtLeastOneValid || Object.keys(errors).length > 0) {
      e.preventDefault();
      setSubmitError(
        !hasAtLeastOneValid
          ? "Vul minimaal 1 geldige tijd in om op te slaan."
          : "Controleer de ongeldige ingevulde tijden.",
      );
      return;
    }
    setSubmitError("");
  }

  function handleBlur(playerId: string) {
    const rawInput = vals[playerId]?.total ?? "";
    const normalized = normalizeTimeInputString(rawInput);
    const parsedSeconds = parseTimeInput(rawInput);
    console.log("[fitness-batch] blur", { playerId, rawInput, normalized, parsedSeconds });
    if (!normalized) {
      setRowErrors((prev) => {
        const { [playerId]: _, ...rest } = prev;
        return rest;
      });
      setVals((prev) => ({ ...prev, [playerId]: { total: "" } }));
      return;
    }
    if (parsedSeconds == null || parsedSeconds <= 0) {
      setRowErrors((prev) => ({
        ...prev,
        [playerId]: "Ongeldige tijd. Gebruik bijvoorbeeld 332.18 of 05:32.18",
      }));
      setVals((prev) => ({ ...prev, [playerId]: { total: normalized } }));
      return;
    }
    setRowErrors((prev) => {
      const { [playerId]: _, ...rest } = prev;
      return rest;
    });
    setVals((prev) => ({ ...prev, [playerId]: { total: parsedSeconds.toFixed(2) } }));
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="payload" value={payload} readOnly />
      {state.status !== "idle" ? <AdminFormBanner state={state} /> : null}

      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
          Datum meting
          <input
            type="date"
            value={testOn}
            onChange={(e) => setTestOn(e.target.value)}
            className={inputCls + " min-w-[11rem]"}
            required
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zvv-border bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-zvv-border bg-zvv-card-mid text-[10px] font-semibold uppercase tracking-wider text-zvv-muted">
              <th className="px-3 py-3">Speelster</th>
              <th className="px-3 py-3">Totale tijd (s)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zvv-border">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-3 py-2 font-medium text-zvv-ink">
                  #{m.shirt} {m.name}
                </td>
                <td className="px-3 py-2">
                  <input
                    className={inputCls}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    pattern="[0-9:.,\\s]*"
                    value={vals[m.id]?.total ?? ""}
                    onChange={(e) => {
                      const next = e.target.value;
                      setVals((p) => ({ ...p, [m.id]: { total: next } }));
                      if (!normalizeTimeInputString(next)) {
                        setRowErrors((prev) => {
                          const { [m.id]: _, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    onBlur={() => handleBlur(m.id)}
                    placeholder="bijv. 332.18 of 05:32.18"
                    aria-label={`Totale tijd ${m.name}`}
                  />
                  <p className="mt-1 text-xs text-zvv-muted">Je mag minuten:seconden invoeren of seconden</p>
                  {rowErrors[m.id] ? <p className="mt-1 text-xs text-red-600">{rowErrors[m.id]}</p> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {fieldMessage(fe, "rows") ? <p className="text-sm text-red-600">{fieldMessage(fe, "rows")}</p> : null}
      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

      <button type="submit" disabled={pending || members.length === 0} className="club-btn-primary disabled:opacity-40">
        {pending ? "Opslaan…" : "Meting opslaan (alle speelsters)"}
      </button>
      <p className="text-xs text-zvv-muted">
        Laat velden leeg om ze over te slaan. Bestaande meting op dezelfde datum wordt vervangen.
      </p>
    </form>
  );
}
