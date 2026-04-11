import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { readDb } from "@/lib/data/repository";
import { resolveSeasonId } from "@/lib/season";
import { MatchAdminForm } from "@/components/admin/match-admin-form";
import { buildMatchSelectablePlayers } from "@/lib/queries/match-selectable-players";
import { formatDateTimeNL } from "@/lib/utils/format-date";

type Props = {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function EditWedstrijdPage({ params, searchParams }: Props) {
  const { matchId } = await params;
  const sp = await searchParams;
  const returnTo = typeof sp.returnTo === "string" && sp.returnTo.startsWith("/") ? sp.returnTo : "";
  const db = await readDb();
  const m = db.matches.find((x) => x.id === matchId);
  if (!m) notFound();

  const cookieSeason = (await cookies()).get("zvv_season_id")?.value;
  const seasonId = resolveSeasonId(db, cookieSeason);

  const members = buildMatchSelectablePlayers(db, m.season_id, matchId).map((row) => ({
    player_id: row.playerId,
    shirt_number: row.shirtNumber,
    name: row.fullName,
    is_guest: row.isGuest,
    position_label: row.positionLabel,
    has_season_membership: row.hasSeasonMembership,
    is_already_in_match: row.isAlreadyInMatch,
    source_tags: row.sourceTags,
  }));

  const statsRows = db.match_player_stats.filter((s) => s.match_id === matchId);
  const events = db.match_goal_events.filter((e) => e.match_id === matchId).sort((a, b) => a.sort_order - b.sort_order);
  const initialSelectedIds = [
    ...new Set([
      ...statsRows.map((s) => s.player_id),
      ...events.map((e) => e.scorer_player_id),
      ...events.map((e) => e.assist_player_id).filter((x): x is string => !!x),
      ...(m.wotm_player_id ? [m.wotm_player_id] : []),
    ]),
  ];
  const initialMatch = {
    id: m.id,
    opponent: m.opponent,
    kickoff_at: m.kickoff_at,
    is_home: m.is_home,
    goals_against: m.goals_against,
    status: m.status,
    wotm_player_id: m.wotm_player_id,
  };
  const memberIdSet = new Set(members.map((x) => x.player_id));
  const referencedPlayerIds = new Set([
    ...statsRows.map((s) => s.player_id),
    ...events.map((e) => e.scorer_player_id),
    ...events.map((e) => e.assist_player_id).filter((x): x is string => !!x),
    ...(m.wotm_player_id ? [m.wotm_player_id] : []),
  ]);
  const missingReferencedCount = [...referencedPlayerIds].filter((id) => !memberIdSet.has(id)).length;

  return (
    <div className="space-y-8">
      <header className="border-b border-zvv-border pb-8">
        <p className="club-page-eyebrow">Beheer · Wedstrijden</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-wide text-zvv-ink md:text-5xl">Wedstrijd bewerken</h1>
        <p className="mt-3 text-sm text-zvv-muted">
          {m.is_home ? "Thuis" : "Uit"} · {m.opponent} · {formatDateTimeNL(m.kickoff_at)}
        </p>
        {(m.integrity_state ?? "verified") !== "verified" ? (
          <p className="mt-3 max-w-2xl rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            Deze wedstrijd bevat inconsistentie en telt niet mee in ranking tot een geverifieerde save.
          </p>
        ) : null}
        {events.length === 0 && m.status === "played" && statsRows.some((s) => s.assists > 0) ? (
          <p className="mt-3 max-w-2xl rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
            Assists zijn geschat op basis van totalen; controleer de verdeling en sla opnieuw op om doelpuntregels vast te leggen.
          </p>
        ) : null}
        {missingReferencedCount > 0 ? (
          <p className="mt-3 max-w-2xl rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {missingReferencedCount} speelster(s) met bestaande matchdata ontbreken in deze selectie. Voeg seizoen-lidmaatschap toe of markeer als gast om dataverlies te voorkomen.{" "}
            <Link className="font-semibold underline" href={`/beheer/spelers?season=${encodeURIComponent(m.season_id)}`}>
              Seizoensselectie beheren
            </Link>
          </p>
        ) : null}
        {returnTo ? (
          <p className="mt-3">
            <Link href={returnTo} className="text-sm font-semibold text-zvv-primary hover:underline">
              Terug naar dispute overzicht
            </Link>
          </p>
        ) : null}
      </header>
      <MatchAdminForm
        key={m.id}
        seasonId={seasonId}
        members={members}
        mode="edit"
        initialMatch={initialMatch}
        initialSelectedIds={initialSelectedIds}
        initialGoalEvents={events.map((e) => ({
          scorer_player_id: e.scorer_player_id,
          assist_player_id: e.assist_player_id,
        }))}
        returnToHref={returnTo || undefined}
      />
    </div>
  );
}
