"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { saveTrainingControlCenterAction } from "@/actions/training";
import type { TrainingVerificationPayload } from "@/lib/admin/verification-types";
import { cn } from "@/lib/utils";
import { formatDateNL, formatDateTimeNL } from "@/lib/utils/format-date";

type PlayerRow = {
  player_id: string;
  name: string;
  shirt_number: number | null;
  position: string | null;
  is_guest?: boolean;
};

type SessionRow = {
  id: string;
  session_at: string;
  title: string | null;
  status: "completed" | "cancelled";
};

type AttendanceRow = {
  session_id: string;
  player_id: string;
  present: boolean;
};

type DayChip = {
  key: string; // YYYY-MM-DD (same as session.session_at.slice(0, 10))
  label: string;
};

type SessionDraft = {
  presence: Map<string, boolean>;
  baseline: Map<string, boolean>;
  status: "completed" | "cancelled";
  lastVerified: TrainingVerificationPayload | null;
  lastError: string | null;
};

function mapEq(a: Map<string, boolean>, b: Map<string, boolean>) {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) {
    if (b.get(k) !== v) return false;
  }
  return true;
}

function generateTrainingDates(start: string, end: string): string[] {
  const result: string[] = [];
  const current = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);

  while (current <= endDate) {
    const day = current.getDay(); // 0=Sun, 1=Mon, 3=Wed
    if (day === 1 || day === 3) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      const date = String(current.getDate()).padStart(2, "0");
      result.push(`${year}-${month}-${date}`);
    }
    current.setDate(current.getDate() + 1);
  }
  return result;
}

function isMonOrWed(dateKey: string): boolean {
  const d = new Date(`${dateKey}T12:00:00`);
  const day = d.getDay();
  return day === 1 || day === 3;
}

export function TrainingAttendanceDashboard({
  seasonId,
  players,
  sessions,
  attendance,
}: {
  seasonId: string;
  players: PlayerRow[];
  sessions: SessionRow[];
  attendance: AttendanceRow[];
}) {
  const searchParams = useSearchParams();
  const [saving, startTransition] = useTransition();
  const [selectedSessionKey, setSelectedSessionKey] = useState("");
  const [selectionInitialized, setSelectionInitialized] = useState(false);
  const [draftsBySessionKey, setDraftsBySessionKey] = useState<Record<string, SessionDraft>>({});

  const sortedPlayers = useMemo(
    () =>
      [...players]
        .filter((p) => !p.is_guest)
        .sort((a, b) => {
        const sa = a.shirt_number ?? 999;
        const sb = b.shirt_number ?? 999;
        if (sa !== sb) return sa - sb;
        return a.name.localeCompare(b.name, "nl");
      }),
    [players],
  );

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, SessionRow>();
    for (const s of sessions) map.set(s.session_at.slice(0, 10), s);
    return map;
  }, [sessions]);

  const sessionKeysFromDB = useMemo(
    () => sessions.slice().sort((a, b) => a.session_at.localeCompare(b.session_at)).map((s) => s.session_at.slice(0, 10)),
    [sessions],
  );
  const fallbackDates = useMemo(() => generateTrainingDates("2026-01-19", "2026-06-30"), []);
  const allSessionKeys = useMemo(
    () => Array.from(new Set([...sessionKeysFromDB, ...fallbackDates])).filter(isMonOrWed).sort(),
    [sessionKeysFromDB, fallbackDates],
  );

  const attendanceMap = useMemo(() => {
    const map = new Map<string, Map<string, boolean>>();
    for (const a of attendance) {
      let m = map.get(a.session_id);
      if (!m) {
        m = new Map();
        map.set(a.session_id, m);
      }
      m.set(a.player_id, a.present);
    }
    return map;
  }, [attendance]);

  const chips = useMemo<DayChip[]>(() => {
    return allSessionKeys.map((k) => ({ key: k, label: formatDateNL(k) }));
  }, [allSessionKeys]);

  const createDraftFromPersisted = (key: string): SessionDraft => {
    const map = new Map<string, boolean>();
    for (const p of sortedPlayers) map.set(p.player_id, true);
    const sess = sessionsByDate.get(key) ?? null;
    const status: "completed" | "cancelled" = sess?.status === "cancelled" ? "cancelled" : "completed";
    if (sess) {
      const rows = attendanceMap.get(sess.id);
      if (rows) {
        for (const p of sortedPlayers) {
          if (rows.has(p.player_id)) map.set(p.player_id, !!rows.get(p.player_id));
        }
      }
    }
    return { presence: new Map(map), baseline: new Map(map), status, lastVerified: null, lastError: null };
  };

  useEffect(() => {
    if (selectionInitialized) return;
    const qp = (searchParams.get("session") ?? "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(qp)) {
      // Selection happens only through setSelectedSessionKey().
      setSelectedSessionKey(allSessionKeys.includes(qp) ? qp : (allSessionKeys[0] ?? ""));
    } else {
      setSelectedSessionKey(allSessionKeys[0] ?? "");
    }
    setSelectionInitialized(true);
  }, [searchParams, selectionInitialized, allSessionKeys]);

  const selectSessionKey = (key: string) => {
    // STEP 6: selectedSessionKey changes only via click handlers that call this.
    setSelectedSessionKey(key);
    // STEP 3: keep editor interactive by ensuring draft exists for this key.
    setDraftsBySessionKey({ [key]: createDraftFromPersisted(key) });
    const url = new URL(window.location.href);
    url.searchParams.set("session", key);
    window.history.replaceState({}, "", url.toString());
  };

  useEffect(() => {
    if (!selectedSessionKey) return;
    // STEP 4: always rebuild the active draft for the selected key.
    setDraftsBySessionKey({ [selectedSessionKey]: createDraftFromPersisted(selectedSessionKey) });
  }, [selectedSessionKey, attendanceMap, sessionsByDate, sortedPlayers]);

  const activeChip = chips.find((c) => c.key === selectedSessionKey) ?? null;
  const activeSession = sessionsByDate.get(selectedSessionKey) ?? null;
  // STEP 3: activeDraft must never be null for the selectedSessionKey.
  const activeDraft = selectedSessionKey
    ? (draftsBySessionKey[selectedSessionKey] ?? createDraftFromPersisted(selectedSessionKey))
    : null;
  const activeStatus: "completed" | "cancelled" =
    activeDraft?.status ?? (activeSession?.status === "cancelled" ? "cancelled" : "completed");
  const isCancelled = activeStatus === "cancelled";
  // With a single key format everywhere, this should not be possible.
  // Keep no UI branch depending on it (deterministic editor).

  const presentCount = [...(activeDraft?.presence ?? new Map<string, boolean>()).values()].filter(Boolean).length;
  const savedPresentCount = [...(activeDraft?.baseline ?? new Map<string, boolean>()).values()].filter(Boolean).length;
  const totalCount = sortedPlayers.length;
  const progress = totalCount ? Math.round((presentCount / totalCount) * 100) : 0;
  const dirty = !!activeDraft && !mapEq(activeDraft.presence, activeDraft.baseline);
  const dirtySinceVerified = dirty && !!activeDraft?.lastVerified;

  // STEP 1: navigation uses ONLY sessionKeys index lookup (no prevChip/nextChip).
  const currentIndex = selectedSessionKey ? allSessionKeys.indexOf(selectedSessionKey) : -1;
  const prevKey = currentIndex > 0 ? allSessionKeys[currentIndex - 1] : null;
  const nextKey = currentIndex >= 0 && currentIndex < allSessionKeys.length - 1 ? allSessionKeys[currentIndex + 1] : null;
  const nextIncomplete = allSessionKeys.find((k) => {
    if (!selectedSessionKey || k <= selectedSessionKey) return false;
    const sess = sessionsByDate.get(k);
    if (!sess || sess.status !== "completed") return false;
    const rows = attendanceMap.get(sess.id);
    return !(rows && sortedPlayers.every((p) => rows.has(p.player_id)));
  });

  const save = (goNext: boolean) => {
    if (!selectedSessionKey || !activeDraft) return;
    const keyAtSave = selectedSessionKey;
    const statusAtSave = activeStatus;
    const draftAtSave = activeDraft;
    startTransition(async () => {
      const rows = sortedPlayers.map((p) => ({
        player_id: p.player_id,
        present: draftAtSave.presence.get(p.player_id) ?? false,
      }));
      const res = await saveTrainingControlCenterAction({
        season_id: seasonId,
        session_date_iso: keyAtSave,
        session_status: statusAtSave,
        rows,
      });
      if (!res.ok) {
        setDraftsBySessionKey({ [keyAtSave]: { ...createDraftFromPersisted(keyAtSave), lastError: res.error } });
        return;
      }
      const cur = createDraftFromPersisted(keyAtSave);
      setDraftsBySessionKey({
        [keyAtSave]: {
          ...cur,
          baseline: new Map(draftAtSave.presence),
          status: res.verification.session_status,
          lastVerified: res.verification,
          lastError: null,
        },
      });
      if (goNext && nextKey) selectSessionKey(nextKey);
    });
  };

  const setAll = (v: boolean) => {
    if (!selectedSessionKey) return;
    const n = new Map<string, boolean>();
    for (const p of sortedPlayers) n.set(p.player_id, v);
    setDraftsBySessionKey({ [selectedSessionKey]: { ...createDraftFromPersisted(selectedSessionKey), presence: n, lastError: null } });
  };

  const reset = () => {
    if (!selectedSessionKey) return;
    // STEP 5: reset must only affect the current session (keep other keys).
    setDraftsBySessionKey({
      ...draftsBySessionKey,
      [selectedSessionKey]: createDraftFromPersisted(selectedSessionKey),
    });
  };

  const setSessionStatus = (status: "completed" | "cancelled") => {
    if (!selectedSessionKey || !activeDraft) return;
    const keyAtSave = selectedSessionKey;
    const draftAtSave = activeDraft;
    setDraftsBySessionKey((prev) => {
      const currentDraft = prev[keyAtSave] ?? createDraftFromPersisted(keyAtSave);
      return {
        ...prev,
        [keyAtSave]: {
          ...currentDraft,
          status,
          lastError: null,
        },
      };
    });
    startTransition(async () => {
      const rows = sortedPlayers.map((p) => ({
        player_id: p.player_id,
        present: draftAtSave.presence.get(p.player_id) ?? false,
      }));
      const res = await saveTrainingControlCenterAction({
        season_id: seasonId,
        session_date_iso: keyAtSave,
        session_status: status,
        rows,
      });
      if (!res.ok) {
        setDraftsBySessionKey((prev) => ({
          ...prev,
          [keyAtSave]: {
            ...(prev[keyAtSave] ?? createDraftFromPersisted(keyAtSave)),
            lastError: res.error,
          },
        }));
        return;
      }
      const cur = createDraftFromPersisted(keyAtSave);
      setDraftsBySessionKey((prev) => ({
        ...prev,
        [keyAtSave]: {
          ...cur,
          status,
          baseline: status === "cancelled" ? new Map(cur.baseline) : new Map(draftAtSave.presence),
          lastVerified: res.verification,
          lastError: null,
        },
      }));
    });
  };

  const chartRows = useMemo(() => {
    // STEP 10: chart MUST use the same sessions list as chips.
    // One bar per session, label DD-MM-YYYY (via chips).
    return chips.map((c) => {
      const sess = sessionsByDate.get(c.key);
      const rows = sess ? attendanceMap.get(sess.id) : null;
      const present = rows ? [...rows.values()].filter(Boolean).length : 0;
      const total = sortedPlayers.length;
      const pct = total ? Math.round((present / total) * 1000) / 10 : 0;
      return {
        key: c.key,
        shortDate: c.label,
        fullDate: c.key,
        present,
        total,
        pct,
      };
    });
  }, [attendanceMap, chips, sessionsByDate, sortedPlayers.length]);

  const rankingRows = useMemo(() => {
    // Ranking uses ONLY DB sessions (same source as chips).
    const sessionIds = new Set(sessions.filter((s) => s.status === "completed").map((s) => s.id));
    return sortedPlayers
      .map((p) => {
        const rows = attendance.filter((a) => a.player_id === p.player_id && sessionIds.has(a.session_id));
        const present = rows.filter((r) => r.present).length;
        const absent = rows.filter((r) => !r.present).length;
        const total = rows.length;
        const pct = total ? Math.round((present / total) * 1000) / 10 : 0;
        return { player: p, present, absent, total, pct };
      })
      .sort((a, b) => (b.pct - a.pct) || (b.present - a.present) || a.player.name.localeCompare(b.player.name, "nl"));
  }, [attendance, sessions, sortedPlayers]);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-zvv-border bg-gradient-to-br from-white to-zvv-card-mid/30 p-5 shadow-sm">
        <p className="club-page-eyebrow">Training beheer</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-wide text-zvv-ink">Aanwezigheidscentrum</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <button
            type="button"
            className="club-btn-secondary"
            onClick={() => (nextIncomplete ?? selectedSessionKey) && selectSessionKey(nextIncomplete ?? selectedSessionKey)}
            disabled={!selectedSessionKey}
          >
            Open volgende niet-ingevuld
          </button>
        </div>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-zvv-border bg-white p-3">
        <div className="flex min-w-max gap-2">
          {chips.map((c) => {
            const active = c.key === selectedSessionKey;
            const sess = sessionsByDate.get(c.key) ?? null;
            const rows = sess ? attendanceMap.get(sess.id) : null;
            const isComplete = !!sess && (sess.status === "cancelled" ? true : !!rows && sortedPlayers.every((p) => rows.has(p.player_id)));
            const badge = sess?.status === "cancelled" ? "Afgelast" : isComplete ? "Ingevuld" : "Open";
            return (
              <button key={c.key} type="button" onClick={() => selectSessionKey(c.key)} className={`rounded-xl border px-3 py-2 text-left transition ${active ? "border-zvv-primary bg-zvv-primary-muted" : "border-zvv-border bg-white hover:border-zvv-primary/40"}`}>
                <p className="text-xs font-bold uppercase tracking-wider text-zvv-muted">Sessie</p>
                <p className="text-sm font-semibold text-zvv-ink">{c.label}</p>
                <p className={`mt-1 text-[11px] ${badge === "Afgelast" ? "text-red-700" : isComplete ? "text-emerald-700" : "text-zvv-muted"}`}>{badge}</p>
              </button>
            );
          })}
        </div>
      </div>

      {selectedSessionKey ? (
        <div className="rounded-2xl border border-zvv-border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zvv-muted">Geselecteerde sessie</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-semibold text-zvv-ink">{formatDateNL(selectedSessionKey)}</h3>
                {isCancelled ? (
                  <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
                    Afgelast
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-zvv-muted">Je bewerkt: {formatDateNL(selectedSessionKey)}</p>
              {activeDraft?.lastVerified ? (
                <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
                  Gevalideerd: sessie {formatDateNL(activeDraft.lastVerified.session_date)} ({activeDraft.lastVerified.session_id}) · rows {activeDraft.lastVerified.actual_attendance_rows}/{activeDraft.lastVerified.expected_attendance_rows} · aanwezig {activeDraft.lastVerified.present_count} · afwezig {activeDraft.lastVerified.absent_count} · {formatDateTimeNL(activeDraft.lastVerified.verified_at)}
                  <br />
                  Wijzigingen: +{activeDraft.lastVerified.present_set_count} aanwezig · +{activeDraft.lastVerified.absent_set_count} afwezig gezet
                </div>
              ) : null}
              {dirtySinceVerified ? (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                  Niet-opgeslagen wijzigingen sinds laatste verificatie.
                </div>
              ) : null}
              {activeDraft?.lastError ? (
                <div className="mt-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[11px] text-red-800">
                  Fout: {activeDraft.lastError}
                </div>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-sm text-zvv-muted">Aanwezig <strong className="text-zvv-ink">{presentCount}/{totalCount}</strong></p>
              <div className="mt-2 h-2 w-44 overflow-hidden rounded-full bg-zvv-card-mid"><div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} /></div>
              <p className={`mt-2 text-xs ${activeDraft?.lastError ? "text-red-700" : dirty ? "text-amber-700" : "text-emerald-700"}`}>{activeDraft?.lastError ? "Fout" : dirty ? "Niet opgeslagen" : "Geverifieerd"}</p>
            </div>

          </div>

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setSessionStatus("completed")} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${!isCancelled ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-zvv-border bg-white text-zvv-muted"}`}>Geweest</button>
            <button type="button" onClick={() => setSessionStatus("cancelled")} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${isCancelled ? "border-red-300 bg-red-50 text-red-800" : "border-zvv-border bg-white text-zvv-muted"}`}>Afgelast</button>
          </div>

          {!activeSession ? (
            <div className="mt-4 rounded-xl border border-zvv-border bg-zvv-card-mid px-4 py-3 text-sm text-zvv-muted">
              Nog geen sessie voor <strong className="text-zvv-ink">{selectedSessionKey}</strong>. Pas aanwezigheid aan en klik <strong className="text-zvv-ink">Opslaan</strong> om de sessie aan te maken.
            </div>
          ) : null}

          <div className="mt-4">
            {isCancelled ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                Deze training is afgelast. Aanwezigheid wordt niet meegeteld.
              </div>
            ) : null}
            <div
              key={selectedSessionKey}
              className={cn(
                "space-y-2 transition",
                isCancelled && "pointer-events-none opacity-50",
              )}
            >
              {sortedPlayers.map((p) => {
                const present = activeDraft?.presence.get(p.player_id) ?? false;
                return (
                  <button
                    key={`${selectedSessionKey}-${p.player_id}`}
                    type="button"
                    onClick={() => {
                      const base = createDraftFromPersisted(selectedSessionKey);
                      const current = draftsBySessionKey[selectedSessionKey] ?? base;
                      const next = new Map(current.presence);
                      next.set(p.player_id, !present);
                      setDraftsBySessionKey({ [selectedSessionKey]: { ...current, presence: next, lastError: null } });
                    }}
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-left transition",
                      isCancelled
                        ? "border-zvv-border bg-zvv-card-mid"
                        : present
                          ? "border-emerald-200 bg-emerald-50/70"
                          : "border-zvv-border bg-zvv-card-mid",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-zvv-ink">{p.shirt_number != null ? `#${p.shirt_number} ` : ""}{p.name}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-semibold",
                          isCancelled
                            ? "bg-zvv-card-mid text-zvv-muted"
                            : present
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-zvv-card-mid text-zvv-muted",
                        )}
                      >
                        {present ? "Aanwezig" : "Afwezig"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-zvv-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">Ranglijst aanwezigheid</h3>
        </div>

        <div className="mt-4 h-64 rounded-xl border border-zvv-border p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartRows}>
              <XAxis dataKey="shortDate" tick={{ fontSize: 12 }} interval={0} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number, _n, p) => [`${v}%`, "Aanwezigheid"]} labelFormatter={(_l, ps) => {
                const row = ps?.[0]?.payload as { fullDate: string; present: number; total: number } | undefined;
                return row ? `${formatDateNL(row.fullDate)} • ${row.present}/${row.total}` : "";
              }} />
              <Bar dataKey="pct" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-zvv-muted">{chartRows.length} sessies geplot</p>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-zvv-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-zvv-card-mid text-xs uppercase tracking-wide text-zvv-muted">
              <tr><th className="px-3 py-2 text-left">#</th><th className="px-3 py-2 text-left">Speler</th><th className="px-3 py-2 text-right">Aanwezig</th><th className="px-3 py-2 text-right">Afwezig</th><th className="px-3 py-2 text-right">Totaal</th><th className="px-3 py-2 text-right">%</th></tr>
            </thead>
            <tbody>
              {rankingRows.map((r, i) => (
                <tr key={r.player.player_id} className="border-t border-zvv-border">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-zvv-ink">{r.player.name}</td>
                  <td className="px-3 py-2 text-right">{r.present}</td>
                  <td className="px-3 py-2 text-right">{r.absent}</td>
                  <td className="px-3 py-2 text-right">{r.total}</td>
                  <td className="px-3 py-2 text-right font-semibold text-zvv-ink">{r.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sticky bottom-3 z-20 rounded-2xl border border-zvv-border bg-white/95 p-3 shadow-lg backdrop-blur">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setAll(true)} className="club-btn-secondary" disabled={saving || isCancelled}>Iedereen aanwezig</button>
          <button type="button" onClick={() => setAll(false)} className="club-btn-secondary" disabled={saving || isCancelled}>Iedereen afwezig</button>
          <button type="button" onClick={reset} className="club-btn-secondary" disabled={saving || isCancelled}>Reset</button>
          <button type="button" onClick={() => save(false)} className="club-btn-primary" disabled={saving || isCancelled || !dirty}>{saving ? "Opslaan..." : "Opslaan"}</button>
          <button type="button" onClick={() => save(true)} className="club-btn-primary" disabled={saving || isCancelled || !dirty}>Opslaan & volgende training</button>
          <button type="button" onClick={() => prevKey && selectSessionKey(prevKey)} className="club-btn-secondary" disabled={!prevKey || saving}>Vorige training</button>
          <button type="button" onClick={() => nextKey && selectSessionKey(nextKey)} className="club-btn-secondary" disabled={!nextKey || saving}>Volgende training</button>
        </div>
      </div>
    </div>
  );
}
