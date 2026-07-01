import type { AcademyCategory, AcademyCategoryOverview, AcademyTopic } from "@/lib/academie";
import { AcademyBreadcrumbs } from "@/components/academie/academy-breadcrumbs";
import { AcademyCategorySidebar } from "@/components/academie/academy-category-sidebar";
import { AcademyTopicCard } from "@/components/academie/academy-topic-card";

export function AcademyCategoryOverviewLayout({
  category,
  overview,
  topics,
}: {
  category: AcademyCategory;
  overview: AcademyCategoryOverview;
  topics: AcademyTopic[];
}) {
  return (
    <div className="space-y-8 md:space-y-10">
      <AcademyBreadcrumbs
        items={[
          { label: "Football Academy", href: "/academie" },
          { label: category.title },
        ]}
      />

      <header className="club-section-surface club-reveal">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl leading-none" aria-hidden>
            {category.icon}
          </span>
        </div>
        <p className="club-page-eyebrow mt-4">Academy</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(2.5rem,6vw,3.9rem)] tracking-wide text-zvv-ink">
          {category.title}
        </h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-[1.75] text-zvv-muted md:text-base md:leading-[1.7]">{overview.intro}</p>
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start xl:gap-10">
        <section aria-labelledby="academy-topics-heading" className="space-y-6">
          <div>
            <p className="club-page-eyebrow">Onderwerpen</p>
            <h2
              id="academy-topics-heading"
              className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.65rem,3.5vw,2.35rem)] tracking-wide text-zvv-ink"
            >
              Overzicht
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {topics.map((topic) => (
              <AcademyTopicCard key={topic.id} categorySlug={category.slug} topic={topic} />
            ))}
          </div>
        </section>

        <aside aria-label="Onderwerpen in deze categorie">
          <AcademyCategorySidebar categorySlug={category.slug} topics={topics} />
        </aside>
      </div>
    </div>
  );
}
