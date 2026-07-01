import Link from "next/link";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { getStatisticsHome, hasSeasonRecords, listPlayerRecordItems, listTeamRecordItems } from "@/lib/statistics/statistics";
import { GlassCard } from "@/components/layout/glass-card";
import { Badge } from "@/components/layout/badge";

type Props = { searchParams: Promise<{ season?: string }> };

const quickNav = [
  { href: "/ranking", title: "Ranking", subtitle: "Goals, assists en WOTM", icon: "🏆" },
  { href: "/training", title: "Training", subtitle: "Opkomst en ritme", icon: "📈" },
  { href: "/fitheid", title: "Fitheid", subtitle: "Sprintdata en progressie", icon: "⚡" },
  { href: "/wedstrijden", title: "Wedstrijden", subtitle: "Programma en uitslagen", icon: "⚽" },
  { href: "/selectie", title: "Selectie", subtitle: "Speelsters en profielen", icon: "🛡️" },
] as const;

function formatGoalDifference(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

export default async function StatistiekenPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const home = getStatisticsHome(db, seasonId);
  const summary = home.teamSummary;
  const seasonName = db.seasons.find((s) => s.id === home.seasonId)?.name ?? "Seizoen";

  const teamKpis = [
    { label: "Winst", value: String(summary.won) },
    { label: "Gelijk", value: String(summary.drawn) },
    { label: "Verlies", value: String(summary.lost) },
    { label: "Doelsaldo", value: formatGoalDifference(summary.goalDifference) },
  ] as const;

  const heroStats = [
    { label: "Seizoen", value: seasonName },
    { label: "Gespeeld", value: String(summary.played) },
    { label: "Punten", value: String(summary.points) },
    { label: "Doelsaldo", value: formatGoalDifference(summary.goalDifference) },
  ] as const;

  const standoutCards = [
    { key: "topScorer", label: "Topscorer", leader: home.standouts.topScorer },
    { key: "assistLeader", label: "Meeste assists", leader: home.standouts.assistLeader },
    { key: "motmLeader", label: "MVP", leader: home.standouts.motmLeader },
  ] as const;

  const rankingPreviewLists = [
    { key: "topScorers", title: "Goals", entries: home.rankingPreview.topScorers },
    { key: "topAssists", title: "Assists", entries: home.rankingPreview.topAssists },
    { key: "topMotm", title: "WOTM", entries: home.rankingPreview.topMotm },
    { key: "mostMatches", title: "Wedstrijden", entries: home.rankingPreview.mostMatches },
  ] as const;

  const rankingHref = home.seasonId ? `/ranking?season=${encodeURIComponent(home.seasonId)}` : "/ranking";
  const matchesHref = home.seasonId ? `/wedstrijden?season=${encodeURIComponent(home.seasonId)}` : "/wedstrijden";
  const trainingHref = home.seasonId ? `/training?season=${encodeURIComponent(home.seasonId)}` : "/training";
  const fitnessHref = home.seasonId ? `/fitheid?season=${encodeURIComponent(home.seasonId)}` : "/fitheid";
  const hasAnyRankingPreview = rankingPreviewLists.some((list) => list.entries.length > 0);
  const dev = home.teamDevelopment;
  const records = home.records;
  const teamRecordItems = listTeamRecordItems(records.team);
  const playerRecordItems = listPlayerRecordItems(records.players);
  const hasAnyRecords = hasSeasonRecords(records);

  return (
    <div className="space-y-12 md:space-y-16">
      {/* Hero */}
      <header className="club-section-surface club-reveal border-b-0 pb-11 md:pb-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
          <span
            className="hidden h-28 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-zvv-primary via-zvv-primary/45 to-zvv-primary/10 sm:block md:h-32"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="club-page-eyebrow-strong">Statistieken</p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.85rem,7vw,4.65rem)] leading-[0.93] tracking-[0.02em] text-zvv-ink">
              Statistics Center
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-[1.7] text-zvv-muted md:text-lg">
              Centraal overzicht van teamprestaties, ranglijsten en ontwikkeling voor Zaandijk VRZ1.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-zvv-border bg-white/80 px-4 py-4 shadow-sm"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zvv-muted">{stat.label}</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-2xl tabular-nums tracking-wide text-zvv-ink md:text-3xl">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Teamoverzicht */}
      <section aria-labelledby="team-overview-heading" className="space-y-6">
        <div>
          <p className="club-page-eyebrow">Team</p>
          <h2
            id="team-overview-heading"
            className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.75rem)] tracking-wide text-zvv-ink"
          >
            Teamoverzicht
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zvv-muted">
            Seizoensbalans, uitslagen en doelsaldo op één plek.
          </p>
        </div>
        {summary.played === 0 ? (
          <div className="club-empty-state">
            <p className="text-lg font-semibold text-zvv-ink">Nog geen teamstatistieken</p>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed">
              Voor dit seizoen zijn er nog geen geverifieerde gespeelde wedstrijden om te tonen.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {teamKpis.map((kpi) => (
              <GlassCard key={kpi.label} className="club-card-lift text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zvv-muted">{kpi.label}</p>
                <p className="mt-3 font-[family-name:var(--font-display)] text-4xl tabular-nums tracking-wide text-zvv-primary">
                  {kpi.value}
                </p>
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      {/* Topprestaties */}
      <section aria-labelledby="top-performers-heading" className="space-y-6">
        <div>
          <p className="club-page-eyebrow">Spotlight</p>
          <h2
            id="top-performers-heading"
            className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.75rem)] tracking-wide text-zvv-ink"
          >
            Topprestaties
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {standoutCards.map((item) => (
            <GlassCard key={item.key} glow className="club-card-lift bg-gradient-to-br from-white to-zvv-card-mid/35">
              <Badge tone="gold">{item.label}</Badge>
              <p className="mt-4 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">
                {item.leader ? String(item.leader.value) : "—"}
              </p>
              <p className="mt-2 text-sm text-zvv-muted">
                {item.leader ? item.leader.playerName : "Nog geen speelster gekoppeld"}
              </p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Ranglijsten */}
      <section aria-labelledby="rankings-heading" className="space-y-6">
        <GlassCard className="club-card-lift">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="club-page-eyebrow">Klassement</p>
              <h2
                id="rankings-heading"
                className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink md:text-3xl"
              >
                Ranglijsten
              </h2>
              <p className="mt-2 text-sm text-zvv-muted">Goals, assists en WOTM in één overzicht.</p>
            </div>
            <Badge tone="muted">Preview</Badge>
          </div>
          {!hasAnyRankingPreview ? (
            <div className="club-empty-state mt-8">
              <p className="text-lg font-semibold text-zvv-ink">Nog geen ranglijstdata</p>
              <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed">
                Voor dit seizoen zijn er nog geen geverifieerde statistieken om in de preview te tonen.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {rankingPreviewLists.map((list) => (
                <div key={list.key} className="rounded-xl border border-zvv-border bg-white/60 p-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zvv-muted">{list.title}</h3>
                  {list.entries.length === 0 ? (
                    <p className="mt-4 text-sm text-zvv-muted">Nog geen data voor deze categorie.</p>
                  ) : (
                    <ul className="mt-4 flex flex-col gap-2" role="list">
                      {list.entries.map((row) => (
                        <li
                          key={`${list.key}-${row.playerId}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-zvv-border/80 bg-white px-3 py-2.5"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold tabular-nums text-gray-500">
                              {row.rank}
                            </span>
                            <p className="truncate font-semibold text-zvv-ink">{row.playerName}</p>
                          </div>
                          <span className="shrink-0 font-[family-name:var(--font-display)] text-lg tabular-nums text-zvv-primary">
                            {row.value}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-8 border-t border-zvv-border pt-6">
            <Link
              href={rankingHref}
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zvv-primary transition-colors hover:text-zvv-primary-hover hover:underline"
            >
              Volledige ranking bekijken →
            </Link>
          </div>
        </GlassCard>
      </section>

      {/* Teamontwikkeling */}
      <section aria-labelledby="team-development-heading" className="space-y-6">
        <GlassCard glow className="club-card-lift bg-gradient-to-br from-white to-zvv-card-mid/35">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="club-page-eyebrow">Trend</p>
              <h2
                id="team-development-heading"
                className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink"
              >
                Teamontwikkeling
              </h2>
              <p className="mt-2 text-sm text-zvv-muted">Trainingsopkomst en fitheid in één overzicht.</p>
            </div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-zvv-border bg-white/70 p-5">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zvv-muted">Training</h3>
              {dev.training.sessionCount === 0 && dev.training.averageAttendancePct == null ? (
                <p className="mt-4 text-sm text-zvv-muted">Nog geen trainingen geregistreerd voor dit seizoen.</p>
              ) : (
                <dl className="mt-4 space-y-4">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Gemiddelde opkomst</dt>
                    <dd className="mt-1 font-[family-name:var(--font-display)] text-3xl tabular-nums tracking-wide text-zvv-primary">
                      {dev.training.averageAttendanceLabel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Totaal trainingen</dt>
                    <dd className="mt-1 font-[family-name:var(--font-display)] text-2xl tabular-nums tracking-wide text-zvv-ink">
                      {dev.training.sessionCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Laatste training</dt>
                    <dd className="mt-1 text-sm font-medium text-zvv-ink">
                      {dev.training.lastSessionDateLabel ?? "Nog niet beschikbaar"}
                    </dd>
                  </div>
                </dl>
              )}
              <div className="mt-6 border-t border-zvv-border pt-4">
                <Link
                  href={trainingHref}
                  className="text-sm font-bold uppercase tracking-wider text-zvv-primary transition-colors hover:text-zvv-primary-hover hover:underline"
                >
                  Naar training →
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-zvv-border bg-white/70 p-5">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zvv-muted">Fitheid</h3>
              {dev.fitness.testCount === 0 ? (
                <p className="mt-4 text-sm text-zvv-muted">Nog geen fitheidstesten geregistreerd voor dit seizoen.</p>
              ) : (
                <dl className="mt-4 space-y-4">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Geregistreerde testen</dt>
                    <dd className="mt-1 font-[family-name:var(--font-display)] text-3xl tabular-nums tracking-wide text-zvv-primary">
                      {dev.fitness.testCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Laatste testdatum</dt>
                    <dd className="mt-1 text-sm font-medium text-zvv-ink">
                      {dev.fitness.lastTestDateLabel ?? "Nog niet beschikbaar"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Snelste teamtijd (laatste test)</dt>
                    <dd className="mt-1 font-[family-name:var(--font-display)] text-2xl tabular-nums tracking-wide text-zvv-ink">
                      {dev.fitness.teamSprintSummaryLabel ?? "—"}
                    </dd>
                  </div>
                </dl>
              )}
              <div className="mt-6 border-t border-zvv-border pt-4">
                <Link
                  href={fitnessHref}
                  className="text-sm font-bold uppercase tracking-wider text-zvv-primary transition-colors hover:text-zvv-primary-hover hover:underline"
                >
                  Naar fitheid →
                </Link>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Records */}
      <section aria-labelledby="records-heading" className="space-y-6">
        <GlassCard glow className="club-card-lift bg-gradient-to-br from-white to-zvv-card-mid/35">
          <div>
            <p className="club-page-eyebrow">Hoogtepunten</p>
            <h2
              id="records-heading"
              className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink md:text-3xl"
            >
              Records
            </h2>
            <p className="mt-2 text-sm text-zvv-muted">Dynamische team- en speelstersrecords voor dit seizoen.</p>
          </div>
          {!hasAnyRecords ? (
            <div className="club-empty-state mt-8">
              <p className="text-lg font-semibold text-zvv-ink">Nog geen records</p>
              <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed">
                Voor dit seizoen zijn er nog niet genoeg gegevens om records te tonen.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-zvv-border bg-white/70 p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zvv-muted">Teamrecords</h3>
                <ul className="mt-4 flex flex-col gap-3" role="list">
                  {teamRecordItems.map((item) => (
                    <li
                      key={item.key}
                      className="rounded-lg border border-zvv-border/80 bg-white px-4 py-3"
                    >
                      {item.entry ? (
                        <>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zvv-muted">{item.entry.label}</p>
                          <p className="mt-1 font-[family-name:var(--font-display)] text-xl tabular-nums tracking-wide text-zvv-primary">
                            {item.entry.valueLabel}
                          </p>
                          {item.entry.detailLabel ? (
                            <p className="mt-1 text-sm text-zvv-muted">{item.entry.detailLabel}</p>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zvv-muted">{item.label}</p>
                          <p className="mt-1 text-sm text-zvv-muted">Nog geen record beschikbaar</p>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-zvv-border bg-white/70 p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zvv-muted">Speelstersrecords</h3>
                <ul className="mt-4 flex flex-col gap-3" role="list">
                  {playerRecordItems.map((item) => (
                    <li
                      key={item.key}
                      className="rounded-lg border border-zvv-border/80 bg-white px-4 py-3"
                    >
                      {item.entry ? (
                        <>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zvv-muted">{item.entry.label}</p>
                          <p className="mt-1 font-[family-name:var(--font-display)] text-xl tabular-nums tracking-wide text-zvv-primary">
                            {item.entry.valueLabel}
                          </p>
                          {item.entry.detailLabel ? (
                            <p className="mt-1 text-sm font-medium text-zvv-ink">{item.entry.detailLabel}</p>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zvv-muted">{item.label}</p>
                          <p className="mt-1 text-sm text-zvv-muted">Nog geen record beschikbaar</p>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </GlassCard>
      </section>

      {/* Historische seizoenen */}
      <section aria-labelledby="season-history-heading" className="space-y-6">
        <GlassCard className="club-card-lift">
          <div>
            <p className="club-page-eyebrow">Tijdlijn</p>
            <h2
              id="season-history-heading"
              className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink md:text-3xl"
            >
              Historische seizoenen
            </h2>
            <p className="mt-2 text-sm text-zvv-muted">Teamstatistieken per seizoen, van nieuw naar oud.</p>
          </div>
          {home.seasonHistory.length === 0 ? (
            <div className="club-empty-state mt-8">
              <p className="text-lg font-semibold text-zvv-ink">Nog geen seizoenen</p>
              <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed">
                Er zijn nog geen seizoenen beschikbaar om te vergelijken.
              </p>
            </div>
          ) : (
            <div className="mt-8 overflow-x-auto rounded-xl border border-zvv-border bg-white/70">
              <table className="min-w-full border-collapse text-left text-sm">
                <caption className="sr-only">Historische teamstatistieken per seizoen</caption>
                <thead>
                  <tr className="border-b border-zvv-border bg-zvv-card-mid/60">
                    <th scope="col" className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zvv-muted">
                      Seizoen
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-zvv-muted">
                      Gespeeld
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-zvv-muted">
                      W
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-zvv-muted">
                      G
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-zvv-muted">
                      V
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-zvv-muted">
                      GF
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-zvv-muted">
                      GT
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-zvv-muted">
                      DS
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-zvv-muted">
                      Ptn
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {home.seasonHistory.map((row) => {
                    const isCurrent = row.seasonId === home.seasonId;
                    return (
                      <tr
                        key={row.seasonId}
                        className={isCurrent ? "bg-zvv-primary/5" : "border-b border-zvv-border/70 last:border-b-0"}
                      >
                        <th scope="row" className="px-4 py-3 font-semibold text-zvv-ink">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/statistieken?season=${encodeURIComponent(row.seasonId)}`}
                              className="hover:text-zvv-primary hover:underline"
                            >
                              {row.seasonName}
                            </Link>
                            {isCurrent ? <Badge tone="live">Huidig</Badge> : null}
                            {!isCurrent && row.isActive ? <Badge tone="gold">Actief</Badge> : null}
                          </div>
                        </th>
                        <td className="px-3 py-3 text-center tabular-nums">{row.played}</td>
                        <td className="px-3 py-3 text-center tabular-nums">{row.won}</td>
                        <td className="px-3 py-3 text-center tabular-nums">{row.drawn}</td>
                        <td className="px-3 py-3 text-center tabular-nums">{row.lost}</td>
                        <td className="px-3 py-3 text-center tabular-nums">{row.goalsFor}</td>
                        <td className="px-3 py-3 text-center tabular-nums">{row.goalsAgainst}</td>
                        <td className="px-3 py-3 text-center tabular-nums">{row.goalDifferenceLabel}</td>
                        <td className="px-4 py-3 text-center font-[family-name:var(--font-display)] text-base tabular-nums text-zvv-primary">
                          {row.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </section>

      {/* Recente wedstrijden */}
      <section aria-labelledby="recent-matches-heading" className="space-y-6">
        <GlassCard>
          <p className="club-page-eyebrow">Wedstrijden</p>
          <h2
            id="recent-matches-heading"
            className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink"
          >
            Recente wedstrijden
          </h2>
          <p className="mt-2 text-sm text-zvv-muted">Laatste uitslagen en tegenstanders.</p>
          {home.recentMatches.length === 0 ? (
            <div className="club-empty-state mt-6">
              <p className="text-lg font-semibold text-zvv-ink">Nog geen recente wedstrijden</p>
              <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed">
                Voor dit seizoen zijn er nog geen geverifieerde gespeelde wedstrijden om te tonen.
              </p>
            </div>
          ) : (
            <ul className="mt-6 flex flex-col gap-3" role="list">
              {home.recentMatches.map((m) => (
                <li
                  key={m.matchId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zvv-border bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-zvv-ink">vs {m.opponent}</p>
                    <p className="text-xs text-zvv-muted">
                      {m.dateLabel} · {m.venueLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-[family-name:var(--font-display)] text-xl tabular-nums text-zvv-primary">{m.scoreLabel}</span>
                    <Badge tone={m.badgeTone}>{m.result}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 border-t border-zvv-border pt-6">
            <Link
              href={matchesHref}
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zvv-primary transition-colors hover:text-zvv-primary-hover hover:underline"
            >
              Volledig programma bekijken →
            </Link>
          </div>
        </GlassCard>
      </section>

      {/* Snelle navigatie */}
      <section aria-labelledby="quick-nav-heading" className="space-y-6">
        <div>
          <p className="club-page-eyebrow">Verder</p>
          <h2
            id="quick-nav-heading"
            className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.75rem)] tracking-wide text-zvv-ink"
          >
            Snelle navigatie
          </h2>
          <p className="mt-2 text-sm text-zvv-muted">Ga direct naar de bestaande statistiekpagina&apos;s.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickNav.map((tile) => (
            <Link key={tile.href} href={tile.href} className="group block h-full">
              <GlassCard className="h-full transition-all duration-300 motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:border-zvv-primary/25">
                <p className="text-2xl leading-none" aria-hidden>
                  {tile.icon}
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink">{tile.title}</h3>
                <p className="mt-1 text-sm text-zvv-muted">{tile.subtitle}</p>
                <span className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-zvv-primary group-hover:underline">
                  Openen →
                </span>
              </GlassCard>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
