import type { AcademyChapter } from "@/lib/academie/chapter-types";
import { getChapterProgressPlaceholder } from "@/lib/academie/chapter-utils";
import type { AcademyTopic } from "@/lib/academie";

export function AcademyChapterProgress({ chapter, topics }: { chapter: AcademyChapter; topics: AcademyTopic[] }) {
  const progress = getChapterProgressPlaceholder(chapter, topics);

  return (
    <section aria-labelledby="chapter-progress-heading" className="rounded-2xl border border-zvv-border/80 bg-white/80 px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p id="chapter-progress-heading" className="club-page-eyebrow">
            Voortgang
          </p>
          <p className="mt-1 text-sm font-semibold text-zvv-ink">
            {progress.completed} van {progress.total} lessen voltooid
          </p>
        </div>
        <p className="text-xs text-zvv-muted">Tracking volgt in een volgende fase</p>
      </div>

      <div
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-zvv-card-mid"
        role="progressbar"
        aria-valuenow={progress.completed}
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-label={`Voortgang chapter ${chapter.chapterNumber}: ${progress.completed} van ${progress.total} lessen voltooid`}
      >
        <div
          className="h-full rounded-full bg-zvv-primary/80 transition-all duration-500"
          style={{ width: `${progress.percentComplete}%` }}
        />
      </div>
    </section>
  );
}
