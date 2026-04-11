"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { refreshAfterAdminSave } from "@/lib/admin-refresh";
import { saveFitnessBatchFormAction } from "@/actions/fitness";
import { initialAdminFormState, fieldMessage } from "@/lib/forms/admin-action-state";
import { AdminFormBanner } from "@/components/admin/admin-form-message";

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

  useEffect(() => {
    if (state.status === "success") refreshAfterAdminSave(router);
  }, [state, router]);

  const payload = useMemo(
    () =>
      JSON.stringify({
        season_id: seasonId,
        test_on: testOn,
        rows: members.map((m) => ({
          player_id: m.id,
          sprint_20m: vals[m.id]?.total ?? "",
          sprint_40m: vals[m.id]?.total ?? "",
          sprint_60m: vals[m.id]?.total ?? "",
        })),
      }),
    [seasonId, testOn, members, vals],
  );

  const fe = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-6">
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
                    inputMode="decimal"
                    value={vals[m.id]?.total ?? ""}
                    onChange={(e) => setVals((p) => ({ ...p, [m.id]: { total: e.target.value } }))}
                    placeholder="Totale tijd (s)"
                    aria-label={`Totale tijd ${m.name}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {fieldMessage(fe, "rows") ? <p className="text-sm text-red-600">{fieldMessage(fe, "rows")}</p> : null}

      <button type="submit" disabled={pending || members.length === 0} className="club-btn-primary disabled:opacity-40">
        {pending ? "Opslaan…" : "Meting opslaan (alle speelsters)"}
      </button>
      <p className="text-xs text-zvv-muted">Totale tijd is per speelster verplicht. Bestaande meting op dezelfde datum wordt vervangen.</p>
    </form>
  );
}
