import { notFound } from "next/navigation";
import Link from "next/link";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { MatchAdminForm } from "@/components/admin/match-admin-form";
import { MatchFormationEditor } from "@/components/admin/match-formation-editor";
import { MatchShapeEventsEditor } from "@/components/admin/match-shape-events-editor";
import { MatchWorkflowNav } from "@/components/admin/match-workflow-nav";
import { matchWorkflowHref, parseMatchWorkflowStep } from "@/lib/match/match-workflow-steps";
import {
  buildAvailableGuestsForMatch,
  buildMatchSelectablePlayers,
} from "@/lib/queries/match-selectable-players";
import { getMatchLineupInitial } from "@/lib/queries/match-lineup";
import { getMatchCardInitial, getMatchSubstitutionInitial } from "@/lib/queries/match-timeline";
import { formatDateTimeNL } from "@/lib/utils/format-date";
import { FORMATION_SLOT_CODES, type FormationSlotCode } from "@/lib/match/formation-4231";
import { isFormationSlotCode } from "@/lib/match/formation-4231";
import { sortPlayersBySquadNumber } from "@/lib/players/sort-by-squad-number";

type Props = {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ returnTo?: string; season?: string; step?: string; finish?: string }>;
};

export default async function EditWedstrijdPage({ params, searchParams }: Props) {
  const { matchId } = await params;
  const sp = await searchParams;
  const returnTo = typeof sp.returnTo === "string" && sp.returnTo.startsWith("/") ? sp.returnTo : "";
  const step = parseMatchWorkflowStep(sp.step);
  const finishing = sp.finish === "1" || step === "na-de-wedstrijd";
  const db = await readDb();
  const m = db.matches.find((x) => x.id === matchId);
  if (!m) notFound();

  const seasonId = await readResolvedSeasonId(db, sp.season);
  const effectiveStatus = finishing && m.status !== "played" ? ("played" as const) : m.status;
  const lineupConfirmed = m.lineup_status === "confirmed";

  const members = sortPlayersBySquadNumber(
    buildMatchSelectablePlayers(db, m.season_id, matchId).map((row) => ({
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
  const availableGuests = buildAvailableGuestsForMatch(db, matchId);

  const statsRows = db.match_player_stats.filter((s) => s.match_id === matchId);
  const events = db.match_goal_events.filter((e) => e.match_id === matchId).sort((a, b) => a.sort_order - b.sort_order);
  const initialSelectedIds = [
    ...new Set([
      ...statsRows.map((s) => s.player_id),
      ...events.map((e) => e.scorer_player_id),
      ...events.map((e) => e.assist_player_id).filter((x): x is string => !!x),
      ...(m.wotm_player_id ? [m.wotm_player_id] : []),
      ...db.match_lineup_entries
        .filter((e) => e.match_id === matchId && e.role !== "absent")
        .map((e) => e.player_id),
      ...db.match_matchday_roster.filter((r) => r.match_id === matchId).map((r) => r.player_id),
    ]),
  ];
  const initialMatch = {
    id: m.id,
    opponent: m.opponent,
    kickoff_at: m.kickoff_at,
    is_home: m.is_home,
    match_type: m.match_type,
    location: m.location,
    referee: m.referee,
    notes: m.notes,
    goals_against: m.goals_against,
    status: effectiveStatus,
    wotm_player_id: m.wotm_player_id,
  };

  const initialLineup = getMatchLineupInitial(db, matchId);
  const initialCardEvents = getMatchCardInitial(db, matchId);
  const initialSubstitutionEvents = getMatchSubstitutionInitial(db, matchId);

  const initialSlots: Partial<Record<FormationSlotCode, string | null>> = {};
  for (const code of FORMATION_SLOT_CODES) initialSlots[code] = null;
  for (const e of db.match_lineup_entries.filter((x) => x.match_id === matchId && x.role === "starter")) {
    if (isFormationSlotCode(e.position)) initialSlots[e.position] = e.player_id;
  }

  const membershipByPlayer = new Map(
    db.player_season_memberships
      .filter((mem) => mem.season_id === m.season_id)
      .map((mem) => [mem.player_id, mem]),
  );
  const formationPlayers = sortPlayersBySquadNumber(
    members.map((x) => {
      const mem = membershipByPlayer.get(x.player_id);
      return {
        player_id: x.player_id,
        name: x.name,
        shirt_number: x.shirt_number,
        position_label: x.position_label,
        is_guest: x.is_guest,
        is_captain: !!mem?.is_captain,
        is_vice_captain: !!mem?.is_vice_captain,
      };
    }),
  );

  const showWedstrijd = step === "wedstrijd";
  const showFormation = step === "opstelling";
  const showAfter =
    step === "na-de-wedstrijd" || (step === "controle" && (m.status === "played" || finishing));
  const showControleOnly = step === "controle";

  return (
    <div className="space-y-6">
      <header className="space-y-4 border-b border-zvv-border pb-6">
        <div>
          <p className="club-page-eyebrow">Beheer · Wedstrijden</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-wide text-zvv-ink md:text-5xl">
            {m.opponent}
          </h1>
          <p className="mt-2 text-sm text-zvv-muted">
            {m.is_home ? "Thuis" : "Uit"} · {formatDateTimeNL(m.kickoff_at)}
            {m.location ? ` · ${m.location}` : ""} · {m.status === "played" ? "Gespeeld" : "Gepland"}
            {lineupConfirmed ? " · Opstelling compleet" : ""}
          </p>
        </div>
        <MatchWorkflowNav
          matchId={m.id}
          seasonId={seasonId}
          active={step}
          status={m.status}
          lineupConfirmed={lineupConfirmed}
        />
        {m.status !== "played" && step !== "na-de-wedstrijd" ? (
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={matchWorkflowHref(m.id, seasonId, "na-de-wedstrijd", { finish: "1" })}
              className="club-btn-secondary club-btn-primary-sm"
            >
              Wedstrijd afronden
            </Link>
            <p className="text-sm text-zvv-muted">Na afloop: eindstand, doelpunten, wissels en MVP.</p>
          </div>
        ) : null}
      </header>

      {showWedstrijd ? (
        <MatchAdminForm
          key={`${m.id}-wedstrijd`}
          seasonId={seasonId}
          members={members}
          availableGuests={availableGuests}
          mode="edit"
          workflowStep="wedstrijd"
          defaultStatus={m.status}
          initialMatch={{ ...initialMatch, status: m.status }}
          initialSelectedIds={initialSelectedIds}
          initialGoalEvents={events.map((e) => ({
            scorer_player_id: e.scorer_player_id,
            assist_player_id: e.assist_player_id,
            minute: e.minute,
          }))}
          initialLineup={initialLineup}
          initialCardEvents={initialCardEvents}
          initialSubstitutionEvents={initialSubstitutionEvents}
          returnToHref={returnTo || undefined}
          preserveShapeEvents
        />
      ) : null}

      {showFormation ? (
        <MatchFormationEditor
          matchId={m.id}
          seasonId={m.season_id}
          players={formationPlayers}
          initialSlots={initialSlots}
          initialBench={initialLineup.bench}
          initialAbsent={initialLineup.absent.map((a) => a.player_id)}
          initialStatus={lineupConfirmed ? "confirmed" : "draft"}
          matchStatus={m.status}
        />
      ) : null}

      {step === "na-de-wedstrijd" && m.status !== "played" && !finishing ? (
        <section className="rounded-2xl border border-zvv-border bg-white px-5 py-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">Na de wedstrijd</h2>
          <p className="mt-2 max-w-xl text-sm text-zvv-muted">
            Beschikbaar na de wedstrijd. Hier vul je na afloop de eindstand, doelpunten, wissels en MVP in — niet live naast
            het veld.
          </p>
          <Link
            href={matchWorkflowHref(m.id, seasonId, "na-de-wedstrijd", { finish: "1" })}
            className="club-btn-primary club-btn-primary-sm mt-4 inline-flex"
          >
            Wedstrijdgegevens invoeren
          </Link>
        </section>
      ) : null}

      {showAfter && (m.status === "played" || finishing) ? (
        <div className="space-y-6">
          {(finishing || m.status === "played") && step === "na-de-wedstrijd" ? (
            <>
              <MatchAdminForm
                key={`${m.id}-after-${effectiveStatus}`}
                seasonId={seasonId}
                members={members}
                availableGuests={availableGuests}
                mode="edit"
                workflowStep="na-de-wedstrijd"
                defaultStatus={effectiveStatus}
                initialMatch={initialMatch}
                initialSelectedIds={initialSelectedIds}
                initialGoalEvents={events.map((e) => ({
                  scorer_player_id: e.scorer_player_id,
                  assist_player_id: e.assist_player_id,
                  minute: e.minute,
                }))}
                initialLineup={initialLineup}
                initialCardEvents={initialCardEvents}
                initialSubstitutionEvents={initialSubstitutionEvents}
                preserveShapeEvents
              />
              <section className="rounded-2xl border border-zvv-border bg-white p-4 md:p-6">
                <h3 className="font-[family-name:var(--font-display)] text-xl text-zvv-ink">
                  Wissels en positiewijzigingen
                </h3>
                <p className="mt-1 text-sm text-zvv-muted">Leg na afloop vast wie erin/eruit ging en positiewijzigingen.</p>
                <div className="mt-4">
                  <MatchShapeEventsEditor
                    matchId={m.id}
                    players={formationPlayers.map((p) => ({
                      ...p,
                      shirt_number: p.shirt_number ?? 0,
                    }))}
                    initialSlots={initialSlots}
                    initialBench={initialLineup.bench}
                    initialSubs={db.match_substitutions
                      .filter((s) => s.match_id === matchId)
                      .sort((a, b) => a.minute - b.minute || (a.sort_order ?? 0) - (b.sort_order ?? 0))
                      .map((s) => ({
                        id: s.id,
                        player_in_id: s.player_in_id,
                        player_out_id: s.player_out_id,
                        minute: s.minute,
                        to_slot: s.to_slot ?? "",
                        change_group_id: s.change_group_id ?? "",
                        notes: s.notes ?? "",
                      }))}
                    initialPos={(db.match_position_changes ?? [])
                      .filter((c) => c.match_id === matchId)
                      .sort((a, b) => a.minute - b.minute || a.sort_order - b.sort_order)
                      .map((c) => ({
                        id: c.id,
                        player_id: c.player_id,
                        minute: c.minute,
                        from_slot: c.from_slot,
                        to_slot: c.to_slot,
                        change_group_id: c.change_group_id ?? "",
                        notes: c.notes ?? "",
                      }))}
                  />
                </div>
              </section>
            </>
          ) : null}

          {showControleOnly ? (
            <MatchAdminForm
              key={`${m.id}-controle`}
              seasonId={seasonId}
              members={members}
              availableGuests={availableGuests}
              mode="edit"
              workflowStep="controle"
              defaultStatus={effectiveStatus}
              initialMatch={initialMatch}
              initialSelectedIds={initialSelectedIds}
              initialGoalEvents={events.map((e) => ({
                scorer_player_id: e.scorer_player_id,
                assist_player_id: e.assist_player_id,
                minute: e.minute,
              }))}
              initialLineup={initialLineup}
              initialCardEvents={initialCardEvents}
              initialSubstitutionEvents={initialSubstitutionEvents}
              preserveShapeEvents
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
