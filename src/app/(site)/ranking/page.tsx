import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { computeRanking } from "@/lib/queries/ranking";
import {
  FitnessPodiumList,
  MatchCategoryBoard,
  RankingViewTabs,
} from "@/components/ranking/dual-ranking-panels";
import {
  hasAnyMatchPerformance,
  MatchCategoryRanking,
} from "@/components/ranking/match-performance-ranking";
import {
  latestPublishedFitnessSession,
  publishedFitnessSessions,
  rankFitnessComponent,
  rankFitnessTotal,
} from "@/lib/fitness/session-ranking";
import { FITNESS_COMPONENTS } from "@/lib/fitness/protocol";
import { formatDateNL, formatHumanDateNL } from "@/lib/utils/format-date";
import { expectedFitnessTestDate } from "@/lib/operations/countdown";
import { OperationsCountdownLabel } from "@/components/admin/operations/operations-countdown";
import {
  seasonBestPerComponent,
  seasonFitnessConsistency,
  seasonFitnessMinParticipations,
  seasonFitnessStandingStatus,
} from "@/lib/fitness/season-overview";
import {
  formatMetersNl,
  formatPlankDisplay,
  formatSecondsNl,
} from "@/lib/fitness/parse-values";
import Link from "next/link";
import { nextFitnessMoment } from "@/lib/operations/next-events";
import { getSeasonOperations } from "@/lib/season/season-operations-2026-27";

type Props = { searchParams: Promise<{ season?: string; view?: string; session?: string }> };

function sortByGoals(rows: ReturnType<typeof computeRanking>) {
  return [...rows]
    .filter((r) => r.goals_total > 0)
    .sort((a, b) => b.goals_total - a.goals_total || a.full_name.localeCompare(b.full_name, "nl"))
    .map((r) => ({
      player_id: r.player_id,
      full_name: r.full_name,
      shirt_number: r.shirt_number,
      value: r.goals_total,
    }));
}
function sortByAssists(rows: ReturnType<typeof computeRanking>) {
  return [...rows]
    .filter((r) => r.assists_total > 0)
    .sort((a, b) => b.assists_total - a.assists_total || a.full_name.localeCompare(b.full_name, "nl"))
    .map((r) => ({
      player_id: r.player_id,
      full_name: r.full_name,
      shirt_number: r.shirt_number,
      value: r.assists_total,
    }));
}
function sortByMvp(rows: ReturnType<typeof computeRanking>) {
  return [...rows]
    .filter((r) => r.wotm_total > 0)
    .sort((a, b) => b.wotm_total - a.wotm_total || a.full_name.localeCompare(b.full_name, "nl"))
    .map((r) => ({
      player_id: r.player_id,
      full_name: r.full_name,
      shirt_number: r.shirt_number,
      value: r.wotm_total,
    }));
}
function sortByCleanSheets(rows: ReturnType<typeof computeRanking>) {
  return [...rows]
    .filter((r) => r.clean_sheets_total > 0)
    .sort(
      (a, b) =>
        b.clean_sheets_total - a.clean_sheets_total || a.full_name.localeCompare(b.full_name, "nl"),
    )
    .map((r) => ({
      player_id: r.player_id,
      full_name: r.full_name,
      shirt_number: r.shirt_number,
      value: r.clean_sheets_total,
    }));
}

export default async function RankingPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const viewRaw = sp.view ?? "wedstrijd";
  const view =
    viewRaw === "fitheid" || viewRaw === "historie" || viewRaw === "seizoen" ? viewRaw : "wedstrijd";
  const rows = computeRanking(db, seasonId);
  const hasMatchScores = hasAnyMatchPerformance(rows);
  const currentFitness = latestPublishedFitnessSession(db, seasonId);
  const history = publishedFitnessSessions(db, seasonId);
  const selectedSession =
    history.find((s) => s.id === sp.session) ?? currentFitness ?? history[0] ?? null;
  const nextFitness = nextFitnessMoment(db, seasonId);
  const expectedNext = currentFitness ? expectedFitnessTestDate(currentFitness.test_on) : nextFitness.date;

  return (
    <div className="space-y-10 md:space-y-12">
      <header className="club-section-surface club-reveal border-b-0 pb-8 md:pb-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
          <span
            className="hidden h-28 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-zvv-primary via-zvv-primary/45 to-zvv-primary/10 sm:block md:h-32"
            aria-hidden
          />
          <div className="min-w-0 max-w-3xl space-y-5">
            <div>
              <p className="club-page-eyebrow-strong">Ranglijst</p>
              <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.4rem,6vw,4rem)] leading-[0.93] tracking-[0.02em] text-zvv-ink">
                Wedstrijd &amp; fitheid
              </h1>
              <p className="mt-4 max-w-2xl text-[16px] leading-[1.7] text-zvv-muted md:text-lg">
                Twee gescheiden klassementen: seizoensprestaties in wedstrijden, en fitheid per gepubliceerde test.
              </p>
            </div>
            <RankingViewTabs seasonId={seasonId} view={view} />
          </div>
        </div>
      </header>

      {view === "wedstrijd" ? (
        <div className="space-y-8">
          {!hasMatchScores ? (
            <div className="club-empty-state">
              <p className="text-lg font-semibold text-zvv-ink md:text-xl">Nog geen wedstrijdklassement</p>
              <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed md:text-base">
                Na de eerste gespeelde wedstrijd verschijnen hier de topscorer, assistkoningin, MVP-ranglijst
                en wedstrijden zonder tegengoals.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              <MatchCategoryRanking rows={rows} category="goals" />
              <MatchCategoryRanking rows={rows} category="assists" />
              <MatchCategoryRanking rows={rows} category="mvp" />
              <MatchCategoryRanking rows={rows} category="cleanSheets" />
            </div>
          )}
        </div>
      ) : null}

      {view === "fitheid" ? (
        <div className="space-y-6">
          {currentFitness ? (
            <>
              <div className="rounded-2xl border border-zvv-border bg-white p-4 md:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zvv-primary">Actuele fitheidsranking</p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-zvv-ink">
                  {formatDateNL(currentFitness.test_on)}
                </h2>
                <p className="mt-1 text-sm text-zvv-muted">Geldig tot de volgende meting</p>
                {expectedNext ? (
                  <p className="mt-3 text-base text-zvv-ink">
                    Volgende test verwacht: {formatDateNL(expectedNext)} ·{" "}
                    <OperationsCountdownLabel targetIso={expectedNext} expectedLabel className="inline" />
                  </p>
                ) : null}
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {FITNESS_COMPONENTS.map((c) => (
                  <FitnessPodiumList
                    key={c.key}
                    title={c.shortLabel}
                    rows={rankFitnessComponent(db, currentFitness.id, c.key)}
                    componentKey={c.key}
                  />
                ))}
                <FitnessPodiumList
                  title="Totaal fitheid"
                  rows={rankFitnessTotal(db, currentFitness.id)}
                  total
                />
              </div>
              <p className="text-sm text-zvv-muted">
                Totaalranking: alleen speelsters met alle vier onderdelen. Gelijke weging 25% per onderdeel, genormaliseerd binnen deze test.
              </p>
            </>
          ) : (
            <div className="club-empty-state">
              <p className="text-lg font-semibold text-zvv-ink">Nog geen fitheidsranking</p>
              <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed">
                De eerste meting staat gepland voor{" "}
                {formatHumanDateNL(
                  nextFitness.date ?? getSeasonOperations(seasonId)?.fitness.firstTestOn ?? "",
                  {
                    includeYear: true,
                  },
                )}
                . Na publicatie verschijnen hier de rankings voor sprint, agility, plank, 6 minuten lopen en
                het totaalklassement.
              </p>
              <Link
                href={`/ranking?season=${encodeURIComponent(seasonId)}&view=historie`}
                className="club-btn-primary club-btn-primary-sm mt-5 inline-flex"
              >
                Bekijk testplanning
              </Link>
            </div>
          )}
        </div>
      ) : null}

      {view === "historie" ? (
        <div className="space-y-6">
          {history.length === 0 ? (
            <div className="club-empty-state">
              <p className="text-lg font-semibold text-zvv-ink">Nog geen eerdere metingen</p>
              <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed">
                Zodra de eerste fitheidstest is gepubliceerd, verschijnt hier de historie per testdatum.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {history.map((s) => (
                  <Link
                    key={s.id}
                    href={`/ranking?season=${encodeURIComponent(seasonId)}&view=historie&session=${encodeURIComponent(s.id)}`}
                    className={`min-h-10 rounded-xl border px-3 py-2 text-sm font-semibold ${
                      selectedSession?.id === s.id
                        ? "border-zvv-primary bg-zvv-primary text-white"
                        : "border-zvv-border bg-white text-zvv-muted"
                    }`}
                  >
                    {formatDateNL(s.test_on)}
                  </Link>
                ))}
              </div>
              {selectedSession ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {FITNESS_COMPONENTS.map((c) => (
                    <FitnessPodiumList
                      key={c.key}
                      title={c.shortLabel}
                      rows={rankFitnessComponent(db, selectedSession.id, c.key)}
                      componentKey={c.key}
                    />
                  ))}
                  <FitnessPodiumList
                    title="Totaal fitheid"
                    rows={rankFitnessTotal(db, selectedSession.id)}
                    total
                  />
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {view === "seizoen" ? (
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-zvv-ink">Wedstrijdprestaties</h2>
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              <MatchCategoryBoard title="Meeste doelpunten" rows={sortByGoals(rows).slice(0, 10)} />
              <MatchCategoryBoard title="Meeste assists" rows={sortByAssists(rows).slice(0, 10)} />
              <MatchCategoryBoard title="Meeste MVP’s" rows={sortByMvp(rows).slice(0, 10)} />
              <MatchCategoryBoard
                title="Meeste wedstrijden zonder tegengoals"
                rows={sortByCleanSheets(rows).slice(0, 10)}
              />
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-zvv-ink">Fitheid — seizoensoverzicht</h2>
            {publishedFitnessSessions(db, seasonId).length === 0 ? (
              <div className="club-empty-state">
                <p className="text-lg font-semibold text-zvv-ink">Seizoensfitheid nog niet gestart</p>
                <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed">
                  Het seizoensoverzicht wordt opgebouwd vanaf de eerste gepubliceerde meting.
                </p>
              </div>
            ) : (
              <>
                {(() => {
                  const publishedCount = publishedFitnessSessions(db, seasonId).length;
                  const status = seasonFitnessStandingStatus(publishedCount);
                  const minPart = seasonFitnessMinParticipations(publishedCount);
                  return (
                    <p className="text-sm text-zvv-muted">
                      {status === "voorlopig"
                        ? "Voorlopige seizoenstand — er is nog één gepubliceerde test. De formule is vast; de eindstand volgt wanneer het seizoen meer tests heeft of wordt afgesloten."
                        : `Seizoenstussenstand: gemiddelde totaalscore over volledige deelnames (minimaal ${minPart}× volledig).`}
                    </p>
                  );
                })()}
                <ul className="grid gap-3 md:grid-cols-2">
                  {FITNESS_COMPONENTS.map((c) => {
                    const best = seasonBestPerComponent(db, seasonId, c.key);
                    const display = !best
                      ? "—"
                      : c.key === "plank_seconds"
                        ? formatPlankDisplay(best.value)
                        : c.key === "six_minute_run_meters"
                          ? formatMetersNl(best.value)
                          : formatSecondsNl(best.value);
                    return (
                      <li key={c.key} className="rounded-xl border border-zvv-border bg-white px-4 py-3">
                        <p className="text-sm text-zvv-muted">Beste {c.shortLabel.toLowerCase()} van het seizoen</p>
                        <p className="mt-1 font-[family-name:var(--font-display)] text-xl text-zvv-ink">
                          {best ? `#${best.shirt_number} ${best.full_name}` : "Nog geen data"}
                        </p>
                        <p className="text-sm text-zvv-muted">
                          {display}
                          {best ? ` · ${formatDateNL(best.test_on)}` : ""}
                        </p>
                      </li>
                    );
                  })}
                </ul>
                <div className="rounded-2xl border border-zvv-border bg-white p-4">
                  <p className="font-semibold text-zvv-ink">
                    {seasonFitnessStandingStatus(publishedFitnessSessions(db, seasonId).length) === "voorlopig"
                      ? "Voorlopige seizoenstand"
                      : "Seizoensfitheidsranking"}
                  </p>
                  <p className="mt-1 text-sm text-zvv-muted">
                    Primaire score: gemiddelde genormaliseerde totaalscore over volledige deelnames.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {seasonFitnessConsistency(db, seasonId)
                      .slice(0, 12)
                      .map((r, i) => (
                        <li key={r.player_id} className="flex flex-wrap justify-between gap-2 text-sm">
                          <span>
                            #{i + 1} #{r.shirt_number} {r.full_name}
                          </span>
                          <span className="text-zvv-muted">
                            gem. {r.avgTotalScore?.toLocaleString("nl-NL") ?? "—"} · {r.fullParticipations}× volledig ·{" "}
                            {r.firstPlaces}× #1 · {r.podiums}× podium
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
