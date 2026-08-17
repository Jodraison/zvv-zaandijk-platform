"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FITNESS_COMPONENTS,
  PARTICIPATION_REASON_OPTIONS,
  type FitnessComponentKey,
  type FitnessParticipationStatus,
} from "@/lib/fitness/protocol";
import {
  COMPLETENESS_LABEL,
  derivePlayerCompleteness,
  type FitnessResultValues,
} from "@/lib/fitness/completeness";
import {
  parseMetersValue,
  parsePlankToSeconds,
  parseSecondsValue,
  plankSecondsToInput,
} from "@/lib/fitness/parse-values";
import { saveFitnessSessionResultsAction } from "@/actions/fitness-protocol";
import { AdminSaveBar, type AdminSaveStatus } from "@/components/admin/shell/admin-ui";
import { cn } from "@/lib/utils";

type StationTab = (typeof FITNESS_COMPONENTS)[number]["tabId"];

export type StationPlayer = {
  player_id: string;
  name: string;
  shirt_number: number | null;
  position_label?: string | null;
};

const STATION_ORDER: StationTab[] = ["sprint", "agility", "plank", "run"];
const STATION_NAV_LABEL: Record<StationTab, string> = {
  sprint: "Sprint",
  agility: "Agility",
  plank: "Plank",
  run: "6 minuten",
};

export type StationRow = FitnessResultValues & {
  player_id: string;
  participation_reason: string | null;
  note: string | null;
};

function emptyRow(player_id: string): StationRow {
  return {
    player_id,
    flying_sprint_30m_seconds: null,
    agility_10_20_10_seconds: null,
    plank_seconds: null,
    six_minute_run_meters: null,
    participation_status: "pending",
    participation_reason: null,
    note: null,
  };
}

function parseForKey(key: FitnessComponentKey, raw: string) {
  if (key === "plank_seconds") return parsePlankToSeconds(raw);
  if (key === "six_minute_run_meters") return parseMetersValue(raw);
  return parseSecondsValue(raw);
}

export function FitnessStationEntry({
  sessionId,
  seasonId,
  testOn,
  status,
  stationTab,
  players,
  initialRows,
  readOnly,
}: {
  sessionId: string;
  seasonId: string;
  testOn: string;
  status: "draft" | "published";
  stationTab: StationTab;
  players: StationPlayer[];
  initialRows: StationRow[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const component = FITNESS_COMPONENTS.find((c) => c.tabId === stationTab)!;
  const key = component.key;
  const locked = readOnly || status === "published";
  const [mobileIndex, setMobileIndex] = useState(0);
  const [listMode, setListMode] = useState(true);
  const [rowsById, setRowsById] = useState<Record<string, StationRow>>(() => {
    const map: Record<string, StationRow> = {};
    for (const p of players) {
      const found = initialRows.find((r) => r.player_id === p.player_id);
      map[p.player_id] = found ? { ...found } : emptyRow(p.player_id);
    }
    return map;
  });
  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const p of players) {
      const r = initialRows.find((x) => x.player_id === p.player_id) ?? emptyRow(p.player_id);
      if (key === "plank_seconds") out[p.player_id] = plankSecondsToInput(r.plank_seconds);
      else if (key === "six_minute_run_meters")
        out[p.player_id] = r.six_minute_run_meters != null ? String(r.six_minute_run_meters) : "";
      else {
        const v = r[key];
        out[p.player_id] = v != null ? String(v).replace(".", ",") : "";
      }
    }
    return out;
  });
  const [plankMin, setPlankMin] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const p of players) {
      const r = initialRows.find((x) => x.player_id === p.player_id) ?? emptyRow(p.player_id);
      out[p.player_id] = r.plank_seconds != null ? String(Math.floor(r.plank_seconds / 60)) : "";
    }
    return out;
  });
  const [plankSec, setPlankSec] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const p of players) {
      const r = initialRows.find((x) => x.player_id === p.player_id) ?? emptyRow(p.player_id);
      out[p.player_id] = r.plank_seconds != null ? String(r.plank_seconds % 60) : "";
    }
    return out;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<AdminSaveStatus>("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const dirtyRef = useRef(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const q = `?season=${encodeURIComponent(seasonId)}`;

  const filled = useMemo(
    () => players.filter((p) => rowsById[p.player_id]?.[key] != null).length,
    [players, rowsById, key],
  );

  const commit = useCallback(
    (playerId: string, raw: string) => {
      if (!raw.trim()) {
        // Lege invoer wist bestaande waarde niet
        setErrors((e) => {
          const next = { ...e };
          delete next[playerId];
          return next;
        });
        return true;
      }
      const parsed = parseForKey(key, raw);
      if (!parsed.ok) {
        setErrors((e) => ({ ...e, [playerId]: parsed.error }));
        return false;
      }
      setErrors((e) => {
        const next = { ...e };
        delete next[playerId];
        return next;
      });
      setRowsById((prev) => {
        const cur = prev[playerId] ?? emptyRow(playerId);
        return { ...prev, [playerId]: { ...cur, [key]: parsed.value } as StationRow };
      });
      setSaveStatus("dirty");
      dirtyRef.current = true;
      return true;
    },
    [key],
  );

  const commitPlank = useCallback((playerId: string, mmRaw: string, ssRaw: string) => {
    if (!mmRaw.trim() && !ssRaw.trim()) {
      setErrors((e) => {
        const next = { ...e };
        delete next[playerId];
        return next;
      });
      return true;
    }
    const parsed = parsePlankToSeconds(`${mmRaw.trim() || "0"}:${ssRaw.trim() || "0"}`);
    if (!parsed.ok) {
      setErrors((e) => ({ ...e, [playerId]: parsed.error }));
      return false;
    }
    setErrors((e) => {
      const next = { ...e };
      delete next[playerId];
      return next;
    });
    setRowsById((prev) => {
      const cur = prev[playerId] ?? emptyRow(playerId);
      return { ...prev, [playerId]: { ...cur, plank_seconds: parsed.value } };
    });
    setSaveStatus("dirty");
    dirtyRef.current = true;
    return true;
  }, []);

  const setExcuse = (playerId: string, st: FitnessParticipationStatus | "pending") => {
    setRowsById((prev) => {
      const cur = prev[playerId] ?? emptyRow(playerId);
      if (st === "pending") {
        return { ...prev, [playerId]: { ...cur, participation_status: "pending", participation_reason: null } };
      }
      return {
        ...prev,
        [playerId]: {
          ...cur,
          participation_status: st,
          participation_reason: PARTICIPATION_REASON_OPTIONS.find((o) => o.value === st)?.label ?? st,
        },
      };
    });
    setSaveStatus("dirty");
    dirtyRef.current = true;
  };

  const resolveStationValue = useCallback(
    (playerId: string, existing: number | null): number | null => {
      if (key === "plank_seconds") {
        const mm = (plankMin[playerId] ?? "").trim();
        const ss = (plankSec[playerId] ?? "").trim();
        if (!mm && !ss) return existing; // lege invoer wist niet
        const raw = `${mm || "0"}:${ss || "0"}`;
        const parsed = parsePlankToSeconds(raw);
        return parsed.ok ? parsed.value : existing;
      }
      const draft = (drafts[playerId] ?? "").trim();
      if (!draft) return existing; // lege invoer wist bestaande waarde niet
      const parsed = parseForKey(key, draft);
      return parsed.ok ? parsed.value : existing;
    },
    [key, drafts, plankMin, plankSec],
  );

  const save = useCallback(
    (opts?: { goNext?: boolean }) => {
      startTransition(async () => {
        setSaveStatus("saving");
        const payload = players.map((p) => {
          const r = rowsById[p.player_id] ?? emptyRow(p.player_id);
          const value = resolveStationValue(p.player_id, r[key] as number | null);
          if (value !== r[key]) {
            setRowsById((prev) => ({
              ...prev,
              [p.player_id]: { ...(prev[p.player_id] ?? emptyRow(p.player_id)), [key]: value } as StationRow,
            }));
          }
          return {
            player_id: p.player_id,
            flying_sprint_30m_seconds:
              key === "flying_sprint_30m_seconds" ? value : r.flying_sprint_30m_seconds,
            agility_10_20_10_seconds:
              key === "agility_10_20_10_seconds" ? value : r.agility_10_20_10_seconds,
            plank_seconds: key === "plank_seconds" ? value : r.plank_seconds,
            six_minute_run_meters: key === "six_minute_run_meters" ? value : r.six_minute_run_meters,
            participation_status: r.participation_status,
            participation_reason: r.participation_reason,
            note: r.note,
          };
        });
        const res = await saveFitnessSessionResultsAction({ session_id: sessionId, rows: payload });
        if (!res.ok) {
          setSaveStatus("error");
          setSaveMessage(res.error);
          return;
        }
        dirtyRef.current = false;
        setSaveStatus("saved");
        setSaveMessage(`Opgeslagen om ${new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}`);
        router.refresh();
        if (opts?.goNext) {
          const idx = STATION_ORDER.indexOf(stationTab);
          const next = STATION_ORDER[idx + 1];
          if (next) router.push(`/beheer/fitheid/${sessionId}/station/${next}${q}`);
          else router.push(`/beheer/fitheid/${sessionId}/controle${q}`);
        }
      });
    },
    [players, rowsById, key, sessionId, router, resolveStationValue, stationTab, q],
  );

  // Periodieke conceptsave wanneer dirty
  useEffect(() => {
    if (locked) return;
    const id = window.setInterval(() => {
      if (dirtyRef.current && !pending) save();
    }, 45_000);
    return () => window.clearInterval(id);
  }, [locked, pending, save]);

  const focusNext = (playerId: string) => {
    const idx = players.findIndex((p) => p.player_id === playerId);
    const next = players[idx + 1];
    if (next) {
      inputRefs.current[next.player_id]?.focus();
      inputRefs.current[next.player_id]?.select();
      setMobileIndex(idx + 1);
    }
  };

  const onPasteColumn = (startPlayerId: string, text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) return false;
    const start = players.findIndex((p) => p.player_id === startPlayerId);
    if (start < 0) return false;
    const nextDrafts = { ...drafts };
    for (let i = 0; i < lines.length; i++) {
      const p = players[start + i];
      if (!p) break;
      nextDrafts[p.player_id] = lines[i]!;
      commit(p.player_id, lines[i]!);
    }
    setDrafts(nextDrafts);
    return true;
  };

  const unitHint =
    key === "plank_seconds"
      ? "Minuten + seconden (1 min 30 sec → 90)"
      : key === "six_minute_run_meters"
        ? "Voorbeeld: 1345"
        : "Voorbeeld: 4,82";
  const direction = component.direction === "lower_better" ? "Lager is beter" : "Hoger is beter";
  const inputMode = key === "six_minute_run_meters" ? "numeric" : "decimal";
  const current = players[mobileIndex] ?? players[0];
  const nextStation = STATION_ORDER[STATION_ORDER.indexOf(stationTab) + 1];

  const renderInput = (playerId: string, large?: boolean) => {
    const err = errors[playerId];
    if (key === "plank_seconds") {
      return (
        <div className="min-w-0 space-y-1">
          <span className="mb-1 block text-sm font-medium text-zvv-muted">Plank</span>
          <div className="flex items-center gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Minuten</span>
              <input
                ref={(el) => {
                  inputRefs.current[playerId] = el;
                }}
                type="text"
                inputMode="numeric"
                disabled={locked || pending}
                value={plankMin[playerId] ?? ""}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  setPlankMin((d) => ({ ...d, [playerId]: e.target.value }));
                  setSaveStatus("dirty");
                  dirtyRef.current = true;
                }}
                onBlur={() => commitPlank(playerId, plankMin[playerId] ?? "", plankSec[playerId] ?? "")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitPlank(playerId, plankMin[playerId] ?? "", plankSec[playerId] ?? "");
                    focusNext(playerId);
                  }
                }}
                aria-invalid={!!err}
                className={cn(
                  "w-full rounded-xl border bg-white px-3 py-2 text-zvv-ink outline-none focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/20",
                  large ? "min-h-14 text-2xl" : "min-h-11 text-base",
                  err ? "border-red-300" : "border-zvv-border",
                )}
                placeholder="min"
              />
            </label>
            <span className="text-sm text-zvv-muted">min</span>
            <label className="min-w-0 flex-1">
              <span className="sr-only">Seconden</span>
              <input
                type="text"
                inputMode="numeric"
                disabled={locked || pending}
                value={plankSec[playerId] ?? ""}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  setPlankSec((d) => ({ ...d, [playerId]: e.target.value }));
                  setSaveStatus("dirty");
                  dirtyRef.current = true;
                }}
                onBlur={() => commitPlank(playerId, plankMin[playerId] ?? "", plankSec[playerId] ?? "")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitPlank(playerId, plankMin[playerId] ?? "", plankSec[playerId] ?? "");
                    focusNext(playerId);
                  }
                }}
                aria-invalid={!!err}
                className={cn(
                  "w-full rounded-xl border bg-white px-3 py-2 text-zvv-ink outline-none focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/20",
                  large ? "min-h-14 text-2xl" : "min-h-11 text-base",
                  err ? "border-red-300" : "border-zvv-border",
                )}
                placeholder="sec"
              />
            </label>
            <span className="text-sm text-zvv-muted">sec</span>
          </div>
          {err ? (
            <span className="mt-1 block text-sm text-red-700" role="alert">
              {err}
            </span>
          ) : null}
        </div>
      );
    }
    return (
      <label className="block min-w-0">
        <span className="mb-1 block text-sm font-medium text-zvv-muted">
          {component.shortLabel}
          {key === "six_minute_run_meters" ? " (meters)" : " (seconden)"}
        </span>
        <input
          ref={(el) => {
            inputRefs.current[playerId] = el;
          }}
          type="text"
          inputMode={inputMode}
          disabled={locked || pending}
          value={drafts[playerId] ?? ""}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            setDrafts((d) => ({ ...d, [playerId]: e.target.value }));
            setSaveStatus("dirty");
            dirtyRef.current = true;
          }}
          onBlur={(e) => commit(playerId, e.target.value)}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (text.includes("\n")) {
              e.preventDefault();
              onPasteColumn(playerId, text);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(playerId, (e.target as HTMLInputElement).value);
              focusNext(playerId);
            }
          }}
          aria-invalid={!!err}
          className={cn(
            "w-full rounded-xl border bg-white px-3 py-2 text-zvv-ink outline-none focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/20",
            large ? "min-h-14 text-2xl" : "min-h-11 text-base",
            err ? "border-red-300" : "border-zvv-border",
          )}
          placeholder={key === "six_minute_run_meters" ? "1345" : "4,82"}
        />
        {err ? (
          <span className="mt-1 block text-sm text-red-700" role="alert">
            {err}
          </span>
        ) : null}
      </label>
    );
  };

  return (
    <div className="space-y-5" data-station-root>
      {/* Niet-sticky: sticky station-header overlapte de eerste speelsterrij (Jelisa) bij scroll. */}
      <header
        data-fitness-station-header
        className="relative z-10 -mx-1 space-y-3 rounded-2xl border border-zvv-border bg-white px-4 py-3 shadow-sm md:px-5"
      >
        <nav aria-label="Fitheidsstations" className="flex flex-wrap gap-1">
          {STATION_ORDER.map((tab) => (
            <Link
              key={tab}
              href={`/beheer/fitheid/${sessionId}/station/${tab}${q}`}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-semibold",
                tab === stationTab ? "bg-zvv-primary text-white" : "bg-zvv-card-mid text-zvv-ink hover:bg-zvv-primary-muted",
              )}
            >
              {STATION_NAV_LABEL[tab]}
            </Link>
          ))}
          <Link
            href={`/beheer/fitheid/${sessionId}/controle${q}`}
            className="rounded-lg bg-zvv-card-mid px-3 py-1.5 text-sm font-semibold text-zvv-ink hover:bg-zvv-primary-muted"
          >
            Controle
          </Link>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zvv-primary">Station · {component.shortLabel}</p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">{component.label}</h2>
            <p className="mt-1 text-sm text-zvv-muted">
              {filled} van {players.length} ingevuld · {direction} · {unitHint}
            </p>
          </div>
          <p className="text-sm text-zvv-muted">Testmoment {testOn}</p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 md:hidden">
        <button
          type="button"
          className={cn(
            "min-h-10 rounded-lg border px-3 text-sm font-medium",
            !listMode ? "border-zvv-primary bg-zvv-primary text-white" : "border-zvv-border bg-white",
          )}
          onClick={() => setListMode(false)}
        >
          Eén speelster
        </button>
        <button
          type="button"
          className={cn(
            "min-h-10 rounded-lg border px-3 text-sm font-medium",
            listMode ? "border-zvv-primary bg-zvv-primary text-white" : "border-zvv-border bg-white",
          )}
          onClick={() => setListMode(true)}
        >
          Lijst
        </button>
      </div>

      {/* Mobile one-player */}
      <div className={cn("space-y-4 rounded-2xl border border-zvv-border bg-white p-4", listMode ? "hidden md:hidden" : "md:hidden")}>
        {current ? (
          <>
            <p className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">
              {current.shirt_number != null ? `#${current.shirt_number} ` : ""}
              {current.name}
            </p>
            {renderInput(current.player_id, true)}
            <button
              type="button"
              className="club-btn-primary w-full"
              onClick={() => {
                commit(current.player_id, drafts[current.player_id] ?? "");
                if (mobileIndex < players.length - 1) setMobileIndex((i) => i + 1);
              }}
            >
              Volgende speelster
            </button>
            <p className="text-sm text-zvv-muted">
              {mobileIndex + 1} van {players.length}
            </p>
          </>
        ) : null}
      </div>

      {/* Desktop / list */}
      <ul className={cn("divide-y divide-zvv-border overflow-hidden rounded-2xl border border-zvv-border bg-white", !listMode && "hidden md:block")}>
        <li
          data-fitness-column-header
          className="relative z-0 hidden grid-cols-[3rem_minmax(0,1fr)_minmax(9rem,12rem)_9rem_7rem] gap-3 border-b border-zvv-border bg-zvv-card-mid px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zvv-muted md:grid"
        >
          <span>#</span>
          <span>Speelster</span>
          <span>Resultaat</span>
          <span>Status</span>
          <span>Reden</span>
        </li>
        {players.map((p) => {
          const row = rowsById[p.player_id]!;
          const completeness = derivePlayerCompleteness(row);
          const done = row[key] != null;
          return (
            <li
              key={p.player_id}
              data-fitness-player-row={p.player_id}
              className={cn(
                "relative z-0 grid gap-3 p-3 md:grid-cols-[3rem_minmax(0,1fr)_minmax(9rem,12rem)_9rem_7rem] md:items-center",
                done && "bg-emerald-50/40",
              )}
            >
              <span className="font-semibold text-zvv-muted">{p.shirt_number ?? "—"}</span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-zvv-ink">{p.name}</p>
                <p className="text-sm text-zvv-muted">
                  {p.position_label ? `${p.position_label} · ` : ""}
                  <span className="md:hidden">{COMPLETENESS_LABEL[completeness]}</span>
                </p>
              </div>
              {renderInput(p.player_id)}
              <p className="text-sm font-medium text-zvv-ink">{done ? "Ingevuld" : COMPLETENESS_LABEL[completeness]}</p>
              <select
                className="min-h-11 rounded-xl border border-zvv-border bg-white px-2 text-sm"
                disabled={locked}
                value={
                  ["absent", "injured", "not_tested", "stopped", "other"].includes(row.participation_status ?? "")
                    ? row.participation_status
                    : "pending"
                }
                onChange={(e) => setExcuse(p.player_id, e.target.value as FitnessParticipationStatus | "pending")}
              >
                <option value="pending">Meten</option>
                {PARTICIPATION_REASON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>

      {!locked ? (
        <AdminSaveBar
          status={pending ? "saving" : saveStatus}
          primaryLabel={nextStation ? "Opslaan en naar volgend station" : "Opslaan en naar controle"}
          onPrimary={() => save({ goNext: true })}
          primaryDisabled={pending}
          summary={saveMessage || `${filled} van ${players.length} ingevuld`}
          secondary={
            <button
              type="button"
              className="club-btn-secondary club-btn-primary-sm"
              disabled={pending}
              onClick={() => save()}
            >
              Alleen opslaan
            </button>
          }
        />
      ) : (
        <p className="rounded-xl border border-zvv-border bg-zvv-card-mid px-4 py-3 text-sm text-zvv-muted">
          Definitief — alleen lezen.
        </p>
      )}
    </div>
  );
}
