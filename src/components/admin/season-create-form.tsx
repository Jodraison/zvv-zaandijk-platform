"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { refreshAfterAdminSave } from "@/lib/admin-refresh";
import { createSeasonFormAction } from "@/actions/seasons-admin";
import { initialAdminFormState, fieldMessage } from "@/lib/forms/admin-action-state";
import { AdminFormBanner } from "@/components/admin/admin-form-message";

const inputCls =
  "min-h-[44px] w-full rounded-xl border border-zvv-border bg-white px-4 py-2.5 text-sm text-zvv-ink outline-none focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/15";

export function SeasonCreateForm() {
  const router = useRouter();
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, pending] = useActionState(createSeasonFormAction, initialAdminFormState);

  useEffect(() => {
    if (state.status === "success") {
      setFormKey((k) => k + 1);
      refreshAfterAdminSave(router);
    }
  }, [state, router]);

  const fe = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form key={formKey} action={formAction} className="mt-6 grid gap-4 md:grid-cols-2">
      {state.status !== "idle" ? (
        <div className="md:col-span-2">
          <AdminFormBanner state={state} />
        </div>
      ) : null}
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
        Naam
        <input name="name" required placeholder="2026/27" className={inputCls} />
        {fieldMessage(fe, "name") ? (
          <span className="block text-xs font-normal text-red-300">{fieldMessage(fe, "name")}</span>
        ) : null}
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
        Actief maken
        <div className="mt-2 flex min-h-[44px] items-center gap-2">
          <input type="checkbox" name="is_active" className="h-4 w-4 rounded border-zvv-border text-zvv-primary" />
          <span className="text-sm text-zvv-muted">Andere seizoenen worden op niet-actief gezet</span>
        </div>
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
        Start
        <input name="starts_on" type="date" required className={inputCls} />
        {fieldMessage(fe, "starts_on") ? (
          <span className="block text-xs font-normal text-red-300">{fieldMessage(fe, "starts_on")}</span>
        ) : null}
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
        Einde
        <input name="ends_on" type="date" required className={inputCls} />
        {fieldMessage(fe, "ends_on") ? (
          <span className="block text-xs font-normal text-red-300">{fieldMessage(fe, "ends_on")}</span>
        ) : null}
      </label>
      <div className="md:col-span-2">
        <button type="submit" disabled={pending} className="club-btn-primary disabled:opacity-40">
          {pending ? "Aanmaken…" : "Seizoen aanmaken"}
        </button>
      </div>
    </form>
  );
}
