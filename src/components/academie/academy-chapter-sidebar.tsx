import Link from "next/link";
import { GlassCard } from "@/components/layout/glass-card";
import { Badge } from "@/components/layout/badge";
import { cn } from "@/lib/utils";
import type { AcademyChapter } from "@/lib/academie/chapter-types";
import { resolveAcademyChapterLessons } from "@/lib/academie/chapter-utils";
import type { AcademyTopic } from "@/lib/academie";
import { academyTopicHref } from "@/lib/academie";

export function AcademyChapterSidebar({
  chapter,
  categorySlug,
  topics,
  activeTopicSlug,
}: {
  chapter: AcademyChapter;
  categorySlug: string;
  topics: AcademyTopic[];
  activeTopicSlug?: string;
}) {
  const lessons = resolveAcademyChapterLessons(chapter, topics, { activeTopicSlug });

  return (
    <aside aria-label={`Chapter ${chapter.chapterNumber} navigatie`}>
      <GlassCard className="club-card-lift xl:sticky xl:top-24">
        <p className="club-page-eyebrow">Chapter {chapter.chapterNumber}</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink">{chapter.title}</h2>
        <Link
          href={`/academie/${categorySlug}`}
          className="mt-2 inline-block text-xs font-bold uppercase tracking-wider text-zvv-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zvv-primary/40 focus-visible:ring-offset-2"
        >
          ← Chapter overzicht
        </Link>

        <ol className="mt-5 flex flex-col gap-1" role="list">
          {lessons.map((lesson) => {
            const active = activeTopicSlug === lesson.topicSlug;
            const isAvailable = lesson.status === "available";

            return (
              <li key={lesson.topicId}>
                {isAvailable ? (
                  <Link
                    href={academyTopicHref(categorySlug, lesson.topicSlug)}
                    className={cn(
                      "flex min-h-[48px] items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zvv-primary/40 focus-visible:ring-offset-2",
                      active ? "bg-zvv-primary-muted font-semibold text-zvv-primary" : "text-zvv-muted hover:bg-zvv-card-mid hover:text-zvv-ink",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="font-[family-name:var(--font-display)] text-xs text-zvv-primary" aria-hidden>
                        {String(lesson.lessonNumber).padStart(2, "0")}
                      </span>
                      <span className="truncate">{lesson.title}</span>
                    </span>
                  </Link>
                ) : (
                  <div
                    className="flex min-h-[48px] items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm text-zvv-muted/80"
                    aria-disabled
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="font-[family-name:var(--font-display)] text-xs text-zvv-muted" aria-hidden>
                        {String(lesson.lessonNumber).padStart(2, "0")}
                      </span>
                      <span className="truncate">{lesson.title}</span>
                    </span>
                    <Badge tone="gold" className="shrink-0 px-2 py-0.5 text-[9px]">
                      Binnenkort
                    </Badge>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </GlassCard>
    </aside>
  );
}
