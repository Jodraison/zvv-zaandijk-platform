import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/shell/admin-ui";
import { FITNESS_COMPONENTS } from "@/lib/fitness/protocol";
import { cn } from "@/lib/utils";

/** Preview testdag met vier stations (ADMIN_UI_PREVIEW). */
export default function FitnessTestdagPreviewPage() {
  const expected = 21;
  const filled = { sprint: 21, agility: 18, plank: 15, run: 12 } as const;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Fitheidstest"
        title="Fitheidstest · 30 augustus 2026"
        description="12 van 21 speelsters volledig · Concept — open een station om in te voeren"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {FITNESS_COMPONENTS.map((c) => {
          const n = filled[c.tabId];
          const done = n >= expected;
          return (
            <article
              key={c.key}
              className={cn(
                "flex flex-col rounded-2xl border bg-white p-4 shadow-sm",
                done ? "border-emerald-300" : "border-zvv-border",
              )}
            >
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">{c.shortLabel}</h2>
              <p className="mt-1 text-sm text-zvv-muted">{c.label}</p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-xl text-zvv-ink">
                {n} / {expected} ingevuld
              </p>
              <div className="mt-auto pt-4">
                <Link
                  href={`/review/admin-ui/fitheid-invoer?station=${c.tabId}`}
                  className="club-btn-primary club-btn-primary-sm inline-flex"
                >
                  Station openen
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
