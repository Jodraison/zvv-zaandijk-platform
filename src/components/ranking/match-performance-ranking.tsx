import { RankingPodium, type PodiumEntry } from "@/components/ranking/ranking-podium";
import { membershipPositionLabel } from "@/lib/membership-position-label";
import type { PlayerSeasonRankingRow } from "@/types";
import { cn } from "@/lib/utils";

type Category = "goals" | "assists" | "mvp" | "cleanSheets";

function valueOf(row: PlayerSeasonRankingRow, cat: Category): number {
  if (cat === "goals") return row.goals_total;
  if (cat === "assists") return row.assists_total;
  if (cat === "cleanSheets") return row.clean_sheets_total;
  return row.wotm_total;
}

function sortCategory(rows: PlayerSeasonRankingRow[], cat: Category): PlayerSeasonRankingRow[] {
  return [...rows]
    .filter((r) => valueOf(r, cat) > 0)
    .sort((a, b) => {
      const d = valueOf(b, cat) - valueOf(a, cat);
      if (d !== 0) return d;
      return a.full_name.localeCompare(b.full_name, "nl");
    });
}

const TITLES: Record<Category, { title: string; unit: string; emptyTitle: string; emptyBody: string }> = {
  goals: {
    title: "Topscorer",
    unit: "goals",
    emptyTitle: "Nog geen topscorer",
    emptyBody: "Na de eerste gespeelde wedstrijd verschijnt hier de topscorer.",
  },
  assists: {
    title: "Assistkoningin",
    unit: "assists",
    emptyTitle: "Nog geen assistkoningin",
    emptyBody: "Na de eerste gespeelde wedstrijd verschijnt hier de assistkoningin.",
  },
  mvp: {
    title: "MVP",
    unit: "MVP’s",
    emptyTitle: "Nog geen MVP-ranglijst",
    emptyBody: "Na de eerste gespeelde wedstrijd verschijnt hier de MVP-ranglijst.",
  },
  cleanSheets: {
    title: "Wedstrijden zonder tegengoals",
    unit: "wedstrijden",
    emptyTitle: "Nog geen ranglijst zonder tegengoals",
    emptyBody:
      "Keepers en verdedigers die meespeelden zonder tegendoelpunt verschijnen hier na de eerste clean sheet.",
  },
};

export function MatchCategoryRanking({
  rows,
  category,
}: {
  rows: PlayerSeasonRankingRow[];
  category: Category;
}) {
  const meta = TITLES[category];
  const ranked = sortCategory(rows, category);

  if (ranked.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-zvv-border bg-white px-5 py-8 text-center">
        <h3 className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">{meta.emptyTitle}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zvv-muted">{meta.emptyBody}</p>
      </section>
    );
  }

  const podiumEntries: PodiumEntry[] = ranked.slice(0, 3).map((r, i) => ({
    player_id: r.player_id,
    full_name: r.full_name,
    shirt_number: r.shirt_number,
    positionLabel: membershipPositionLabel(r.display_position, r.position),
    valueLabel: `${valueOf(r, category)} ${meta.unit}`,
    photo_url: r.photo_url,
    rank: i + 1,
  }));

  const rest = ranked.slice(3);

  return (
    <section className="space-y-4">
      <h3 className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink md:text-3xl">{meta.title}</h3>
      <RankingPodium entries={podiumEntries} />
      {rest.length > 0 ? (
        <ul className="divide-y divide-zvv-border rounded-2xl border border-zvv-border bg-white">
          {rest.map((r, i) => (
            <li key={r.player_id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="text-zvv-muted tabular-nums">#{i + 4}</span>
              <span className="min-w-0 flex-1 truncate font-medium text-zvv-ink">
                #{r.shirt_number} {r.full_name}
                <span className="ml-2 font-normal text-zvv-muted">
                  {membershipPositionLabel(r.display_position, r.position)}
                </span>
              </span>
              <span className={cn("tabular-nums font-semibold text-zvv-ink")}>{valueOf(r, category)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function hasAnyMatchPerformance(rows: PlayerSeasonRankingRow[]): boolean {
  return rows.some(
    (r) =>
      r.goals_total > 0 ||
      r.assists_total > 0 ||
      r.wotm_total > 0 ||
      r.clean_sheets_total > 0,
  );
}
