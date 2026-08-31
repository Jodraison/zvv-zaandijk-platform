import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { MatchAdminForm } from "@/components/admin/match-admin-form";
import { buildMatchSelectablePlayers } from "@/lib/queries/match-selectable-players";

/** Snelle invoer na een gespeelde wedstrijd — standaard status 'gespeeld'. */
type Props = { searchParams: Promise<{ season?: string }> };

export default async function WedstrijdToevoegenPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const members = buildMatchSelectablePlayers(db, seasonId).map((row) => ({
    player_id: row.playerId,
    shirt_number: row.shirtNumber,
    name: row.fullName,
    is_guest: row.isGuest,
    position_label: row.positionLabel,
    has_season_membership: row.hasSeasonMembership,
    is_already_in_match: row.isAlreadyInMatch,
    source_tags: row.sourceTags,
  }));

  const initialMatch = {
    id: "new",
    opponent: "",
    kickoff_at: new Date().toISOString(),
    is_home: true,
    match_type: "competition" as const,
    location: null,
    referee: null,
    notes: null,
    goals_against: 0,
    status: "played" as const,
    wotm_player_id: null as string | null,
    wotm_player_ids: [] as string[],
  };
  const initialLineup = { starters: [], bench: [], absent: [] as { player_id: string; absence_reason: string | null }[] };

  return (
    <div className="space-y-8">
      <header className="border-b border-zvv-border pb-8">
        <p className="club-page-eyebrow">Beheer · Wedstrijdresultaat</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-wide text-zvv-ink md:text-5xl">
          Uitslag invoeren
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zvv-muted">
          Alleen vaste selectie. Gastspeelsters pas na opslaan via Opstelling / Selectie toevoegen. Na opslaan → opstelling.
        </p>
      </header>
      <MatchAdminForm
        seasonId={seasonId}
        members={members}
        availableGuests={[]}
        mode="create"
        defaultStatus="played"
        initialMatch={initialMatch}
        initialSelectedIds={[]}
        initialLineup={initialLineup}
      />
    </div>
  );
}
