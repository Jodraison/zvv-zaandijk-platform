import Link from "next/link";
import { GlassCard } from "@/components/layout/glass-card";
import { Badge } from "@/components/layout/badge";
import { cn } from "@/lib/utils";
import type { AcademyTopic } from "@/lib/academie";
import { academyTopicHref } from "@/lib/academie";

export function AcademyCategorySidebar({
  categorySlug,
  topics,
  activeTopicSlug,
}: {
  categorySlug: string;
  topics: AcademyTopic[];
  activeTopicSlug?: string;
}) {
  return (
    <GlassCard className="club-card-lift lg:sticky lg:top-24">
      <p className="club-page-eyebrow">Navigatie</p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink">In deze categorie</h2>
      <ul className="mt-5 flex flex-col gap-1" role="list">
        {topics.map((topic) => {
          const active = activeTopicSlug === topic.slug;
          return (
            <li key={topic.id}>
              <Link
                href={academyTopicHref(categorySlug, topic.slug)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active ? "bg-zvv-primary-muted font-semibold text-zvv-primary" : "text-zvv-muted hover:bg-zvv-card-mid hover:text-zvv-ink",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span aria-hidden>{topic.icon}</span>
                  <span className="truncate">{topic.title}</span>
                </span>
                {topic.comingSoon ? (
                  <Badge tone="gold" className="shrink-0 px-2 py-0.5 text-[9px]">
                    Binnenkort
                  </Badge>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
