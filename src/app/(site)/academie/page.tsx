import type { Metadata } from "next";
import { listAcademyCategories, listAcademyQuickAccess } from "@/lib/academie";
import { AcademyCategoryCard } from "@/components/academie/academy-category-card";
import { AcademyHomeHero } from "@/components/academie/academy-home-hero";
import { AcademyIntroBlock } from "@/components/academie/academy-intro-block";
import { AcademyQuickAccess } from "@/components/academie/academy-quick-access";
import { AcademySearchPlaceholder } from "@/components/academie/academy-search-placeholder";
import { AcademyStructureExplainer } from "@/components/academie/academy-structure-explainer";

export const metadata: Metadata = {
  title: "Football Academy",
};

export default function AcademiePage() {
  const categories = listAcademyCategories();
  const quickAccess = listAcademyQuickAccess();

  return (
    <div className="space-y-12 md:space-y-16">
      <AcademyHomeHero />

      <AcademySearchPlaceholder />

      <AcademyQuickAccess items={quickAccess} />

      <AcademyIntroBlock />

      <AcademyStructureExplainer />

      <section aria-labelledby="academy-all-topics-heading" className="space-y-6">
        <div>
          <p className="club-page-eyebrow">Overzicht</p>
          <h2
            id="academy-all-topics-heading"
            className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.75rem)] tracking-wide text-zvv-ink"
          >
            Alle onderwerpen
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <AcademyCategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>
    </div>
  );
}
