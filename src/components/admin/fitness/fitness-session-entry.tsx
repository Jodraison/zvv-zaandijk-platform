"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
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
  sessionProgress,
  type FitnessResultValues,
} from "@/lib/fitness/completeness";
import {
  formatMetersNl,
  formatPlankDisplay,
  formatSecondsNl,
  parseMetersValue,
  parsePlankToSeconds,
  parseSecondsValue,
  plankSecondsToInput,
} from "@/lib/fitness/parse-values";
import { saveFitnessSessionResultsAction } from "@/actions/fitness-protocol";
import { AdminSaveBar, type AdminSaveStatus } from "@/components/admin/shell/admin-ui";
import { cn } from "@/lib/utils";

export type EntryPlayer = {
  player_id: string;
  name: string;
  shirt_number: number | null;
};

export type EntryRow = FitnessResultValues & {
  player_id: string;
  participation_reason: string | null;
  note: string | null;
};

type Mode = "component" | "player";
type TabId = (typeof FITNESS_COMPONENTS)[number]["tabId"];

function emptyRow(player_id: string): EntryRow {
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

export function FitnessSessionEntry({
  sessionId,
  seasonId,
  testOn,
  status,
  players,
  initialRows,
  readOnly,
}: {
  sessionId: string;
  seasonId: string;
  testOn: string;
  status: "draft" | "published";
  players: EntryPlayer[];
  initialRows: EntryRow[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("component");
  const [tab, setTab] = useState<TabId>("sprint");
  const [playerIndex, setPlayerIndex] = useState(0);
  const [rowsById, setRowsById] = useState<Record<string, EntryRow>>(() => {
    const map: Record<string, EntryRow> = {};
    for (const p of players) {
      const found = initialRows.find((r) => r.player_id === p.player_id);
      map[p.player_id] = found ? { ...found } : emptyRow(p.player_id);
    }
    return map;
  });
  const [draftInputs, setDraftInputs] = useState<Record<string, Record<FitnessComponentKey, string>>>(() => {
    const out: Record<string, Record<FitnessComponentKey, string>> = {};
    for (const p of players) {
      const r = initialRows.find((x) => x.player_id === p.player_id) ?? emptyRow(p.player_id);
      out[p.player_id] = {
        flying_sprint_30m_seconds:
          r.flying_sprint_30m_seconds != null ? String(r.flying_sprint_30m_seconds).replace(".", ",") : "",
        agility_10_20_10_seconds:
          r.agility_10_20_10_seconds != null ? String(r.agility_10_20_10_seconds).replace(".", ",") : "",
        plank_seconds: plankSecondsToInput(r.plank_seconds),
        six_minute_run_meters: r.six_minute_run_meters != null ? String(r.six_minute_run_meters) : "",
      };
    }
    return out;
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<AdminSaveStatus>("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const locked = readOnly || status === "published";

  const rows = useMemo(() => players.map((p) => rowsById[p.player_id]!), [players, rowsById]);
  const progress = sessionProgress(rows, players.length);

  const commitField = useCallback(
    (playerId: string, key: FitnessComponentKey, raw: string) => {
      let parsed;
      if (key === "plank_seconds") parsed = parsePlankToSeconds(raw);
      else if (key === "six_minute_run_meters") parsed = parseMetersValue(raw);
      else parsed = parseSecondsValue(raw);

      const errKey = `${playerId}:${key}`;
      if (!parsed.ok) {
        setFieldErrors((e) => ({ ...e, [errKey]: parsed.error }));
        return false;
      }
      setFieldErrors((e) => {
        const next = { ...e };
        delete next[errKey];
        return next;
      });
      setRowsById((prev) => {
        const cur = prev[playerId] ?? emptyRow(playerId);
        const next = { ...cur, [key]: parsed.value } as EntryRow;
        next.participation_status =
          next.participation_status &&
          ["absent", "injured", "not_tested", "stopped", "other"].includes(next.participation_status)
            ? next.participation_status
            : undefined;
        return { ...prev, [playerId]: next };
      });
      setSaveStatus("dirty");
      return true;
    },
    [],
  );

  const setExcuse = (playerId: string, status: FitnessParticipationStatus | "pending") => {
    setRowsById((prev) => {
      const cur = prev[playerId] ?? emptyRow(playerId);
      if (status === "pending") {
        return {
          ...prev,
          [playerId]: { ...cur, participation_status: "pending", participation_reason: null },
        };
      }
      return {
        ...prev,
        [playerId]: {
          ...cur,
          participation_status: status,
          participation_reason: PARTICIPATION_REASON_OPTIONS.find((o) => o.value === status)?.label ?? status,
        },
      };
    });
    setSaveStatus("dirty");
  };

  const save = () => {
    // flush all draft inputs
    for (const p of players) {
      const drafts = draftInputs[p.player_id];
      if (!drafts) continue;
      for (const c of FITNESS_COMPONENTS) {
        commitField(p.player_id, c.key, drafts[c.key] ?? "");
      }
    }
    startTransition(async () => {
      setSaveStatus("saving");
      const payload = players.map((p) => {
        const r = rowsById[p.player_id] ?? emptyRow(p.player_id);
        return {
          player_id: p.player_id,
          flying_sprint_30m_seconds: r.flying_sprint_30m_seconds,
          agility_10_20_10_seconds: r.agility_10_20_10_seconds,
          plank_seconds: r.plank_seconds,
          six_minute_run_meters: r.six_minute_run_meters,
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
      setSaveStatus("saved");
      setSaveMessage(`Opgeslagen om ${new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}`);
      router.refresh();
    });
  };

  const activeComponent = FITNESS_COMPONENTS.find((c) => c.tabId === tab)!;
  const currentPlayer = players[playerIndex] ?? players[0];

  const inputFor = (playerId: string, key: FitnessComponentKey, inputMode: "decimal" | "numeric") => {
    const errKey = `${playerId}:${key}`;
    const err = fieldErrors[errKey];
    const suffix = key === "six_minute_run_meters" ? "m" : key === "plank_seconds" ? "min:sec" : "s";
    return (
      <label className="block min-w-0">
        <span className="sr-only">{key}</span>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode={inputMode}
            disabled={locked || pending}
            value={draftInputs[playerId]?.[key] ?? ""}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const v = e.target.value;
              setDraftInputs((d) => ({
                ...d,
                [playerId]: { ...(d[playerId] ?? draftInputs[playerId]!), [key]: v },
              }));
              setSaveStatus("dirty");
            }}
            onBlur={(e) => commitField(playerId, key, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitField(playerId, key, (e.target as HTMLInputElement).value);
                const form = (e.target as HTMLElement).closest("[data-entry-root]");
                const inputs = form?.querySelectorAll<HTMLInputElement>("input[data-entry-field]:not([disabled])");
                if (!inputs?.length) return;
                const list = [...inputs];
                const idx = list.indexOf(e.target as HTMLInputElement);
                const next = list[idx + 1];
                next?.focus();
              }
            }}
            data-entry-field
            aria-invalid={!!err}
            aria-describedby={err ? `${errKey}-err` : undefined}
            className={cn(
              "min-h-11 w-full min-w-0 rounded-xl border bg-white px-3 py-2 text-base text-zvv-ink outline-none focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/20",
              err ? "border-red-300" : "border-zvv-border",
            )}
            placeholder={key === "plank_seconds" ? "1:45" : key === "six_minute_run_meters" ? "1345" : "4,82"}
          />
          <span className="shrink-0 text-sm text-zvv-muted">{suffix}</span>
        </div>
        {err ? (
          <span id={`${errKey}-err`} className="mt-1 block text-sm text-red-700" role="alert">
            {err}
          </span>
        ) : null}
      </label>
    );
  };

  return (
    <div className="space-y-5" data-entry-root>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zvv-primary">Testmoment · {testOn}</p>
          <p className="mt-1 text-base text-zvv-muted">
            {progress.complete} van {progress.expectedPlayers} speelsters volledig
            {status === "published" ? " · Definitief" : " · Concept"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/beheer/fitheid/${sessionId}/controle?season=${encodeURIComponent(seasonId)}`}
            className="club-btn-secondary club-btn-primary-sm"
          >
            Controleren
          </Link>
          <Link
            href={`/beheer/fitheid?season=${encodeURIComponent(seasonId)}`}
            className="club-btn-secondary club-btn-primary-sm"
          >
            Overzicht
          </Link>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {FITNESS_COMPONENTS.map((c) => (
          <div key={c.key} className="rounded-xl border border-zvv-border bg-white px-3 py-2">
            <p className="text-sm text-zvv-muted">{c.shortLabel}</p>
            <p className="font-[family-name:var(--font-display)] text-xl text-zvv-ink">
              {progress.byComponent[c.key]}/{progress.expectedPlayers}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Invoermodus">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "component"}
          className={cn(
            "min-h-11 rounded-xl border px-4 text-sm font-semibold",
            mode === "component"
              ? "border-zvv-primary bg-zvv-primary-muted text-zvv-primary"
              : "border-zvv-border bg-white text-zvv-muted",
          )}
          onClick={() => setMode("component")}
        >
          Per onderdeel
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "player"}
          className={cn(
            "min-h-11 rounded-xl border px-4 text-sm font-semibold",
            mode === "player"
              ? "border-zvv-primary bg-zvv-primary-muted text-zvv-primary"
              : "border-zvv-border bg-white text-zvv-muted",
          )}
          onClick={() => setMode("player")}
        >
          Per speelster
        </button>
      </div>

      {mode === "component" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Onderdeel">
            {FITNESS_COMPONENTS.map((c) => (
              <button
                key={c.tabId}
                type="button"
                role="tab"
                aria-selected={tab === c.tabId}
                onClick={() => setTab(c.tabId)}
                className={cn(
                  "min-h-10 rounded-lg border px-3 text-sm font-medium",
                  tab === c.tabId
                    ? "border-zvv-primary bg-zvv-primary text-white"
                    : "border-zvv-border bg-white text-zvv-muted",
                )}
              >
                {c.shortLabel}
              </button>
            ))}
          </div>
          <p className="text-sm text-zvv-muted">{activeComponent.label} — leeg = niet afgenomen (geen 0).</p>
          <ul className="divide-y divide-zvv-border overflow-hidden rounded-2xl border border-zvv-border bg-white">
            {players.map((p) => {
              const row = rowsById[p.player_id]!;
              const completeness = derivePlayerCompleteness(row);
              return (
                <li key={p.player_id} className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,12rem)_9rem] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zvv-ink">
                      {p.shirt_number != null ? `#${p.shirt_number} ` : ""}
                      {p.name}
                    </p>
                    <p className="text-sm text-zvv-muted">{COMPLETENESS_LABEL[completeness]}</p>
                  </div>
                  {inputFor(
                    p.player_id,
                    activeComponent.key,
                    activeComponent.key === "six_minute_run_meters" ? "numeric" : "decimal",
                  )}
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
                    <option value="pending">Gereed / meten</option>
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
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-zvv-border bg-white p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              className="club-btn-secondary club-btn-primary-sm"
              disabled={playerIndex <= 0}
              onClick={() => setPlayerIndex((i) => Math.max(0, i - 1))}
            >
              Vorige
            </button>
            <p className="font-[family-name:var(--font-display)] text-xl text-zvv-ink">
              {currentPlayer
                ? `${currentPlayer.shirt_number != null ? `#${currentPlayer.shirt_number} ` : ""}${currentPlayer.name}`
                : "—"}
            </p>
            <button
              type="button"
              className="club-btn-secondary club-btn-primary-sm"
              disabled={playerIndex >= players.length - 1}
              onClick={() => setPlayerIndex((i) => Math.min(players.length - 1, i + 1))}
            >
              Volgende
            </button>
          </div>
          {currentPlayer ? (
            <div className="grid gap-4 md:grid-cols-2">
              {FITNESS_COMPONENTS.map((c) => (
                <div key={c.key}>
                  <p className="mb-1 text-sm font-medium text-zvv-muted">{c.label}</p>
                  {inputFor(
                    currentPlayer.player_id,
                    c.key,
                    c.key === "six_minute_run_meters" ? "numeric" : "decimal",
                  )}
                </div>
              ))}
            </div>
          ) : null}
          <p className="text-sm text-zvv-muted">
            Speelster {playerIndex + 1} van {players.length}
            {currentPlayer
              ? ` · ${COMPLETENESS_LABEL[derivePlayerCompleteness(rowsById[currentPlayer.player_id]!)]}`
              : ""}
          </p>
        </div>
      )}

      {!locked ? (
        <AdminSaveBar
          status={pending ? "saving" : saveStatus}
          primaryLabel="Concept opslaan"
          onPrimary={save}
          primaryDisabled={pending}
          summary={saveMessage || `${progress.complete}/${progress.expectedPlayers} volledig`}
          secondary={
            <Link
              href={`/beheer/fitheid/${sessionId}/controle?season=${encodeURIComponent(seasonId)}`}
              className="club-btn-secondary club-btn-primary-sm"
            >
              Naar controle
            </Link>
          }
        />
      ) : (
        <p className="rounded-xl border border-zvv-border bg-zvv-card-mid px-4 py-3 text-sm text-zvv-muted">
          Definitief — alleen lezen. Gebruik Correctie openen om te wijzigen.
        </p>
      )}

      <details className="rounded-xl border border-zvv-border bg-zvv-card-mid/50 p-3 text-sm text-zvv-muted">
        <summary className="cursor-pointer font-medium text-zvv-ink">Weergavevoorbeelden</summary>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Sprint: {formatSecondsNl(4.82)}</li>
          <li>Agility: {formatSecondsNl(17.42)}</li>
          <li>Plank: {formatPlankDisplay(105)}</li>
          <li>6 min: {formatMetersNl(1345)}</li>
        </ul>
      </details>
    </div>
  );
}
