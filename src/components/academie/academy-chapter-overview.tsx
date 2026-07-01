import type { AcademyChapter } from "@/lib/academie/chapter-types";
import { resolveAcademyChapterLessons } from "@/lib/academie/chapter-utils";
import type { AcademyCategory, AcademyTopic } from "@/lib/academie";
import { AcademyBreadcrumbs } from "@/components/academie/academy-breadcrumbs";
import { AcademyChapterHeader } from "@/components/academie/academy-chapter-header";
import { AcademyChapterProgress } from "@/components/academie/academy-chapter-progress";
import { AcademyChapterLessonFlow } from "@/components/academie/academy-chapter-lesson-flow";
import { AcademyChapterLessonCard } from "@/components/academie/academy-chapter-lesson-card";
import { AcademyChapterSidebar } from "@/components/academie/academy-chapter-sidebar";

export function AcademyChapterOverviewLayout({
  chapter,
  category,
  topics,
}: {
  chapter: AcademyChapter;
  category: AcademyCategory;
  topics: AcademyTopic[];
}) {
  const lessons = resolveAcademyChapterLessons(chapter, topics);

  return (
    <div className="space-y-8 md:space-y-10">
      <AcademyBreadcrumbs
        items={[
          { label: "Football Academy", href: "/academie" },
          { label: `Chapter ${chapter.chapterNumber}: ${chapter.title}` },
        ]}
      />

      <AcademyChapterHeader chapter={chapter} category={category} topics={topics} />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start xl:gap-10">
        <div className="space-y-8 md:space-y-10">
          <AcademyChapterProgress chapter={chapter} topics={topics} />

          <AcademyChapterLessonFlow lessons={lessons} />

          <section aria-labelledby="chapter-lessons-heading" className="space-y-5">
            <div>
              <p className="club-page-eyebrow">Lessen</p>
              <h2
                id="chapter-lessons-heading"
                className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.65rem,3.5vw,2.35rem)] tracking-wide text-zvv-ink"
              >
                Alle lessen in dit chapter
              </h2>
            </div>
            <div className="space-y-4">
              {lessons.map((lesson) => (
                <AcademyChapterLessonCard key={lesson.topicId} lesson={lesson} />
              ))}
            </div>
          </section>
        </div>

        <AcademyChapterSidebar chapter={chapter} categorySlug={category.slug} topics={topics} />
      </div>
    </div>
  );
}
