"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { refreshAfterAdminSave } from "@/lib/admin-refresh";
import type { MatchStatus, MatchType, MatchLineupRole, MatchCardType } from "@/types";
import { DEFAULT_MATCH_TYPE } from "@/lib/match-type";
import { MAX_LINEUP_STARTERS } from "@/lib/match-lineup";
import type { MatchLineupInitial } from "@/lib/queries/match-lineup";
import { GlassCard } from "@/components/layout/glass-card";
import { saveMatchAdminFormStateAction } from "@/actions/match-admin";
import { MatchDeleteDialog } from "@/components/admin/match-delete-dialog";
import { addMatchGuestAction, addMatchRosterPlayerAction, removeMatchGuestAction } from "@/actions/match-guest";
import { initialMatchAdminFormState, type MatchAdminFormState } from "@/lib/admin/match-admin-types";
import {
  initialAdminFormState,
  type AdminFormState,
  collectGoalFieldMessages,
  fieldMessage,
} from "@/lib/forms/admin-action-state";
import { AdminFormBanner } from "@/components/admin/admin-form-message";
import { AdminSaveBar } from "@/components/admin/shell/admin-ui";
import type { MatchVerificationPayload } from "@/lib/admin/verification-types";
import { sortPlayersBySquadNumber } from "@/lib/players/sort-by-squad-number";
import { CLUB_NAME } from "@/constants/club";
import { matchWorkflowHref } from "@/lib/match/match-workflow-steps";
import { formatWotmNamesNl, uniquePlayerIds } from "@/lib/match/wotm-winners";

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
  minute: number;
};

type CardEvent = {
  player_id: string;
  card_type: MatchCardType;
  minute: number;
};

type SubstitutionEvent = {
  player_in_id: string;
  player_out_id: string;
  minute: number;
};

type MatchDraft = {
  matchMetaDraft: {
    opponent: string;
    kickoffLocal: string;
    isHome: boolean;
    matchType: MatchType;
    location: string;
    referee: string;
    notes: string;
    goalsAgainst: number;
    status: MatchStatus;
    goalsFor: number;
  };
  eventDraft: GoalEvent[];
  cardDraft: CardEvent[];
  substitutionDraft: SubstitutionEvent[];
  selectedMvpPlayerIds: string[];
  selectedSquadIds: Record<string, boolean>;
  lineupRoleByPlayer: Record<string, MatchLineupRole | "">;
  lineupAbsentReasons: Record<string, string>;
  lastVerifiedSnapshot: string | null;
};

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function initGoals(
  initialGoalEvents: { scorer_player_id: string; assist_player_id: string | null; minute?: number }[],
): GoalEvent[] {
  return initialGoalEvents.map((e) => ({
    scorer_player_id: e.scorer_player_id,
    assist_player_id: e.assist_player_id ?? null,
    minute: e.minute ?? 0,
  }));
}

function initCards(initialCardEvents: CardEvent[]): CardEvent[] {
  return initialCardEvents.map((e) => ({
    player_id: e.player_id,
    card_type: e.card_type,
    minute: e.minute,
  }));
}

function initSubstitutions(initialSubstitutionEvents: SubstitutionEvent[]): SubstitutionEvent[] {
  return initialSubstitutionEvents.map((e) => ({
    player_in_id: e.player_in_id,
    player_out_id: e.player_out_id,
    minute: e.minute,
  }));
}

function createInitialLineupState(initialLineup: MatchLineupInitial) {
  const lineupRoleByPlayer: Record<string, MatchLineupRole | ""> = {};
  const lineupAbsentReasons: Record<string, string> = {};
  for (const id of initialLineup.starters) lineupRoleByPlayer[id] = "starter";
  for (const id of initialLineup.bench) lineupRoleByPlayer[id] = "bench";
  for (const a of initialLineup.absent) {
    lineupRoleByPlayer[a.player_id] = "absent";
    if (a.absence_reason) lineupAbsentReasons[a.player_id] = a.absence_reason;
  }
  return { lineupRoleByPlayer, lineupAbsentReasons };
}

function createInitialDraft(
  members: MatchAdminMember[],
  initialSelectedIds: string[],
  initialGoalEvents: { scorer_player_id: string; assist_player_id: string | null }[],
  initialMatch: {
    opponent: string;
    kickoff_at: string;
    is_home: boolean;
    match_type?: MatchType;
    location?: string | null;
    referee?: string | null;
    notes?: string | null;
    goals_against: number;
    status: MatchStatus;
    wotm_player_id: string | null;
    wotm_player_ids?: string[];
  },
  initialLineup: MatchLineupInitial,
  initialCardEvents: CardEvent[],
  initialSubstitutionEvents: SubstitutionEvent[],
  mode: "create" | "edit",
  defaultStatus: MatchStatus,
): MatchDraft {
  const selected: Record<string, boolean> = {};
  const fromLineupParticipants = new Set([...initialLineup.starters, ...initialLineup.bench]);
  for (const m of members) {
    selected[m.player_id] =
      initialSelectedIds.includes(m.player_id) || fromLineupParticipants.has(m.player_id);
  }
  const seededGoals = initGoals(initialGoalEvents);
  const lineupState = createInitialLineupState(initialLineup);
  return {
    matchMetaDraft: {
      opponent: initialMatch.opponent,
      kickoffLocal: toDatetimeLocalValue(initialMatch.kickoff_at),
      isHome: initialMatch.is_home,
      matchType: initialMatch.match_type ?? DEFAULT_MATCH_TYPE,
      location: initialMatch.location ?? "",
      referee: initialMatch.referee ?? "",
      notes: initialMatch.notes ?? "",
      goalsAgainst: initialMatch.goals_against,
      // Afrondmodus (finish=1) geeft defaultStatus=played terwijl DB nog scheduled is.
      status:
        defaultStatus === "played"
          ? "played"
          : mode === "create"
            ? defaultStatus
            : initialMatch.status,
      goalsFor: seededGoals.length,
    },
    eventDraft: seededGoals,
    cardDraft: initCards(initialCardEvents),
    substitutionDraft: initSubstitutions(initialSubstitutionEvents),
    selectedMvpPlayerIds: uniquePlayerIds(initialMatch.wotm_player_ids ?? (initialMatch.wotm_player_id ? [initialMatch.wotm_player_id] : [])),
    selectedSquadIds: selected,
    lineupRoleByPlayer: lineupState.lineupRoleByPlayer,
    lineupAbsentReasons: lineupState.lineupAbsentReasons,
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
  initialLineup = { starters: [], bench: [], absent: [] },
  initialCardEvents = [],
  initialSubstitutionEvents = [],
  returnToHref,
  preserveShapeEvents = false,
  availableGuests = [],
  workflowStep,
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
    match_type?: MatchType;
    location?: string | null;
    referee?: string | null;
    notes?: string | null;
    goals_against: number;
    status: MatchStatus;
    wotm_player_id: string | null;
    wotm_player_ids?: string[];
  };
  initialSelectedIds: string[];
  initialGoalEvents?: { scorer_player_id: string; assist_player_id: string | null; minute?: number }[];
  initialLineup?: MatchLineupInitial;
  initialCardEvents?: CardEvent[];
  initialSubstitutionEvents?: SubstitutionEvent[];
  returnToHref?: string;
  /** Wissels/posities via MatchShapeEventsEditor — niet overschrijven bij uitslag-save. */
  preserveShapeEvents?: boolean;
  /** Catalogusgasten die nog niet op deze wedstrijd staan. */
  availableGuests?: { playerId: string; fullName: string }[];
  /** Optionele wizardstap: toont alleen relevante secties. */
  workflowStep?:
    | "wedstrijd"
    | "selectie"
    | "opstelling"
    | "verloop"
    | "uitslag"
    | "na-de-wedstrijd"
    | "controle";
}) {
  const router = useRouter();
  const afterMatchStep =
    workflowStep === "uitslag" || workflowStep === "na-de-wedstrijd" || workflowStep === "verloop";
  const showWedstrijd = !workflowStep || workflowStep === "wedstrijd" || workflowStep === "controle";
  /** Losse selectie is niet meer primaire stap — alleen legacy/controle. */
  const showSelectie = workflowStep === "selectie" || (!workflowStep && mode === "edit" && false);
  /** Uitslag alleen bij gespeelde / afrondmodus — nooit in stap 1. */
  const showUitslag =
    mode === "create" ? false : afterMatchStep || workflowStep === "controle" || !workflowStep;
  const compactAfterMatch = afterMatchStep;
  const [saveState, saveAction, savePending] = useActionState(saveMatchAdminFormStateAction, initialMatchAdminFormState);

  const [draft, setDraft] = useState<MatchDraft>(() =>
    createInitialDraft(
      members,
      initialSelectedIds,
      initialGoalEvents,
      initialMatch,
      initialLineup,
      initialCardEvents,
      initialSubstitutionEvents,
      mode,
      defaultStatus,
    ),
  );

  const [guestState, setGuestState] = useState<AdminFormState>(initialAdminFormState);
  const [guestName, setGuestName] = useState("");
  const [guestShirt, setGuestShirt] = useState("");
  const [guestPosition, setGuestPosition] = useState("");
  const [guestPositionLabel, setGuestPositionLabel] = useState("");
  const [rosterPlayerId, setRosterPlayerId] = useState("");
  const [rosterShirt, setRosterShirt] = useState("");
  const [rosterPositionLabel, setRosterPositionLabel] = useState("");
  const [busyGuest, startGuestTransition] = useTransition();
  const opponent = draft.matchMetaDraft.opponent;
  const kickoffLocal = draft.matchMetaDraft.kickoffLocal;
  const isHome = draft.matchMetaDraft.isHome;
  const matchType = draft.matchMetaDraft.matchType;
  const location = draft.matchMetaDraft.location;
  const referee = draft.matchMetaDraft.referee;
  const notes = draft.matchMetaDraft.notes;
  const goalsAgainst = draft.matchMetaDraft.goalsAgainst;
  const status = draft.matchMetaDraft.status;
  const goalsForInput = draft.matchMetaDraft.goalsFor;
  const goals = draft.eventDraft;
  const cards = draft.cardDraft;
  const substitutions = draft.substitutionDraft;
  const selected = draft.selectedSquadIds;
  const wotmIds = draft.selectedMvpPlayerIds;
  const lastVerifiedSignature = draft.lastVerifiedSnapshot;

  const setOpponent = (value: string) =>
    setDraft((prev) => ({ ...prev, matchMetaDraft: { ...prev.matchMetaDraft, opponent: value } }));
  const setKickoffLocal = (value: string) =>
    setDraft((prev) => ({ ...prev, matchMetaDraft: { ...prev.matchMetaDraft, kickoffLocal: value } }));
  const setIsHome = (value: boolean) =>
    setDraft((prev) => ({ ...prev, matchMetaDraft: { ...prev.matchMetaDraft, isHome: value } }));
  const setMatchType = (value: MatchType) =>
    setDraft((prev) => ({ ...prev, matchMetaDraft: { ...prev.matchMetaDraft, matchType: value } }));
  const setLocation = (value: string) =>
    setDraft((prev) => ({ ...prev, matchMetaDraft: { ...prev.matchMetaDraft, location: value } }));
  const setReferee = (value: string) =>
    setDraft((prev) => ({ ...prev, matchMetaDraft: { ...prev.matchMetaDraft, referee: value } }));
  const setNotes = (value: string) =>
    setDraft((prev) => ({ ...prev, matchMetaDraft: { ...prev.matchMetaDraft, notes: value } }));
  const setGoalsAgainst = (value: number) =>
    setDraft((prev) => ({ ...prev, matchMetaDraft: { ...prev.matchMetaDraft, goalsAgainst: value } }));
  const setStatus = (value: MatchStatus) =>
    setDraft((prev) => ({ ...prev, matchMetaDraft: { ...prev.matchMetaDraft, status: value } }));
  const setGoals = (updater: GoalEvent[] | ((prev: GoalEvent[]) => GoalEvent[])) =>
    setDraft((prev) => ({
      ...prev,
      eventDraft: typeof updater === "function" ? (updater as (rows: GoalEvent[]) => GoalEvent[])(prev.eventDraft) : updater,
    }));
  const setCards = (updater: CardEvent[] | ((prev: CardEvent[]) => CardEvent[])) =>
    setDraft((prev) => ({
      ...prev,
      cardDraft: typeof updater === "function" ? (updater as (rows: CardEvent[]) => CardEvent[])(prev.cardDraft) : updater,
    }));
  const setSubstitutions = (updater: SubstitutionEvent[] | ((prev: SubstitutionEvent[]) => SubstitutionEvent[])) =>
    setDraft((prev) => ({
      ...prev,
      substitutionDraft:
        typeof updater === "function"
          ? (updater as (rows: SubstitutionEvent[]) => SubstitutionEvent[])(prev.substitutionDraft)
          : updater,
    }));
  const setSelected = (updater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) =>
    setDraft((prev) => ({
      ...prev,
      selectedSquadIds:
        typeof updater === "function"
          ? (updater as (rows: Record<string, boolean>) => Record<string, boolean>)(prev.selectedSquadIds)
          : updater,
    }));
  const toggleWotmId = (playerId: string) =>
    setDraft((prev) => {
      const has = prev.selectedMvpPlayerIds.includes(playerId);
      return {
        ...prev,
        selectedMvpPlayerIds: has
          ? prev.selectedMvpPlayerIds.filter((id) => id !== playerId)
          : uniquePlayerIds([...prev.selectedMvpPlayerIds, playerId]),
      };
    });

  const setLineupRole = (playerId: string, role: MatchLineupRole | "") => {
    setDraft((prev) => {
      const lineupRoleByPlayer = { ...prev.lineupRoleByPlayer };
      const lineupAbsentReasons = { ...prev.lineupAbsentReasons };
      if (!role) {
        delete lineupRoleByPlayer[playerId];
        delete lineupAbsentReasons[playerId];
      } else {
        lineupRoleByPlayer[playerId] = role;
        if (role !== "absent") delete lineupAbsentReasons[playerId];
        else if (!(playerId in lineupAbsentReasons)) lineupAbsentReasons[playerId] = "";
      }
      return { ...prev, lineupRoleByPlayer, lineupAbsentReasons };
    });
  };

  const setLineupAbsentReason = (playerId: string, reason: string) =>
    setDraft((prev) => ({
      ...prev,
      lineupAbsentReasons: { ...prev.lineupAbsentReasons, [playerId]: reason },
    }));

  const hydratedMatchId = useRef<string | null>(null);
  useEffect(() => {
    if (hydratedMatchId.current === initialMatch.id) return;
    hydratedMatchId.current = initialMatch.id;
    setDraft(
      createInitialDraft(
        members,
        initialSelectedIds,
        initialGoalEvents,
        initialMatch,
        initialLineup,
        initialCardEvents,
        initialSubstitutionEvents,
        mode,
        defaultStatus,
      ),
    );
  }, [mode, defaultStatus, initialMatch, members, initialSelectedIds, initialGoalEvents, initialLineup, initialCardEvents, initialSubstitutionEvents]);

  const selectedIds = useMemo(
    () => members.filter((m) => draft.selectedSquadIds[m.player_id]).map((m) => m.player_id),
    [draft.selectedSquadIds, members],
  );
  const squadMembers = useMemo(
    () => sortPlayersBySquadNumber(members.filter((m) => draft.selectedSquadIds[m.player_id])),
    [draft.selectedSquadIds, members],
  );
  const lineupPool = useMemo(
    () => sortPlayersBySquadNumber(members.filter((m) => m.has_season_membership && !m.is_guest)),
    [members],
  );
  const membersSorted = useMemo(() => sortPlayersBySquadNumber(members), [members]);
  const starterCount = useMemo(
    () => Object.values(draft.lineupRoleByPlayer).filter((r) => r === "starter").length,
    [draft.lineupRoleByPlayer],
  );
  const benchCount = useMemo(
    () => Object.values(draft.lineupRoleByPlayer).filter((r) => r === "bench").length,
    [draft.lineupRoleByPlayer],
  );
  const absentCount = useMemo(
    () => Object.values(draft.lineupRoleByPlayer).filter((r) => r === "absent").length,
    [draft.lineupRoleByPlayer],
  );
  const squadById = useMemo(() => new Set(squadMembers.map((m) => m.player_id)), [squadMembers]);

  useEffect(() => {
    setDraft((prev) => {
      const nextEvents = prev.eventDraft.filter((g) => {
        if (!squadById.has(g.scorer_player_id)) return false;
        if (g.assist_player_id && !squadById.has(g.assist_player_id)) return false;
        return true;
      });
      const nextMvp = prev.selectedMvpPlayerIds.filter((id) => squadById.has(id));
      if (nextEvents === prev.eventDraft && nextMvp.length === prev.selectedMvpPlayerIds.length) return prev;
      return { ...prev, eventDraft: nextEvents, selectedMvpPlayerIds: nextMvp };
    });
  }, [squadById]);

  useEffect(() => {
    if (draft.matchMetaDraft.status !== "played") {
      setDraft((prev) => ({
        ...prev,
        eventDraft: [],
        selectedMvpPlayerIds: [],
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

  const lineupLiveErrors = useMemo(() => {
    const errs: string[] = [];
    if (starterCount > MAX_LINEUP_STARTERS) {
      errs.push(`Maximaal ${MAX_LINEUP_STARTERS} speelsters in de basis.`);
    }
    return errs;
  }, [starterCount]);

  const liveErrors = useMemo(() => {
    const errs: string[] = [];
    if (status !== "played") return errs;
    if (selectedIds.length === 0) errs.push("Selecteer minstens één speelster voor de wedstrijdselectie.");
    if (goals.length !== goalsForInput) errs.push("Aantal doelpunten moet exact gelijk zijn aan ‘Doelpunten voor’.");
    for (let i = 0; i < goals.length; i++) {
      const g = goals[i];
      if (!g.scorer_player_id) errs.push(`Goal ${i + 1}: kies een scorer.`);
      if (g.scorer_player_id && !squadById.has(g.scorer_player_id)) errs.push(`Goal ${i + 1}: scorer niet in selectie.`);
      if (g.assist_player_id && !squadById.has(g.assist_player_id)) errs.push(`Goal ${i + 1}: assist niet in selectie.`);
      if (g.assist_player_id && g.assist_player_id === g.scorer_player_id) errs.push(`Goal ${i + 1}: assist mag niet gelijk zijn aan scorer.`);
    }
    if (wotmIds.some((id) => !squadById.has(id))) errs.push("Elke MVP moet in de selectie staan.");
    return errs;
  }, [status, selectedIds.length, goals, goalsForInput, wotmIds, squadById]);

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

    const lineup = (["starter", "bench", "absent"] as const).flatMap((role) => {
      const ids = lineupPool.filter((m) => draft.lineupRoleByPlayer[m.player_id] === role).map((m) => m.player_id);
      return ids.map((player_id, sort_order) => {
        const member = lineupPool.find((m) => m.player_id === player_id);
        // Zod lineup-schema accepteert geen JSON-null — lege string wordt genormaliseerd.
        return {
          player_id,
          role,
          position: member?.position_label?.trim() || "",
          absence_reason:
            role === "absent" ? draft.lineupAbsentReasons[player_id]?.trim() || "" : "",
          sort_order,
        };
      });
    });

    const payload = {
      match_id: mode === "edit" && initialMatch.id !== "new" ? initialMatch.id : "",
      season_id: seasonId,
      opponent,
      kickoff_at: kickoffIso,
      is_home: isHome,
      match_type: matchType,
      location: location.trim(),
      referee: referee.trim(),
      notes: notes.trim(),
      status,
      goals_for: status === "played" ? goals.length : 0,
      goals_against: status === "played" ? goalsAgainst : 0,
      selected_player_ids: status === "played" ? selectedIds : [],
      goals:
        status === "played"
          ? goals.map((g) => ({
              scorer_player_id: g.scorer_player_id,
              assist_player_id: g.assist_player_id || "",
              minute: g.minute,
            }))
          : [],
      cards: status === "played" ? cards : [],
      substitutions: status === "played" && !preserveShapeEvents ? substitutions : [],
      preserve_shape_events: preserveShapeEvents,
      wotm_player_ids: status === "played" ? wotmIds : [],
      wotm_player_id: "",
      lineup,
    };
    return JSON.stringify(payload);
  }, [
    draft.lineupAbsentReasons,
    draft.lineupRoleByPlayer,
    goals,
    cards,
    substitutions,
    preserveShapeEvents,
    goalsAgainst,
    goalsForInput,
    initialMatch.id,
    isHome,
    kickoffLocal,
    lineupPool,
    location,
    matchType,
    mode,
    notes,
    opponent,
    referee,
    seasonId,
    selectedIds,
    status,
    wotmIds,
  ]);

  // Afrondstap: forceer status played (ook als DB-record nog gepland is).
  useEffect(() => {
    if (!afterMatchStep) return;
    if (draft.matchMetaDraft.status !== "played") setStatus("played");
  }, [afterMatchStep, draft.matchMetaDraft.status]);

  // Compact afronden: basis+bank zijn de enige scorers/assists/MVP/kaarten-bron.
  useEffect(() => {
    if (!compactAfterMatch || status !== "played") return;
    const fromLineup = [...initialLineup.starters, ...initialLineup.bench];
    if (fromLineup.length === 0) return;
    setDraft((prev) => {
      let changed = false;
      const next = { ...prev.selectedSquadIds };
      for (const id of fromLineup) {
        if (!next[id]) {
          next[id] = true;
          changed = true;
        }
      }
      return changed ? { ...prev, selectedSquadIds: next } : prev;
    });
  }, [compactAfterMatch, status, initialLineup.starters, initialLineup.bench]);

  const lineupSelectionIncomplete =
    compactAfterMatch &&
    squadMembers.length === 0 &&
    initialLineup.starters.length === 0 &&
    initialLineup.bench.length === 0;

  useEffect(() => {
    if (saveState.status !== "success" || !saveState.matchId) return;
    refreshAfterAdminSave(router);
    const base = `/beheer/wedstrijden/${saveState.matchId}?season=${encodeURIComponent(seasonId)}`;
    if (mode === "create") {
      router.push(`/beheer/wedstrijden?season=${encodeURIComponent(seasonId)}`);
      return;
    }
    if (mode === "edit" && returnToHref) {
      router.push(returnToHref);
      return;
    }
    if (mode === "edit" && workflowStep === "wedstrijd") {
      router.push(`/beheer/wedstrijden?season=${encodeURIComponent(seasonId)}`);
      return;
    }
    if (mode === "edit" && (workflowStep === "na-de-wedstrijd" || workflowStep === "uitslag")) {
      router.push(`${base}&step=controle`);
      return;
    }
    if (mode === "edit" && workflowStep === "controle" && status === "played") {
      router.push(`/beheer/wedstrijden/${saveState.matchId}?season=${encodeURIComponent(seasonId)}`);
    }
  }, [saveState, mode, returnToHref, router, seasonId, workflowStep, status]);

  const busy = savePending || busyGuest;
  const submitBlocked = busy || lineupLiveErrors.length > 0 || (status === "played" && liveErrors.length > 0);
  const fieldErrors = saveState.status === "error" ? saveState.fieldErrors : undefined;
  const goalMsgs = collectGoalFieldMessages(fieldErrors);

  const handleAddGoal = () => setGoals((prev) => [...prev, { scorer_player_id: "", assist_player_id: null, minute: 0 }]);
  const handleGoalUpdate = (idx: number, patch: Partial<GoalEvent>) => setGoals((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  const handleGoalDelete = (idx: number) => setGoals((prev) => prev.filter((_, i) => i !== idx));
  const handleAddCard = () => setCards((prev) => [...prev, { player_id: "", card_type: "yellow", minute: 0 }]);
  const handleCardUpdate = (idx: number, patch: Partial<CardEvent>) => setCards((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  const handleCardDelete = (idx: number) => setCards((prev) => prev.filter((_, i) => i !== idx));
  const handleAddSubstitution = () =>
    setSubstitutions((prev) => [...prev, { player_in_id: "", player_out_id: "", minute: 0 }]);
  const handleSubstitutionUpdate = (idx: number, patch: Partial<SubstitutionEvent>) =>
    setSubstitutions((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  const handleSubstitutionDelete = (idx: number) => setSubstitutions((prev) => prev.filter((_, i) => i !== idx));
  const handleAddGoalForPlayer = (playerId: string) =>
    setGoals((prev) => [...prev, { scorer_player_id: playerId, assist_player_id: null, minute: 0 }]);
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

  const savePreviewText = useMemo(() => {
    const lines = goals.map((g, i) => {
      const scorer = members.find((m) => m.player_id === g.scorer_player_id)?.name ?? "Onbekend";
      const assist = g.assist_player_id ? members.find((m) => m.player_id === g.assist_player_id)?.name ?? "Onbekend" : null;
      return `- Doelpunt #${i + 1}: ${scorer}${assist ? ` (assist van ${assist})` : ""}`;
    });
    const mvpName = formatWotmNamesNl(
      wotmIds.map((id) => members.find((m) => m.player_id === id)?.name ?? "").filter(Boolean),
    );
    return [
      "Je slaat op:",
      `Score: ${goalsForInput}-${goalsAgainst}`,
      "Doelpunten:",
      ...(lines.length ? lines : ["- geen"]),
      `MVP: ${mvpName || "—"}`,
    ].join("\n");
  }, [goals, goalsAgainst, goalsForInput, members, wotmIds]);
  const currentSignature = useMemo(
    () =>
      JSON.stringify({
        status,
        goalsForInput,
        goalsAgainst,
        goals: goals.map((g) => [g.scorer_player_id, g.assist_player_id ?? ""]),
        wotmIds,
      }),
    [goals, goalsAgainst, goalsForInput, status, wotmIds],
  );
  const dirtySinceVerified = !!lastVerifiedSignature && lastVerifiedSignature !== currentSignature;
  const verification = saveState.status === "success" ? (saveState.verification as MatchVerificationPayload | undefined) : undefined;
  const pageTitle =
    mode === "edit"
      ? "Wedstrijd bewerken"
      : defaultStatus === "played"
        ? "Uitslag invoeren"
        : "Wedstrijd plannen";

  useEffect(() => {
    if (saveState.status !== "success" || !saveState.verification) return;
    setDraft((prev) => ({ ...prev, lastVerifiedSnapshot: currentSignature }));
  }, [currentSignature, saveState]);

  return (
    <div className="space-y-8">
      <form
        action={saveAction}
        className="space-y-8"
        onSubmit={(e) => {
          if (status !== "played") return;
          // Afrondstap gaat naar Controleren — geen native confirm daar.
          // Alleen bij definitief afronden (controle) nog een korte bevestiging.
          if (afterMatchStep) return;
          if (workflowStep !== "controle") return;
          if (!confirm(savePreviewText)) e.preventDefault();
        }}
      >
        <input type="hidden" name="payload" value={payloadJson} readOnly />
        <GlassCard className="space-y-0 divide-y divide-zvv-border">
          {showWedstrijd ? (
          <div className="space-y-6 pb-8">
            <div>
              <p className="text-sm font-semibold text-zvv-primary">{pageTitle}</p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">
                Stap 1 — Wedstrijdgegevens
              </h2>
              <p className="mt-1 text-sm text-zvv-muted">
                {status === "played"
                  ? "Wedstrijdgegevens en uitslag. Doelpunten en MVP horen bij afronden."
                  : "Plan de wedstrijd. Opstelling, selectie en uitslag komen later — alleen als jij dat wilt."}
              </p>
            </div>
            {status === "played" ? (
            <div className="sticky top-2 z-10 rounded-2xl border border-zvv-border bg-white/95 p-3 shadow-sm backdrop-blur sm:p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full border border-zvv-border bg-zvv-card-mid px-3 py-1 text-zvv-muted">Doelpunten: {goals.length}</span>
                <span className="rounded-full border border-zvv-border bg-zvv-card-mid px-3 py-1 text-zvv-muted">Assists: {goals.filter((g) => !!g.assist_player_id).length}</span>
                <span className="rounded-full border border-zvv-border bg-zvv-card-mid px-3 py-1 text-zvv-muted">MVP: {formatWotmNamesNl(wotmIds.map((id) => members.find((m) => m.player_id === id)?.name ?? "").filter(Boolean)) || "—"}</span>
                <span className={`rounded-full border px-3 py-1 ${liveErrors.length ? "border-red-300 bg-red-50 text-red-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`}>
                  {liveErrors.length ? `${liveErrors.length} aandachtspunt${liveErrors.length === 1 ? "" : "en"}` : "Validatie in orde"}
                </span>
                <span className={`rounded-full border px-3 py-1 ${goals.length === goalsForInput ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"}`}>
                  Score {goals.length}/{goalsForInput}
                </span>
              </div>
              {verification ? (
                <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  Opgeslagen: {verification.event_goal_count} doelpunten · {verification.event_assist_count} assists · {verification.integrity_state === "verified" ? "alles klopt" : "controleer de uitslag"}
                </div>
              ) : null}
              {dirtySinceVerified ? (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Niet-opgeslagen wijzigingen sinds de laatste opslag.
                </div>
              ) : null}
            </div>
            ) : (
              <div className="rounded-xl border border-zvv-border bg-zvv-card-mid/50 px-4 py-3 text-sm text-zvv-muted">
                Status Gepland: uitslag, doelpuntenmakers, assists en MVP vul je in na de wedstrijd via{" "}
                <strong className="text-zvv-ink">Wedstrijd afronden</strong>.
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-zvv-muted">Tegenstander</span>
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
                <span className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Wedstrijdtype</span>
                <select
                  required
                  value={matchType}
                  onChange={(e) => setMatchType(e.target.value as MatchType)}
                  className={inputCls}
                >
                  <option value="competition">Competitie</option>
                  <option value="cup">Beker</option>
                  <option value="friendly">Oefenwedstrijd</option>
                </select>
                {fieldMessage(fieldErrors, "match_type") ? (
                  <span className="text-xs text-red-600">{fieldMessage(fieldErrors, "match_type")}</span>
                ) : null}
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
              {status === "played" ? (
                <>
                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Doelpunten voor</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      name="goals_for_display"
                      value={goals.length}
                      readOnly
                      className={inputCls}
                      title="Volgt uit het aantal doelpunt-events"
                    />
                    {fieldMessage(fieldErrors, "goals_for") ? (
                      <span className="text-xs text-red-600">{fieldMessage(fieldErrors, "goals_for")}</span>
                    ) : null}
                  </label>
                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Doelpunten tegen</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      name="goals_against"
                      value={goalsAgainst}
                      onChange={(e) => setGoalsAgainst(Math.max(0, Math.min(99, Number(e.target.value) || 0)))}
                      className={inputCls}
                    />
                    {fieldMessage(fieldErrors, "goals_against") ? (
                      <span className="text-xs text-red-600">{fieldMessage(fieldErrors, "goals_against")}</span>
                    ) : null}
                  </label>
                </>
              ) : null}
              <label className="block space-y-2 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Locatie</span>
                <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} placeholder="Optioneel" maxLength={200} />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Scheidsrechter</span>
                <input value={referee} onChange={(e) => setReferee(e.target.value)} className={inputCls} placeholder="Optioneel" maxLength={120} />
              </label>
              <label className="block space-y-2 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Notities</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`${inputCls} min-h-[88px] resize-y`}
                  placeholder="Optioneel — interne toelichting"
                  maxLength={2000}
                />
              </label>
            </div>
          </div>
          ) : null}

          {showSelectie ? (
          <div className="space-y-4 border-t border-zvv-border py-8">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">
                Stap 2 — Wedstrijdselectie
              </h2>
              <p className="mt-1 text-sm text-zvv-muted">
                Alleen de vaste selectie. Gastspeelsters verschijnen pas na <strong>+ Gastspeelster toevoegen</strong>.
                De visuele 1-4-2-3-1-opstelling staat in stap Opstelling.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wider text-zvv-muted">
              <span>Basis: {starterCount}/{MAX_LINEUP_STARTERS}</span>
              <span>Bank: {benchCount}</span>
              <span>Afwezig: {absentCount}</span>
            </div>
            {lineupLiveErrors.length > 0 ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {lineupLiveErrors.join(" ")}
              </div>
            ) : null}
            {fieldMessage(fieldErrors, "lineup") ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {fieldMessage(fieldErrors, "lineup")}
              </div>
            ) : null}
            {lineupPool.length === 0 ? (
              <p className="text-sm text-zvv-muted">Geen seizoensselectie gevonden voor dit seizoen.</p>
            ) : (
              <div className="space-y-2">
                {lineupPool.map((m) => {
                  const role = draft.lineupRoleByPlayer[m.player_id] ?? "";
                  return (
                    <div
                      key={`lineup-${m.player_id}`}
                      className="grid gap-2 rounded-xl border border-zvv-border bg-zvv-card-mid/40 p-3 md:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1fr)] md:items-center"
                    >
                      <div className="min-w-0 text-sm font-medium text-zvv-ink">
                        {m.shirt_number != null ? `#${m.shirt_number}` : "—"} {m.name}
                        {m.position_label ? (
                          <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-zvv-muted">
                            {m.position_label}
                          </span>
                        ) : null}
                      </div>
                      <select
                        value={role}
                        onChange={(e) => {
                          const next = e.target.value as MatchLineupRole | "";
                          if (next === "starter" && role !== "starter" && starterCount >= MAX_LINEUP_STARTERS) return;
                          setLineupRole(m.player_id, next);
                        }}
                        className={inputCls}
                        disabled={busy}
                      >
                        <option value="">Niet geselecteerd</option>
                        <option value="starter">Basis</option>
                        <option value="bench">Bank</option>
                        <option value="absent">Afwezig</option>
                      </select>
                      {role === "absent" ? (
                        <input
                          value={draft.lineupAbsentReasons[m.player_id] ?? ""}
                          onChange={(e) => setLineupAbsentReason(m.player_id, e.target.value)}
                          className={inputCls}
                          placeholder="Reden (optioneel)"
                          maxLength={200}
                          disabled={busy}
                        />
                      ) : (
                        <span className="hidden text-xs text-zvv-muted md:block">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {mode === "edit" && initialMatch.id !== "new" ? (
              <div className="rounded-xl border border-dashed border-zvv-primary/35 bg-zvv-primary-muted/40 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zvv-muted">+ Gastspeelster toevoegen</p>
                <p className="mb-3 text-sm text-zvv-muted">
                  Gasten horen niet in de vaste selectie. Koppel ze alleen voor deze wedstrijd.
                </p>
                <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <select
                    value={rosterPlayerId}
                    onChange={(e) => setRosterPlayerId(e.target.value)}
                    className={`${inputCls} sm:col-span-2 lg:col-span-2`}
                  >
                    <option value="">Bestaande gastspeelster kiezen</option>
                    {availableGuests.map((g) => (
                      <option key={`ag-${g.playerId}`} value={g.playerId}>
                        {g.fullName}
                      </option>
                    ))}
                  </select>
                  <input
                    value={rosterShirt}
                    onChange={(e) => setRosterShirt(e.target.value)}
                    className={inputCls}
                    type="number"
                    min={1}
                    max={99}
                    placeholder="Rugnummer"
                  />
                  <input
                    value={rosterPositionLabel}
                    onChange={(e) => setRosterPositionLabel(e.target.value)}
                    className={inputCls}
                    placeholder="Positie (optioneel)"
                    maxLength={120}
                  />
                  <button
                    type="button"
                    onClick={handleAddRosterPlayer}
                    disabled={busy || !rosterPlayerId}
                    className="club-btn-secondary text-sm font-bold disabled:opacity-40"
                  >
                    {busyGuest ? "Bezig…" : "Gast aan wedstrijd koppelen"}
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className={`${inputCls} sm:col-span-2`}
                    placeholder="Nieuwe gast — volledige naam *"
                  />
                  <input
                    value={guestShirt}
                    onChange={(e) => setGuestShirt(e.target.value)}
                    className={inputCls}
                    type="number"
                    min={1}
                    max={99}
                    placeholder="Rugnummer"
                  />
                  <button
                    type="button"
                    onClick={handleAddGuest}
                    disabled={busy || !guestName.trim()}
                    className="club-btn-primary text-sm font-bold disabled:opacity-40"
                  >
                    {busyGuest ? "Bezig…" : "+ Nieuwe gastspeelster"}
                  </button>
                </div>
                <div className="mt-3">
                  <AdminFormBanner state={guestState} />
                </div>
              </div>
            ) : null}
          </div>
          ) : null}

          {showUitslag && status === "played" ? (
            <>
              <div className="space-y-4 py-8">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink md:text-3xl">
                    {compactAfterMatch ? "Wedstrijd afronden" : "Uitslag en gebeurtenissen"}
                  </h2>
                  <p className="mt-1 text-sm text-zvv-muted">
                    {compactAfterMatch
                      ? "Vul na afloop in een paar stappen de eindstand en belangrijkste gebeurtenissen in. Dit hoeft niet live tijdens de wedstrijd."
                      : "Vul de eindstand, doelpunten, assists en MVP in."}
                  </p>
                </div>

                {/* Eindstand */}
                <div className="rounded-2xl border border-zvv-border bg-gradient-to-br from-zvv-card-mid/80 to-white px-4 py-5 md:px-6">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-zvv-muted">Eindstand</p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3 md:gap-5">
                    <span className="min-w-[7rem] text-center font-[family-name:var(--font-display)] text-xl text-zvv-ink md:text-2xl">
                      {isHome ? CLUB_NAME : opponent || "Tegenstander"}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      name="goals_for"
                      aria-label="Doelpunten voor"
                      value={goalsForInput}
                      onChange={(e) => {
                        const n = Math.max(0, Math.min(99, Number(e.target.value) || 0));
                        setDraft((prev) => {
                          // Compact afronden: geen lege doelpuntrijen auto-genereren — alleen via + Doelpunt toevoegen.
                          if (compactAfterMatch) {
                            const trimmed =
                              prev.eventDraft.length > n ? prev.eventDraft.slice(0, n) : prev.eventDraft;
                            return {
                              ...prev,
                              eventDraft: trimmed,
                              matchMetaDraft: { ...prev.matchMetaDraft, goalsFor: n },
                            };
                          }
                          const prevGoals = prev.eventDraft;
                          let nextGoals = prevGoals;
                          if (prevGoals.length > n) nextGoals = prevGoals.slice(0, n);
                          else if (prevGoals.length < n) {
                            nextGoals = [
                              ...prevGoals,
                              ...Array.from({ length: n - prevGoals.length }, () => ({
                                scorer_player_id: "",
                                assist_player_id: null as string | null,
                                minute: 0,
                              })),
                            ];
                          }
                          return {
                            ...prev,
                            eventDraft: nextGoals,
                            matchMetaDraft: { ...prev.matchMetaDraft, goalsFor: n },
                          };
                        });
                      }}
                      className="h-14 w-16 rounded-xl border border-zvv-border bg-white text-center font-[family-name:var(--font-display)] text-3xl text-zvv-ink md:h-16 md:w-20 md:text-4xl"
                    />
                    <span className="font-[family-name:var(--font-display)] text-3xl text-zvv-ink/40">–</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      name="goals_against"
                      aria-label="Doelpunten tegen"
                      value={goalsAgainst}
                      onChange={(e) => setGoalsAgainst(Math.max(0, Math.min(99, Number(e.target.value) || 0)))}
                      className="h-14 w-16 rounded-xl border border-zvv-border bg-white text-center font-[family-name:var(--font-display)] text-3xl text-zvv-ink md:h-16 md:w-20 md:text-4xl"
                    />
                    <span className="min-w-[7rem] text-center font-[family-name:var(--font-display)] text-xl text-zvv-ink md:text-2xl">
                      {isHome ? opponent || "Tegenstander" : CLUB_NAME}
                    </span>
                  </div>
                  {compactAfterMatch ? (
                    <p className="mt-3 text-center text-sm font-medium text-zvv-ink">
                      {goals.filter((g) => g.scorer_player_id).length} van {goalsForInput} doelpunten ingevoerd
                    </p>
                  ) : goals.length !== goalsForInput ? (
                    <p className="mt-3 text-center text-sm text-amber-800">
                      {goalsForInput} doelpunten voor vereist · {goals.length} ingevoerd
                    </p>
                  ) : null}
                </div>

                {lineupSelectionIncomplete ? (
                  <div
                    className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-amber-950"
                    data-testid="lineup-selection-gate"
                  >
                    <p className="font-semibold">De wedstrijdselectie is nog niet compleet.</p>
                    <p className="mt-1 text-sm">
                      Bevestig eerst basis en bank om doelpuntenmakers, assists, kaarten en MVP te kunnen kiezen.
                    </p>
                    {initialMatch.id && initialMatch.id !== "new" ? (
                      <Link
                        href={matchWorkflowHref(initialMatch.id, seasonId, "opstelling")}
                        className="club-btn-primary club-btn-primary-sm mt-3 inline-flex"
                      >
                        Ga naar Opstelling &amp; selectie
                      </Link>
                    ) : null}
                  </div>
                ) : null}

                {!compactAfterMatch ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {membersSorted.map((m) => (
                    <div key={m.player_id} className={`${toggleCls} items-center justify-between gap-2`}>
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                        <input type="checkbox" checked={!!selected[m.player_id]} onChange={(e) => setSelected((prev) => ({ ...prev, [m.player_id]: e.target.checked }))} className="h-4 w-4 shrink-0 rounded border-zvv-border bg-white text-zvv-primary focus:ring-zvv-primary/30" />
                        <span className="min-w-0 truncate text-sm font-medium text-zvv-ink">
                          {m.shirt_number != null ? `#${m.shirt_number}` : "—"} {m.name}
                          <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-zvv-muted">{m.position_label || ""}</span>
                          {m.is_guest ? <span className="ml-2 rounded border border-zvv-primary/30 bg-zvv-primary-muted px-1.5 py-0.5 text-xs font-black uppercase tracking-wide text-zvv-primary">Gast</span> : null}
                          {!m.has_season_membership ? <span className="ml-2 rounded border border-zvv-border bg-white px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-zvv-muted">Geen seizoenslidmaatschap</span> : null}
                        </span>
                      </label>
                      {m.is_guest && mode === "edit" && initialMatch.id !== "new" ? (
                        <button type="button" onClick={() => handleRemoveGuest(m.player_id)} disabled={busy} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold uppercase tracking-wide text-red-800 hover:bg-red-100 disabled:opacity-40">×</button>
                      ) : null}
                    </div>
                  ))}
                </div>
                ) : !lineupSelectionIncomplete ? (
                  <p className="text-sm text-zvv-muted">
                    Speelsters voor goals, assists, kaarten en MVP: basis en bank ({squadMembers.length}).
                  </p>
                ) : null}
                {!compactAfterMatch && squadMembers.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {squadMembers.map((m) => {
                      const st = liveStats.get(m.player_id) ?? { goals: 0, assists: 0 };
                      const isMvp = wotmIds.includes(m.player_id);
                      return (
                        <div key={`quick-${m.player_id}`} className="rounded-xl border border-zvv-border bg-white p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-zvv-ink">{m.name}</p>
                            <span className="text-xs text-zvv-muted">{st.goals}G · {st.assists}A</span>
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button type="button" className="club-btn-secondary px-3 py-1 text-xs" onClick={() => handleAddGoalForPlayer(m.player_id)} disabled={busy}>+ Doelpunt</button>
                            <button type="button" className="club-btn-secondary px-3 py-1 text-xs" onClick={() => handleQuickAssist(m.player_id)} disabled={busy}>+ Assist</button>
                            <button type="button" className={`rounded-lg border px-2 text-xs font-semibold ${isMvp ? "border-amber-400 bg-amber-50 text-amber-800" : "border-zvv-border bg-zvv-card-mid text-zvv-muted"}`} onClick={() => toggleWotmId(m.player_id)} disabled={busy}>⭐ MVP</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="space-y-4 py-8">
                <div className="flex items-center justify-between gap-3">
                  <p className="club-page-eyebrow">Doelpunten</p>
                  <button
                    type="button"
                    onClick={handleAddGoal}
                    disabled={busy || squadMembers.length === 0 || lineupSelectionIncomplete}
                    className="club-btn-secondary"
                  >
                    + Doelpunt toevoegen
                  </button>
                </div>
                {lineupSelectionIncomplete ? (
                  <p className="rounded-xl border border-zvv-border bg-zvv-card-mid/50 px-3 py-2 text-sm text-zvv-muted">
                    Doelpuntformulieren zijn uitgeschakeld tot de opstelling (basis/bank) is bevestigd.
                  </p>
                ) : null}
                {!lineupSelectionIncomplete
                  ? goals.map((g, idx) => (
                  <div key={`goal-${idx}`} className="grid gap-2 rounded-xl border border-zvv-border bg-zvv-card-mid p-3 md:grid-cols-[5rem_1fr_1fr_auto]">
                    <p className="md:col-span-4 text-xs font-bold uppercase tracking-wider text-zvv-muted">Doelpunt #{idx + 1}</p>
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Minuut</span>
                      <input
                        type="number"
                        min={0}
                        max={130}
                        value={g.minute}
                        onChange={(e) =>
                          handleGoalUpdate(idx, {
                            minute: Math.max(0, Math.min(130, Number(e.target.value) || 0)),
                          })
                        }
                        className={inputCls}
                        disabled={busy}
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Scorer</span>
                      <select value={g.scorer_player_id} onChange={(e) => handleGoalUpdate(idx, { scorer_player_id: e.target.value, assist_player_id: e.target.value === g.assist_player_id ? null : g.assist_player_id })} className={inputCls} disabled={busy}>
                        <option value="">Kies scorer</option>
                        {squadMembers.map((m) => <option key={m.player_id} value={m.player_id}>{m.shirt_number != null ? `#${m.shirt_number} ` : ""}{m.name}</option>)}
                      </select>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Assist</span>
                      <select value={g.assist_player_id ?? ""} onChange={(e) => handleGoalUpdate(idx, { assist_player_id: e.target.value || null })} className={inputCls} disabled={busy}>
                        <option value="">Geen assist</option>
                        {squadMembers
                          .filter((m) => m.player_id !== g.scorer_player_id)
                          .map((m) => <option key={m.player_id} value={m.player_id}>{m.shirt_number != null ? `#${m.shirt_number} ` : ""}{m.name}</option>)}
                      </select>
                    </label>
                    <button type="button" onClick={() => handleGoalDelete(idx)} disabled={busy} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-40">Verwijder</button>
                  </div>
                ))
                  : null}
                {goalMsgs.length > 0 ? <ul className="list-inside list-disc space-y-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{goalMsgs.map((msg, i) => <li key={`${msg}-${i}`}>{msg}</li>)}</ul> : null}
                {liveWarnings.length > 0 ? <ul className="list-inside list-disc space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{liveWarnings.map((msg) => <li key={msg}>{msg}</li>)}</ul> : null}
                <div className="rounded-xl border border-zvv-border bg-white p-4 text-sm">
                  <p className="font-semibold text-zvv-ink">Voorbeeld: doelpunten {goals.length}/{goalsForInput}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {squadMembers.map((m) => {
                      const st = liveStats.get(m.player_id) ?? { goals: 0, assists: 0 };
                      return <div key={m.player_id} className="rounded-lg border border-zvv-border px-3 py-2 text-xs"><p className="font-semibold text-zvv-ink">{m.name}</p><p className="text-zvv-muted">Doelpunten {st.goals} · Assists {st.assists}</p></div>;
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4 py-8">
                <div className="flex items-center justify-between gap-3">
                  <p className="club-page-eyebrow">Kaarten</p>
                  <button type="button" onClick={handleAddCard} disabled={busy || squadMembers.length === 0} className="club-btn-secondary">
                    + Kaart toevoegen
                  </button>
                </div>
                {fieldMessage(fieldErrors, "cards") ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {fieldMessage(fieldErrors, "cards")}
                  </div>
                ) : null}
                {cards.map((c, idx) => (
                  <div key={`card-${idx}`} className="grid gap-2 rounded-xl border border-zvv-border bg-zvv-card-mid p-3 md:grid-cols-[5rem_1fr_8rem_auto]">
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Minuut</span>
                      <input
                        type="number"
                        min={0}
                        max={130}
                        value={c.minute}
                        onChange={(e) =>
                          handleCardUpdate(idx, {
                            minute: Math.max(0, Math.min(130, Number(e.target.value) || 0)),
                          })
                        }
                        className={inputCls}
                        disabled={busy}
                      />
                    </label>
                    <select
                      value={c.player_id}
                      onChange={(e) => handleCardUpdate(idx, { player_id: e.target.value })}
                      className={inputCls}
                      disabled={busy}
                    >
                      <option value="">Kies speelster</option>
                      {squadMembers.map((m) => (
                        <option key={m.player_id} value={m.player_id}>
                          {m.shirt_number != null ? `#${m.shirt_number} ` : ""}
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={c.card_type}
                      onChange={(e) => handleCardUpdate(idx, { card_type: e.target.value as MatchCardType })}
                      className={inputCls}
                      disabled={busy}
                    >
                      <option value="yellow">Gele kaart</option>
                      <option value="red">Rode kaart</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleCardDelete(idx)}
                      disabled={busy}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-40"
                    >
                      Verwijder
                    </button>
                  </div>
                ))}
              </div>

              {!preserveShapeEvents ? (
              <div className="space-y-4 py-8">
                <div className="flex items-center justify-between gap-3">
                  <p className="club-page-eyebrow">Wissels</p>
                  <button
                    type="button"
                    onClick={handleAddSubstitution}
                    disabled={busy || squadMembers.length === 0}
                    className="club-btn-secondary"
                  >
                    + Wissel toevoegen
                  </button>
                </div>
                {fieldMessage(fieldErrors, "substitutions") ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {fieldMessage(fieldErrors, "substitutions")}
                  </div>
                ) : null}
                {substitutions.map((s, idx) => (
                  <div
                    key={`sub-${idx}`}
                    className="grid gap-2 rounded-xl border border-zvv-border bg-zvv-card-mid p-3 md:grid-cols-[5rem_1fr_1fr_auto]"
                  >
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zvv-muted">Minuut</span>
                      <input
                        type="number"
                        min={0}
                        max={130}
                        value={s.minute}
                        onChange={(e) =>
                          handleSubstitutionUpdate(idx, {
                            minute: Math.max(0, Math.min(130, Number(e.target.value) || 0)),
                          })
                        }
                        className={inputCls}
                        disabled={busy}
                      />
                    </label>
                    <select
                      value={s.player_out_id}
                      onChange={(e) => handleSubstitutionUpdate(idx, { player_out_id: e.target.value })}
                      className={inputCls}
                      disabled={busy}
                    >
                      <option value="">Speelster eruit</option>
                      {squadMembers.map((m) => (
                        <option key={m.player_id} value={m.player_id}>
                          {m.shirt_number != null ? `#${m.shirt_number} ` : ""}
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={s.player_in_id}
                      onChange={(e) => handleSubstitutionUpdate(idx, { player_in_id: e.target.value })}
                      className={inputCls}
                      disabled={busy}
                    >
                      <option value="">Speelster erin</option>
                      {squadMembers.map((m) => (
                        <option key={m.player_id} value={m.player_id}>
                          {m.shirt_number != null ? `#${m.shirt_number} ` : ""}
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleSubstitutionDelete(idx)}
                      disabled={busy}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-40"
                    >
                      Verwijder
                    </button>
                  </div>
                ))}
              </div>
              ) : (
                <p className="py-4 text-sm text-zvv-muted">
                  Wissels en positiewijzigingen beheer je in het blok hierboven.
                </p>
              )}

              <div className="space-y-4 py-8">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">
                    Stap 4 — MVP en controle
                  </h2>
                  <p className="mt-1 text-sm text-zvv-muted">
                    Kies één of meer speelsters van de wedstrijd. Controleer of de eindstand overeenkomt met de doelpunten vóór het opslaan.
                  </p>
                </div>
                <fieldset className="space-y-2" disabled={busy || squadMembers.length === 0}>
                  <legend className="text-sm font-medium text-zvv-muted">Speelsters van de wedstrijd</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {squadMembers.map((m) => {
                      const checked = wotmIds.includes(m.player_id);
                      return (
                        <label key={`mvp-${m.player_id}`} className={toggleCls}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleWotmId(m.player_id)}
                            className="h-4 w-4 accent-amber-600"
                          />
                          <span className="text-sm font-semibold text-zvv-ink">
                            {m.shirt_number != null ? `#${m.shirt_number} ` : ""}
                            {m.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <div className="rounded-xl border border-zvv-border bg-white p-4 text-sm text-zvv-ink">
                  <p className="font-semibold">Samenvatting</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-zvv-muted">
                    <li>Eindstand: {goalsForInput}–{goalsAgainst}</li>
                    <li>Doelpunten ingevoerd: {goals.length}</li>
                    <li>Assists: {goals.filter((g) => !!g.assist_player_id).length}</li>
                    <li>MVP: {formatWotmNamesNl(wotmIds.map((id) => members.find((m) => m.player_id === id)?.name ?? "").filter(Boolean)) || "Nog niet gekozen"}</li>
                  </ul>
                </div>
              </div>
            </>
          ) : null}

          <div className="space-y-4 pt-8">
            {liveErrors.length > 0 ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert"><ul className="list-inside list-disc space-y-1">{liveErrors.map((e) => <li key={e}>{e}</li>)}</ul></div> : null}
            <FormStatusBanner state={saveState} />
            <AdminSaveBar
              status={
                savePending
                  ? "saving"
                  : saveState.status === "error"
                    ? "error"
                    : !verification || dirtySinceVerified
                      ? "dirty"
                      : saveState.status === "success"
                        ? "saved"
                        : "idle"
              }
              primaryLabel={
                mode === "create" || workflowStep === "wedstrijd"
                  ? "Opslaan"
                  : afterMatchStep
                    ? "Controleren en afronden"
                    : workflowStep === "controle"
                      ? "Wedstrijd definitief afronden"
                      : status === "played"
                        ? "Uitslag opslaan"
                        : "Wijzigingen opslaan"
              }
              primaryDisabled={submitBlocked}
              summary={
                status === "played"
                  ? `Uitslag ${goalsForInput}–${goalsAgainst} · ${goals.length} doelpunten`
                  : "Gepland — opstelling later optioneel, geen uitslag vereist"
              }
              secondary={
                <span className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/beheer/wedstrijden?season=${encodeURIComponent(seasonId)}`}
                    className="club-btn-secondary club-btn-primary-sm inline-flex min-h-[44px] items-center"
                  >
                    Terug naar wedstrijden
                  </Link>
                  {mode === "edit" && initialMatch.id !== "new" && status !== "played" ? (
                    <Link
                      href={`/beheer/wedstrijden/${initialMatch.id}?season=${encodeURIComponent(seasonId)}&step=opstelling`}
                      className="text-sm font-semibold text-zvv-primary underline"
                    >
                      Opstelling later maken
                    </Link>
                  ) : null}
                </span>
              }
            />
          </div>
        </GlassCard>
      </form>

      {mode === "edit" && initialMatch.id !== "new" ? (
        <GlassCard className="border-red-200">
          <p className="text-sm font-medium text-zvv-ink">Gevaarlijke zone</p>
          <p className="mt-1 text-sm text-zvv-muted">
            Verwijder een foutieve of overbodige wedstrijd. Alleen hoofdbeheer kan dit definitief uitvoeren.
          </p>
          <div className="mt-4">
            <MatchDeleteDialog
              matchId={initialMatch.id}
              opponent={opponent || initialMatch.opponent}
              kickoffAt={initialMatch.kickoff_at}
              status={status}
              hasStats={
                status === "played" ||
                goals.length > 0 ||
                Number(goalsForInput) > 0 ||
                Number(goalsAgainst) > 0
              }
              seasonId={seasonId}
              triggerLabel="Wedstrijd verwijderen"
            />
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}
