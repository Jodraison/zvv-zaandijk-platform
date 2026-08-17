import Link from "next/link";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { AdminPageHeader } from "@/components/admin/shell/admin-ui";
import { ChangeShirtForm } from "@/components/admin/operations/trainer-task-forms";
import { withSeason } from "@/lib/admin/beheer-nav";

type Props = { searchParams: Promise<{ season?: string }> };

export default async function TaakRugnummerPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const players = db.player_season_memberships
    .filter((m) => m.season_id === seasonId)
    .map((m) => {
      const p = db.players.find((x) => x.id === m.player_id);
      return {
        id: m.player_id,
        name: p?.full_name ?? "—",
        shirt: m.shirt_number,
        position: m.position,
        display_position: m.display_position,
      };
    })
    .filter((p) => !db.players.find((x) => x.id === p.id)?.is_guest)
    .sort((a, b) => a.shirt - b.shirt);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Rugnummer wijzigen"
        description="Rugnummers zijn uniek binnen dit seizoen. Conflicten worden geblokkeerd."
        actions={
          <Link href={withSeason("/beheer", seasonId)} className="club-btn-secondary club-btn-primary-sm">
            Terug
          </Link>
        }
      />
      <ChangeShirtForm seasonId={seasonId} players={players} />
    </div>
  );
}
