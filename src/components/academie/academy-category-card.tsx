import Link from "next/link";
import { GlassCard } from "@/components/layout/glass-card";
import { Badge } from "@/components/layout/badge";
import type { AcademyCategory } from "@/lib/academie";
import { academyCategoryHref } from "@/lib/academie";

export function AcademyCategoryCard({ category }: { category: AcademyCategory }) {
  return (
    <Link href={academyCategoryHref(category.slug)} className="group block h-full">
      <GlassCard className="h-full transition-all duration-300 motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:border-zvv-primary/25">
        <div className="flex items-start justify-between gap-3">
          <p className="text-2xl leading-none" aria-hidden>
            {category.icon}
          </p>
          {category.comingSoon ? <Badge tone="gold">Binnenkort</Badge> : null}
        </div>
        <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink md:text-2xl">{category.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zvv-muted">{category.description}</p>
        <span className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-zvv-primary group-hover:underline">Openen →</span>
      </GlassCard>
    </Link>
  );
}
