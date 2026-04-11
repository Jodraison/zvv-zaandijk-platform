"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/layout/glass-card";
import { FitnessLine } from "@/components/charts/fitness-line";
import { fitnessTotalSeconds } from "@/lib/fitness-analytics";
import { formatDateNL } from "@/lib/utils/format-date";

type TestRow = {
  player_id: string;
  test_on: string;
  sprint_20m: number;
  sprint_40m: number;
  sprint_60m: number;
  total_time: number;
};

type Pl = { id: string; name: string; shirt: number };

export function FitnessExplorer({ players, tests }: { players: Pl[]; tests: TestRow[] }) {
  const [pid, setPid] = useState(players[0]?.id ?? "");
  const [metric, setMetric] = useState<"20" | "40" | "60" | "totaal">("totaal");

  const selected = useMemo(() => players.find((p) => p.id === pid) ?? players[0], [players, pid]);

  const series = useMemo(() => {
    if (!selected) return [];
    return tests
      .filter((t) => t.player_id === selected.id)
      .sort((a, b) => a.test_on.localeCompare(b.test_on))
      .map((t) => ({
        label: formatDateNL(t.test_on),
        sec:
          metric === "totaal"
            ? fitnessTotalSeconds(t)
            : metric === "20"
              ? t.sprint_20m
              : metric === "40"
                ? t.sprint_40m
                : t.sprint_60m,
      }));
  }, [selected, tests, metric]);

  if (!selected) {
    return (
      <GlassCard>
        <p className="text-sm text-zvv-muted">Nog geen spelers in dit seizoen.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="elevated">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">Progressie per speelster</h2>
          <p className="text-sm text-zvv-muted">Kies totaal of losse afstand — lagere tijd is sneller.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            className="w-full rounded-xl border border-zvv-border bg-white px-4 py-2.5 text-sm font-medium text-zvv-ink outline-none focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/15 sm:max-w-[200px]"
            value={metric}
            onChange={(e) => setMetric(e.target.value as "20" | "40" | "60" | "totaal")}
            aria-label="Sprintafstand"
          >
            <option value="totaal">Totaal 20-40-60m</option>
            <option value="20">Sprint 20m</option>
            <option value="40">Sprint 40m</option>
            <option value="60">Sprint 60m</option>
          </select>
          <select
            className="w-full rounded-xl border border-zvv-border bg-white px-4 py-2.5 text-sm font-medium text-zvv-ink outline-none focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/15 sm:max-w-xs"
            value={selected.id}
            onChange={(e) => setPid(e.target.value)}
            aria-label="Speelster"
          >
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.shirt} {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-6 h-[260px]">
        {series.length ? (
          <FitnessLine data={series} />
        ) : (
          <p className="text-sm text-zvv-muted">Geen fitheidstests voor deze speelster.</p>
        )}
      </div>
    </GlassCard>
  );
}
