import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { BeheerShell } from "@/components/admin/shell/beheer-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Admin UI review (lokaal bewijs)",
};

/**
 * Read-only UI gallery: zelfde shell/componenten als /beheer, zonder auth.
 * Alleen beschikbaar wanneer `ADMIN_UI_PREVIEW=1` (lokale screenshot-/reviewbewijs).
 * Server actions blijven achter assertAdminServerAction.
 */
export default async function AdminUiReviewLayout({ children }: { children: React.ReactNode }) {
  if (process.env.ADMIN_UI_PREVIEW !== "1") {
    notFound();
  }
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db);
  return (
    <div className="space-y-3">
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
        Review-galerij (geen login). Productiebeheer blijft op <code className="font-semibold">/beheer</code> met
        authenticatie. Opslaan vanuit deze routes faalt zonder admin-sessie.
      </p>
      <BeheerShell seasonId={seasonId}>{children}</BeheerShell>
    </div>
  );
}
