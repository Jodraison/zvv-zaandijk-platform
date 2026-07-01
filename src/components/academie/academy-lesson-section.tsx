import type { ReactNode } from "react";
import { GlassCard } from "@/components/layout/glass-card";
import { cn } from "@/lib/utils";
import type { AcademyLessonPracticeExample } from "@/lib/academie/lesson-types";
import { hasLessonText } from "@/lib/academie/lesson-utils";

/** Gedeelde leestypografie — consistente breedte en ritme in alle lessen. */
export const LESSON_PROSE_MUTED = "max-w-prose text-[15px] leading-[1.8] text-zvv-muted md:text-base md:leading-[1.75]";
export const LESSON_PROSE_BODY = "max-w-prose text-[15px] leading-[1.8] text-zvv-ink md:text-base md:leading-[1.75]";
export const LESSON_PROSE_INVERTED = "max-w-prose text-[15px] leading-[1.8] text-blue-100/92 md:text-base md:leading-[1.75]";
export const LESSON_SCAN_GAP = "space-y-6 md:space-y-8";
export const LESSON_FIELD_GAP = "space-y-5 md:space-y-6";
export const LESSON_DETAIL_GAP = "space-y-8 md:space-y-10 lg:space-y-11";

export function AcademyLessonAnchorSlot({ anchorId, className }: { anchorId: string; className?: string }) {
  return (
    <div
      data-content-anchor={anchorId}
      role="region"
      aria-label={`Inhoudsgebied ${anchorId}`}
      className={cn("min-h-[3.5rem] rounded-xl border border-dashed border-zvv-border/80 bg-zvv-card-mid/25 sm:min-h-[4rem]", className)}
    />
  );
}

export function AcademyLessonPracticeExampleBlock({ example }: { example: AcademyLessonPracticeExample }) {
  if (!hasLessonText(example.body) && !hasLessonText(example.anchorId)) return null;

  return (
    <div className="mt-5 border-t border-zvv-border/60 pt-4 md:mt-6 md:pt-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zvv-muted">Praktijkvoorbeeld</p>
      {hasLessonText(example.body) ? (
        <p className={cn("mt-2", LESSON_PROSE_BODY)}>{example.body}</p>
      ) : example.anchorId ? (
        <div className="mt-2">
          <AcademyLessonAnchorSlot anchorId={example.anchorId} className="min-h-[3.5rem] bg-white/50 sm:min-h-[4rem]" />
        </div>
      ) : null}
    </div>
  );
}

export function AcademyLessonSection({
  eyebrow,
  title,
  children,
  className,
  variant = "default",
  anchorId,
  practiceExample,
  sectionId,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  className?: string;
  variant?: "default" | "highlight" | "tip";
  anchorId?: string;
  practiceExample?: AcademyLessonPracticeExample;
  sectionId?: string;
}) {
  const hasChildren = children != null && !(Array.isArray(children) && children.length === 0);
  const hasPractice = !!practiceExample && (hasLessonText(practiceExample.body) || hasLessonText(practiceExample.anchorId));
  if (!hasChildren && !anchorId && !hasPractice) return null;

  const headingId = sectionId ?? undefined;

  const cardClass =
    variant === "highlight"
      ? "club-card-lift bg-gradient-to-br from-white to-zvv-card-mid/35"
      : variant === "tip"
        ? "club-card-lift border-amber-400/30 bg-gradient-to-br from-amber-50/80 to-white"
        : "club-card-lift bg-white/90";

  return (
    <section aria-labelledby={headingId}>
      <GlassCard glow={variant === "highlight"} className={cn(cardClass, "px-4 py-5 sm:px-6 sm:py-7 md:px-7 md:py-8", className)}>
        {eyebrow ? <p className="club-page-eyebrow">{eyebrow}</p> : null}
        <h2
          id={headingId}
          className={cn("font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink md:text-2xl", eyebrow && "mt-2")}
        >
          {title}
        </h2>
        {(hasChildren || anchorId) && (
          <div className="mt-4 space-y-4 md:mt-5">
            {hasChildren ? <div className={LESSON_PROSE_MUTED}>{children}</div> : anchorId ? <AcademyLessonAnchorSlot anchorId={anchorId} className="min-h-[4.5rem] sm:min-h-[5rem]" /> : null}
          </div>
        )}
        {hasPractice && practiceExample ? <AcademyLessonPracticeExampleBlock example={practiceExample} /> : null}
      </GlassCard>
    </section>
  );
}
