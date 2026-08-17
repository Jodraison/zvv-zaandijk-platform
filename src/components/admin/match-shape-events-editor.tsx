"use client";

import { useMemo, useState, useTransition } from "react";
import { FORMATION_4231_SLOTS, FORMATION_SLOT_CODES, type FormationSlotCode } from "@/lib/match/formation-4231";
import { saveMatchShapeEventsAction } from "@/actions/match-shape-events";
import { getMatchShapeAtMinute } from "@/lib/match/match-shape";
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
  subs: SubRow[],
  pos: PosRow[],
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
  const substitutions: MatchSubstitution[] = subs.map((s, idx) => ({
    id: s.id ?? `sub-${idx}`,
    match_id: matchId,
    player_in_id: s.player_in_id,
    player_out_id: s.player_out_id,
    minute: s.minute,
    to_slot: s.to_slot || null,
    stoppage_time: 0,
    sort_order: idx,
    change_group_id: s.change_group_id || null,
    notes: s.notes || null,
  }));
  const position_changes: MatchPositionChange[] = pos.map((c, idx) => ({
    id: c.id ?? `pos-${idx}`,
    match_id: matchId,
    player_id: c.player_id,
    minute: c.minute,
    stoppage_time: 0,
    from_slot: c.from_slot,
    to_slot: c.to_slot,
    change_group_id: c.change_group_id || null,
    notes: c.notes || null,
    sort_order: idx,
  }));
  return {
    match_lineup_entries: lineup,
    match_substitutions: substitutions,
    match_position_changes: position_changes,
  } as unknown as ClubDatabase;
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
  const [subs, setSubs] = useState<SubRow[]>(initialSubs);
  const [pos, setPos] = useState<PosRow[]>(initialPos);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [draftMinute, setDraftMinute] = useState(45);
  const sortedPlayers = useMemo(() => sortPlayersBySquadNumber(players), [players]);

  const shapeAtDraft = useMemo(() => {
    const db = buildLocalDb(matchId, initialSlots, initialBench, subs, pos);
    // Shape vóór een nieuwe wissel op draftMinute: gebruik minute-1 voor candidates wanneer events op die minuut bestaan
    return getMatchShapeAtMinute(db, matchId, Math.max(0, draftMinute));
  }, [matchId, initialSlots, initialBench, subs, pos, draftMinute]);

  const onPitchOptions = sortedPlayers.filter((p) => shapeAtDraft.onPitch.includes(p.player_id));
  const offPitchOptions = sortedPlayers.filter((p) => !shapeAtDraft.onPitch.includes(p.player_id));

  function addSub() {
    setSubs((prev) => [
      ...prev,
      {
        player_in_id: "",
        player_out_id: "",
        minute: draftMinute,
        to_slot: "",
        change_group_id: "",
        notes: "",
      },
    ]);
  }

  function addPos() {
    setPos((prev) => [
      ...prev,
      {
        player_id: "",
        minute: draftMinute,
        from_slot: "LM",
        to_slot: "SP",
        change_group_id: "",
        notes: "",
      },
    ]);
  }

  function save() {
    setMessage(null);
    if (demoMode) {
      setMessage("Demo: wijzigingen lokaal zichtbaar (geen databasewrite).");
      return;
    }
    startTransition(async () => {
      const res = await saveMatchShapeEventsAction({
        match_id: matchId,
        substitutions: subs.map((s, i) => ({
          id: s.id,
          player_in_id: s.player_in_id,
          player_out_id: s.player_out_id,
          minute: s.minute,
          to_slot: s.to_slot || null,
          sort_order: i,
          change_group_id: s.change_group_id || null,
          notes: s.notes || null,
        })),
        position_changes: pos.map((c, i) => ({
          id: c.id,
          player_id: c.player_id,
          minute: c.minute,
          from_slot: c.from_slot,
          to_slot: c.to_slot,
          change_group_id: c.change_group_id || null,
          notes: c.notes || null,
          sort_order: i,
        })),
      });
      setMessage(res.ok ? "Wedstrijdverloop opgeslagen (vrij wisselen ondersteund)" : res.error);
    });
  }

  const slotOpts = FORMATION_4231_SLOTS;
  const nameOf = (id: string) => sortedPlayers.find((p) => p.player_id === id)?.name ?? id;

  return (
    <section className="space-y-6 rounded-2xl border border-zvv-border bg-white p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zvv-primary">Na de wedstrijd</p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-zvv-ink">
            Wissels &amp; positiewijzigingen
          </h2>
          <p className="mt-1 text-sm text-zvv-muted">
            Vul dit na afloop in — niet live naast het veld. Speelsters mogen eruit en later opnieuw invallen.
          </p>
        </div>
        <button type="button" disabled={pending} onClick={save} className="club-btn-primary club-btn-primary-sm">
          Opslaan
        </button>
      </div>

      {message ? <p className="text-sm font-medium text-zvv-ink">{message}</p> : null}

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zvv-border bg-slate-50/80 p-3">
        <label className="text-xs font-semibold text-zvv-muted">
          Voorbeeldminuut (voor eruit/erin)
          <input
            type="number"
            min={0}
            max={130}
            className="mt-1 min-h-11 w-28 rounded-lg border border-zvv-border bg-white px-2 text-sm"
            value={draftMinute}
            onChange={(e) => setDraftMinute(Math.max(0, Math.min(130, Number(e.target.value) || 0)))}
          />
        </label>
        <p className="text-sm text-zvv-muted">
          Op het veld: {shapeAtDraft.onPitch.map(nameOf).join(", ") || "—"}
        </p>
        {shapeAtDraft.warnings.length > 0 ? (
          <p className="w-full text-xs text-amber-800">{shapeAtDraft.warnings.slice(0, 3).join(" · ")}</p>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zvv-ink">+ Wisselmoment</h3>
          <button type="button" onClick={addSub} className="club-btn-secondary club-btn-primary-sm">
            + Wisselmoment toevoegen
          </button>
        </div>
        {subs.length === 0 ? <p className="text-sm text-zvv-muted">Nog geen wissels — later invullen mag.</p> : null}
        {subs.map((s, idx) => {
          const localDb = buildLocalDb(
            matchId,
            initialSlots,
            initialBench,
            subs.filter((_, i) => i !== idx),
            pos,
          );
          const shape = getMatchShapeAtMinute(localDb, matchId, Math.max(0, s.minute - (s.minute > 0 ? 0 : 0)));
          // Candidates: on-field before this sub — approximate with shape at minute including earlier events only
          const earlierDb = buildLocalDb(
            matchId,
            initialSlots,
            initialBench,
            subs.filter((row, i) => i !== idx && (row.minute < s.minute || (row.minute === s.minute && i < idx))),
            pos.filter((row) => row.minute < s.minute),
          );
          const before = getMatchShapeAtMinute(earlierDb, matchId, s.minute);
          const outOpts = sortedPlayers.filter((p) => before.onPitch.includes(p.player_id) || p.player_id === s.player_out_id);
          const inOpts = sortedPlayers.filter((p) => !before.onPitch.includes(p.player_id) || p.player_id === s.player_in_id);
          void shape;
          return (
            <div
              key={`sub-${idx}`}
              className="grid gap-2 rounded-xl border border-zvv-border bg-slate-50/80 p-3 md:grid-cols-2 lg:grid-cols-3"
            >
              <label className="space-y-1 text-xs font-semibold text-zvv-muted">
                Minuut
                <input
                  type="number"
                  min={0}
                  max={130}
                  className="mt-1 min-h-11 w-full rounded-lg border border-zvv-border bg-white px-2 text-sm"
                  value={s.minute}
                  onChange={(e) =>
                    setSubs((prev) =>
                      prev.map((row, i) =>
                        i === idx ? { ...row, minute: Math.max(0, Math.min(130, Number(e.target.value) || 0)) } : row,
                      ),
                    )
                  }
                />
              </label>
              <label className="space-y-1 text-xs font-semibold text-zvv-muted">
                Eruit (op veld)
                <select
                  className="mt-1 min-h-11 w-full rounded-lg border border-zvv-border bg-white px-2 text-sm"
                  value={s.player_out_id}
                  onChange={(e) =>
                    setSubs((prev) => prev.map((row, i) => (i === idx ? { ...row, player_out_id: e.target.value } : row)))
                  }
                >
                  <option value="">—</option>
                  {outOpts.map((p) => (
                    <option key={p.player_id} value={p.player_id}>
                      #{p.shirt_number} {p.name}
                      {p.is_guest ? " (Gast)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs font-semibold text-zvv-muted">
                Erin (bank / eerder eruit)
                <select
                  className="mt-1 min-h-11 w-full rounded-lg border border-zvv-border bg-white px-2 text-sm"
                  value={s.player_in_id}
                  onChange={(e) =>
                    setSubs((prev) => prev.map((row, i) => (i === idx ? { ...row, player_in_id: e.target.value } : row)))
                  }
                >
                  <option value="">—</option>
                  {inOpts.map((p) => (
                    <option key={p.player_id} value={p.player_id}>
                      #{p.shirt_number} {p.name}
                      {before.substitutedOut.includes(p.player_id) ? " · opnieuw" : ""}
                      {p.is_guest ? " (Gast)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs font-semibold text-zvv-muted">
                Slot erin
                <select
                  className="mt-1 min-h-11 w-full rounded-lg border border-zvv-border bg-white px-2 text-sm"
                  value={s.to_slot}
                  onChange={(e) =>
                    setSubs((prev) => prev.map((row, i) => (i === idx ? { ...row, to_slot: e.target.value } : row)))
                  }
                >
                  <option value="">Zelfde als eruit</option>
                  {slotOpts.map((slot) => (
                    <option key={slot.code} value={slot.code}>
                      {slot.code} · {slot.labelNl}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs font-semibold text-zvv-muted">
                Groep
                <input
                  className="mt-1 min-h-11 w-full rounded-lg border border-zvv-border bg-white px-2 text-sm"
                  value={s.change_group_id}
                  onChange={(e) =>
                    setSubs((prev) =>
                      prev.map((row, i) => (i === idx ? { ...row, change_group_id: e.target.value } : row)),
                    )
                  }
                  placeholder="optioneel"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  className="min-h-11 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-800"
                  onClick={() => setSubs((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Verwijder
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3 border-t border-zvv-border pt-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zvv-ink">+ Positiewijziging</h3>
          <button type="button" onClick={addPos} className="club-btn-secondary club-btn-primary-sm">
            + Positiewijziging toevoegen
          </button>
        </div>
        {pos.length === 0 ? <p className="text-sm text-zvv-muted">Nog geen positiewijzigingen.</p> : null}
        {pos.map((c, idx) => (
          <div
            key={`pos-${idx}`}
            className="grid gap-2 rounded-xl border border-zvv-border bg-slate-50/80 p-3 md:grid-cols-2 lg:grid-cols-3"
          >
            <label className="space-y-1 text-xs font-semibold text-zvv-muted">
              Minuut
              <input
                type="number"
                min={0}
                max={130}
                className="mt-1 min-h-11 w-full rounded-lg border border-zvv-border bg-white px-2 text-sm"
                value={c.minute}
                onChange={(e) =>
                  setPos((prev) =>
                    prev.map((row, i) =>
                      i === idx ? { ...row, minute: Math.max(0, Math.min(130, Number(e.target.value) || 0)) } : row,
                    ),
                  )
                }
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-zvv-muted">
              Speelster
              <select
                className="mt-1 min-h-11 w-full rounded-lg border border-zvv-border bg-white px-2 text-sm"
                value={c.player_id}
                onChange={(e) => {
                  const pid = e.target.value;
                  const db = buildLocalDb(matchId, initialSlots, initialBench, subs, pos);
                  const sh = getMatchShapeAtMinute(db, matchId, c.minute);
                  let from: FormationSlotCode | string = c.from_slot;
                  for (const code of FORMATION_SLOT_CODES) {
                    if (sh.slots[code] === pid) {
                      from = code;
                      break;
                    }
                  }
                  setPos((prev) =>
                    prev.map((row, i) => (i === idx ? { ...row, player_id: pid, from_slot: from } : row)),
                  );
                }}
              >
                <option value="">—</option>
                {onPitchOptions.concat(offPitchOptions).map((p) => (
                  <option key={p.player_id} value={p.player_id}>
                    #{p.shirt_number} {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold text-zvv-muted">
              Van
              <select
                className="mt-1 min-h-11 w-full rounded-lg border border-zvv-border bg-white px-2 text-sm"
                value={c.from_slot}
                onChange={(e) =>
                  setPos((prev) => prev.map((row, i) => (i === idx ? { ...row, from_slot: e.target.value } : row)))
                }
              >
                {slotOpts.map((slot) => (
                  <option key={slot.code} value={slot.code}>
                    {slot.code} · {slot.labelNl}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold text-zvv-muted">
              Naar
              <select
                className="mt-1 min-h-11 w-full rounded-lg border border-zvv-border bg-white px-2 text-sm"
                value={c.to_slot}
                onChange={(e) =>
                  setPos((prev) => prev.map((row, i) => (i === idx ? { ...row, to_slot: e.target.value } : row)))
                }
              >
                {slotOpts.map((slot) => (
                  <option key={slot.code} value={slot.code}>
                    {slot.code} · {slot.labelNl}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold text-zvv-muted">
              Groep
              <input
                className="mt-1 min-h-11 w-full rounded-lg border border-zvv-border bg-white px-2 text-sm"
                value={c.change_group_id}
                onChange={(e) =>
                  setPos((prev) =>
                    prev.map((row, i) => (i === idx ? { ...row, change_group_id: e.target.value } : row)),
                  )
                }
              />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                className="min-h-11 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-800"
                onClick={() => setPos((prev) => prev.filter((_, i) => i !== idx))}
              >
                Verwijder
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
