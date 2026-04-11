"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { refreshAfterAdminSave } from "@/lib/admin-refresh";
import { setActiveSeasonFormStateAction } from "@/actions/seasons-admin";
import { initialAdminFormState } from "@/lib/forms/admin-action-state";
import { AdminFormBanner } from "@/components/admin/admin-form-message";

export function SetActiveSeasonForm({ seasonId, isActive }: { seasonId: string; isActive: boolean }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(setActiveSeasonFormStateAction, initialAdminFormState);

  useEffect(() => {
    if (state.status === "success") {
      refreshAfterAdminSave(router);
    }
  }, [state, router]);

  return (
    <div className="flex flex-col items-end gap-2">
      {state.status !== "idle" ? <AdminFormBanner state={state} /> : null}
      <form action={formAction}>
        <input type="hidden" name="season_id" value={seasonId} />
        <button
          type="submit"
          disabled={isActive || pending}
          className="club-btn-secondary club-btn-primary-sm disabled:pointer-events-none disabled:opacity-40"
        >
          {pending ? "…" : "Maak actief"}
        </button>
      </form>
    </div>
  );
}
