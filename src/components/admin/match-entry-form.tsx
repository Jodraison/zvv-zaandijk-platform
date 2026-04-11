"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { refreshAfterAdminSave } from "@/lib/admin-refresh";
import { GlassCard } from "@/components/layout/glass-card";
import { createMatchEntryAction } from "@/actions/match-entry";
import { useMatchEntryGoalStore } from "@/stores/match-entry-store";
import { GoalInputList, type SquadOption } from "@/components/admin/match-entry/goal-input-list";

export type MatchEntryMember = { player_id: string; name: string; shirt_number: number };

export function MatchEntryForm({ seasonId, members }: { seasonId: string; members: MatchEntryMember[] }) {
  const router = useRouter();
  const [opponent, setOpponent] = useState("");
  const [matchDate, setMatchDate] = useState(() => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  });
  const [isHome, setIsHome] = useState(true);
  const [goalsAgainst, setGoalsAgainst] = useState(0);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [wotmId, setWotmId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [isPending, startTransition] = useTransition();

  const goalRows = useMatchEntryGoalStore((s) => s.goalRows);
  const resetGoalRows = useMatchEntryGoalStore((s) => s.resetGoalRows);
  const setGoalRow = useMatchEntryGoalStore((s) => s.setGoalRow);

  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  const togglePlayer = useCallback((playerId: string, on: boolean) => {
    setSelected((prev) => ({ ...prev, [playerId]: on }));
  }, []);

  const selectedIds = useMemo(
    () => members.filter((m) => selected[m.player_id]).map((m) => m.player_id),
    [members, selected],
  );

  const squad: SquadOption[] = useMemo(
    () => members.filter((m) => selected[m.player_id]),
    [members, selected],
  );

  const goalsFor = useMemo(() => goalRows.filter((r) => r.scorerId).length, [goalRows]);

  useEffect(() => {
    const sel = new Set(selectedIds);
    const rows = useMatchEntryGoalStore.getState().goalRows;
    for (const r of rows) {
      if (r.scorerId && !sel.has(r.scorerId)) setGoalRow(r.clientId, { scorerId: "" });
      if (r.assistId && !sel.has(r.assistId)) setGoalRow(r.clientId, { assistId: "" });
    }
  }, [selectedIds, setGoalRow]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors(null);

    const goalsPayload = goalRows
      .filter((r) => r.scorerId)
      .map((r) => ({
        scorer_player_id: r.scorerId,
        assist_player_id: r.assistId || "",
      }));

    startTransition(async () => {
      const res = await createMatchEntryAction({
        season_id: seasonId,
        opponent,
        match_date: matchDate,
        is_home: isHome,
        goals_against: goalsAgainst,
        selected_player_ids: selectedIds,
        goals: goalsPayload,
        wotm_player_id: wotmId || "",
      });

      if (!res.ok) {
        setFormError(res.error);
        setFieldErrors(res.fieldErrors ?? null);
        setLastSavedId(null);
        return;
      }

      setLastSavedId(res.matchId);
      refreshAfterAdminSave(router);
      setFormError(null);
      setFieldErrors(null);
      setOpponent("");
      setGoalsAgainst(0);
      setWotmId("");
      setSelected({});
      resetGoalRows();
    });
  };

  const inputCls =
    "w-full rounded-xl border border-zvv-border bg-white px-4 py-2.5 text-sm text-zvv-ink outline-none focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/15";
  const toggleCls =
    "flex cursor-pointer items-center gap-3 rounded-xl border border-zvv-border bg-zvv-card-mid px-3 py-2.5 transition-colors hover:border-zvv-primary/30 has-[:checked]:border-zvv-primary/45 has-[:checked]:bg-zvv-primary-muted";

  const firstFieldError = fieldErrors ? Object.values(fieldErrors).flat()[0] : undefined;

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <GlassCard className="space-y-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zvv-muted">Stap 1</p>
          <h2 className="mt-1 font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-zvv-ink">Wedstrijdinfo</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-1.5 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zvv-muted">Tegenstander</span>
            <input
              required
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              className={inputCls}
              placeholder="Bv. AFC Ajax VR1"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zvv-muted">Datum</span>
            <input type="date" required value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className={inputCls} />
          </label>
          <div className="flex flex-col justify-end gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zvv-muted">Locatie</span>
            <button
              type="button"
              onClick={() => setIsHome((v) => !v)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                isHome
                  ? "border-emerald-500/40 bg-emerald-50 text-emerald-900"
                  : "border-zvv-border bg-white text-zvv-muted"
              }`}
            >
              {isHome ? "Thuiswedstrijd" : "Uitwedstrijd"}
            </button>
          </div>
          <div className="rounded-xl border border-zvv-border bg-zvv-card-mid/80 px-4 py-3 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zvv-muted">Goals voor (automatisch)</p>
                <p className="mt-1 text-2xl font-black tabular-nums text-zvv-ink">{goalsFor}</p>
              </div>
              <label className="min-w-[140px] flex-1 space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-zvv-muted">Goals tegen</span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={goalsAgainst}
                  onChange={(e) => setGoalsAgainst(Number(e.target.value) || 0)}
                  className={inputCls}
                />
              </label>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zvv-muted">Stap 2</p>
          <h2 className="mt-1 font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-zvv-ink">Selectie</h2>
          <p className="mt-2 text-xs text-zvv-muted">Alleen aangevinkte spelers krijgen een stats-rij voor deze wedstrijd.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <label key={m.player_id} className={toggleCls}>
              <input
                type="checkbox"
                checked={!!selected[m.player_id]}
                onChange={(e) => {
                  const on = e.target.checked;
                  togglePlayer(m.player_id, on);
                  if (!on && wotmId === m.player_id) setWotmId("");
                }}
                className="h-4 w-4 rounded border-zvv-border bg-white text-zvv-primary focus:ring-zvv-primary/30"
              />
              <span className="text-sm font-medium text-zvv-ink">
                #{m.shirt_number} {m.name}
              </span>
            </label>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zvv-muted">Stap 3</p>
          <h2 className="mt-1 font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-zvv-ink">Goals & assists</h2>
        </div>
        <GoalInputList squad={squad} disabled={isPending} />
      </GlassCard>

      <GlassCard className="space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zvv-muted">Stap 4</p>
          <h2 className="mt-1 font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-zvv-ink">Player of the match</h2>
        </div>
        <label className="block max-w-md space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-zvv-muted">MVP (verplicht)</span>
          <select
            value={wotmId}
            onChange={(e) => setWotmId(e.target.value)}
            disabled={squad.length === 0}
            className={inputCls}
          >
            <option value="">— kies speelster —</option>
            {squad.map((m) => (
              <option key={m.player_id} value={m.player_id}>
                #{m.shirt_number} {m.name}
              </option>
            ))}
          </select>
        </label>
      </GlassCard>

      <GlassCard className="space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zvv-muted">Stap 5</p>
          <h2 className="mt-1 font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-zvv-ink">Opslaan</h2>
          <p className="mt-2 text-xs text-zvv-muted">
            Match wordt als <strong className="text-zvv-ink">gespeeld</strong> opgeslagen. Ranking en stats volgen uit{" "}
            <code className="text-zvv-primary">match_player_stats</code>.
          </p>
        </div>

        {(formError || firstFieldError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {formError ?? firstFieldError}
          </div>
        )}

        {lastSavedId ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <span className="font-semibold">Opgeslagen.</span>{" "}
            <Link href={`/beheer/wedstrijden/${lastSavedId}`} className="underline decoration-zvv-primary/30 underline-offset-2 hover:text-zvv-primary">
              Bekijk of bewerk deze wedstrijd
            </Link>
            {" · "}
            <Link href="/beheer/wedstrijden" className="underline decoration-zvv-primary/30 underline-offset-2 hover:text-zvv-primary">
              Kalender
            </Link>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isPending || selectedIds.length === 0 || !wotmId.trim()}
            className="club-btn-primary px-8 py-3 text-sm disabled:opacity-40"
          >
            {isPending ? "Bezig met opslaan…" : "Wedstrijd opslaan"}
          </button>
          <Link
            href="/beheer/wedstrijden"
            className="club-btn-secondary inline-flex items-center px-6 py-3 text-sm"
          >
            Naar kalender
          </Link>
        </div>
      </GlassCard>
    </form>
  );
}
