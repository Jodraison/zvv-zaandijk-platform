/**
 * Compat-wrappers — Goed/Fout en foutkaarten via Tactical Visual System V1.
 */
import { TacticalIllustration } from "@/components/academie/tactical-illustration";
import type { AcademyLessonMistakeVisual } from "@/lib/academie/lesson-standard-v1";
import { cn } from "@/lib/utils";

const MISTAKE_TO_SITUATION: Record<NonNullable<AcademyLessonMistakeVisual>, string> = {
  solo: "solo-solve",
  "blind-run": "blind-run",
  "always-forward": "always-forward",
  freeze: "solo-solve",
  silent: "solo-solve",
};

export function AcademyLessonComparePitch({
  variant,
  className,
  situationId,
}: {
  variant?: "good" | "bad";
  className?: string;
  situationId?: string;
}) {
  const id = situationId ?? (variant === "good" ? "press-good" : "press-bad");
  return (
    <div className={cn(className)}>
      <TacticalIllustration situationId={id} showLegend={false} compact />
    </div>
  );
}

export function AcademyLessonMistakePitch({
  visual,
  className,
  situationId,
}: {
  visual?: AcademyLessonMistakeVisual;
  className?: string;
  situationId?: string;
}) {
  const id = situationId ?? MISTAKE_TO_SITUATION[visual ?? "solo"];
  return (
    <div className={cn(className)}>
      <TacticalIllustration situationId={id} showLegend={false} compact />
    </div>
  );
}
