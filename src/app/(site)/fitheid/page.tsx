import Link from "next/link";
import { readDb } from "@/lib/data/repository";
import { readResolvedSeasonId } from "@/actions/season";
import { FITNESS_COMPONENTS, type FitnessComponentKey } from "@/lib/fitness/protocol";
import {
  latestPublishedFitnessSession,
  rankFitnessComponent,
  rankFitnessTotal,
} from "@/lib/fitness/session-ranking";
import { formatHumanDateNL } from "@/lib/utils/format-date";
import { nextFitnessMoment } from "@/lib/operations/next-events";
import {
  formatMetersNl,
  formatPlankDisplay,
  formatSecondsNl,
} from "@/lib/fitness/parse-values";
import { OperationsCountdownLabel } from "@/components/admin/operations/operations-countdown";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const COMPONENT_COPY: Record<
  FitnessComponentKey,
  { title: string; unit: string; direction: string; goal: string; accent: string; icon: "sprint" | "agility" | "plank" | "run" }
> = {
  flying_sprint_30m_seconds: {
    title: "30 meter sprint met vliegende start",
    unit: "seconden",
    direction: "Lager is beter",
    goal: "Maximale snelheid na aanloop.",
    accent: "from-sky-600 to-blue-800",
    icon: "sprint",
  },
  agility_10_20_10_seconds: {
    title: "Agility 10-20-10",
    unit: "seconden",
    direction: "Lager is beter",
    goal: "Versnellen, keren en opnieuw versnellen.",
    accent: "from-violet-600 to-indigo-800",
    icon: "agility",
  },
  plank_seconds: {
    title: "Plank",
    unit: "tijd",
    direction: "Hoger is beter",
    goal: "Rompstabiliteit en lichaamsspanning.",
    accent: "from-emerald-600 to-teal-800",
    icon: "plank",
  },
  six_minute_run_meters: {
    title: "Zes minuten looptest",
    unit: "meters",
    direction: "Hoger is beter",
    goal: "Herhaald loopvermogen en basisconditie.",
    accent: "from-orange-500 to-rose-700",
    icon: "run",
  },
};

function ComponentIcon({ kind }: { kind: "sprint" | "agility" | "plank" | "run" }) {
  if (kind === "sprint") {
    return (
      <svg viewBox="0 0 48 48" className="h-10 w-10 text-white" fill="none" aria-hidden>
        <path d="M10 34h28M14 28l8-12 6 8 10-14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="14" cy="34" r="2.5" fill="currentColor" />
        <circle cx="38" cy="34" r="2.5" fill="currentColor" />
      </svg>
    );
  }
  if (kind === "agility") {
    return (
      <svg viewBox="0 0 48 48" className="h-10 w-10 text-white" fill="none" aria-hidden>
        <path d="M8 24h8l6-10 6 20 6-10h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "plank") {
    return (
      <svg viewBox="0 0 48 48" className="h-10 w-10 text-white" fill="none" aria-hidden>
        <path d="M8 30h32M12 30V20h24v10M16 20V14M32 20V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10 text-white" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="2.5" />
      <path d="M24 10v14l8 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

type Props = { searchParams: Promise<{ season?: string }> };

export default async function FitheidPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const published = latestPublishedFitnessSession(db, seasonId);
  const nextFitness = nextFitnessMoment(db, seasonId);
  const firstTestOn = nextFitness.date;
  const seasonQ = `?season=${encodeURIComponent(seasonId)}`;
  const humanFirst = firstTestOn ? formatHumanDateNL(firstTestOn, { includeYear: true }) : "Nog te plannen";

  return (
    <div className="space-y-10 md:space-y-14">
      <header className="relative overflow-hidden rounded-[1.75rem] border border-zvv-border bg-gradient-to-br from-[#0b1222] via-[#12203a] to-[#1d4ed8] px-5 py-10 text-white shadow-[0_20px_50px_rgba(15,23,42,0.22)] sm:px-8 md:rounded-[2rem] md:px-12 md:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.7)_0.7px,transparent_0.7px)] [background-size:4px_4px]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" aria-hidden />
        <div className="relative max-w-3xl space-y-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-200">ZVV Zaandijk · VRZ1</p>
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.6rem,7vw,4.4rem)] leading-[0.92] tracking-[0.02em]">
            Fitheid
          </h1>
          <p className="max-w-2xl text-[16px] leading-[1.7] text-sky-50/90 md:text-lg">
            Vier meetmomenten die samen laten zien hoe snel, wendbaar, stabiel en duurzaam het team is — zonder
            nepcijfers vóór de eerste echte test.
          </p>
          {!published ? (
            <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm sm:flex-row sm:items-end sm:justify-between sm:px-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Eerste meting</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl md:text-3xl">{humanFirst}</p>
                <p className="mt-1 text-sm text-sky-100/85">Eerste echte resultaten verschijnen na publicatie.</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-left sm:min-w-[11rem]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200">Countdown</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  <OperationsCountdownLabel targetIso={firstTestOn} expectedLabel className="text-white" />
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm sm:px-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Actuele meting</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl md:text-3xl">
                {formatHumanDateNL(published.test_on, { includeYear: true })}
              </p>
              <Link
                href={`/ranking${seasonQ}&view=fitheid`}
                className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zvv-ink"
              >
                Bekijk actuele ranking
              </Link>
            </div>
          )}
        </div>
      </header>

      <section className="space-y-5">
        <div className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.6rem)] tracking-wide text-zvv-ink">
            De vier testonderdelen
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-zvv-muted md:text-base">
            Elk onderdeel telt apart. Geen samengevoegde totale tijd — pas na publicatie verschijnen echte uitslagen.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {FITNESS_COMPONENTS.map((c) => {
            const copy = COMPONENT_COPY[c.key];
            return (
              <li
                key={c.key}
                className="flex h-full min-h-[12.5rem] flex-col overflow-hidden rounded-2xl border border-zvv-border bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
              >
                <div className={cn("flex items-center gap-3 bg-gradient-to-r px-4 py-3 text-white", copy.accent)}>
                  <ComponentIcon kind={copy.icon} />
                  <p className="font-[family-name:var(--font-display)] text-xl leading-tight">{copy.title}</p>
                </div>
                <div className="flex flex-1 flex-col gap-2 px-4 py-4">
                  <p className="text-sm leading-relaxed text-zvv-muted">{copy.goal}</p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2 text-xs font-semibold">
                    <span className="rounded-full bg-zvv-card-mid px-2.5 py-1 text-zvv-ink">Eenheid: {copy.unit}</span>
                    <span className="rounded-full bg-zvv-primary-muted px-2.5 py-1 text-zvv-primary">{copy.direction}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {!published ? (
        <section className="rounded-2xl border border-dashed border-zvv-border bg-gradient-to-b from-white to-zvv-card-mid/40 px-5 py-8 md:px-8 md:py-10">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink md:text-3xl">
            Voor de eerste test
          </h2>
          <ul className="mt-4 max-w-2xl space-y-2 text-[15px] leading-relaxed text-zvv-muted md:text-base">
            <li>· Volgende meetmoment: {humanFirst}</li>
            <li>· Na publicatie zie je teamoverzicht, persoonlijke resultaten en leiders per onderdeel</li>
            <li>· Totaalscore alleen voor speelsters met alle vier geldige onderdelen</li>
            <li>· Er staan nu bewust geen metingen of speelsterscores — geen nepresultaten</li>
          </ul>
          <Link
            href={`/ranking${seasonQ}&view=fitheid`}
            className="club-btn-secondary mt-6 inline-flex min-h-11 items-center px-4"
          >
            Ranking (leeg tot publicatie)
          </Link>
        </section>
      ) : (
        <section className="space-y-8">
          <div className="grid gap-4 xl:grid-cols-2">
            {FITNESS_COMPONENTS.map((c) => {
              const rows = rankFitnessComponent(db, published.id, c.key).slice(0, 5);
              const copy = COMPONENT_COPY[c.key];
              return (
                <div key={c.key} className="rounded-2xl border border-zvv-border bg-white p-4 shadow-sm md:p-5">
                  <h3 className="font-[family-name:var(--font-display)] text-xl text-zvv-ink">{copy.title}</h3>
                  <p className="mt-1 text-sm text-zvv-muted">{copy.direction}</p>
                  {rows.length === 0 ? (
                    <p className="mt-4 text-sm text-zvv-muted">Nog geen geldige resultaten.</p>
                  ) : (
                    <ol className="mt-4 space-y-2">
                      {rows.map((r) => {
                        const value =
                          c.key === "plank_seconds"
                            ? formatPlankDisplay(r.value)
                            : c.key === "six_minute_run_meters"
                              ? formatMetersNl(r.value)
                              : formatSecondsNl(r.value);
                        return (
                          <li key={r.player_id} className="flex justify-between gap-3 text-sm">
                            <span>
                              #{r.rank} · #{r.shirt_number} {r.full_name}
                            </span>
                            <span className="tabular-nums text-zvv-muted">{value}</span>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-zvv-border bg-white p-4 shadow-sm md:p-5">
            <h3 className="font-[family-name:var(--font-display)] text-xl text-zvv-ink">Totaalklassement</h3>
            <p className="mt-1 text-sm text-zvv-muted">
              Alleen speelsters met vier geldige onderdelen · gelijke weging 25%
            </p>
            <ol className="mt-4 space-y-2">
              {rankFitnessTotal(db, published.id)
                .slice(0, 10)
                .map((r) => (
                  <li key={r.player_id} className="flex flex-wrap justify-between gap-2 text-sm">
                    <span>
                      #{r.rank} · #{r.shirt_number} {r.full_name}
                    </span>
                    <span className="text-zvv-muted">{r.totalScore.toLocaleString("nl-NL")} pt</span>
                  </li>
                ))}
            </ol>
          </div>
        </section>
      )}
    </div>
  );
}
