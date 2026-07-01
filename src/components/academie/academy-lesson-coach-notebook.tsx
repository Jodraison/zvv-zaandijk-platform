import { cn } from "@/lib/utils";
import { AcademyLessonAnchorSlot, AcademyLessonPracticeExampleBlock, LESSON_PROSE_INVERTED } from "@/components/academie/academy-lesson-section";
import type { AcademyLessonCoachNotebook, AcademyLessonPracticeExample } from "@/lib/academie/lesson-types";
import { hasLessonText } from "@/lib/academie/lesson-utils";

const ACCENT_LABELS: Record<NonNullable<AcademyLessonCoachNotebook["accent"]>, string> = {
  coaching: "Extra coaching",
  attention: "Aandachtspunt",
  training: "Trainingsaccent",
  match: "Wedstrijdaccent",
};

export function AcademyLessonCoachNotebook({
  notebook,
  anchorId,
  practiceExample,
}: {
  notebook?: AcademyLessonCoachNotebook;
  anchorId?: string;
  practiceExample?: AcademyLessonPracticeExample;
}) {
  const hasBody = notebook && hasLessonText(notebook.body);
  if (!hasBody && !anchorId) return null;

  const accentLabel = notebook?.accent ? ACCENT_LABELS[notebook.accent] : "Coach's notebook";
  const title = notebook?.title ?? "Coach's notebook";

  return (
    <aside aria-labelledby="lesson-coach-notebook-heading">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-zvv-blue-deep/40",
          "bg-gradient-to-br from-[#020817] via-[#0b1f5f] to-[#1d4ed8]",
          "px-5 py-6 shadow-[0_20px_52px_rgba(15,23,42,0.26)] sm:px-7 sm:py-8",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_0%_0%,rgba(147,197,253,0.22),transparent_70%)]" />
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-100/80">{accentLabel}</p>
          <h2 id="lesson-coach-notebook-heading" className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.25rem,3vw,1.75rem)] tracking-wide text-white">
            {title}
          </h2>
          {hasBody ? (
            <p className={cn("mt-4", LESSON_PROSE_INVERTED)}>{notebook.body}</p>
          ) : anchorId ? (
            <div className="mt-4 max-w-prose">
              <AcademyLessonAnchorSlot anchorId={anchorId} className="min-h-[4.5rem] border-blue-200/20 bg-white/5 sm:min-h-[5rem]" />
            </div>
          ) : null}
          {practiceExample ? (
            <div className="mt-5 border-t border-blue-200/20 pt-4 sm:mt-6 sm:pt-5">
              <AcademyLessonPracticeExampleBlock example={practiceExample} />
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
