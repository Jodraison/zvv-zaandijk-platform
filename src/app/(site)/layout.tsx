import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { AppShell } from "@/components/layout/app-shell";
import { SeasonHydrate } from "@/components/providers/season-hydrate";
import { ConfirmHost } from "@/components/layout/confirm-host";
import { isCurrentUserAdmin } from "@/lib/auth/viewer";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db);
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
