import type { FitnessProgressStatus, FitnessTest } from "@/types";

const EPS = 0.015;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Effectieve totaaltijd in seconden: total_time indien gezet (>0), anders som sprinten. */
export function fitnessTotalSeconds(
  f: Pick<FitnessTest, "sprint_20m" | "sprint_40m" | "sprint_60m" | "total_time">,
): number {
  if (f.total_time > 0) return round2(f.total_time);
  return round2(f.sprint_20m + f.sprint_40m + f.sprint_60m);
}

export function progressFromTotals(previous: number | null, current: number): {
  status: FitnessProgressStatus;
  delta: number | null;
} {
  if (previous === null) {
    return { status: "no_previous", delta: null };
  }
  const delta = round2(previous - current);
  if (Math.abs(delta) < EPS) {
    return { status: "equal", delta: 0 };
  }
  if (delta > 0) return { status: "improved", delta };
  return { status: "declined", delta };
}

/**
 * Past progress_* en session_rank in-place aan op alle fitness_tests van dit seizoen.
 */
export function recomputeFitnessAnalyticsInDb(
  db: { fitness_tests: FitnessTest[] },
  seasonId: string,
): void {
  const tests = db.fitness_tests.filter((f) => f.season_id === seasonId && f.test_type === "sprint_20_40_60");

  for (const t of tests) {
    t.total_time = round2(fitnessTotalSeconds(t));
  }

  const byPlayer = new Map<string, FitnessTest[]>();
  for (const t of tests) {
    let arr = byPlayer.get(t.player_id);
    if (!arr) {
      arr = [];
      byPlayer.set(t.player_id, arr);
    }
    arr.push(t);
  }

  for (const arr of byPlayer.values()) {
    arr.sort((a, b) => a.test_on.localeCompare(b.test_on));
    for (let i = 0; i < arr.length; i++) {
      const cur = arr[i];
      const prev = i > 0 ? arr[i - 1] : null;
      const prevTotal = prev ? fitnessTotalSeconds(prev) : null;
      const curTotal = fitnessTotalSeconds(cur);
      const { status, delta } = progressFromTotals(prevTotal, curTotal);
      cur.progress_status = status;
      cur.progress_delta = delta;
    }
  }

  for (const t of tests) {
    t.session_rank = null;
  }

  let latestOn = "";
  for (const t of tests) {
    if (t.test_on > latestOn) latestOn = t.test_on;
  }
  if (!latestOn) return;

  const onLatest = tests.filter((t) => t.test_on === latestOn);
  onLatest.sort((a, b) => {
    const ta = fitnessTotalSeconds(a);
    const tb = fitnessTotalSeconds(b);
    if (ta !== tb) return ta - tb;
    return a.player_id.localeCompare(b.player_id);
  });
  for (let i = 0; i < onLatest.length; i++) {
    onLatest[i].session_rank = i < 3 ? (i + 1) as 1 | 2 | 3 : null;
  }
}

/** Alleen tests van dit seizoen (volledige array mag gefilterd zijn). */
export function recomputeFitnessAnalyticsForTests(tests: FitnessTest[], seasonId: string): void {
  recomputeFitnessAnalyticsInDb({ fitness_tests: tests }, seasonId);
}
