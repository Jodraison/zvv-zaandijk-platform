import { cookies } from "next/headers";
import { readDb } from "@/lib/data/repository";
import { resolveSeasonId } from "@/lib/season";
import { MatchAdminForm } from "@/components/admin/match-admin-form";
import { buildMatchSelectablePlayers } from "@/lib/queries/match-selectable-players";

export default async function NieuwWedstrijdPage() {
  const db = await readDb();
  const cookieSeason = (await cookies()).get("zvv_season_id")?.value;
  const seasonId = resolveSeasonId(db, cookieSeason);
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
    kickoff_at: new Date(Date.now() + 86400000).toISOString(),
    is_home: true,
    goals_against: 0,
    status: "scheduled" as const,
    wotm_player_id: null as string | null,
  };

  return (
    <div className="space-y-8">
      <header className="border-b border-zvv-border pb-8">
        <p className="club-page-eyebrow">Beheer · Wedstrijden</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-wide text-zvv-ink md:text-5xl">Nieuwe wedstrijd</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zvv-muted">
          Plan een wedstrijd (gepland) of kies direct <strong className="text-zvv-ink/85">gespeeld</strong> om uitslag, selectie en doelpunten in te voeren.
        </p>
      </header>
      <MatchAdminForm
        key={initialMatch.id}
        seasonId={seasonId}
        members={members}
        mode="create"
        defaultStatus="scheduled"
        initialMatch={initialMatch}
        initialSelectedIds={[]}
      />
    </div>
  );
}
