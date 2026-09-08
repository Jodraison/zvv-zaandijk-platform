import Link from "next/link";
import type { FitnessRankRow, FitnessTotalRankRow } from "@/lib/fitness/session-ranking";
import {
  formatMetersNl,
  formatPlankDisplay,
  formatSecondsNl,
} from "@/lib/fitness/parse-values";
import { FITNESS_COMPONENTS, type FitnessComponentKey } from "@/lib/fitness/protocol";
import { cn } from "@/lib/utils";
import { RankingPodium, type PodiumEntry } from "@/components/ranking/ranking-podium";
import { FitnessScoreLegend } from "@/components/fitness/fitness-score-legend";

function formatComponentValue(key: FitnessComponentKey, value: number): string {
  if (key === "plank_seconds") return formatPlankDisplay(value);
  if (key === "six_minute_run_meters") return formatMetersNl(value);
  return formatSecondsNl(value);
}

function formatTotalPoints(score: number): string {
  return `${score.toLocaleString("nl-NL")} pt`;
}

function rowValueLabel(
  r: FitnessRankRow | FitnessTotalRankRow,
  total: boolean | undefined,
  componentKey?: FitnessComponentKey,
): string {
  if (total && "totalScore" in r) return formatTotalPoints(r.totalScore);
  if ("value" in r && componentKey) return formatComponentValue(componentKey, r.value);
  return "";
}

function podiumValueLabel(
  r: FitnessRankRow | FitnessTotalRankRow,
  total: boolean | undefined,
  componentKey?: FitnessComponentKey,
): string {
  if (total && "totalScore" in r) return formatTotalPoints(r.totalScore);
  if ("value" in r && componentKey) {
    return `#${r.rank} · ${formatComponentValue(componentKey, r.value)}`;
  }
  return "";
}

export function FitnessPodiumList({
  title,
  rows,
  componentKey,
  total,
  fieldSize = 0,
}: {
  title: string;
  rows: FitnessRankRow[] | FitnessTotalRankRow[];
  componentKey?: FitnessComponentKey;
  total?: boolean;
  fieldSize?: number;
}) {
  if (rows.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-zvv-border bg-white px-4 py-6 text-center md:p-5">
        <h3 className="font-[family-name:var(--font-display)] text-xl text-zvv-ink">{title}</h3>
        <p className="mt-2 text-sm text-zvv-muted">Nog geen geldige resultaten in deze categorie.</p>
      </section>
    );
  }

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  const podiumEntries: PodiumEntry[] = podium.map((r, i) => ({
    player_id: r.player_id,
    full_name: r.full_name,
    shirt_number: r.shirt_number,
    positionLabel: "",
    valueLabel: podiumValueLabel(r, total, componentKey),
    photo_url: null,
    rank: i + 1,
  }));

  return (
    <section className="space-y-4 rounded-2xl border border-zvv-border bg-white p-4 md:p-5">
      <div className="space-y-2">
        <h3 className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">{title}</h3>
        {total ? <FitnessScoreLegend fieldSize={fieldSize} /> : null}
      </div>
      <RankingPodium entries={podiumEntries} />
      {rest.length > 0 ? (
        <ul className="divide-y divide-zvv-border/80 rounded-2xl border border-zvv-border">
          {rest.map((r) => (
            <li key={r.player_id} className="flex items-center gap-3 px-3 py-3.5 sm:px-4">
              <span className="w-8 shrink-0 font-[family-name:var(--font-display)] text-lg tabular-nums text-zvv-muted">
                #{r.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-[family-name:var(--font-display)] text-[17px] leading-tight tracking-wide text-zvv-ink">
                  {r.full_name}
                </p>
                <p className="mt-0.5 text-sm text-zvv-muted">#{r.shirt_number}</p>
              </div>
              <span className="shrink-0 font-[family-name:var(--font-display)] text-lg tabular-nums text-zvv-ink">
                {rowValueLabel(r, total, componentKey)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function RankingViewTabs({
  seasonId,
  view,
}: {
  seasonId: string;
  view: "wedstrijd" | "fitheid" | "historie" | "seizoen";
}) {
  const q = (v: string) => `/ranking?season=${encodeURIComponent(seasonId)}&view=${v}`;
  const tabs = [
    { id: "wedstrijd" as const, label: "Wedstrijdprestaties" },
    { id: "fitheid" as const, label: "Actuele fitheidstest" },
    { id: "historie" as const, label: "Fitheidshistorie" },
    { id: "seizoen" as const, label: "Seizoensoverzicht" },
  ];
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Rankingonderdelen">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={q(t.id)}
          className={cn(
            "min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold",
            view === t.id
              ? "border-zvv-primary bg-zvv-primary text-white"
              : "border-zvv-border bg-white text-zvv-muted hover:border-zvv-primary/40",
          )}
          aria-current={view === t.id ? "page" : undefined}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/** @deprecated Prefer MatchCategoryRanking — kept for season overview compact lists with real values only. */
export function MatchCategoryBoard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ player_id: string; full_name: string; shirt_number: number; value: number }>;
}) {
  const scored = rows.filter((r) => r.value > 0);
  return (
    <section className="rounded-2xl border border-zvv-border bg-white p-4 shadow-sm md:p-5">
      <h3 className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">{title}</h3>
      {scored.length === 0 ? (
        <p className="mt-3 text-sm text-zvv-muted">Nog geen data.</p>
      ) : (
        <ol className="mt-4 space-y-2">
          {scored.map((r, i) => (
            <li
              key={r.player_id}
              className={cn(
                "flex items-center justify-between rounded-xl border px-3 py-2",
                i === 0 ? "border-amber-200 bg-amber-50" : "border-zvv-border bg-white",
              )}
            >
              <span className="font-medium text-zvv-ink">
                <span className="mr-2 text-zvv-muted">#{i + 1}</span>
                #{r.shirt_number} {r.full_name}
              </span>
              <span className="tabular-nums font-semibold text-zvv-ink">{r.value}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export { FITNESS_COMPONENTS };
