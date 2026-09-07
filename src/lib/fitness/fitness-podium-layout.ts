/**
 * Visual fitness podium layout — presentation only.
 * Sporting ranks/values stay untouched. Ties on the podium use existing
 * session total rank (then shirt → name). The rest list uses the existing
 * technical order (value → shirt → name) and excludes actual podium player_ids.
 */

export type FitnessPodiumLayoutRow = {
  player_id: string;
  full_name: string;
  shirt_number: number;
  value: number;
};

export function compareValueThenShirt(
  a: FitnessPodiumLayoutRow,
  b: FitnessPodiumLayoutRow,
  direction: "lower_better" | "higher_better",
): number {
  const d = direction === "lower_better" ? a.value - b.value : b.value - a.value;
  if (d !== 0) return d;
  if (a.shirt_number !== b.shirt_number) return a.shirt_number - b.shirt_number;
  return a.full_name.localeCompare(b.full_name, "nl");
}

function comparePodiumTieBreak(
  a: FitnessPodiumLayoutRow,
  b: FitnessPodiumLayoutRow,
  totalRankByPlayer: ReadonlyMap<string, number>,
): number {
  const ta = totalRankByPlayer.get(a.player_id) ?? Number.POSITIVE_INFINITY;
  const tb = totalRankByPlayer.get(b.player_id) ?? Number.POSITIVE_INFINITY;
  if (ta !== tb) return ta - tb;
  if (a.shirt_number !== b.shirt_number) return a.shirt_number - b.shirt_number;
  return a.full_name.localeCompare(b.full_name, "nl");
}

export function layoutFitnessPodium<T extends FitnessPodiumLayoutRow>(
  rows: readonly T[],
  direction: "lower_better" | "higher_better",
  totalRankByPlayer: ReadonlyMap<string, number>,
): { podium: T[]; rest: T[] } {
  const byValue = [...rows].sort((a, b) => compareValueThenShirt(a, b, direction));
  const groups: T[][] = [];
  for (const row of byValue) {
    const last = groups[groups.length - 1];
    if (!last || last[0]!.value !== row.value) groups.push([row]);
    else last.push(row);
  }

  const podium: T[] = [];
  for (const group of groups) {
    if (podium.length >= 3) break;
    const ordered = [...group].sort((a, b) => comparePodiumTieBreak(a, b, totalRankByPlayer));
    for (const row of ordered) {
      if (podium.length >= 3) break;
      podium.push(row);
    }
  }

  const onPodium = new Set(podium.map((r) => r.player_id));
  const rest = rows
    .filter((r) => !onPodium.has(r.player_id))
    .sort((a, b) => compareValueThenShirt(a, b, direction));

  return { podium, rest };
}

export function splitPreservingOrderByPodiumIds<T extends { player_id: string }>(
  rows: readonly T[],
  podium: readonly T[],
): { podium: T[]; rest: T[] } {
  const taken = podium.slice(0, 3);
  const onPodium = new Set(taken.map((r) => r.player_id));
  return {
    podium: taken,
    rest: rows.filter((r) => !onPodium.has(r.player_id)),
  };
}
