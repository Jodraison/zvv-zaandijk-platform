"use client";

import { useMemo, useState, useTransition } from "react";
import { FORMATION_4231_SLOTS, FORMATION_SLOT_CODES, type FormationSlotCode } from "@/lib/match/formation-4231";
import { saveMatchShapeEventsAction } from "@/actions/match-shape-events";
import { getMatchShapeAtMinute, slotOfShape, validateShapeOccupancy } from "@/lib/match/match-shape";
import {
  emptyMoment,
  flattenMoments,
  groupRowsIntoMoments,
  type TacticalMomentDraft,
} from "@/lib/match/tactical-moments";
import type { ClubDatabase, MatchLineupEntry, MatchPositionChange, MatchSubstitution } from "@/types";
import { sortPlayersBySquadNumber } from "@/lib/players/sort-by-squad-number";

type PlayerOpt = { player_id: string; name: string; shirt_number: number; is_guest?: boolean };

type SubRow = {
  id?: string;
  player_in_id: string;
  player_out_id: string;
  minute: number;
  to_slot: string;
  change_group_id: string;
  notes: string;
};

type PosRow = {
  id?: string;
  player_id: string;
  minute: number;
  from_slot: string;
  to_slot: string;
  change_group_id: string;
  notes: string;
};

function buildLocalDb(
  matchId: string,
  slots: Partial<Record<FormationSlotCode, string | null>>,
  bench: string[],
  moments: TacticalMomentDraft[],
): ClubDatabase {
  const lineup: MatchLineupEntry[] = [];
  let i = 0;
  for (const code of FORMATION_SLOT_CODES) {
    const pid = slots[code];
    if (!pid) continue;
    lineup.push({
      id: `l-${i++}`,
      match_id: matchId,
      player_id: pid,
      role: "starter",
      position: code,
      absence_reason: null,
      sort_order: i,
    });
  }
  for (const pid of bench) {
    lineup.push({
      id: `l-${i++}`,
      match_id: matchId,
      player_id: pid,
      role: "bench",
      position: null,
      absence_reason: null,
      sort_order: i,
    });
  }
  const flat = flattenMoments(moments);
  const substitutions: MatchSubstitution[] = flat.substitutions.map((s, idx) => ({
    id: s.id ?? `sub-${idx}`,
    match_id: matchId,
    player_in_id: s.player_in_id,
    player_out_id: s.player_out_id,
    minute: s.minute,
    to_slot: s.to_slot || null,
    stoppage_time: 0,
    sort_order: s.sort_order,
    change_group_id: s.change_group_id,
    notes: null,
  }));
  const position_changes: MatchPositionChange[] = flat.position_changes.map((c, idx) => ({
    id: c.id ?? `pos-${idx}`,
    match_id: matchId,
    player_id: c.player_id,
    minute: c.minute,
    stoppage_time: 0,
    from_slot: c.from_slot,
    to_slot: c.to_slot,
    change_group_id: c.change_group_id,
    notes: null,
    sort_order: c.sort_order,
  }));
  return {
    match_lineup_entries: lineup,
    match_substitutions: substitutions,
    match_position_changes: position_changes,
  } as unknown as ClubDatabase;
}

function rowsToMoments(initialSubs: SubRow[], initialPos: PosRow[]): TacticalMomentDraft[] {
  return groupRowsIntoMoments(
    initialSubs.map((s, i) => ({
      id: s.id ?? `sub-${i}`,
      match_id: "local",
      player_in_id: s.player_in_id,
      player_out_id: s.player_out_id,
      minute: s.minute,
      to_slot: s.to_slot || null,
      stoppage_time: 0,
      sort_order: i,
      change_group_id: s.change_group_id || null,
      notes: s.notes || null,
    })),
    initialPos.map((c, i) => ({
      id: c.id ?? `pos-${i}`,
      match_id: "local",
      player_id: c.player_id,
      minute: c.minute,
      stoppage_time: 0,
      from_slot: c.from_slot,
      to_slot: c.to_slot,
      change_group_id: c.change_group_id || null,
      notes: c.notes || null,
      sort_order: i,
    })),
  );
}

export function MatchShapeEventsEditor({
  matchId,
  players,
  initialSlots = {},
  initialBench = [],
  initialSubs,
  initialPos,
  demoMode = false,
}: {
  matchId: string;
  players: PlayerOpt[];
  initialSlots?: Partial<Record<FormationSlotCode, string | null>>;
  initialBench?: string[];
  initialSubs: SubRow[];
  initialPos: PosRow[];
  demoMode?: boolean;
}) {
  const [moments, setMoments] = useState<TacticalMomentDraft[]>(() => rowsToMoments(initialSubs, initialPos));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [draftMinute, setDraftMinute] = useState(75);
  const sortedPlayers = useMemo(() => sortPlayersBySquadNumber(players), [players]);
  const nameOf = (id: string) => sortedPlayers.find((p) => p.player_id === id)?.name ?? id;
  const slotOpts = FORMATION_4231_SLOTS;

  function shapeBefore(index: number, minute: number) {
    const earlier = moments.filter((m, i) => i !== index && (m.minute < minute || (m.minute === minute && i < index)));
    const db = buildLocalDb(matchId, initialSlots, initialBench, earlier);
    return getMatchShapeAtMinute(db, matchId, minute);
  }

  function addMoment() {
    setMoments((prev) => [...prev, emptyMoment(draftMinute)]);
  }

  function save() {
    setMessage(null);
    const flat = flattenMoments(moments);
    const preview = getMatchShapeAtMinute(
      buildLocalDb(matchId, initialSlots, initialBench, moments),
      matchId,
      90,
    );
    const occupancy = validateShapeOccupancy(preview);
    if (occupancy.length) {
      setMessage(occupancy[0] ?? "Eindopstelling is ongeldig.");
      return;
    }
    if (demoMode) {
      setMessage("Demo: wijzigingen lokaal zichtbaar (geen databasewrite).");
      return;
    }
    startTransition(async () => {
      const res = await saveMatchShapeEventsAction({
        match_id: matchId,
        substitutions: flat.substitutions.map((s) => ({
          id: s.id,
          player_in_id: s.player_in_id,
          player_out_id: s.player_out_id,
          minute: s.minute,
          to_slot: s.to_slot || null,
          sort_order: s.sort_order,
          change_group_id: s.change_group_id,
          notes: null,
        })),
        position_changes: flat.position_changes.map((c) => ({
          id: c.id,
          player_id: c.player_id,
          minute: c.minute,
          from_slot: c.from_slot,
          to_slot: c.to_slot,
          change_group_id: c.change_group_id,
          notes: null,
          sort_order: c.sort_order,
        })),
      });
      setMessage(res.ok ? "Wisselmomenten opgeslagen" : res.error);
    });
  }

  return (
    <section className="space-y-6 rounded-2xl border border-zvv-border bg-white p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zvv-primary">Na de wedstrijd</p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-zvv-ink">
            Wisselmoment
          </h2>
          <p className="mt-1 text-sm text-zvv-muted">
            Eén moment kan een wissel én meerdere positiewijzigingen op dezelfde minuut bevatten.
          </p>
        </div>
        <button type="button" disabled={pending} onClick={save} className="club-btn-primary club-btn-primary-sm">
          Opslaan
        </button>
      </div>

      {message ? <p className="text-sm font-medium text-zvv-ink">{message}</p> : null}

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zvv-border bg-slate-50/80 p-3">
        <label className="text-xs font-semibold text-zvv-muted">
          Standaardminuut
          <input
            type="number"
            min={0}
            max={130}
            className="mt-1 min-h-11 w-28 rounded-lg border border-zvv-border bg-white px-2 text-sm"
            value={draftMinute}
            onChange={(e) => setDraftMinute(Math.max(0, Math.min(130, Number(e.target.value) || 0)))}
          />
        </label>
        <button type="button" onClick={addMoment} className="club-btn-secondary club-btn-primary-sm">
          + Wisselmoment
        </button>
      </div>

      {moments.length === 0 ? <p className="text-sm text-zvv-muted">Nog geen wisselmomenten — later invullen mag.</p> : null}

      {moments.map((m, idx) => {
        const before = shapeBefore(idx, m.minute);
        const onField = sortedPlayers.filter((p) => before.onPitch.includes(p.player_id));
        const offField = sortedPlayers.filter((p) => !before.onPitch.includes(p.player_id));
        const sub = m.substitutions[0] ?? { player_out_id: "", player_in_id: "", to_slot: "" };

        function patchMoment(patch: Partial<TacticalMomentDraft>) {
          setMoments((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
        }
        function patchSub(patch: Partial<typeof sub>) {
          const nextSubs = m.substitutions.length ? m.substitutions.map((s, i) => (i === 0 ? { ...s, ...patch } : s)) : [{ ...sub, ...patch }];
          patchMoment({ substitutions: nextSubs });
        }

        return (
          <div key={m.groupId} className="space-y-3 rounded-2xl border border-zvv-border bg-slate-50/80 p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-zvv-muted">
                Minuut
                <input
                  type="number"
                  min={0}
                  max={130}
                  className="ml-2 min-h-11 w-20 rounded-lg border border-zvv-border bg-white px-2 text-sm"
                  value={m.minute}
                  onChange={(e) => patchMoment({ minute: Math.max(0, Math.min(130, Number(e.target.value) || 0)) })}
                />
              </label>
              <button
                type="button"
                className="min-h-11 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-800"
                onClick={() => setMoments((prev) => prev.filter((_, i) => i !== idx))}
              >
                Verwijder
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-semibold text-zvv-muted">
                Uit
                <select
                  className="mt-1 min-h-11 w-full rounded-lg border border-zvv-border bg-white px-2 text-sm"
                  value={sub.player_out_id}
                  onChange={(e) => patchSub({ player_out_id: e.target.value })}
                >
                  <option value="">—</option>
                  {onField.concat(offField.filter((p) => p.player_id === sub.player_out_id)).map((p) => (
                    <option key={p.player_id} value={p.player_id}>
                      #{p.shirt_number} {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs font-semibold text-zvv-muted">
                In
                <select
                  className="mt-1 min-h-11 w-full rounded-lg border border-zvv-border bg-white px-2 text-sm"
                  value={sub.player_in_id}
                  onChange={(e) => patchSub({ player_in_id: e.target.value })}
                >
                  <option value="">—</option>
                  {offField.concat(onField.filter((p) => p.player_id === sub.player_in_id)).map((p) => (
                    <option key={p.player_id} value={p.player_id}>
                      #{p.shirt_number} {p.name}
                      {before.substitutedOut.includes(p.player_id) ? " · opnieuw" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs font-semibold text-zvv-muted sm:col-span-2">
                Positie
                <select
                  className="mt-1 min-h-11 w-full rounded-lg border border-zvv-border bg-white px-2 text-sm"
                  value={sub.to_slot}
                  onChange={(e) => patchSub({ to_slot: e.target.value })}
                >
                  <option value="">Zelfde als uit</option>
                  {slotOpts.map((slot) => (
                    <option key={slot.code} value={slot.code}>
                      {slot.code} · {slot.labelNl}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-2 border-t border-zvv-border/70 pt-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-zvv-primary">Positiewijzigingen</p>
              {m.positionChanges.map((c, pIdx) => {
                const fromAuto = c.player_id ? slotOfShape(before.slots, c.player_id) : null;
                const from = fromAuto ?? (c.from_slot || "");
                return (
                  <div key={`${m.groupId}-pos-${pIdx}`} className="grid gap-2 rounded-xl border border-zvv-border bg-white p-2 sm:grid-cols-[1fr_auto_auto]">
                    <label className="space-y-1 text-xs font-semibold text-zvv-muted">
                      Speelster
                      <select
                        className="mt-1 min-h-11 w-full rounded-lg border border-zvv-border bg-white px-2 text-sm"
                        value={c.player_id}
                        onChange={(e) => {
                          const pid = e.target.value;
                          const auto = slotOfShape(before.slots, pid) ?? c.from_slot;
                          setMoments((prev) =>
                            prev.map((row, i) =>
                              i === idx
                                ? {
                                    ...row,
                                    positionChanges: row.positionChanges.map((x, j) =>
                                      j === pIdx ? { ...x, player_id: pid, from_slot: auto } : x,
                                    ),
                                  }
                                : row,
                            ),
                          );
                        }}
                      >
                        <option value="">—</option>
                        {onField.map((p) => (
                          <option key={p.player_id} value={p.player_id}>
                            #{p.shirt_number} {p.name}
                            {slotOfShape(before.slots, p.player_id) ? ` · ${slotOfShape(before.slots, p.player_id)}` : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="flex items-end text-sm font-semibold text-zvv-ink">
                      {from || "—"} →
                    </p>
                    <label className="space-y-1 text-xs font-semibold text-zvv-muted">
                      Naar
                      <select
                        className="mt-1 min-h-11 w-full rounded-lg border border-zvv-border bg-white px-2 text-sm"
                        value={c.to_slot}
                        onChange={(e) =>
                          setMoments((prev) =>
                            prev.map((row, i) =>
                              i === idx
                                ? {
                                    ...row,
                                    positionChanges: row.positionChanges.map((x, j) =>
                                      j === pIdx ? { ...x, to_slot: e.target.value, from_slot: from } : x,
                                    ),
                                  }
                                : row,
                            ),
                          )
                        }
                      >
                        <option value="">—</option>
                        {slotOpts.map((slot) => (
                          <option key={slot.code} value={slot.code}>
                            {slot.code}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="text-left text-xs font-semibold text-red-800 sm:col-span-3"
                      onClick={() =>
                        setMoments((prev) =>
                          prev.map((row, i) =>
                            i === idx ? { ...row, positionChanges: row.positionChanges.filter((_, j) => j !== pIdx) } : row,
                          ),
                        )
                      }
                    >
                      Verwijder wijziging
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                className="text-sm font-semibold text-zvv-primary"
                onClick={() =>
                  setMoments((prev) =>
                    prev.map((row, i) =>
                      i === idx
                        ? { ...row, positionChanges: [...row.positionChanges, { player_id: "", from_slot: "", to_slot: "" }] }
                        : row,
                    ),
                  )
                }
              >
                + positiewijziging
              </button>
            </div>
          </div>
        );
      })}

      {moments.length > 0 ? (
        <p className="text-xs text-zvv-muted">
          Eindbeeld na alle momenten:{" "}
          {FORMATION_SLOT_CODES.map((code) => {
            const id = getMatchShapeAtMinute(buildLocalDb(matchId, initialSlots, initialBench, moments), matchId, 90).slots[
              code
            ];
            return id ? `${code} ${nameOf(id)}` : null;
          })
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>
      ) : null}
    </section>
  );
}
