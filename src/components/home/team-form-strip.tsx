"use client";

import { cn } from "@/lib/utils";

const meta: Record<string, { label: string; sub: string }> = {
  W: { label: "W", sub: "Winst" },
  D: { label: "G", sub: "Gelijk" },
  L: { label: "V", sub: "Verlies" },
};

export function TeamFormStrip({ form }: { form: ("W" | "D" | "L")[] }) {
  if (form.length === 0) {
    return (
      <div className="club-empty-state !py-12 md:!py-14">
        <p className="text-lg font-semibold text-zvv-ink">Nog geen vorm om te tonen</p>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed">
          Na de eerste gespeelde wedstrijden zie je hier de laatste vijf resultaten (oudste links, nieuwste rechts).
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-wrap items-end justify-center gap-5 sm:max-w-none sm:justify-between sm:gap-6 md:gap-8">
      {form.map((r, i) => {
        const m = meta[r];
        return (
          <div key={`${r}-${i}`} className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-xl border text-base font-bold shadow-md transition-transform duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01] sm:h-16 sm:w-16 sm:text-lg",
                r === "W" && "border-emerald-500/40 bg-gradient-to-b from-emerald-50 to-emerald-100/90 text-emerald-800",
                r === "L" && "border-red-400/45 bg-gradient-to-b from-red-50 to-red-100/90 text-red-800",
                r === "D" && "border-zvv-border bg-gradient-to-b from-zvv-card-mid to-white text-zvv-muted",
              )}
              title={m.sub}
            >
              {m.label}
            </div>
            <span className="max-w-[5rem] text-center text-[10px] font-bold uppercase leading-tight tracking-wider text-zvv-muted">
              {m.sub}
            </span>
          </div>
        );
      })}
    </div>
  );
}
