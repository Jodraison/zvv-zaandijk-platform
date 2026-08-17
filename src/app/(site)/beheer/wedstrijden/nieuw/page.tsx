import Link from "next/link";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { MatchAdminForm } from "@/components/admin/match-admin-form";
import { MATCH_WORKFLOW_STEPS } from "@/lib/match/match-workflow-steps";
import { buildMatchSelectablePlayers } from "@/lib/queries/match-selectable-players";
import { activeSeasonMemberCount } from "@/lib/players/season-squad";
import { sortPlayersBySquadNumber } from "@/lib/players/sort-by-squad-number";

type Props = { searchParams: Promise<{ season?: string }> };

export default async function NieuwWedstrijdPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const members = sortPlayersBySquadNumber(
    buildMatchSelectablePlayers(db, seasonId).map((row) => ({
      player_id: row.playerId,
      shirt_number: row.shirtNumber,
      name: row.fullName,
      is_guest: row.isGuest,
      position_label: row.positionLabel,
      has_season_membership: row.hasSeasonMembership,
      is_already_in_match: row.isAlreadyInMatch,
      source_tags: row.sourceTags,
    })),
  );
  const squadCount = activeSeasonMemberCount(db, seasonId);

  const initialMatch = {
    id: "new",
    opponent: "",
    kickoff_at: new Date(Date.now() + 86400000).toISOString(),
    is_home: true,
    match_type: "competition" as const,
    location: null,
    referee: null,
    notes: null,
    goals_against: 0,
    status: "scheduled" as const,
    wotm_player_id: null as string | null,
  };

  return (
    <div className="space-y-6">
      <header className="space-y-4 border-b border-zvv-border pb-6">
        <div>
          <p className="club-page-eyebrow">Beheer · Wedstrijden</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-wide text-zvv-ink md:text-5xl">
            Nieuwe wedstrijd
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zvv-muted">
            Alleen tegenstander, datum, tijd, thuis/uit en type. Opstelling is later optioneel ({squadCount} speelsters
            in de selectie). Uitslag pas na de wedstrijd.
          </p>
        </div>
        <ol className="flex flex-wrap gap-1 rounded-2xl border border-zvv-border bg-white p-1.5">
          {MATCH_WORKFLOW_STEPS.map((step, i) => (
            <li
              key={step.id}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
                i === 0 ? "bg-zvv-primary text-white" : "text-zvv-muted"
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                {step.short}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </li>
          ))}
        </ol>
        <p className="text-sm text-zvv-muted">
          Plannen is klaar na opslaan. Opstelling & selectie doe je later wanneer jij wilt.{" "}
          <Link href={`/beheer/wedstrijden?season=${encodeURIComponent(seasonId)}`} className="font-semibold text-zvv-primary underline">
            Terug naar overzicht
          </Link>
        </p>
      </header>
      <MatchAdminForm
        key={initialMatch.id}
        seasonId={seasonId}
        members={members}
        availableGuests={[]}
        mode="create"
        defaultStatus="scheduled"
        workflowStep="wedstrijd"
        initialMatch={initialMatch}
        initialSelectedIds={[]}
      />
    </div>
  );
}
