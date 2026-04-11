"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { refreshAfterAdminSave } from "@/lib/admin-refresh";
import { createGuestPlayerFormAction } from "@/actions/players";
import { initialAdminFormState, fieldMessage } from "@/lib/forms/admin-action-state";
import { AdminFormBanner } from "@/components/admin/admin-form-message";

const inputCls =
  "min-h-[44px] w-full rounded-xl border border-zvv-border bg-white px-4 py-2.5 text-sm text-zvv-ink outline-none focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/15";

export function GuestPlayerCreateForm({ seasonId }: { seasonId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createGuestPlayerFormAction, initialAdminFormState);
  useEffect(() => {
    if (state.status === "success") refreshAfterAdminSave(router);
  }, [router, state.status]);
  const fe = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="season_id" value={seasonId} />
      {state.status !== "idle" ? <div className="md:col-span-2"><AdminFormBanner state={state} /></div> : null}
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted md:col-span-2">
        Gast naam
        <input name="full_name" required className={inputCls} />
        {fieldMessage(fe, "full_name") ? <span className="text-xs text-red-600">{fieldMessage(fe, "full_name")}</span> : null}
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
        Foto-URL
        <input name="photo_url" type="url" className={inputCls} />
      </label>
      <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-zvv-border bg-zvv-card-mid px-3 py-2">
        <input type="checkbox" name="add_to_season" className="h-4 w-4 rounded border-zvv-border text-zvv-primary" />
        <span className="text-sm text-zvv-ink">Direct koppelen aan geselecteerd seizoen</span>
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
        Rugnummer (bij koppelen)
        <input name="shirt_number" type="number" min={1} max={99} className={inputCls} />
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
        Positie enum
        <select name="position" className={inputCls}>
          <option value="">—</option><option value="GK">GK</option><option value="DEF">DEF</option><option value="MID">MID</option><option value="ATT">ATT</option>
        </select>
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted md:col-span-2">
        Display positie (bij koppelen)
        <input name="display_position" className={inputCls} />
      </label>
      <div className="md:col-span-2">
        <button type="submit" disabled={pending} className="club-btn-secondary disabled:opacity-40">{pending ? "Bezig..." : "Gast opslaan"}</button>
      </div>
    </form>
  );
}
