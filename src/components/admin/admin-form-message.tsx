"use client";

import type { AdminFormState } from "@/lib/forms/admin-action-state";

export function AdminFormBanner({ state }: { state: AdminFormState }) {
  if (state.status === "idle") return null;

  if (state.status === "error") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <p className="font-medium">{state.error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      {state.message}
    </div>
  );
}
