"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { refreshAfterAdminSave } from "@/lib/admin-refresh";
import type { MatchStatus } from "@/types";
import { GlassCard } from "@/components/layout/glass-card";
import { saveMatchAdminFormStateAction, deleteMatchAdminAction } from "@/actions/match-admin";
import { addMatchGuestAction, addMatchRosterPlayerAction, removeMatchGuestAction } from "@/actions/match-guest";
import { initialMatchAdminFormState, type MatchAdminFormState } from "@/lib/admin/match-admin-types";
import {
  initialAdminFormState,
  type AdminFormState,
  collectGoalFieldMessages,
  fieldMessage,
} from "@/lib/forms/admin-action-state";
import { AdminFormBanner } from "@/components/admin/admin-form-message";
import type { MatchVerificationPayload } from "@/lib/admin/verification-types";

export type MatchAdminMember = {
  player_id: string;
  name: string;
  shirt_number: number | null;
  is_guest: boolean;
  position_label?: string | null;
  has_season_membership?: boolean;
  is_already_in_match?: boolean;
  source_tags?: string[];
};

type GoalEvent = {
  scorer_player_id: string;
  assist_player_id?: string | null;
};

type MatchDraft = {
  matchMetaDraft: {
    opponent: string;
    kickoffLocal: string;
    isHome: boolean;
    goalsAgainst: number;
    status: MatchStatus;
    goalsFor: number;
  };
  eventDraft: GoalEvent[];
  selectedMvpPlayerId: string;
  selectedSquadIds: Record<string, boolean>;
  lastVerifiedSnapshot: string | null;
};

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function initGoals(initialGoalEvents: { scorer_player_id: string; assist_player_id: string | null }[]): GoalEvent[] {
  return initialGoalEvents.map((e) => ({
    scorer_player_id: e.scorer_player_id,
    assist_player_id: e.assist_player_id ?? null,
  }));
}

function createInitialDraft(
  members: MatchAdminMember[],
  initialSelectedIds: string[],
  initialGoalEvents: { scorer_player_id: string; assist_player_id: string | null }[],
  initialMatch: {
    opponent: string;
    kickoff_at: string;
    is_home: boolean;
    goals_against: number;
    status: MatchStatus;
    wotm_player_id: string | null;
  },
  mode: "create" | "edit",
  defaultStatus: MatchStatus,
): MatchDraft {
  const selected: Record<string, boolean> = {};
  for (const m of members) selected[m.player_id] = initialSelectedIds.includes(m.player_id);
  const seededGoals = initGoals(initialGoalEvents);
  return {
    matchMetaDraft: {
      opponent: initialMatch.opponent,
      kickoffLocal: toDatetimeLocalValue(initialMatch.kickoff_at),
      isHome: initialMatch.is_home,
      goalsAgainst: initialMatch.goals_against,
      status: mode === "create" ? defaultStatus : initialMatch.status,
      goalsFor: seededGoals.length,
    },
    eventDraft: seededGoals,
    selectedMvpPlayerId: initialMatch.wotm_player_id ?? "",
    selectedSquadIds: selected,
    lastVerifiedSnapshot: null,
  };
}

const inputCls =
  "min-h-[44px] w-full rounded-xl border border-zvv-border bg-white px-4 py-2.5 text-sm text-zvv-ink outline-none transition-colors placeholder:text-zvv-muted focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/15";
const toggleCls =
  "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-zvv-border bg-zvv-card-mid px-3 py-2.5 transition-colors hover:border-zvv-primary/25 has-[:checked]:border-zvv-primary/45 has-[:checked]:bg-zvv-primary-muted";

function FormStatusBanner({ state }: { state: MatchAdminFormState }) {
  if (state.status === "idle") return null;
  if (state.status === "error") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <p className="font-medium">{state.error}</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      <p className="font-semibold">{state.message}</p>
      <p className="mt-1 text-emerald-800/90">De site is direct bijgewerkt.</p>
    </div>
  );
}

export function MatchAdminForm({
  seasonId,
  members,
  mode,
  defaultStatus = "scheduled",
  initialMatch,
  initialSelectedIds,
  initialGoalEvents = [],
  returnToHref,
}: {
  seasonId: string;
  members: MatchAdminMember[];
  mode: "create" | "edit";
  defaultStatus?: MatchStatus;
  initialMatch: {
    id: string;
    opponent: string;
    kickoff_at: string;
    is_home: boolean;
    goals_against: number;
    status: MatchStatus;
    wotm_player_id: string | null;
  };
  initialSelectedIds: string[];
  initialGoalEvents?: { scorer_player_id: string; assist_player_id: string | null }[];
  returnToHref?: string;
}) {
  const router = useRouter();
  const [saveState, saveAction, savePending] = useActionState(saveMatchAdminFormStateAction, initialMatchAdminFormState);

  const [draft, setDraft] = useState<MatchDraft>(() =>
    createInitialDraft(members, initialSelectedIds, initialGoalEvents, initialMatch, mode, defaultStatus),
  );

  const [guestState, setGuestState] = useState<AdminFormState>(initialAdminFormState);
  const [deleteState, setDeleteState] = useState<AdminFormState>(initialAdminFormState);
  const [guestName, setGuestName] = useState("");
  const [guestShirt, setGuestShirt] = useState("");
  const [guestPosition, setGuestPosition] = useState("");
  const [guestPositionLabel, setGuestPositionLabel] = useState("");
  const [rosterPlayerId, setRosterPlayerId] = useState("");
  const [rosterShirt, setRosterShirt] = useState("");
  const [rosterPositionLabel, setRosterPositionLabel] = useState("");
  const [busyGuest, startGuestTransition] = useTransition();
  const [busyDelete, startDeleteTransition] = useTransition();
  const [correctionMode, setCorrectionMode] = useState(false);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const opponent = draft.matchMetaDraft.opponent;
  const kickoffLocal = draft.matchMetaDraft.kickoffLocal;
  const isHome = draft.matchMetaDraft.isHome;
  const goalsAgainst = draft.matchMetaDraft.goalsAgainst;
  const status = draft.matchMetaDraft.status;
  const goalsForInput = draft.matchMetaDraft.goalsFor;
  const goals = draft.eventDraft;
  const selected = draft.selectedSquadIds;
  const wotmId = draft.selectedMvpPlayerId;
  const lastVerifiedSignature = draft.lastVerifiedSnapshot;

  const setOpponent = (value: string) =>
    setDraft((prev) => ({ ...prev, matchMetaDraft: { ...prev.matchMetaDraft, opponent: value } }));
  const setKickoffLocal = (value: string) =>
    setDraft((prev) => ({ ...prev, matchMetaDraft: { ...prev.matchMetaDraft, kickoffLocal: value } }));
  const setIsHome = (value: boolean) =>
    setDraft((prev) => ({ ...prev, matchMetaDraft: { ...prev.matchMetaDraft, isHome: value } }));
  const setGoalsAgainst = (value: number) =>
    setDraft((prev) => ({ ...prev, matchMetaDraft: { ...prev.matchMetaDraft, goalsAgainst: value } }));
  const setStatus = (value: MatchStatus) =>
    setDraft((prev) => ({ ...prev, matchMetaDraft: { ...prev.matchMetaDraft, status: value } }));
  const setGoalsForInput = (value: number) =>
    setDraft((prev) => ({ ...prev, matchMetaDraft: { ...prev.matchMetaDraft, goalsFor: value } }));
  const setGoals = (updater: GoalEvent[] | ((prev: GoalEvent[]) => GoalEvent[])) =>
    setDraft((prev) => ({
      ...prev,
      eventDraft: typeof updater === "function" ? (updater as (rows: GoalEvent[]) => GoalEvent[])(prev.eventDraft) : updater,
    }));
  const setSelected = (updater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) =>
    setDraft((prev) => ({
      ...prev,
      selectedSquadIds:
        typeof updater === "function"
          ? (updater as (rows: Record<string, boolean>) => Record<string, boolean>)(prev.selectedSquadIds)
          : updater,
    }));
  const setWotmId = (value: string) => setDraft((prev) => ({ ...prev, selectedMvpPlayerId: value }));

  const hydratedMatchId = useRef<string | null>(null);
  useEffect(() => {
    if (hydratedMatchId.current === initialMatch.id) return;
    hydratedMatchId.current = initialMatch.id;
    setDraft(createInitialDraft(members, initialSelectedIds, initialGoalEvents, initialMatch, mode, defaultStatus));
  }, [mode, defaultStatus, initialMatch, members, initialSelectedIds, initialGoalEvents]);

  const selectedIds = useMemo(
    () => members.filter((m) => draft.selectedSquadIds[m.player_id]).map((m) => m.player_id),
    [draft.selectedSquadIds, members],
  );
  const squadMembers = useMemo(
    () => members.filter((m) => draft.selectedSquadIds[m.player_id]),
    [draft.selectedSquadIds, members],
  );
  const squadById = useMemo(() => new Set(squadMembers.map((m) => m.player_id)), [squadMembers]);

  useEffect(() => {
    setDraft((prev) => {
      const nextEvents = prev.eventDraft.filter((g) => {
        if (!squadById.has(g.scorer_player_id)) return false;
        if (g.assist_player_id && !squadById.has(g.assist_player_id)) return false;
        return true;
      });
      const nextMvp =
        prev.selectedMvpPlayerId && !squadById.has(prev.selectedMvpPlayerId) ? "" : prev.selectedMvpPlayerId;
      if (nextEvents === prev.eventDraft && nextMvp === prev.selectedMvpPlayerId) return prev;
      return { ...prev, eventDraft: nextEvents, selectedMvpPlayerId: nextMvp };
    });
  }, [squadById]);

  useEffect(() => {
    if (draft.matchMetaDraft.status !== "played") {
      setDraft((prev) => ({
        ...prev,
        eventDraft: [],
        selectedMvpPlayerId: "",
        matchMetaDraft: { ...prev.matchMetaDraft, goalsFor: 0 },
      }));
    }
  }, [draft.matchMetaDraft.status]);

  useEffect(() => {
    if (draft.matchMetaDraft.status !== "played") return;
    if (draft.matchMetaDraft.goalsFor === draft.eventDraft.length) return;
    setDraft((prev) => ({
      ...prev,
      matchMetaDraft: { ...prev.matchMetaDraft, goalsFor: prev.eventDraft.length },
    }));
  }, [draft.eventDraft.length, draft.matchMetaDraft.goalsFor, draft.matchMetaDraft.status]);

  const liveStats = useMemo(() => {
    const map = new Map<string, { goals: number; assists: number }>();
    for (const m of squadMembers) map.set(m.player_id, { goals: 0, assists: 0 });
    for (const g of goals) {
      const scorer = map.get(g.scorer_player_id);
      if (scorer) scorer.goals += 1;
      if (g.assist_player_id) {
        const assist = map.get(g.assist_player_id);
        if (assist) assist.assists += 1;
      }
    }
    return map;
  }, [goals, squadMembers]);

  const liveErrors = useMemo(() => {
    const errs: string[] = [];
    if (status !== "played") return errs;
    if (selectedIds.length === 0) errs.push("Selecteer minstens één speelster voor de wedstrijdselectie.");
    if (goals.length !== goalsForInput) errs.push("Aantal goals moet exact gelijk zijn aan 'Goals voor'.");
    for (let i = 0; i < goals.length; i++) {
      const g = goals[i];
      if (!g.scorer_player_id) errs.push(`Goal ${i + 1}: kies een scorer.`);
      if (g.scorer_player_id && !squadById.has(g.scorer_player_id)) errs.push(`Goal ${i + 1}: scorer niet in selectie.`);
      if (g.assist_player_id && !squadById.has(g.assist_player_id)) errs.push(`Goal ${i + 1}: assist niet in selectie.`);
      if (g.assist_player_id && g.assist_player_id === g.scorer_player_id) errs.push(`Goal ${i + 1}: assist mag niet gelijk zijn aan scorer.`);
    }
    const w = wotmId.trim();
    if (!w) errs.push("Kies een MVP (speelster van de wedstrijd).");
    else if (!squadById.has(w)) errs.push("MVP niet in selectie");
    return errs;
  }, [status, selectedIds.length, goals, goalsForInput, wotmId, squadById]);

  const liveWarnings = useMemo(() => {
    if (status !== "played") return [] as string[];
    const freq = new Map<string, number>();
    for (const g of goals) {
      const k = `${g.scorer_player_id}::${g.assist_player_id ?? ""}`;
      freq.set(k, (freq.get(k) ?? 0) + 1);
    }
    const dupes = [...freq.values()].filter((n) => n > 1).length;
    return dupes > 0
      ? ["Er zijn meerdere identieke goal-events (zelfde scorer + assist). Controleer of dit klopt."]
      : [];
  }, [goals, status]);

  const payloadJson = useMemo(() => {
    let kickoffIso: string;
    try {
      kickoffIso = new Date(kickoffLocal).toISOString();
    } catch {
      kickoffIso = "";
    }

    const payload = {
      match_id: mode === "edit" && initialMatch.id !== "new" ? initialMatch.id : "",
      season_id: seasonId,
      opponent,
      kickoff_at: kickoffIso,
      is_home: isHome,
      status,
      goals_for: status === "played" ? goals.length : 0,
      goals_against: goalsAgainst,
      selected_player_ids: status === "played" ? selectedIds : [],
      goals:
        status === "played"
          ? goals.map((g) => ({
              scorer_player_id: g.scorer_player_id,
              assist_player_id: g.assist_player_id || "",
            }))
          : [],
      wotm_player_id: status === "played" ? wotmId : "",
    };
    return JSON.stringify(payload);
  }, [goals, goalsAgainst, goalsForInput, initialMatch.id, isHome, kickoffLocal, mode, opponent, seasonId, selectedIds, status, wotmId]);

  useEffect(() => {
    if (saveState.status !== "success" || !saveState.matchId) return;
    refreshAfterAdminSave(router);
    if (mode === "create") {
      router.push(`/beheer/wedstrijden/${saveState.matchId}?season=${encodeURIComponent(seasonId)}`);
      return;
    }
    if (mode === "edit" && returnToHref) {
      router.push(returnToHref);
    }
  }, [saveState, mode, returnToHref, router, seasonId]);

  const busy = savePending || busyGuest || busyDelete;
  const submitBlocked = busy || (status === "played" && liveErrors.length > 0);
  const fieldErrors = saveState.status === "error" ? saveState.fieldErrors : undefined;
  const goalMsgs = collectGoalFieldMessages(fieldErrors);

  const handleAddGoal = () => setGoals((prev) => [...prev, { scorer_player_id: "", assist_player_id: null }]);
  const handleGoalUpdate = (idx: number, patch: Partial<GoalEvent>) => setGoals((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  const handleGoalDelete = (idx: number) => setGoals((prev) => prev.filter((_, i) => i !== idx));
  const handleAddGoalForPlayer = (playerId: string) =>
    setGoals((prev) => [...prev, { scorer_player_id: playerId, assist_player_id: null }]);
  const handleQuickAssist = (playerId: string) => {
    setGoals((prev) => {
      const i = [...prev].reverse().findIndex((g) => !g.assist_player_id && g.scorer_player_id !== playerId);
      if (i === -1) return prev;
      const idx = prev.length - 1 - i;
      return prev.map((g, k) => (k === idx ? { ...g, assist_player_id: playerId } : g));
    });
  };

  const handleAddGuest = () => {
    if (mode !== "edit" || initialMatch.id === "new") return;
    startGuestTransition(async () => {
      const res = await addMatchGuestAction({
        match_id: initialMatch.id,
        season_id: seasonId,
        full_name: guestName,
        shirt_number: guestShirt,
        position: guestPosition,
        position_label: guestPositionLabel,
      });
      setGuestState(res);
      if (res.status === "success") {
        setGuestName("");
        setGuestShirt("");
        setGuestPosition("");
        setGuestPositionLabel("");
        refreshAfterAdminSave(router);
      }
    });
  };

  const handleAddRosterPlayer = () => {
    if (mode !== "edit" || initialMatch.id === "new" || !rosterPlayerId) return;
    startGuestTransition(async () => {
      const res = await addMatchRosterPlayerAction({
        match_id: initialMatch.id,
        season_id: seasonId,
        player_id: rosterPlayerId,
        shirt_number: rosterShirt,
        position_label: rosterPositionLabel,
      });
      setGuestState(res);
      if (res.status === "success") {
        setRosterPlayerId("");
        setRosterShirt("");
        setRosterPositionLabel("");
        refreshAfterAdminSave(router);
      }
    });
  };

  const handleRemoveGuest = (playerId: string) => {
    if (mode !== "edit" || initialMatch.id === "new") return;
    if (!confirm("Gast van deze wedstrijd verwijderen?")) return;
    startGuestTransition(async () => {
      const res = await removeMatchGuestAction({ match_id: initialMatch.id, player_id: playerId });
      setGuestState(res);
      if (res.status === "success") refreshAfterAdminSave(router);
    });
  };

  const handleDeleteMatch = () => {
    if (mode !== "edit" || initialMatch.id === "new") return;
    if (!confirm("Deze wedstrijd en alle bijbehorende statistieken verwijderen? Dit kan niet ongedaan worden.")) return;
    startDeleteTransition(async () => {
      const res = await deleteMatchAdminAction(initialMatch.id);
      if (!res.ok) {
        setDeleteState({ status: "error", error: res.error });
        return;
      }
      setDeleteState({ status: "success", message: "Wedstrijd verwijderd." });
      router.push(`/beheer/wedstrijden?season=${encodeURIComponent(seasonId)}`);
      refreshAfterAdminSave(router);
    });
  };

  const savePreviewText = useMemo(() => {
    const lines = goals.map((g, i) => {
      const scorer = members.find((m) => m.player_id === g.scorer_player_id)?.name ?? "Onbekend";
      const assist = g.assist_player_id ? members.find((m) => m.player_id === g.assist_player_id)?.name ?? "Onbekend" : null;
      return `- Goal #${i + 1}: ${scorer}${assist ? ` (assist: ${assist})` : ""}`;
    });
    const mvpName = wotmId ? members.find((m) => m.player_id === wotmId)?.name ?? "—" : "—";
    return [
      "Je slaat op:",
      `Score: ${goalsForInput}-${goalsAgainst}`,
      "Goals:",
      ...(lines.length ? lines : ["- geen"]),
      `MVP: ${mvpName}`,
    ].join("\n");
  }, [goals, goalsAgainst, goalsForInput, members, wotmId]);
  const currentSignature = useMemo(
    () =>
      JSON.stringify({
        status,
        goalsForInput,
        goalsAgainst,
        goals: goals.map((g) => [g.scorer_player_id, g.assist_player_id ?? ""]),
        wotmId,
      }),
    [goals, goalsAgainst, goalsForInput, status, wotmId],
  );
  const dirtySinceVerified = !!lastVerifiedSignature && lastVerifiedSignature !== currentSignature;
  const verification = saveState.status === "success" ? (saveState.verification as MatchVerificationPayload | undefined) : undefined;

  useEffect(() => {
    if (saveState.status !== "success" || !saveState.verification) return;
    setDraft((prev) => ({ ...prev, lastVerifiedSnapshot: currentSignature }));
  }, [currentSignature, saveState]);
  useEffect(() => {
    if (!correctionMode) return;
    timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [correctionMode]);

  return (
    <div className="space-y-8">
      <form
        action={saveAction}
        className="space-y-8"
        onSubmit={(e) => {
          if (status !== "played") return;
          if (!confirm(savePreviewText)) e.preventDefault();
        }}
      >
        <input type="hidden" name="payload" value={payloadJson} readOnly />
        <GlassCard className="space-y-0 divide-y divide-zvv-border">
          <div className="space-y-6 pb-8">
            <p className="club-page-eyebrow">Match Control Center</p>
            <div className="sticky top-2 z-10 rounded-2xl border border-zvv-border bg-white/95 p-3 shadow-sm backdrop-blur">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-zvv-border bg-zvv-card-mid px-2 py-1 text-zvv-muted">Seizoen: {seasonId.slice(0, 8)}…</span>
                <span className="rounded-full border border-zvv-border bg-zvv-card-mid px-2 py-1 text-zvv-muted">Events: {goals.length}</span>
                <span className="rounded-full border border-zvv-border bg-zvv-card-mid px-2 py-1 text-zvv-muted">Goals voor: {goalsForInput}</span>
                <span className="rounded-full border border-zvv-border bg-zvv-card-mid px-2 py-1 text-zvv-muted">Assists: {goals.filter((g) => !!g.assist_player_id).length}</span>
                <span className="rounded-full border border-zvv-border bg-zvv-card-mid px-2 py-1 text-zvv-muted">MVP: {wotmId ? (members.find((m) => m.player_id === wotmId)?.name ?? "—") : "—"}</span>
                <span className={`rounded-full border px-2 py-1 ${liveErrors.length ? "border-red-300 bg-red-50 text-red-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`}>
                  {liveErrors.length ? `Validatie: ${liveErrors.length} issues` : "Validatie: OK"}
                </span>
                <span className={`rounded-full border px-2 py-1 ${goals.length === goalsForInput ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"}`}>
                  Score/Event check: {goals.length}/{goalsForInput}
                </span>
                <span className={`rounded-full border px-2 py-1 ${saveState.status === "error" ? "border-red-300 bg-red-50 text-red-700" : !verification || dirtySinceVerified || savePending ? "border-amber-300 bg-amber-50 text-amber-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`}>
                  {saveState.status === "error" ? "ERROR" : !verification || dirtySinceVerified || savePending ? "DIRTY" : "VERIFIED"}
                </span>
                {verification ? (
                  <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-emerald-700">
                    verified {new Date(verification.verified_at).toLocaleTimeString("nl-NL")}
                  </span>
                ) : null}
                <button type="button" onClick={() => setCorrectionMode((v) => !v)} className={`rounded-full border px-2 py-1 ${correctionMode ? "border-zvv-primary bg-zvv-primary-muted text-zvv-ink" : "border-zvv-border bg-zvv-card-mid text-zvv-muted"}`}>
                  Correctie modus
                </button>
              </div>
              {verification ? (
                <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
                  Verified: event goals {verification.event_goal_count} · derived goals {verification.derived_goal_count} · event assists {verification.event_assist_count} · derived assists {verification.derived_assist_count} · integrity {verification.integrity_state}
                </div>
              ) : null}
              {verification && verification.changes.length > 0 ? (
                <div className="mt-2 rounded-lg border border-zvv-border bg-white px-3 py-2 text-[11px] text-zvv-ink">
                  Wijzigingen: {verification.changes.map((c) => `${members.find((m) => m.player_id === c.player_id)?.name ?? "Speler"} ${c.goals_delta ? `${c.goals_delta > 0 ? "+" : ""}${c.goals_delta} goals` : ""}${c.goals_delta && c.assists_delta ? ", " : ""}${c.assists_delta ? `${c.assists_delta > 0 ? "+" : ""}${c.assists_delta} assists` : ""}`).join(" · ")}
                  {verification.mvp_before_player_id !== verification.mvp_after_player_id ? ` · MVP gewijzigd` : ""}
                </div>
              ) : null}
              {dirtySinceVerified ? (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                  Niet-opgeslagen wijzigingen sinds laatste verificatie.
                </div>
              ) : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Tegenstander</span>
                <input required value={opponent} onChange={(e) => setOpponent(e.target.value)} className={inputCls} />
                {fieldMessage(fieldErrors, "opponent") ? <span className="text-xs text-red-600">{fieldMessage(fieldErrors, "opponent")}</span> : null}
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Datum & tijd (aanvang)</span>
                <input type="datetime-local" required value={kickoffLocal} onChange={(e) => setKickoffLocal(e.target.value)} className={inputCls} />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Thuis / uit</span>
                <select value={isHome ? "true" : "false"} onChange={(e) => setIsHome(e.target.value === "true")} className={inputCls}>
                  <option value="true">Thuis</option>
                  <option value="false">Uit</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value as MatchStatus)} className={inputCls}>
                  <option value="scheduled">Gepland</option>
                  <option value="played">Gespeeld</option>
                  <option value="postponed">Uitgesteld</option>
                  <option value="cancelled">Afgelast</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Goals voor</span>
                <input type="number" min={0} max={99} disabled value={status === "played" ? goals.length : 0} className={inputCls} />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Goals tegen</span>
                <input type="number" min={0} max={99} value={goalsAgainst} onChange={(e) => setGoalsAgainst(Math.max(0, Math.min(99, Number(e.target.value) || 0)))} className={inputCls} />
              </label>
            </div>
          </div>

          {status === "played" ? (
            <>
              <div ref={timelineRef} className={`space-y-4 py-8 ${correctionMode ? "rounded-xl border border-zvv-primary/35 bg-zvv-primary-muted/20 p-4" : ""}`}>
                <p className="club-page-eyebrow">Player event board</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((m) => (
                    <div key={m.player_id} className={`${toggleCls} items-center justify-between gap-2`}>
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                        <input type="checkbox" checked={!!selected[m.player_id]} onChange={(e) => setSelected((prev) => ({ ...prev, [m.player_id]: e.target.checked }))} className="h-4 w-4 shrink-0 rounded border-zvv-border bg-white text-zvv-primary focus:ring-zvv-primary/30" />
                        <span className="min-w-0 truncate text-sm font-medium text-zvv-ink">
                          {m.shirt_number != null ? `#${m.shirt_number}` : "—"} {m.name}
                          <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-zvv-muted">{m.position_label || ""}</span>
                          {m.is_guest ? <span className="ml-2 rounded border border-zvv-primary/30 bg-zvv-primary-muted px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-zvv-primary">Gast</span> : null}
                          {!m.has_season_membership ? <span className="ml-2 rounded border border-zvv-border bg-white px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-zvv-muted">Geen seizoensmembership</span> : null}
                        </span>
                      </label>
                      {m.is_guest && mode === "edit" && initialMatch.id !== "new" ? (
                        <button type="button" onClick={() => handleRemoveGuest(m.player_id)} disabled={busy} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-red-800 hover:bg-red-100 disabled:opacity-40">×</button>
                      ) : null}
                    </div>
                  ))}
                </div>
                {squadMembers.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {squadMembers.map((m) => {
                      const st = liveStats.get(m.player_id) ?? { goals: 0, assists: 0 };
                      const isMvp = wotmId === m.player_id;
                      return (
                        <div key={`quick-${m.player_id}`} className="rounded-xl border border-zvv-border bg-white p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-zvv-ink">{m.name}</p>
                            <span className="text-xs text-zvv-muted">{st.goals}G · {st.assists}A</span>
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button type="button" className="club-btn-secondary px-3 py-1 text-xs" onClick={() => handleAddGoalForPlayer(m.player_id)} disabled={busy}>+ Goal</button>
                            <button type="button" className="club-btn-secondary px-3 py-1 text-xs" onClick={() => handleQuickAssist(m.player_id)} disabled={busy}>+ Assist</button>
                            <button type="button" className={`rounded-lg border px-2 text-xs font-semibold ${isMvp ? "border-amber-400 bg-amber-50 text-amber-800" : "border-zvv-border bg-zvv-card-mid text-zvv-muted"}`} onClick={() => setWotmId(m.player_id)} disabled={busy}>⭐ MVP</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                {mode === "edit" && initialMatch.id !== "new" ? (
                  <div className="rounded-xl border border-dashed border-zvv-primary/35 bg-zvv-primary-muted/40 p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zvv-muted">+ Gastspeler / tijdelijke speelster toevoegen</p>
                    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <select value={rosterPlayerId} onChange={(e) => setRosterPlayerId(e.target.value)} className={`${inputCls} sm:col-span-2 lg:col-span-2`}>
                        <option value="">Bestaande speelster zonder seizoensmembership kiezen</option>
                        {members
                          .filter((m) => !m.has_season_membership || m.is_guest)
                          .map((m) => (
                            <option key={`roster-${m.player_id}`} value={m.player_id}>
                              {m.name} {m.is_guest ? "(Gast)" : "(tijdelijk)"}
                            </option>
                          ))}
                      </select>
                      <input value={rosterShirt} onChange={(e) => setRosterShirt(e.target.value)} className={inputCls} type="number" min={1} max={99} placeholder="Rugnummer" />
                      <input value={rosterPositionLabel} onChange={(e) => setRosterPositionLabel(e.target.value)} className={inputCls} placeholder="Positie-tekst" maxLength={120} />
                      <button type="button" onClick={handleAddRosterPlayer} disabled={busy || !rosterPlayerId} className="club-btn-secondary text-sm font-bold disabled:opacity-40">
                        {busyGuest ? "Bezig…" : "Aan match toevoegen"}
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <input value={guestName} onChange={(e) => setGuestName(e.target.value)} className={`${inputCls} sm:col-span-2`} placeholder="Volledige naam *" />
                      <input value={guestShirt} onChange={(e) => setGuestShirt(e.target.value)} className={inputCls} type="number" min={1} max={99} placeholder="Rugnummer" />
                      <select value={guestPosition} onChange={(e) => setGuestPosition(e.target.value)} className={inputCls}>
                        <option value="">Linie</option><option value="GK">GK</option><option value="DEF">DEF</option><option value="MID">MID</option><option value="ATT">ATT</option>
                      </select>
                      <input value={guestPositionLabel} onChange={(e) => setGuestPositionLabel(e.target.value)} className={`${inputCls} sm:col-span-2 lg:col-span-3`} placeholder="Positie-tekst" maxLength={120} />
                      <button type="button" onClick={handleAddGuest} disabled={busy || !guestName.trim()} className="club-btn-secondary text-sm font-bold disabled:opacity-40">{busyGuest ? "Bezig…" : "+ Gastspeler toevoegen"}</button>
                    </div>
                    <div className="mt-3"><AdminFormBanner state={guestState} /></div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4 py-8">
                <div className="flex items-center justify-between gap-3">
                  <p className="club-page-eyebrow">Goal events timeline</p>
                  <button type="button" onClick={handleAddGoal} disabled={busy || squadMembers.length === 0} className="club-btn-secondary">+ Goal toevoegen</button>
                </div>
                {goals.map((g, idx) => (
                  <div key={`goal-${idx}`} className="grid gap-2 rounded-xl border border-zvv-border bg-zvv-card-mid p-3 md:grid-cols-[1fr_1fr_auto]">
                    <p className="md:col-span-3 text-xs font-bold uppercase tracking-wider text-zvv-muted">Goal #{idx + 1}</p>
                    <select value={g.scorer_player_id} onChange={(e) => handleGoalUpdate(idx, { scorer_player_id: e.target.value })} className={inputCls} disabled={busy}>
                      <option value="">Kies scorer</option>
                      {squadMembers.map((m) => <option key={m.player_id} value={m.player_id}>{m.shirt_number != null ? `#${m.shirt_number} ` : ""}{m.name}</option>)}
                    </select>
                    <select value={g.assist_player_id ?? ""} onChange={(e) => handleGoalUpdate(idx, { assist_player_id: e.target.value || null })} className={inputCls} disabled={busy}>
                      <option value="">Geen assist</option>
                      {squadMembers.map((m) => <option key={m.player_id} value={m.player_id}>{m.shirt_number != null ? `#${m.shirt_number} ` : ""}{m.name}</option>)}
                    </select>
                    <button type="button" onClick={() => handleGoalDelete(idx)} disabled={busy} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-40">Verwijder</button>
                  </div>
                ))}
                {goalMsgs.length > 0 ? <ul className="list-inside list-disc space-y-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{goalMsgs.map((msg, i) => <li key={`${msg}-${i}`}>{msg}</li>)}</ul> : null}
                {liveWarnings.length > 0 ? <ul className="list-inside list-disc space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{liveWarnings.map((msg) => <li key={msg}>{msg}</li>)}</ul> : null}
                <div className="rounded-xl border border-zvv-border bg-white p-4 text-sm">
                  <p className="font-semibold text-zvv-ink">Live preview: goals {goals.length}/{goalsForInput}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {squadMembers.map((m) => {
                      const st = liveStats.get(m.player_id) ?? { goals: 0, assists: 0 };
                      return <div key={m.player_id} className="rounded-lg border border-zvv-border px-3 py-2 text-xs"><p className="font-semibold text-zvv-ink">{m.name}</p><p className="text-zvv-muted">Goals {st.goals} · Assists {st.assists}</p></div>;
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4 py-8">
                <p className="club-page-eyebrow">⭐ MVP</p>
                <select value={wotmId} onChange={(e) => setWotmId(e.target.value)} className={inputCls} disabled={busy || squadMembers.length === 0}>
                  <option value="">Kies MVP</option>
                  {squadMembers.map((m) => <option key={m.player_id} value={m.player_id}>{m.name}</option>)}
                </select>
              </div>
            </>
          ) : null}

          <div className="space-y-4 pt-8">
            {liveErrors.length > 0 ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><ul className="list-inside list-disc space-y-1">{liveErrors.map((e) => <li key={e}>{e}</li>)}</ul></div> : null}
            <FormStatusBanner state={saveState} />
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={submitBlocked} className="club-btn-primary min-h-[48px] disabled:pointer-events-none disabled:opacity-40">{savePending ? "Bezig met opslaan…" : mode === "create" ? "Wedstrijd aanmaken" : "Wijzigingen opslaan"}</button>
              <Link href={`/beheer/wedstrijden?season=${encodeURIComponent(seasonId)}`} className="club-btn-secondary inline-flex min-h-[48px] items-center">Naar kalender</Link>
            </div>
          </div>
        </GlassCard>
      </form>

      {mode === "edit" && initialMatch.id !== "new" ? (
        <GlassCard className="border-red-200">
          <p className="text-sm font-medium text-zvv-ink">Gevaarlijke zone</p>
          <div className="mt-3"><AdminFormBanner state={deleteState} /></div>
          <button type="button" onClick={handleDeleteMatch} disabled={busy} className="mt-4 rounded-xl border border-red-300 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-800 transition-colors hover:bg-red-100 disabled:opacity-40">
            {busyDelete ? "Verwijderen…" : "Wedstrijd verwijderen…"}
          </button>
        </GlassCard>
      ) : null}
    </div>
  );
}
