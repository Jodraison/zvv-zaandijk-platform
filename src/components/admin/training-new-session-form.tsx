"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { refreshAfterAdminSave } from "@/lib/admin-refresh";
import {
  createManualTrainingFormAction,
  updateManualTrainingFormAction,
} from "@/actions/training";
import { initialAdminFormState, fieldMessage } from "@/lib/forms/admin-action-state";
import { AdminFormBanner } from "@/components/admin/admin-form-message";
import { TRAINING_TITLE_OPTIONS } from "@/lib/training/manual-training";

const inputCls =
  "min-h-[44px] w-full rounded-xl border border-zvv-border bg-white px-4 py-2.5 text-sm text-zvv-ink outline-none focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/15";

type Props = {
  seasonId: string;
  mode?: "create" | "edit";
  sessionId?: string;
  initialDate?: string;
  initialStart?: string;
  initialEnd?: string;
  initialTitle?: string;
  initialNote?: string;
  onCancel?: () => void;
};

export function TrainingNewSessionForm({
  seasonId,
  mode = "create",
  sessionId,
  initialDate = "",
  initialStart = "20:00",
  initialEnd = "21:00",
  initialTitle = "Reguliere training",
  initialNote = "",
  onCancel,
}: Props) {
  const router = useRouter();
  const action = mode === "edit" ? updateManualTrainingFormAction : createManualTrainingFormAction;
  const [state, formAction, pending] = useActionState(action, initialAdminFormState);
  const [open, setOpen] = useState(mode === "edit");

  useEffect(() => {
    if (state.status !== "success") return;
    refreshAfterAdminSave(router);
    if (state.redirectTo) {
      router.push(state.redirectTo);
      return;
    }
    setOpen(false);
  }, [state, router]);

  const fe = state.status === "error" ? state.fieldErrors : undefined;

  if (mode === "create" && !open) {
    return (
      <button type="button" className="club-btn-primary min-h-[44px]" onClick={() => setOpen(true)}>
        + Training toevoegen
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-zvv-border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">
            {mode === "edit" ? "Training wijzigen" : "Nieuwe training"}
          </h3>
          <p className="mt-1 text-sm text-zvv-muted">
            Datum en tijd vrij kiezen. Er wordt geen aanwezigheid automatisch aangemaakt.
          </p>
        </div>
        {mode === "create" ? (
          <button
            type="button"
            className="text-sm font-semibold text-zvv-muted hover:text-zvv-ink"
            onClick={() => setOpen(false)}
          >
            Sluiten
          </button>
        ) : null}
      </div>

      <form action={formAction} className="mt-5 grid gap-4 md:grid-cols-2">
        <input type="hidden" name="season_id" value={seasonId} />
        {mode === "edit" && sessionId ? <input type="hidden" name="session_id" value={sessionId} /> : null}
        {state.status !== "idle" ? (
          <div className="md:col-span-2">
            <AdminFormBanner state={state} />
          </div>
        ) : null}

        <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
          Datum *
          <input name="date_ymd" type="date" required defaultValue={initialDate} className={inputCls} />
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
          Trainingstype / titel *
          <select name="title" defaultValue={initialTitle} className={inputCls}>
            {TRAINING_TITLE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {fieldMessage(fe, "title") ? (
            <span className="block text-xs font-normal text-red-600">{fieldMessage(fe, "title")}</span>
          ) : null}
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
          Starttijd *
          <input name="start_hhmm" type="time" required defaultValue={initialStart} className={inputCls} />
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
          Eindtijd *
          <input name="end_hhmm" type="time" required defaultValue={initialEnd} className={inputCls} />
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted md:col-span-2">
          Notitie (optioneel)
          <input name="note" defaultValue={initialNote} className={inputCls} placeholder="Bv. inhaaltraining of veld 2" />
        </label>

        <div className="flex flex-wrap gap-2 md:col-span-2">
          <button type="submit" disabled={pending} className="club-btn-primary disabled:opacity-40">
            {pending ? "Opslaan…" : mode === "edit" ? "Wijzigingen opslaan" : "Training toevoegen"}
          </button>
          {onCancel ? (
            <button type="button" className="club-btn-secondary" onClick={onCancel}>
              Annuleren
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
