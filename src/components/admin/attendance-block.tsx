"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { refreshAfterAdminSave } from "@/lib/admin-refresh";
import { saveTrainingAttendanceFormAction } from "@/actions/training";
import { initialAdminFormState } from "@/lib/forms/admin-action-state";
import { AdminFormBanner } from "@/components/admin/admin-form-message";
import { GlassCard } from "@/components/layout/glass-card";
import { formatDateTimeNL } from "@/lib/utils/format-date";

type Row = { player_id: string; name: string; shirt_number: number; present: boolean; note: string | null };

export function AttendanceBlock({
  sessionId,
  title,
  sessionAt,
  rows,
}: {
  sessionId: string;
  title: string;
  sessionAt: string;
  rows: Row[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveTrainingAttendanceFormAction, initialAdminFormState);

  useEffect(() => {
    if (state.status === "success") {
      refreshAfterAdminSave(router);
    }
  }, [state, router]);

  return (
    <GlassCard>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink">{title}</h3>
          <p className="text-sm text-zvv-muted">{formatDateTimeNL(sessionAt)}</p>
        </div>
      </div>
      {state.status !== "idle" ? (
        <div className="mb-4">
          <AdminFormBanner state={state} />
        </div>
      ) : null}
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="session_id" value={sessionId} />
        {rows.map((r) => (
          <div key={r.player_id} className="rounded-xl border border-zvv-border bg-zvv-card-mid p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-medium text-zvv-ink">
                #{r.shirt_number} {r.name}
              </span>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
                <input
                  type="checkbox"
                  name={`present__${r.player_id}`}
                  defaultChecked={r.present}
                  className="h-4 w-4 rounded border-zvv-border bg-white text-zvv-primary focus:ring-zvv-primary/30"
                />
                Aanwezig
              </label>
            </div>
            <label className="mt-3 block space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zvv-muted">Opmerking (blessure, onbekend, …)</span>
              <input
                type="text"
                name={`note__${r.player_id}`}
                defaultValue={r.note ?? ""}
                className="min-h-[44px] w-full rounded-lg border border-zvv-border bg-white px-3 py-2 text-sm text-zvv-ink outline-none focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/15"
                placeholder="Optioneel"
              />
            </label>
          </div>
        ))}
        <button type="submit" disabled={pending} className="club-btn-primary w-full sm:w-auto disabled:opacity-40">
          {pending ? "Opslaan…" : "Opslaan aanwezigheid"}
        </button>
      </form>
    </GlassCard>
  );
}
