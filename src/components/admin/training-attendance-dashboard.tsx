"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  cancelTrainingSessionByIdAction,
  deleteTrainingSessionAction,
  saveTrainingControlCenterAction,
} from "@/actions/training";
import { AbsenceReasonChips } from "@/components/training/absence-reason-chips";
import { SessionTrendList } from "@/components/training/session-trend-list";
import { AdminPlayerAttendanceExplain } from "@/components/admin/admin-player-attendance-explain";
import {
  ABSENCE_REASON_LABELS_NL,
  parseAbsenceReason,
  type AbsenceReason,
} from "@/lib/training/absence-reason";
import type { AdminPlayerAttendanceDetail, SessionTrendRow } from "@/lib/training/training-performance";
import type { TrainingVerificationPayload } from "@/lib/admin/verification-types";
import { cn } from "@/lib/utils";
import { formatDateTimeNL, formatHumanDateNL } from "@/lib/utils/format-date";
import { TrainingNewSessionForm } from "@/components/admin/training-new-session-form";
import { PlayerPhotoAvatar } from "@/components/players/player-photo-avatar";
import {
  buildTrainingEndIso,
  classifyTrainingSessions,
  formatTrainingChipLabel,
  parseTrainingLocationMeta,
  trainingDateKeyAmsterdam,
  trainingTimeLabelAmsterdam,
  type TrainingListItem,
} from "@/lib/training/manual-training";
import { resolveTrainingOperationalStatus } from "@/lib/training/training-status";
import {
  resolveTrainingWorkspaceSelection,
  trainingAttendanceIsReadOnly,
} from "@/lib/training/training-attendance-workspace";
import { refreshAfterAdminSave } from "@/lib/admin-refresh";

type PlayerRow = {
  player_id: string;
  name: string;
  shirt_number: number | null;
  position: string | null;
  photo_url?: string | null;
  is_guest?: boolean;
};

type SessionRow = {
  id: string;
  session_at: string;
  title: string | null;
  status: "scheduled" | "completed" | "cancelled";
  location?: string | null;
};

type AttendanceRow = {
  session_id: string;
  player_id: string;
  present: boolean;
  note?: string | null;
};

type SessionDraft = {
  presence: Map<string, boolean>;
  reasons: Map<string, AbsenceReason | null>;
  baseline: Map<string, boolean>;
  baselineReasons: Map<string, AbsenceReason | null>;
  status: "completed" | "cancelled";
  lastVerified: TrainingVerificationPayload | null;
  lastError: string | null;
};

function mapEq<T>(a: Map<string, T>, b: Map<string, T>) {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) {
    if (b.get(k) !== v) return false;
  }
  return true;
}

export function TrainingAttendanceDashboard({
  seasonId,
  players,
  sessions,
  attendance,
  canDeleteSessions = false,
  performance,
}: {
  seasonId: string;
  players: PlayerRow[];
  sessions: SessionRow[];
  attendance: AttendanceRow[];
  canDeleteSessions?: boolean;
  performance?: {
    trend: SessionTrendRow[];
    adminRanking: AdminPlayerAttendanceDetail[];
    withoutReasonCount: number;
    absenceTotals?: Record<AbsenceReason, number>;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, startTransition] = useTransition();
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectionInitialized, setSelectionInitialized] = useState(false);
  const [draftsBySessionId, setDraftsBySessionId] = useState<Record<string, SessionDraft>>({});
  const [editing, setEditing] = useState(false);
  const [earlierExpanded, setEarlierExpanded] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [missingSid, setMissingSid] = useState(false);

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

  const sessionsTyped = useMemo(
    () =>
      sessions.map((s) => ({
        id: s.id,
        season_id: seasonId,
        title: s.title,
        session_at: s.session_at,
        location: s.location ?? null,
        status: s.status,
      })),
    [sessions, seasonId],
  );

  const listItems = useMemo(
    () => classifyTrainingSessions(sessionsTyped, attendance, sortedPlayers.length),
    [sessionsTyped, attendance, sortedPlayers.length],
  );

  const openItems = useMemo(() => listItems.filter((i) => i.bucket === "open"), [listItems]);
  const upcomingItems = useMemo(() => listItems.filter((i) => i.bucket === "upcoming"), [listItems]);
  const earlierItems = useMemo(() => listItems.filter((i) => i.bucket === "earlier"), [listItems]);

  const sessionsById = useMemo(() => {
    const map = new Map<string, SessionRow>();
    for (const s of sessions) map.set(s.id, s);
    return map;
  }, [sessions]);

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

  const createDraftFromPersisted = (sessionId: string): SessionDraft => {
    const map = new Map<string, boolean>();
    const reasons = new Map<string, AbsenceReason | null>();
    for (const p of sortedPlayers) {
      map.set(p.player_id, false);
      reasons.set(p.player_id, null);
    }
    const sess = sessionsById.get(sessionId) ?? null;
    const isFuture = sess ? new Date(sess.session_at).getTime() > Date.now() : false;
    const status: "completed" | "cancelled" =
      sess?.status === "cancelled" ? "cancelled" : sess?.status === "completed" && !isFuture ? "completed" : "completed";
    if (sess) {
      const rows = attendanceMap.get(sess.id);
      if (rows) {
        for (const p of sortedPlayers) {
          if (rows.has(p.player_id)) map.set(p.player_id, !!rows.get(p.player_id));
        }
      }
      for (const a of attendance.filter((r) => r.session_id === sess.id)) {
        const present = map.get(a.player_id) ?? false;
        reasons.set(a.player_id, parseAbsenceReason(a.note ?? null, present));
      }
    }
    return {
      presence: new Map(map),
      reasons: new Map(reasons),
      baseline: new Map(map),
      baselineReasons: new Map(reasons),
      status,
      lastVerified: null,
      lastError: null,
    };
  };

  useEffect(() => {
    if (selectionInitialized) return;
    const resolved = resolveTrainingWorkspaceSelection({
      sid: searchParams.get("sid"),
      dateKey: searchParams.get("session"),
      sessions,
      dateKeys: listItems.map((i) => ({ id: i.session.id, dateKey: i.dateKey, prefer: i.needsAttendance })),
      fallbackIds: [openItems[0]?.session.id ?? "", upcomingItems[0]?.session.id ?? "", listItems[0]?.session.id ?? ""],
    });
    setSelectedSessionId(resolved.sessionId);
    setMissingSid(resolved.missingSid);
    setSelectionInitialized(true);
  }, [searchParams, selectionInitialized, sessions, listItems, openItems, upcomingItems]);

  const selectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setEditing(false);
    setActionMsg(null);
    setDraftsBySessionId({ [sessionId]: createDraftFromPersisted(sessionId) });
    const sess = sessionsById.get(sessionId);
    const url = new URL(window.location.href);
    if (sess) {
      url.searchParams.set("session", trainingDateKeyAmsterdam(sess.session_at));
      url.searchParams.set("sid", sessionId);
    }
    window.history.replaceState({}, "", url.toString());
  };

  useEffect(() => {
    if (!selectedSessionId) return;
    setDraftsBySessionId({ [selectedSessionId]: createDraftFromPersisted(selectedSessionId) });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuild when source maps change
  }, [selectedSessionId, attendanceMap, sessionsById, sortedPlayers]);

  const activeSession = selectedSessionId ? (sessionsById.get(selectedSessionId) ?? null) : null;
  const activeDateKey = activeSession ? trainingDateKeyAmsterdam(activeSession.session_at) : "";
  const activeDraft = selectedSessionId
    ? (draftsBySessionId[selectedSessionId] ?? createDraftFromPersisted(selectedSessionId))
    : null;
  const activeStatus: "completed" | "cancelled" =
    activeDraft?.status ?? (activeSession?.status === "cancelled" ? "cancelled" : "completed");
  const isCancelled = activeStatus === "cancelled" || trainingAttendanceIsReadOnly(activeSession?.status);

  const opStatus = activeSession
    ? resolveTrainingOperationalStatus(activeSession, {
        attendanceRowCount: attendanceMap.get(activeSession.id)?.size ?? 0,
        expectedSquadCount: sortedPlayers.length,
      })
    : null;

  const presentCount = [...(activeDraft?.presence ?? new Map<string, boolean>()).values()].filter(Boolean).length;
  const totalCount = sortedPlayers.length;
  const progress = totalCount ? Math.round((presentCount / totalCount) * 100) : 0;
  const dirty =
    !!activeDraft &&
    (!mapEq(activeDraft.presence, activeDraft.baseline) || !mapEq(activeDraft.reasons, activeDraft.baselineReasons));
  const dirtySinceVerified = dirty && !!activeDraft?.lastVerified;
  const locMeta = parseTrainingLocationMeta(activeSession?.location);

  const sessionIdsOrdered = listItems.map((i) => i.session.id);
  const currentIndex = selectedSessionId ? sessionIdsOrdered.indexOf(selectedSessionId) : -1;
  const prevKey = currentIndex > 0 ? sessionIdsOrdered[currentIndex - 1] : null;
  const nextKey =
    currentIndex >= 0 && currentIndex < sessionIdsOrdered.length - 1 ? sessionIdsOrdered[currentIndex + 1] : null;
  const nextIncomplete = openItems.find((i) => i.session.id !== selectedSessionId)?.session.id ?? null;

  const save = (goNext: boolean) => {
    if (!selectedSessionId || !activeDraft || !activeSession) return;
    const idAtSave = selectedSessionId;
    const dateAtSave = trainingDateKeyAmsterdam(activeSession.session_at);
    const statusAtSave = activeStatus;
    const draftAtSave = activeDraft;
    startTransition(async () => {
      const rows = sortedPlayers.map((p) => {
        const present = draftAtSave.presence.get(p.player_id) ?? false;
        return {
          player_id: p.player_id,
          present,
          absence_reason: present ? null : (draftAtSave.reasons.get(p.player_id) ?? "no_reason"),
        };
      });
      const res = await saveTrainingControlCenterAction({
        season_id: seasonId,
        session_id: idAtSave,
        session_date_iso: dateAtSave,
        session_status: statusAtSave,
        rows,
      });
      if (!res.ok) {
        setDraftsBySessionId({ [idAtSave]: { ...createDraftFromPersisted(idAtSave), lastError: res.error } });
        return;
      }
      const cur = createDraftFromPersisted(idAtSave);
      setDraftsBySessionId({
        [idAtSave]: {
          ...cur,
          baseline: new Map(draftAtSave.presence),
          status: res.verification.session_status,
          lastVerified: res.verification,
          lastError: null,
        },
      });
      refreshAfterAdminSave(router);
      if (goNext && nextIncomplete) selectSession(nextIncomplete);
      else if (goNext && nextKey) selectSession(nextKey);
    });
  };

  const setAll = (v: boolean) => {
    if (!selectedSessionId) return;
    const current = draftsBySessionId[selectedSessionId] ?? createDraftFromPersisted(selectedSessionId);
    const n = new Map<string, boolean>();
    const reasons = new Map<string, AbsenceReason | null>();
    for (const p of sortedPlayers) {
      n.set(p.player_id, v);
      reasons.set(p.player_id, v ? null : "no_reason");
    }
    setDraftsBySessionId({
      [selectedSessionId]: { ...current, presence: n, reasons, lastError: null },
    });
  };

  const reset = () => {
    if (!selectedSessionId) return;
    setDraftsBySessionId({
      ...draftsBySessionId,
      [selectedSessionId]: createDraftFromPersisted(selectedSessionId),
    });
  };

  const setSessionStatus = (status: "completed" | "cancelled") => {
    if (!selectedSessionId || !activeDraft || !activeSession) return;
    const idAtSave = selectedSessionId;
    const dateAtSave = trainingDateKeyAmsterdam(activeSession.session_at);
    const draftAtSave = activeDraft;
    setDraftsBySessionId((prev) => {
      const currentDraft = prev[idAtSave] ?? createDraftFromPersisted(idAtSave);
      return { ...prev, [idAtSave]: { ...currentDraft, status, lastError: null } };
    });
    startTransition(async () => {
      if (status === "cancelled") {
        const res = await cancelTrainingSessionByIdAction({ session_id: idAtSave });
        if (!res.ok) {
          setDraftsBySessionId((prev) => ({
            ...prev,
            [idAtSave]: { ...(prev[idAtSave] ?? createDraftFromPersisted(idAtSave)), lastError: res.error },
          }));
          return;
        }
        setActionMsg(res.message);
        refreshAfterAdminSave(router);
        return;
      }
      const rows = sortedPlayers.map((p) => {
        const present = draftAtSave.presence.get(p.player_id) ?? false;
        return {
          player_id: p.player_id,
          present,
          absence_reason: present ? null : (draftAtSave.reasons.get(p.player_id) ?? "no_reason"),
        };
      });
      const res = await saveTrainingControlCenterAction({
        season_id: seasonId,
        session_id: idAtSave,
        session_date_iso: dateAtSave,
        session_status: status,
        rows,
      });
      if (!res.ok) {
        setDraftsBySessionId((prev) => ({
          ...prev,
          [idAtSave]: { ...(prev[idAtSave] ?? createDraftFromPersisted(idAtSave)), lastError: res.error },
        }));
        return;
      }
      const cur = createDraftFromPersisted(idAtSave);
      setDraftsBySessionId((prev) => ({
        ...prev,
        [idAtSave]: {
          ...cur,
          status,
          baseline: new Map(draftAtSave.presence),
          lastVerified: res.verification,
          lastError: null,
        },
      }));
      refreshAfterAdminSave(router);
    });
  };

  const hardDelete = () => {
    if (!selectedSessionId || !canDeleteSessions) return;
    const confirm = window.prompt(
      "Definitief verwijderen alleen bij foutieve/dubbele sessie. Typ VERWIJDER ter bevestiging. (Voor een training die niet doorgaat: gebruik Afgelasten.)",
    );
    if (!confirm) return;
    startTransition(async () => {
      const res = await deleteTrainingSessionAction({ session_id: selectedSessionId, confirm });
      if (!res.ok) {
        setActionMsg(res.error);
        return;
      }
      setActionMsg(res.message);
      setSelectedSessionId("");
      refreshAfterAdminSave(router);
    });
  };

  const renderListButton = (item: TrainingListItem) => {
    const active = item.session.id === selectedSessionId;
    return (
      <button
        key={item.session.id}
        type="button"
        onClick={() => selectSession(item.session.id)}
        className={cn(
          "min-w-[9.5rem] rounded-xl border px-3 py-2 text-left transition",
          active ? "border-zvv-primary bg-zvv-primary-muted" : "border-zvv-border bg-white hover:border-zvv-primary/40",
        )}
      >
        <p className="text-sm font-semibold text-zvv-ink">
          {formatTrainingChipLabel(item.dateKey)} · {item.timeLabel}
        </p>
        <p
          className={cn(
            "mt-1 text-xs",
            item.needsAttendance
              ? "font-semibold text-amber-700"
              : item.session.status === "cancelled"
                ? "text-red-700"
                : "text-zvv-muted",
          )}
        >
          {item.statusLabel}
        </p>
      </button>
    );
  };

  const visibleEarlier = earlierExpanded ? earlierItems : earlierItems.slice(0, 4);

  return (
    <div className="space-y-6">
      {missingSid ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Deze trainingssessie is niet gevonden. Kies een bestaande sessie of voeg een extra trainingsdag toe.
        </div>
      ) : null}
      <header className="rounded-2xl border border-zvv-border bg-gradient-to-br from-white to-zvv-card-mid/30 p-5 shadow-sm">
        <p className="club-page-eyebrow">Training beheer</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-wide text-zvv-ink">
          Aanwezigheidscentrum
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-zvv-muted">
          Voeg zelf trainingen toe op elke dag. Openstaande aanwezigheid staat bovenaan.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <TrainingNewSessionForm seasonId={seasonId} />
          <button
            type="button"
            className="club-btn-secondary"
            onClick={() => nextIncomplete && selectSession(nextIncomplete)}
            disabled={!nextIncomplete}
          >
            Openstaande aanwezigheid
          </button>
        </div>
      </header>

      {openItems.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-900">Openstaand</h3>
          <p className="mt-1 text-sm text-amber-800">Aanwezigheid nog invullen</p>
          <div className="mt-3 flex flex-wrap gap-2">{openItems.map(renderListButton)}</div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-zvv-border bg-white p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zvv-muted">Komende trainingen</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {upcomingItems.length ? upcomingItems.map(renderListButton) : (
            <p className="text-sm text-zvv-muted">Nog geen geplande sessies. Gebruik + Training toevoegen.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zvv-border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zvv-muted">Eerdere trainingen</h3>
          {earlierItems.length > 4 ? (
            <button
              type="button"
              className="text-sm font-semibold text-zvv-primary hover:underline"
              onClick={() => setEarlierExpanded((v) => !v)}
            >
              {earlierExpanded ? "Minder tonen" : `Archief tonen (${earlierItems.length})`}
            </button>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleEarlier.length ? visibleEarlier.map(renderListButton) : (
            <p className="text-sm text-zvv-muted">Nog geen eerdere trainingen.</p>
          )}
        </div>
      </section>

      {activeSession ? (
        <div className="rounded-2xl border border-zvv-border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zvv-muted">Training aanwezigheid</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-semibold text-zvv-ink">
                  {formatHumanDateNL(activeSession.session_at, { includeYear: true })}
                </h3>
                {isCancelled ? (
                  <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
                    Afgelast
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-zvv-muted">
                {(() => {
                  try {
                    return trainingTimeLabelAmsterdam(activeSession.session_at, buildTrainingEndIso(activeDateKey, locMeta.end));
                  } catch {
                    return trainingTimeLabelAmsterdam(activeSession.session_at);
                  }
                })()}
                {activeSession.title ? ` · ${activeSession.title}` : ""}
              </p>
              {opStatus ? (
                <p className="mt-1 text-sm font-semibold text-zvv-ink">
                  {opStatus.label}
                  {opStatus.status !== "geregistreerd" && !isCancelled && !opStatus.isFuture
                    ? " · Nog geen aanwezigheid geregistreerd"
                    : null}
                </p>
              ) : null}
              {activeDraft?.lastVerified ? (
                <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  Opgeslagen: {activeDraft.lastVerified.present_count} aanwezig ·{" "}
                  {activeDraft.lastVerified.absent_count} afwezig ·{" "}
                  {formatDateTimeNL(activeDraft.lastVerified.verified_at)}
                </div>
              ) : null}
              {dirtySinceVerified ? (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Niet-opgeslagen wijzigingen.
                </div>
              ) : null}
              {activeDraft?.lastError || actionMsg ? (
                <div className="mt-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[11px] text-red-800">
                  {activeDraft?.lastError ?? actionMsg}
                </div>
              ) : null}
            </div>
            <div className="text-right">
              {opStatus?.isFuture ? (
                <>
                  <p className="text-sm font-semibold text-zvv-primary">Gepland</p>
                  <p className="mt-1 text-xs text-zvv-muted">Nog geen aanwezigheid geregistreerd</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-zvv-muted">
                    Aanwezig <strong className="text-zvv-ink">{presentCount}/{totalCount}</strong>
                  </p>
                  <div className="mt-2 h-2 w-44 overflow-hidden rounded-full bg-zvv-card-mid">
                    <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {!isCancelled && !opStatus?.isFuture ? (
              <button
                type="button"
                onClick={() => setSessionStatus("completed")}
                className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
              >
                Registreren
              </button>
            ) : null}
            {!isCancelled ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Training afgelasten? Aanwezigheid is dan niet meer nodig.")) {
                    setSessionStatus("cancelled");
                  }
                }}
                className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800"
              >
                Training afgelasten
              </button>
            ) : null}
            {!isCancelled && activeSession.status !== "completed" ? (
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="rounded-xl border border-zvv-border bg-white px-3 py-2 text-sm font-semibold text-zvv-ink"
              >
                Training wijzigen
              </button>
            ) : null}
            {canDeleteSessions ? (
              <button
                type="button"
                onClick={hardDelete}
                className="rounded-xl border border-zvv-border bg-white px-3 py-2 text-sm font-semibold text-zvv-muted"
              >
                Training verwijderen
              </button>
            ) : null}
          </div>

          {editing && !isCancelled ? (
            <div className="mt-4">
              <TrainingNewSessionForm
                seasonId={seasonId}
                mode="edit"
                sessionId={activeSession.id}
                initialDate={activeDateKey}
                initialStart={locMeta.start}
                initialEnd={locMeta.end}
                initialTitle={activeSession.title?.replace(/^Afgelast:\s*/i, "") || "Reguliere training"}
                initialNote={locMeta.note}
                onCancel={() => setEditing(false)}
              />
            </div>
          ) : null}

          <div className="mt-4">
            {isCancelled ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                Deze training is afgelast. Aanwezigheid wordt niet meegeteld.
              </div>
            ) : null}
            <div
              key={selectedSessionId}
              className={cn("space-y-2 transition", isCancelled && "pointer-events-none opacity-50")}
            >
              {sortedPlayers.map((p) => {
                const present = activeDraft?.presence.get(p.player_id) ?? false;
                const reason = activeDraft?.reasons.get(p.player_id) ?? null;
                const setPresent = (value: boolean) => {
                  const base = createDraftFromPersisted(selectedSessionId);
                  const current = draftsBySessionId[selectedSessionId] ?? base;
                  const next = new Map(current.presence);
                  const nextReasons = new Map(current.reasons);
                  next.set(p.player_id, value);
                  nextReasons.set(p.player_id, value ? null : (current.reasons.get(p.player_id) ?? "no_reason"));
                  setDraftsBySessionId({
                    [selectedSessionId]: { ...current, presence: next, reasons: nextReasons, lastError: null },
                  });
                };
                const setReason = (nextReason: AbsenceReason) => {
                  const current = draftsBySessionId[selectedSessionId] ?? createDraftFromPersisted(selectedSessionId);
                  const nextReasons = new Map(current.reasons);
                  nextReasons.set(p.player_id, nextReason);
                  setDraftsBySessionId({
                    [selectedSessionId]: { ...current, reasons: nextReasons, lastError: null },
                  });
                };
                return (
                  <div
                    key={`${selectedSessionId}-${p.player_id}`}
                    className={cn(
                      "rounded-xl border px-3 py-2",
                      isCancelled
                        ? "border-zvv-border bg-zvv-card-mid"
                        : present
                          ? "border-emerald-200 bg-emerald-50/70"
                          : "border-rose-200 bg-rose-50/50",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <PlayerPhotoAvatar
                        playerId={p.player_id}
                        name={p.name}
                        photoUrl={p.photo_url}
                        shirtNumber={p.shirt_number}
                        className="h-9 w-9"
                        sizes="36px"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-zvv-ink">
                          {p.shirt_number != null ? <span className="mr-1.5 text-zvv-muted">#{p.shirt_number}</span> : null}
                          {p.name}
                        </p>
                        <p
                          className={cn(
                            "mt-0.5 text-[11px] font-bold uppercase tracking-wider",
                            present ? "text-emerald-800" : "text-rose-800",
                          )}
                        >
                          {present ? "Aanwezig" : `Afwezig · ${reason ? ABSENCE_REASON_LABELS_NL[reason] : "Geen reden"}`}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          disabled={isCancelled}
                          onClick={() => setPresent(true)}
                          className={cn(
                            "rounded-lg px-2.5 py-1.5 text-xs font-semibold",
                            present
                              ? "bg-emerald-600 text-white"
                              : "border border-zvv-border bg-white text-zvv-muted hover:border-emerald-300 hover:text-emerald-800",
                          )}
                        >
                          Aanwezig
                        </button>
                        <button
                          type="button"
                          disabled={isCancelled}
                          onClick={() => setPresent(false)}
                          className={cn(
                            "rounded-lg px-2.5 py-1.5 text-xs font-semibold",
                            !present
                              ? "bg-slate-800 text-white"
                              : "border border-zvv-border bg-white text-zvv-muted hover:border-slate-300 hover:text-slate-800",
                          )}
                        >
                          Afwezig
                        </button>
                      </div>
                    </div>
                    {!present ? (
                      <AbsenceReasonChips value={reason} onChange={setReason} disabled={isCancelled} />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-zvv-border bg-white p-5 text-sm text-zvv-muted">
          Selecteer een training of voeg er een toe met + Training toevoegen.
        </div>
      )}

      <section className="rounded-2xl border border-zvv-border bg-white p-5 shadow-sm">
        <p className="club-page-eyebrow">Opkomst</p>
        <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">
          Opkomst per training
        </h3>
        <div className="mt-4">
          <SessionTrendList rows={performance?.trend ?? []} />
        </div>
      </section>

      <AdminPlayerAttendanceExplain
        rows={performance?.adminRanking ?? []}
        absenceTotals={performance?.absenceTotals}
        withoutReasonCount={performance?.withoutReasonCount ?? 0}
      />

      <div className="sticky bottom-3 z-20 rounded-2xl border border-zvv-border bg-white/95 p-3 shadow-lg backdrop-blur">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setAll(true)} className="club-btn-secondary" disabled={saving || isCancelled}>
            Iedereen aanwezig
          </button>
          <button type="button" onClick={() => setAll(false)} className="club-btn-secondary" disabled={saving || isCancelled}>
            Iedereen afwezig
          </button>
          <button type="button" onClick={reset} className="club-btn-secondary" disabled={saving || isCancelled}>
            Herstellen
          </button>
          <button
            type="button"
            onClick={() => save(false)}
            className="club-btn-primary"
            disabled={saving || isCancelled || !activeSession}
          >
            {saving ? "Opslaan..." : "Aanwezigheid opslaan"}
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            className="club-btn-primary"
            disabled={saving || isCancelled || !dirty || !activeSession}
          >
            Opslaan & volgende
          </button>
          <button
            type="button"
            onClick={() => prevKey && selectSession(prevKey)}
            className="club-btn-secondary"
            disabled={!prevKey || saving}
          >
            Vorige
          </button>
          <button
            type="button"
            onClick={() => nextKey && selectSession(nextKey)}
            className="club-btn-secondary"
            disabled={!nextKey || saving}
          >
            Volgende
          </button>
        </div>
      </div>
    </div>
  );
}
