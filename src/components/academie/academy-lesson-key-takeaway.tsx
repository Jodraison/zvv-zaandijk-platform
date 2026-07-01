import { AcademyLessonAnchorSlot, AcademyLessonPracticeExampleBlock, LESSON_PROSE_BODY } from "@/components/academie/academy-lesson-section";
import type { AcademyLessonPracticeExample } from "@/lib/academie/lesson-types";
import { cn } from "@/lib/utils";

export function AcademyLessonKeyTakeaway({
  message,
  anchorId,
  practiceExample,
}: {
  message?: string;
  anchorId?: string;
  practiceExample?: AcademyLessonPracticeExample;
}) {
  if (!message && !anchorId) return null;

  return (
    <section aria-labelledby="lesson-key-takeaway-heading" className="relative overflow-hidden rounded-2xl border border-zvv-primary/30 bg-zvv-primary-muted/45 px-5 py-6 sm:px-7 sm:py-7">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-zvv-primary/10 blur-2xl" aria-hidden />
      <p className="club-page-eyebrow text-zvv-primary">Onthoud</p>
      <h2
        id="lesson-key-takeaway-heading"
        className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.2rem,3.2vw,1.6rem)] leading-snug tracking-wide text-zvv-ink"
      >
        Belangrijk om te onthouden
      </h2>
      {message ? (
        <blockquote className={cn("mt-4 border-l-4 border-zvv-primary pl-4 font-medium", LESSON_PROSE_BODY)}>
          {message}
        </blockquote>
      ) : anchorId ? (
        <div className="mt-4 border-l-4 border-zvv-primary/35 pl-4">
          <AcademyLessonAnchorSlot anchorId={anchorId} className="min-h-[3.5rem] bg-white/50 sm:min-h-[4rem]" />
        </div>
      ) : null}
      {practiceExample ? <AcademyLessonPracticeExampleBlock example={practiceExample} /> : null}
    </section>
  );
}
