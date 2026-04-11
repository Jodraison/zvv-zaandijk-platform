"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { refreshAfterAdminSave } from "@/lib/admin-refresh";
import { createTrainingSessionFormAction } from "@/actions/training";
import { initialAdminFormState, fieldMessage } from "@/lib/forms/admin-action-state";
import { AdminFormBanner } from "@/components/admin/admin-form-message";

const inputCls =
  "min-h-[44px] w-full rounded-xl border border-zvv-border bg-white px-4 py-2.5 text-sm text-zvv-ink outline-none focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/15";

export function TrainingNewSessionForm({ seasonId }: { seasonId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createTrainingSessionFormAction, initialAdminFormState);

  useEffect(() => {
    if (state.status === "success") {
      refreshAfterAdminSave(router);
    }
  }, [state, router]);

  const fe = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="mt-6 grid gap-4 md:grid-cols-2">
      <input type="hidden" name="season_id" value={seasonId} />
      {state.status !== "idle" ? (
        <div className="md:col-span-2">
          <AdminFormBanner state={state} />
        </div>
      ) : null}
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted md:col-span-2">
        Titel
        <input name="title" className={inputCls} placeholder="Bv. Positiespel" />
        {fieldMessage(fe, "title") ? <span className="block text-xs font-normal text-red-300">{fieldMessage(fe, "title")}</span> : null}
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
        Datum/tijd
        <input name="session_at" type="datetime-local" required className={inputCls} />
        {fieldMessage(fe, "session_at") ? (
          <span className="block text-xs font-normal text-red-300">{fieldMessage(fe, "session_at")}</span>
        ) : null}
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted md:col-span-2">
        Locatie
        <input name="location" className={inputCls} />
        {fieldMessage(fe, "location") ? (
          <span className="block text-xs font-normal text-red-300">{fieldMessage(fe, "location")}</span>
        ) : null}
      </label>
      <div className="md:col-span-2">
        <button type="submit" disabled={pending} className="club-btn-primary disabled:opacity-40">
          {pending ? "Aanmaken…" : "Aanmaken (iedereen standaard aanwezig)"}
        </button>
      </div>
    </form>
  );
}
