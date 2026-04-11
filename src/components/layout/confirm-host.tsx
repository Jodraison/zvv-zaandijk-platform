"use client";

import { useUiStore } from "@/stores/ui-store";

export function ConfirmHost() {
  const { confirmDialog, closeConfirm } = useUiStore();
  if (!confirmDialog) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zvv-ink/40 p-4 backdrop-blur-sm">
      <div className="glass-panel max-w-md rounded-2xl p-6 shadow-[var(--shadow-zvv-lift)]">
        <h3 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-zvv-ink">{confirmDialog.title}</h3>
        <p className="mt-2 text-sm text-zvv-muted">{confirmDialog.message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-zvv-border bg-zvv-card-mid px-4 py-2 text-sm font-semibold text-zvv-ink hover:bg-white"
            onClick={closeConfirm}
          >
            Annuleren
          </button>
          <button
            type="button"
            className="club-btn-primary px-4 py-2 text-sm"
            onClick={() => {
              confirmDialog.onConfirm();
              closeConfirm();
            }}
          >
            Bevestigen
          </button>
        </div>
      </div>
    </div>
  );
}
