"use client";

import { useState } from "react";
import { GlassCard } from "@/components/layout/glass-card";
import {
  ACADEMY_LESSON_POSITION_IDS,
  ACADEMY_LESSON_POSITION_LABELS,
  type AcademyLessonPositionCard,
  type AcademyLessonPositionId,
} from "@/lib/academie/lesson-standard-v1";
import { hasLessonText } from "@/lib/academie/lesson-utils";
import { cn } from "@/lib/utils";

function resolvePositions(positions: AcademyLessonPositionCard[] | undefined): AcademyLessonPositionCard[] {
  const byId = new Map((positions ?? []).map((p) => [p.id, p]));
  return ACADEMY_LESSON_POSITION_IDS.map((id) => {
    const existing = byId.get(id);
    return (
      existing ?? {
        id,
        mainTask: "Bijdrage volgt",
        watchFor: ["Aandachtspunt volgt"],
      }
    );
  });
}

/** Optioneel: standaard ingeklapt — open alleen wanneer speelster haar positie zoekt. */
export function AcademyLessonPositionPicker({
  positions,
  defaultOpen = false,
}: {
  positions?: AcademyLessonPositionCard[];
  defaultOpen?: boolean;
}) {
  const cards = resolvePositions(positions);
  const [open, setOpen] = useState(defaultOpen);
  const [activeId, setActiveId] = useState<AcademyLessonPositionId>(cards[0]?.id ?? "keeper");
  const active = cards.find((c) => c.id === activeId) ?? cards[0];

  if (!active) return null;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[48px] w-full items-center justify-between rounded-2xl border border-zvv-border bg-white px-4 py-3 text-left transition-colors hover:border-zvv-primary/35"
        aria-expanded={open}
      >
        <span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zvv-muted">Optioneel</span>
          <span className="mt-0.5 block text-sm font-semibold text-zvv-ink">
            {open ? "Mijn positie" : "Mijn positie — tik om te openen"}
          </span>
        </span>
        <span className={cn("text-zvv-muted transition-transform", open && "rotate-180")} aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div className="space-y-4">
          <p className="text-sm text-zvv-muted">Kies je positie. Eén bijdrage, één let-op.</p>

          <div
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]"
            role="tablist"
            aria-label="Kies positie"
          >
            {cards.map((card) => {
              const selected = card.id === active.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveId(card.id)}
                  className={cn(
                    "min-h-[44px] shrink-0 rounded-full border px-4 py-2 text-sm font-bold tracking-wide transition-colors",
                    selected
                      ? "border-zvv-primary bg-zvv-primary text-white"
                      : "border-zvv-border bg-white text-zvv-ink hover:border-zvv-primary/40",
                  )}
                >
                  {ACADEMY_LESSON_POSITION_LABELS[card.id]}
                </button>
              );
            })}
          </div>

          <GlassCard className="club-card-lift space-y-4 border-zvv-primary/20 bg-white px-5 py-5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-zvv-ink">
                {ACADEMY_LESSON_POSITION_LABELS[active.id]}
              </h3>
              {hasLessonText(active.role) ? (
                <span className="rounded-full border border-zvv-border bg-zvv-card-mid/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zvv-muted">
                  {active.role}
                </span>
              ) : null}
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zvv-muted">Jouw bijdrage</p>
              <p className="mt-1.5 text-base font-semibold leading-snug text-zvv-ink">{active.mainTask}</p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-800">Let op</p>
              <p className="mt-1 text-sm font-medium leading-snug text-amber-950">
                {active.watchFor[0] ?? "Aandachtspunt volgt"}
              </p>
            </div>
          </GlassCard>
        </div>
      ) : null}
    </div>
  );
}
