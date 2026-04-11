"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { refreshAfterAdminSave } from "@/lib/admin-refresh";
import { deleteFitnessTestFormAction, updateFitnessSprintFormAction } from "@/actions/fitness";
import { initialAdminFormState, fieldMessage } from "@/lib/forms/admin-action-state";
import { AdminFormBanner } from "@/components/admin/admin-form-message";
import { formatDateNL } from "@/lib/utils/format-date";

const inputCls =
  "min-h-[40px] w-full rounded-lg border border-zvv-border bg-white px-2 py-1.5 text-sm text-zvv-ink tabular-nums outline-none focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/15";

export type FitnessAdminRow = {
  id: string;
  player_id: string;
  playerName: string;
  shirt: number;
  test_on: string;
  sprint_20m: number;
  sprint_40m: number;
  sprint_60m: number;
};

export function FitnessAdminTable({ rows }: { rows: FitnessAdminRow[] }) {
  const router = useRouter();
  const [editState, editAction, editPending] = useActionState(updateFitnessSprintFormAction, initialAdminFormState);
  const [delState, delAction, delPending] = useActionState(deleteFitnessTestFormAction, initialAdminFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    test_on: string;
    sprint_20m: string;
    sprint_40m: string;
    sprint_60m: string;
  } | null>(null);

  useEffect(() => {
    if (editState.status === "success" || delState.status === "success") {
      setEditingId(null);
      setDraft(null);
      refreshAfterAdminSave(router);
    }
  }, [editState, delState, router]);

  const busy = editPending || delPending;

  function startEdit(r: FitnessAdminRow) {
    setEditingId(r.id);
    setDraft({
      test_on: r.test_on,
      sprint_20m: String(r.sprint_20m),
      sprint_40m: String(r.sprint_40m),
      sprint_60m: String(r.sprint_60m),
    });
  }

  const updatePayload = useMemo(() => {
    if (!editingId || !draft) return "";
    return JSON.stringify({
      id: editingId,
      test_on: draft.test_on,
      sprint_20m: draft.sprint_20m,
      sprint_40m: draft.sprint_40m,
      sprint_60m: draft.sprint_60m,
    });
  }, [editingId, draft]);

  return (
    <div className="space-y-4">
      {(editState.status !== "idle" || delState.status !== "idle") && (
        <div className="space-y-2">
          {editState.status !== "idle" ? <AdminFormBanner state={editState} /> : null}
          {delState.status !== "idle" ? <AdminFormBanner state={delState} /> : null}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-zvv-border bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-zvv-border bg-zvv-card-mid text-[10px] font-semibold uppercase tracking-wider text-zvv-muted">
              <th className="px-3 py-3">Datum</th>
              <th className="px-3 py-3">Speelster</th>
              <th className="px-3 py-3 text-right">20m (s)</th>
              <th className="px-3 py-3 text-right">40m (s)</th>
              <th className="px-3 py-3 text-right">60m (s)</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zvv-border">
            {rows.map((r) => (
              <tr key={r.id} className="align-middle">
                {editingId === r.id && draft ? (
                  <>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        className={inputCls}
                        value={draft.test_on}
                        onChange={(e) => setDraft((d) => (d ? { ...d, test_on: e.target.value } : d))}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-zvv-ink">
                      #{r.shirt} {r.playerName}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        className={inputCls}
                        inputMode="decimal"
                        placeholder="20m (s)"
                        value={draft.sprint_20m}
                        onChange={(e) => setDraft((d) => (d ? { ...d, sprint_20m: e.target.value } : d))}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        className={inputCls}
                        inputMode="decimal"
                        placeholder="40m (s)"
                        value={draft.sprint_40m}
                        onChange={(e) => setDraft((d) => (d ? { ...d, sprint_40m: e.target.value } : d))}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        className={inputCls}
                        inputMode="decimal"
                        placeholder="60m (s)"
                        value={draft.sprint_60m}
                        onChange={(e) => setDraft((d) => (d ? { ...d, sprint_60m: e.target.value } : d))}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <form action={editAction} className="flex flex-wrap gap-2">
                        <input type="hidden" name="payload" value={updatePayload} readOnly />
                        <button type="submit" disabled={busy} className="rounded-lg bg-zvv-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                          Opslaan
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-zvv-border px-3 py-1.5 text-xs font-semibold text-zvv-muted"
                          onClick={() => {
                            setEditingId(null);
                            setDraft(null);
                          }}
                        >
                          Annuleren
                        </button>
                      </form>
                      {editState.status === "error" && fieldMessage(editState.fieldErrors, "sprint_20m") ? (
                        <p className="mt-1 text-xs text-red-600">{fieldMessage(editState.fieldErrors, "sprint_20m")}</p>
                      ) : null}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2 text-zvv-muted">{formatDateNL(r.test_on)}</td>
                    <td className="px-3 py-2 font-medium text-zvv-ink">
                      #{r.shirt} {r.playerName}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{r.sprint_20m.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{r.sprint_40m.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{r.sprint_60m.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="text-xs font-semibold text-zvv-primary hover:underline"
                          onClick={() => startEdit(r)}
                          disabled={busy}
                        >
                          Bewerken
                        </button>
                        <form action={delAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <button type="submit" disabled={busy} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50">
                            Verwijderen
                          </button>
                        </form>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
