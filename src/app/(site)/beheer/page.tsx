import Link from "next/link";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { AdminPageHeader, AdminSection } from "@/components/admin/shell/admin-ui";
import { seasonMatches } from "@/lib/queries/matches";
import { formatHumanDateNL, formatKickoffShortNl } from "@/lib/utils/format-date";
import { matchTypeLabel } from "@/lib/match-type";
import { matchPrepLabel, matchPrepStatus, shouldRemindLineupUnprepared } from "@/lib/match/match-planning";
import { withSeason } from "@/lib/admin/beheer-nav";
import { computeCountdown } from "@/lib/operations/countdown";
import { getMatchCountdownState } from "@/lib/match/match-countdown";
import { nextFitnessMoment, nextTrainingSession, resolveNextMatch, upcomingMilestones } from "@/lib/operations/next-events";
import {
  OperationsCockpitCard,
  cockpitSortRank,
  sortCockpitCards,
  type CockpitCardModel,
} from "@/components/admin/operations/operations-cockpit";
import { getSeasonOperations, todayInClubTz } from "@/lib/season/season-operations-2026-27";
import { resolveAuthContext, roleLabelNl } from "@/lib/auth/capabilities";
import { resolveTrainingOperationalStatus } from "@/lib/training/training-status";
import { evaluateProfileCompleteness } from "@/lib/players/profile-completeness";
import { activeSeasonMembers } from "@/lib/players/season-squad";
import { getUpcomingBirthdays } from "@/lib/players/birthdays";
import { UpcomingBirthdaysCard } from "@/components/admin/upcoming-birthdays-card";
import { cn } from "@/lib/utils";

type Props = { searchParams: Promise<{ season?: string }> };

export default async function BeheerHomePage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const season = db.seasons.find((s) => s.id === seasonId);
  const now = new Date();
  const ops = getSeasonOperations(seasonId);
  const auth = await resolveAuthContext();
  const today = todayInClubTz(now);

  const nextMatch = resolveNextMatch(db, seasonId, now);
  const nextMatchLineup = nextMatch
    ? db.match_lineup_entries.filter((e) => e.match_id === nextMatch.id)
    : [];
  const nextMatchPrep = nextMatch ? matchPrepStatus(nextMatch, nextMatchLineup) : null;
  const nextMatchLineupReminder = nextMatch
    ? shouldRemindLineupUnprepared(nextMatch, nextMatchLineup, now)
    : false;
  const matches = seasonMatches(db, seasonId, { includeNonProduction: true });
  const incomplete = matches.filter((m) => m.status === "played" && m.integrity_state !== "verified");
  const training = nextTrainingSession(db, seasonId, now);
  const fitness = nextFitnessMoment(db, seasonId, now);
  const milestones = upcomingMilestones(ops, now);
  const activeMemberRows = activeSeasonMembers(db, seasonId);
  const activeSquad = activeMemberRows.map((r) => r.membership);
  const missingRequired = activeSquad.filter((m) => {
    const p = db.players.find((x) => x.id === m.player_id);
    if (!p) return false;
    return evaluateProfileCompleteness(p, m).requiredMissing.length > 0;
  });
  const birthdayPeople = activeMemberRows.map(({ player, membership }) => ({
    id: player.id,
    full_name: player.full_name,
    birth_date: player.birth_date ?? null,
    photo_url: player.photo_url,
    shirt_number: membership.shirt_number,
    is_captain: membership.is_captain,
    is_vice_captain: membership.is_vice_captain,
  }));
  const upcomingBirthdays = getUpcomingBirthdays(birthdayPeople, now, 60, 5);
  const missingBirthDateCount = birthdayPeople.filter((p) => !p.birth_date).length;
  const draftFitness = (db.fitness_test_sessions ?? []).filter(
    (s) => s.season_id === seasonId && s.status === "draft",
  );

  const trainingTarget = training.session?.session_at ?? training.suggestedIso;
  const trainingDurationMs =
    training.suggestedEndIso && training.suggestedIso
      ? Math.max(60_000, new Date(training.suggestedEndIso).getTime() - new Date(training.suggestedIso).getTime())
      : 60 * 60_000;
  const matchCd = computeCountdown(nextMatch?.kickoff_at ?? null, now, { durationMs: 2 * 60 * 60_000 });
  const matchCdLabel = nextMatch
    ? getMatchCountdownState({
        startsAt: nextMatch.kickoff_at,
        status: nextMatch.status,
        now,
      }).primaryLabel
    : null;
  const trainingCd = computeCountdown(trainingTarget, now, { durationMs: trainingDurationMs });
  const fitnessCd = computeCountdown(fitness.date, now, {
    durationMs: 4 * 60 * 60_000,
    expectedLabel: fitness.kind === "expected" || fitness.kind === "overdue_expected",
  });

  const trainOp = resolveTrainingOperationalStatus(training.session, {
    now,
    attendanceRowCount: training.session
      ? db.training_attendance.filter((a) => a.session_id === training.session!.id).length
      : 0,
    expectedSquadCount: activeSquad.length,
  });

  const cards: CockpitCardModel[] = [
    nextMatch
      ? {
          id: "match",
          title: "Volgende wedstrijd",
          headline: nextMatch.opponent,
          detailLines: [
            formatKickoffShortNl(nextMatch.kickoff_at),
            `${nextMatch.is_home ? "THUIS" : "UIT"} · ${matchTypeLabel(nextMatch.match_type).toUpperCase()}`,
            ...(matchCdLabel ? [matchCdLabel] : []),
            ...(nextMatchLineupReminder && nextMatchPrep
              ? [matchPrepLabel(nextMatchPrep)]
              : nextMatchPrep === "lineup_not_prepared"
                ? [matchPrepLabel(nextMatchPrep)]
                : []),
          ],
          targetIso: nextMatch.kickoff_at,
          durationMs: 2 * 60 * 60_000,
          statusText:
            nextMatch.status === "played" && nextMatch.integrity_state !== "verified"
              ? "Nog af te ronden"
              : "Gepland",
          urgency: matchCd.urgency,
          actionHref:
            nextMatch.status === "played" && nextMatch.integrity_state !== "verified"
              ? withSeason("/beheer/taken/uitslag", seasonId)
              : withSeason(`/beheer/wedstrijden/${nextMatch.id}`, seasonId),
          actionLabel:
            nextMatch.status === "played" && nextMatch.integrity_state !== "verified"
              ? "Uitslag"
              : "Open wedstrijd",
          sortRank: cockpitSortRank({ urgency: matchCd.urgency, state: matchCd.state }),
        }
      : {
          id: "match",
          title: "Volgende wedstrijd",
          headline: "Nog geen wedstrijd",
          detailLines: [],
          targetIso: null,
          statusText: "Nog niets in de agenda",
          urgency: "neutral",
          actionHref: withSeason("/beheer/wedstrijden", seasonId),
          actionLabel: "Wedstrijden",
          sortRank: cockpitSortRank({ urgency: "neutral" }),
        },
    {
      id: "training",
      title: "Volgende training",
      headline: training.session
        ? formatHumanDateNL(training.session.session_at, { includeYear: true })
        : training.suggestedDate
          ? formatHumanDateNL(training.suggestedDate, { includeYear: true })
          : "Nog niet gepland",
      detailLines: ["20:00"],
      targetIso: trainingTarget,
      durationMs: trainingDurationMs,
      statusText: trainOp.label,
      urgency: training.attendanceMissing ? "overdue" : trainingCd.urgency,
      actionHref:
        training.attendanceMissing && training.session
          ? withSeason(`/beheer/training?sid=${encodeURIComponent(training.session.id)}`, seasonId)
          : withSeason("/beheer/training", seasonId),
      actionLabel: training.attendanceMissing ? "Aanwezigheid invullen" : "Open training",
      sortRank: cockpitSortRank({
        urgency: training.attendanceMissing ? "overdue" : trainingCd.urgency,
        attendanceMissing: training.attendanceMissing,
      }),
    },
    {
      id: "fitness",
      title: "Volgende fitheidstest",
      headline: fitness.date ? formatHumanDateNL(fitness.date, { includeYear: true }) : "Nog plannen",
      detailLines: [],
      targetIso: fitness.date,
      expectedLabel: fitness.kind === "expected" || fitness.kind === "planned_config",
      statusText:
        fitness.kind === "draft"
          ? "Concept"
          : fitness.kind === "overdue_expected"
            ? "Aan de beurt"
            : "Gepland",
      urgency: fitness.kind === "draft" ? "today" : fitnessCd.urgency,
      actionHref:
        fitness.kind === "draft" && fitness.plannedSession
          ? withSeason(`/beheer/fitheid/${fitness.plannedSession.id}`, seasonId)
          : withSeason("/beheer/fitheid/nieuw", seasonId),
      actionLabel: "Open fitheid",
      sortRank: cockpitSortRank({ urgency: fitness.kind === "draft" ? "today" : fitnessCd.urgency }),
    },
  ];

  const ordered = sortCockpitCards(cards);

  const openItems: { label: string; href: string }[] = [];
  for (const m of incomplete) {
    openItems.push({
      label: `Uitslag incompleet: ${m.opponent}`,
      href: withSeason(`/beheer/wedstrijden/${m.id}`, seasonId),
    });
  }
  if (training.attendanceMissing && training.session) {
    const ended = new Date(training.session.session_at).getTime() <= now.getTime();
    if (ended) {
      openItems.push({
        label: `Aanwezigheid invullen: ${formatHumanDateNL(training.session.session_at, { includeYear: true })}`,
        href: withSeason(`/beheer/training?sid=${encodeURIComponent(training.session.id)}`, seasonId),
      });
    }
  }
  for (const d of draftFitness) {
    openItems.push({
      label: `Concept-fitheidstest ${formatHumanDateNL(d.test_on)}`,
      href: withSeason(`/beheer/fitheid/${d.id}`, seasonId),
    });
  }
  if (missingRequired.length) {
    openItems.push({
      label: `${missingRequired.length} speelster(s) met ontbrekende verplichte gegevens`,
      href: withSeason("/beheer/spelers?filter=incomplete", seasonId),
    });
  }

  const quick = [
    { href: withSeason("/beheer/taken/uitslag", seasonId), title: "Uitslag", icon: "⚽" },
    { href: withSeason("/beheer/wedstrijden", seasonId), title: "Opstelling", icon: "📋" },
    { href: withSeason("/beheer/training", seasonId), title: "Aanwezigheid", icon: "✓" },
    { href: withSeason("/beheer/taken/training-afgelasten", seasonId), title: "Training afgelasten", icon: "⊘" },
    { href: withSeason("/beheer/spelers", seasonId), title: "Speelster", icon: "👤" },
    { href: withSeason("/beheer/fitheid", seasonId), title: "Fitheid", icon: "⏱" },
  ];

  return (
    <div className="space-y-10">
      <AdminPageHeader
        eyebrow="Teambeheer"
        title="Hier regel je je team"
        metrics={
          <p className="text-sm text-zvv-muted">
            <span className="font-medium text-zvv-ink">{season?.name ?? "—"}</span>
            {" · "}
            {activeSquad.length} speelsters
            {auth ? (
              <>
                {" · "}
                {roleLabelNl(auth.role)}
              </>
            ) : null}
            <span className="sr-only"> · {today}</span>
          </p>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {ordered.map((card) => (
          <OperationsCockpitCard key={card.id} card={card} />
        ))}
      </div>

      <UpcomingBirthdaysCard
        seasonId={seasonId}
        upcoming={upcomingBirthdays}
        missingCount={missingBirthDateCount}
      />

      <AdminSection title="Openstaande taken">
        {openItems.length === 0 ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm font-semibold text-emerald-900">
            Alles is bijgewerkt
          </p>
        ) : (
          <ul className="space-y-2">
            {openItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm font-medium text-amber-950"
                >
                  <span>{item.label}</span>
                  <span aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminSection>

      <AdminSection title="Snelle acties">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quick.map((q) => (
            <Link
              key={q.title}
              href={q.href}
              className={cn(
                "flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-2xl border border-zvv-border bg-white px-3 py-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-zvv-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zvv-primary",
              )}
            >
              <span className="text-xl" aria-hidden>
                {q.icon}
              </span>
              <span className="text-sm font-semibold text-zvv-ink">{q.title}</span>
            </Link>
          ))}
        </div>
      </AdminSection>

      {milestones.length > 0 ? (
        <AdminSection title="Seizoensmijlpalen">
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {milestones.map((m) => {
              const when = m.on
                ? formatHumanDateNL(m.on, { includeYear: true })
                : m.from && m.to
                  ? `${formatHumanDateNL(m.from)} / ${formatHumanDateNL(m.to)}`
                  : m.from
                    ? formatHumanDateNL(m.from)
                    : "—";
              return (
                <li key={m.id} className="rounded-xl border border-zvv-border bg-white px-3 py-2.5">
                  <p className="text-xs font-semibold text-zvv-primary">{when}</p>
                  <p className="mt-0.5 text-sm font-medium text-zvv-ink">{m.label}</p>
                </li>
              );
            })}
          </ul>
        </AdminSection>
      ) : null}
    </div>
  );
}
