"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { refreshAfterAdminSave } from "@/lib/admin-refresh";
import { addPlayerToSeasonFormAction } from "@/actions/players";
import { initialAdminFormState, fieldMessage } from "@/lib/forms/admin-action-state";
import { AdminFormBanner } from "@/components/admin/admin-form-message";

const inputCls =
  "min-h-[44px] w-full rounded-xl border border-zvv-border bg-white px-4 py-2.5 text-sm text-zvv-ink outline-none focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/15";

export function AddPlayerToSeasonForm({
  seasonId,
  candidates,
}: {
  seasonId: string;
  candidates: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(addPlayerToSeasonFormAction, initialAdminFormState);

  useEffect(() => {
    if (state.status === "success") {
      refreshAfterAdminSave(router);
    }
  }, [state, router]);

  const fe = state.status === "error" ? state.fieldErrors : undefined;

  if (candidates.length === 0) {
    return (
      <p className="text-sm text-zvv-muted">
        Alle bekende speelsters zitten al in dit seizoen. Gebruik &quot;Nieuwe speelster&quot; op de spelerspagina om iemand nieuw aan de club toe te voegen.
      </p>
    );
  }

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="season_id" value={seasonId} />
      {state.status !== "idle" ? (
        <div className="md:col-span-2">
          <AdminFormBanner state={state} />
        </div>
      ) : null}
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted md:col-span-2">
        Bestaande club-speelster
        <select name="player_id" required className={inputCls}>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {fieldMessage(fe, "player_id") ? (
          <span className="block text-xs font-normal text-red-300">{fieldMessage(fe, "player_id")}</span>
        ) : null}
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
        Rugnummer in dit seizoen
        <input name="shirt_number" type="number" min={1} max={99} required className={inputCls} />
        {fieldMessage(fe, "shirt_number") ? (
          <span className="block text-xs font-normal text-red-300">{fieldMessage(fe, "shirt_number")}</span>
        ) : null}
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
        Linie (enum)
        <select name="position" className={inputCls}>
          <option value="GK">GK — keeper</option>
          <option value="DEF">DEF — verdediging</option>
          <option value="MID">MID — middenveld</option>
          <option value="ATT">ATT — aanval</option>
        </select>
        {fieldMessage(fe, "position") ? (
          <span className="block text-xs font-normal text-red-300">{fieldMessage(fe, "position")}</span>
        ) : null}
      </label>
      <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-zvv-muted md:col-span-2">
        Positie (tekst op site)
        <textarea
          name="display_position"
          required
          rows={2}
          className={`${inputCls} min-h-[4.5rem] resize-y py-3`}
          placeholder="Exacte rol op het veld"
        />
        {fieldMessage(fe, "display_position") ? (
          <span className="block text-xs font-normal text-red-300">{fieldMessage(fe, "display_position")}</span>
        ) : null}
      </label>
      <div className="md:col-span-2">
        <button type="submit" disabled={pending} className="club-btn-secondary disabled:opacity-40">
          {pending ? "…" : "Koppelen aan seizoen"}
        </button>
      </div>
    </form>
  );
}
