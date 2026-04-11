"use client";

import { useMemo } from "react";
import { useMatchEntryGoalStore } from "@/stores/match-entry-store";

export type SquadOption = {
  player_id: string;
  name: string;
  shirt_number: number;
};

export function GoalInputList({ squad, disabled }: { squad: SquadOption[]; disabled?: boolean }) {
  const goalRows = useMatchEntryGoalStore((s) => s.goalRows);
  const addGoalRow = useMatchEntryGoalStore((s) => s.addGoalRow);
  const removeGoalRow = useMatchEntryGoalStore((s) => s.removeGoalRow);
  const setGoalRow = useMatchEntryGoalStore((s) => s.setGoalRow);
  const byId = useMemo(() => new Set(squad.map((s) => s.player_id)), [squad]);

  const inputCls =
    "w-full rounded-xl border border-zvv-border bg-white px-4 py-2.5 text-sm text-zvv-ink outline-none focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/15";

  return (
    <div className="space-y-3">
      {goalRows.map((row, idx) => (
        <div key={row.clientId} className="grid gap-2 rounded-xl border border-zvv-border bg-zvv-card-mid p-3 md:grid-cols-[1fr_1fr_auto]">
          <p className="md:col-span-3 text-xs font-bold uppercase tracking-wider text-zvv-muted">Goal #{idx + 1}</p>
          <select
            value={row.scorerId}
            onChange={(e) => setGoalRow(row.clientId, { scorerId: e.target.value })}
            className={inputCls}
            disabled={disabled}
          >
            <option value="">Kies scorer</option>
            {squad.map((m) => (
              <option key={m.player_id} value={m.player_id}>
                #{m.shirt_number} {m.name}
              </option>
            ))}
          </select>
          <select
            value={row.assistId}
            onChange={(e) => setGoalRow(row.clientId, { assistId: e.target.value })}
            className={inputCls}
            disabled={disabled}
          >
            <option value="">Geen assist</option>
            {squad
              .filter((m) => m.player_id !== row.scorerId || !byId.has(row.scorerId))
              .map((m) => (
                <option key={m.player_id} value={m.player_id}>
                  #{m.shirt_number} {m.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            onClick={() => removeGoalRow(row.clientId)}
            disabled={disabled || goalRows.length <= 1}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-40"
          >
            Verwijder
          </button>
        </div>
      ))}

      <button type="button" onClick={addGoalRow} disabled={disabled || squad.length === 0} className="club-btn-secondary">
        + Goal toevoegen
      </button>
    </div>
  );
}
