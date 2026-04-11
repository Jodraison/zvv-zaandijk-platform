import { cookies } from "next/headers";
import { readDb } from "@/lib/data/repository";
import { resolveSeasonId } from "@/lib/season";
import { AppShell } from "@/components/layout/app-shell";
import { SeasonHydrate } from "@/components/providers/season-hydrate";
import { ConfirmHost } from "@/components/layout/confirm-host";
import { isCurrentUserAdmin } from "@/lib/auth/viewer";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const db = await readDb();
  const cookieSeason = (await cookies()).get("zvv_season_id")?.value;
  const seasonId = resolveSeasonId(db, cookieSeason);
  const isAdmin = await isCurrentUserAdmin();

  return (
    <>
      <SeasonHydrate seasonId={seasonId} />
      <AppShell seasons={db.seasons} currentSeasonId={seasonId} isAdmin={isAdmin}>
        {children}
      </AppShell>
      <ConfirmHost />
    </>
  );
}
