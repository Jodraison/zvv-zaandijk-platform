"use client";

import { ABSENCE_REASONS, ABSENCE_REASON_LABELS_NL, type AbsenceReason } from "@/lib/training/absence-reason";
import { cn } from "@/lib/utils";

export function AbsenceReasonChips({
  value,
  onChange,
  disabled,
}: {
  value: AbsenceReason | null;
  onChange: (reason: AbsenceReason) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-zvv-muted">Waarom afwezig?</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {ABSENCE_REASONS.map((reason) => {
          const active = value === reason;
          return (
            <button
              key={reason}
              type="button"
              disabled={disabled}
              onClick={() => onChange(reason)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-semibold transition",
                active
                  ? "border-zvv-primary bg-zvv-primary text-white"
                  : "border-zvv-border bg-white text-zvv-ink hover:border-zvv-primary/40",
              )}
            >
              {ABSENCE_REASON_LABELS_NL[reason]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
