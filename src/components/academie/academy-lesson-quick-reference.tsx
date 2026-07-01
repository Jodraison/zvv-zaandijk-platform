import type { ReactNode } from "react";
import { GlassCard } from "@/components/layout/glass-card";
import { Badge } from "@/components/layout/badge";
import { cn } from "@/lib/utils";
import { AcademyLessonAnchorSlot, AcademyLessonPracticeExampleBlock } from "@/components/academie/academy-lesson-section";
import type { AcademyLessonPracticeExample, AcademyLessonQuickReference } from "@/lib/academie/lesson-types";
import { hasLessonText, normalizeLessonItems } from "@/lib/academie/lesson-utils";

function QuickRefItem({
  label,
  anchorId,
  children,
  className,
}: {
  label: string;
  anchorId?: string;
  children?: ReactNode;
  className?: string;
}) {
  if (!children && !anchorId) return null;
  return (
    <div className={cn("rounded-xl border border-zvv-border/80 bg-white/90 px-4 py-3.5 sm:py-4", className)}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zvv-muted">{label}</p>
      <div className="mt-2 text-[15px] leading-relaxed text-zvv-ink">
        {children ?? (anchorId ? <AcademyLessonAnchorSlot anchorId={anchorId} className="min-h-[3rem] bg-white/60 sm:min-h-[3.5rem]" /> : null)}
      </div>
    </div>
  );
}

function QuickRefList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2" role="list">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zvv-primary" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function AcademyLessonQuickReference({
  quickReference,
  anchorId,
  practiceExample,
  suppressReadingTime,
}: {
  quickReference?: AcademyLessonQuickReference;
  anchorId?: string;
  practiceExample?: AcademyLessonPracticeExample;
  /** Verberg leestijd-badge wanneer die al in de les-header staat. */
  suppressReadingTime?: boolean;
}) {
  const doThis = normalizeLessonItems(quickReference?.doThis);
  const doNot = normalizeLessonItems(quickReference?.doNot);
  const readingTime = quickReference?.readingTimeMinutes;
  const scaffold = !!anchorId;

  if (!scaffold && !quickReference) return null;

  const base = anchorId ?? "quick-reference";

  return (
    <section aria-labelledby="lesson-quick-reference-heading">
      <GlassCard className="club-card-lift border-zvv-primary/20 bg-gradient-to-br from-zvv-primary-muted/35 via-white to-white px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="club-page-eyebrow">Quick reference</p>
            <h2 id="lesson-quick-reference-heading" className="mt-1 font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink sm:text-2xl">
              Wat moet ik weten?
            </h2>
          </div>
          {typeof readingTime === "number" && readingTime > 0 && !suppressReadingTime ? (
            <Badge tone="muted" className="shrink-0">
              ± {readingTime} min
            </Badge>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
          <QuickRefItem label="Hoofdtaak" anchorId={scaffold ? `${base}.hoofdtaak` : undefined} className="sm:col-span-2">
            {hasLessonText(quickReference?.mainTask) ? <p className="font-medium">{quickReference.mainTask}</p> : null}
          </QuickRefItem>

          <QuickRefItem label="Belangrijkste aandachtspunt" anchorId={scaffold ? `${base}.aandachtspunt` : undefined} className="sm:col-span-2">
            {hasLessonText(quickReference?.keyFocus) ? <p className="font-medium">{quickReference.keyFocus}</p> : null}
          </QuickRefItem>

          <QuickRefItem label="Doe dit" anchorId={scaffold ? `${base}.doe-dit` : undefined}>
            {doThis.length > 0 ? <QuickRefList items={doThis} /> : null}
          </QuickRefItem>

          <QuickRefItem label="Doe dit niet" anchorId={scaffold ? `${base}.doe-niet` : undefined}>
            {doNot.length > 0 ? <QuickRefList items={doNot} /> : null}
          </QuickRefItem>
        </div>
        {practiceExample ? <AcademyLessonPracticeExampleBlock example={practiceExample} /> : null}
      </GlassCard>
    </section>
  );
}
