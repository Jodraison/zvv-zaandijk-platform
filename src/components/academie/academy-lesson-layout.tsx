import type { ReactNode } from "react";
import { AcademyBreadcrumbs, type AcademyBreadcrumbItem } from "@/components/academie/academy-breadcrumbs";
import { AcademyLessonNavigation } from "@/components/academie/academy-lesson-navigation";
import {
  AcademyLessonStandardBody,
  AcademyLessonStandardHero,
} from "@/components/academie/academy-lesson-standard-sections";
import type { AcademyChapterLessonNav } from "@/lib/academie/chapter-types";
import type { AcademyLesson } from "@/lib/academie/lesson-types";

/**
 * Canonieke lespagina — Lesstandaard V2 (visual-first).
 * Routing, breadcrumbs, sidebar en chapter-nav blijven ongewijzigd.
 */
export function AcademyLessonLayout({
  breadcrumbs,
  lesson,
  sidebar,
  chapterNav,
}: {
  breadcrumbs: AcademyBreadcrumbItem[];
  lesson: AcademyLesson;
  sidebar?: ReactNode;
  /** Vorige/volgende navigatie — alleen wanneer les onderdeel is van een chapter. */
  chapterNav?: AcademyChapterLessonNav;
}) {
  const standard = lesson.standard ?? {};

  return (
    <div className="space-y-6 md:space-y-8">
      <AcademyBreadcrumbs items={breadcrumbs} />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start xl:gap-12">
        <article className="space-y-8 md:space-y-10">
          <AcademyLessonStandardHero lesson={lesson} standard={standard} />
          <AcademyLessonStandardBody standard={standard} />
          {chapterNav ? <AcademyLessonNavigation nav={chapterNav} /> : null}
        </article>

        {sidebar ? (
          <aside aria-label="Les-navigatie" className="xl:sticky xl:top-24">
            {sidebar}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
