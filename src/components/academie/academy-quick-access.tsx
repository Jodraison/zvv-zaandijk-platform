import Link from "next/link";
import { GlassCard } from "@/components/layout/glass-card";
import type { AcademyQuickAccessItem } from "@/lib/academie";

export function AcademyQuickAccess({ items }: { items: AcademyQuickAccessItem[] }) {
  return (
    <section aria-labelledby="academy-quick-access-heading" className="space-y-6">
      <div>
        <p className="club-page-eyebrow">Navigatie</p>
        <h2
          id="academy-quick-access-heading"
          className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.75rem)] tracking-wide text-zvv-ink"
        >
          Snel naar
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <Link key={item.id} href={item.href} className="group block h-full">
            <GlassCard className="h-full transition-all duration-300 motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:border-zvv-primary/25">
              <p className="text-2xl leading-none" aria-hidden>
                {item.icon}
              </p>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-lg tracking-wide text-zvv-ink md:text-xl">{item.label}</h3>
              <p className="mt-1 text-sm text-zvv-muted">{item.subtitle}</p>
              <span className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-zvv-primary group-hover:underline">Openen →</span>
            </GlassCard>
          </Link>
        ))}
      </div>
    </section>
  );
}
