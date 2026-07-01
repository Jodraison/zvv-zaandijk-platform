import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/layout/badge";
import { AcademyBreadcrumbs } from "@/components/academie/academy-breadcrumbs";
import { AcademyCategorySidebar } from "@/components/academie/academy-category-sidebar";
import { AcademyChapterSidebar } from "@/components/academie/academy-chapter-sidebar";
import { AcademyLessonLayout } from "@/components/academie/academy-lesson-layout";
import {
  getAcademyCategory,
  getAcademyChapterByCategorySlug,
  getAcademyChapterLessonNav,
  getAcademyLesson,
  getAcademyTopic,
  listAcademyTopicRoutes,
  listAcademyTopicsByCategorySlug,
} from "@/lib/academie";

type Props = { params: Promise<{ category: string; topic: string }> };

export function generateStaticParams() {
  return listAcademyTopicRoutes();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: categorySlug, topic: topicSlug } = await params;
  const lesson = getAcademyLesson(categorySlug, topicSlug);
  const topic = getAcademyTopic(categorySlug, topicSlug);
  const title = lesson?.title ?? topic?.title;
  if (!title) return { title: "Football Academy" };
  return { title: `${title} — Football Academy` };
}

export default async function AcademyTopicPage({ params }: Props) {
  const { category: categorySlug, topic: topicSlug } = await params;
  const category = getAcademyCategory(categorySlug);
  const topic = getAcademyTopic(categorySlug, topicSlug);
  if (!category || !topic) notFound();

  const topics = listAcademyTopicsByCategorySlug(categorySlug);
  const lesson = getAcademyLesson(categorySlug, topicSlug);
  const chapter = getAcademyChapterByCategorySlug(categorySlug);
  const chapterNav = chapter ? getAcademyChapterLessonNav(categorySlug, topicSlug) : undefined;

  const sidebar = chapter ? (
    <AcademyChapterSidebar chapter={chapter} categorySlug={category.slug} topics={topics} activeTopicSlug={topic.slug} />
  ) : (
    <AcademyCategorySidebar categorySlug={category.slug} topics={topics} activeTopicSlug={topic.slug} />
  );

  const chapterBreadcrumb = chapter
    ? { label: `Chapter ${chapter.chapterNumber}: ${chapter.title}`, href: `/academie/${category.slug}` }
    : { label: category.title, href: `/academie/${category.slug}` };

  if (lesson) {
    return (
      <AcademyLessonLayout
        breadcrumbs={[
          { label: "Football Academy", href: "/academie" },
          chapterBreadcrumb,
          { label: lesson.title },
        ]}
        lesson={lesson}
        sidebar={sidebar}
        chapterNav={chapterNav}
      />
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <AcademyBreadcrumbs
        items={[
          { label: "Football Academy", href: "/academie" },
          chapterBreadcrumb,
          { label: topic.title },
        ]}
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start xl:gap-10">
        <header className="club-section-surface club-reveal">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl leading-none" aria-hidden>
              {topic.icon}
            </span>
            {topic.comingSoon ? <Badge tone="gold">Binnenkort</Badge> : null}
          </div>
          <p className="club-page-eyebrow mt-4">Academy</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(2.5rem,6vw,3.9rem)] tracking-wide text-zvv-ink">
            {topic.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zvv-muted md:text-[15px]">{topic.description}</p>
        </header>

        <aside aria-label={chapter ? `Chapter ${chapter.chapterNumber} navigatie` : "Onderwerpen in deze categorie"} className="xl:col-start-2 xl:row-span-2 xl:row-start-1">
          {sidebar}
        </aside>
      </div>
    </div>
  );
}
