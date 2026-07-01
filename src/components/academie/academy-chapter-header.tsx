import type { AcademyChapter } from "@/lib/academie/chapter-types";
import { countChapterLessons, getChapterProgressPlaceholder } from "@/lib/academie/chapter-utils";
import type { AcademyCategory, AcademyTopic } from "@/lib/academie";

export function AcademyChapterHeader({
  chapter,
  category,
  topics,
}: {
  chapter: AcademyChapter;
  category: AcademyCategory;
  topics: AcademyTopic[];
}) {
  const lessonCount = countChapterLessons(chapter, topics);
  const progress = getChapterProgressPlaceholder(chapter, topics);

  return (
    <header className="club-section-surface club-reveal border-b border-zvv-border/60 pb-8 md:pb-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-3xl leading-none" aria-hidden>
          {category.icon}
        </span>
      </div>
      <p className="club-page-eyebrow mt-4">Chapter {chapter.chapterNumber}</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(2rem,5.5vw,3.5rem)] leading-[0.98] tracking-wide text-zvv-ink">
        {chapter.title}
      </h1>
      <p className="mt-5 max-w-prose text-[15px] leading-[1.8] text-zvv-muted md:text-base md:leading-[1.75]">{chapter.intro}</p>

      <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-zvv-muted">Lessen</dt>
          <dd className="mt-1 font-semibold text-zvv-ink">{lessonCount} lessen</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-zvv-muted">Beschikbaar</dt>
          <dd className="mt-1 font-semibold text-zvv-ink">
            {progress.available} van {progress.total}
          </dd>
        </div>
      </dl>
    </header>
  );
}
