import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/layout/badge";
import { AcademyCategoryOverviewLayout } from "@/components/academie/academy-category-overview";
import { AcademyChapterOverviewLayout } from "@/components/academie/academy-chapter-overview";
import {
  getAcademyCategory,
  getAcademyCategoryOverview,
  getAcademyChapterByCategorySlug,
  listAcademyTopicsByCategorySlug,
  listAllAcademyCategories,
} from "@/lib/academie";

type Props = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return listAllAcademyCategories().map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getAcademyCategory(slug);
  if (!category) return { title: "Football Academy" };
  return { title: `${category.title} — Football Academy` };
}

export default async function AcademyCategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const category = getAcademyCategory(slug);
  if (!category) notFound();

  const overview = getAcademyCategoryOverview(slug);
  const topics = listAcademyTopicsByCategorySlug(slug);
  const chapter = getAcademyChapterByCategorySlug(slug);

  if (chapter && topics.length > 0) {
    return <AcademyChapterOverviewLayout chapter={chapter} category={category} topics={topics} />;
  }

  if (overview && topics.length > 0) {
    return <AcademyCategoryOverviewLayout category={category} overview={overview} topics={topics} />;
  }

  return (
    <div className="space-y-8">
      <header className="club-section-surface club-reveal">
        <Link
          href="/academie"
          className="text-sm font-bold uppercase tracking-wider text-zvv-primary transition-colors hover:text-zvv-primary-hover hover:underline"
        >
          ← Football Academy
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="text-3xl leading-none" aria-hidden>
            {category.icon}
          </span>
          {category.comingSoon ? <Badge tone="gold">Binnenkort</Badge> : null}
        </div>
        <p className="club-page-eyebrow mt-4">Academy</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(2.5rem,6vw,3.9rem)] tracking-wide text-zvv-ink">
          {category.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zvv-muted md:text-[15px]">{category.description}</p>
      </header>
    </div>
  );
}
