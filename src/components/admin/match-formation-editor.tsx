"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FORMATION_4231_SLOTS, type FormationSlotCode } from "@/lib/match/formation-4231";
import { validateConfirmedFormation } from "@/lib/match/match-shape";
import {
  assignPlayerToSlot,
  locationOfPlayer,
  moveToAbsent as draftToAbsent,
  moveToBench as draftToBench,
  type LineupDraft,
  unassignPlayer,
} from "@/lib/match/lineup-assignment";
import {
  futureConfirmedLineupIsEditable,
  shouldStayOnLineupEditorAfterSave,
} from "@/lib/match/lineup-editability";
import { saveMatchFormationAction } from "@/actions/match-formation";
import { FormationPitch } from "@/components/match/formation-pitch";
import { MatchPlayerPicker, type PickerPlayer } from "@/components/admin/match-player-picker";
import { PlayerPhotoAvatar } from "@/components/players/player-photo-avatar";
import { sortPlayersBySquadNumber } from "@/lib/players/sort-by-squad-number";
import { matchWorkflowHref } from "@/lib/match/match-workflow-steps";

type PlayerOpt = PickerPlayer;
type SelectionTab = "basis" | "bank" | "absent" | "unassigned";

type LineupDialog =
  | { kind: "pick-player"; slot: FormationSlotCode }
  | { kind: "occupied"; slot: FormationSlotCode }
  | { kind: "move-slot"; playerId: string; fromSlot: FormationSlotCode | null }
  | { kind: "swap-pick"; slot: FormationSlotCode }
  | { kind: "replace-pick"; slot: FormationSlotCode }
  | {
      kind: "conflict";
      playerId: string;
      target: FormationSlotCode;
      occupantId: string;
    }
  | { kind: "field-pick"; playerId: string }
  | null;

function RowActions({ children }: { children: ReactNode }) {
  return (
    <details className="relative shrink-0">
      <summary
        className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-lg leading-none text-zvv-muted hover:bg-zvv-card-mid [&::-webkit-details-marker]:hidden"
        aria-label="Acties"
      >
        ⋮
      </summary>
      <div className="absolute right-0 z-20 mt-1 flex min-w-[9rem] flex-col rounded-xl border border-zvv-border bg-white p-1 shadow-lg">
        {children}
      </div>
    </details>
  );
}

function actionBtnClass(tone: "default" | "danger" = "default") {
  return tone === "danger"
    ? "w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-red-700 hover:bg-red-50"
    : "w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-zvv-ink hover:bg-zvv-card-mid";
}

function sortIds(ids: string[], byId: Record<string, PlayerOpt | undefined>): string[] {
  return sortPlayersBySquadNumber(ids.map((id) => byId[id]).filter((p): p is PlayerOpt => !!p)).map((p) => p.player_id);
}

export function MatchFormationEditor({
  matchId,
  seasonId,
  players,
  initialSlots,
  initialBench,
  initialAbsent,
  initialStatus,
  matchStatus,
  guestPanel,
}: {
  matchId: string;
  seasonId: string;
  players: PlayerOpt[];
  initialSlots: Partial<Record<FormationSlotCode, string | null>>;
  initialBench: string[];
  initialAbsent?: string[];
  initialStatus: "draft" | "confirmed";
  matchStatus: string;
  guestPanel?: ReactNode;
}) {
  const router = useRouter();
  const sortedPlayers = useMemo(() => sortPlayersBySquadNumber(players), [players]);
  const [slots, setSlots] = useState<Record<FormationSlotCode, string | null>>(() => {
    const base = Object.fromEntries(FORMATION_4231_SLOTS.map((s) => [s.code, null])) as Record<
      FormationSlotCode,
      string | null
    >;
    for (const s of FORMATION_4231_SLOTS) {
      base[s.code] = initialSlots[s.code] ?? null;
    }
    return base;
  });
  const [bench, setBench] = useState<string[]>(() =>
    sortPlayersBySquadNumber(
      initialBench
        .map((id) => players.find((p) => p.player_id === id))
        .filter((p): p is PlayerOpt => !!p),
    ).map((p) => p.player_id),
  );
  const [absent, setAbsent] = useState<string[]>(() =>
    sortPlayersBySquadNumber(
      (initialAbsent ?? [])
        .map((id) => players.find((p) => p.player_id === id))
        .filter((p): p is PlayerOpt => !!p),
    ).map((p) => p.player_id),
  );
  const [dialog, setDialog] = useState<LineupDialog>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [guestOpen, setGuestOpen] = useState(false);
  const [tab, setTab] = useState<SelectionTab>("basis");
  const [pending, startTransition] = useTransition();

  const used = useMemo(
    () => new Set([...Object.values(slots).filter(Boolean), ...bench, ...absent] as string[]),
    [slots, bench, absent],
  );

  const unassigned = sortedPlayers.filter((p) => !used.has(p.player_id));
  const freeSlots = FORMATION_4231_SLOTS.filter((s) => !slots[s.code]);
  const byId = useMemo(
    () => Object.fromEntries(sortedPlayers.map((p) => [p.player_id, p])),
    [sortedPlayers],
  );
  const starters = FORMATION_4231_SLOTS.flatMap((s) => {
    const id = slots[s.code];
    const player = id ? byId[id] : null;
    return player ? [{ player, slot: s }] : [];
  });
  const pitchPlayersById = useMemo(
    () =>
      Object.fromEntries(
        sortedPlayers.map((p) => [
          p.player_id,
          {
            player_id: p.player_id,
            name: p.name,
            shirt_number: p.shirt_number,
            photo_url: p.photo_url ?? null,
            is_captain: !!p.is_captain,
            is_vice_captain: !!p.is_vice_captain,
          },
        ]),
      ),
    [sortedPlayers],
  );

  const draft: LineupDraft = { slots, bench, absent };

  function commit(next: LineupDraft) {
    setSlots(next.slots);
    setBench(sortIds(next.bench, byId));
    setAbsent(sortIds(next.absent, byId));
  }

  function hintFor(player: PickerPlayer): string {
    const loc = locationOfPlayer(draft, player.player_id);
    if (loc.kind === "field") return `Op het veld · ${loc.slot}`;
    if (loc.kind === "bench") return "Bank";
    if (loc.kind === "absent") return "Afwezig";
    return player.position_label || (player.is_guest ? "Gast" : "Nog indelen");
  }

  function requestFieldPick(playerId: string) {
    setMessage(null);
    setDialog({ kind: "field-pick", playerId });
  }

  function onSlotClick(code: FormationSlotCode) {
    setMessage(null);
    if (slots[code]) setDialog({ kind: "occupied", slot: code });
    else setDialog({ kind: "pick-player", slot: code });
  }

  function placeOnSlot(playerId: string, target: FormationSlotCode, mode?: "swap" | "replace") {
    const result = assignPlayerToSlot(draft, playerId, target, mode);
    if (!result.ok) {
      setDialog({ kind: "conflict", playerId, target, occupantId: result.occupantId });
      return;
    }
    commit(result.draft);
    setDialog(null);
  }

  function renderPlayerRow(player: PlayerOpt, meta: string | null, actions: ReactNode) {
    return (
      <li key={player.player_id} className="flex min-h-[42px] items-center gap-2 rounded-lg px-1 py-0.5">
        <PlayerPhotoAvatar
          playerId={player.player_id}
          name={player.name}
          photoUrl={player.photo_url}
          shirtNumber={player.shirt_number}
          className="h-9 w-9"
          sizes="36px"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-zvv-ink">
            {player.shirt_number != null ? `#${player.shirt_number} ` : ""}
            {player.name}
            {player.is_captain ? " · C" : player.is_vice_captain ? " · VC" : ""}
          </span>
          {meta ? <span className="block truncate text-[11px] text-zvv-muted">{meta}</span> : null}
        </span>
        {actions}
      </li>
    );
  }

  function moveToBench(playerId: string) {
    commit(draftToBench(draft, playerId));
    setDialog(null);
  }

  function moveToAbsent(playerId: string) {
    commit(draftToAbsent(draft, playerId));
    setDialog(null);
  }

  function clearFromAll(playerId: string) {
    commit(unassignPlayer(draft, playerId));
    setDialog(null);
  }

  function save(confirm: boolean) {
    setMessage(null);
    if (confirm) {
      const v = validateConfirmedFormation(slots, bench);
      if (!v.ok) {
        setMessage(v.error);
        return;
      }
      if (unassigned.length > 0) {
        setMessage(`Nog ${unassigned.length} speelster(s) indelen als Bank of Afwezig.`);
        return;
      }
      const overlap = bench.filter((id) => absent.includes(id));
      if (overlap.length) {
        setMessage("Een speelster kan niet tegelijk bank en afwezig zijn.");
        return;
      }
    }
    startTransition(async () => {
      const res = await saveMatchFormationAction({
        match_id: matchId,
        season_id: seasonId,
        slots,
        bench,
        absent,
        confirm,
      });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      if (confirm) {
        if (matchStatus === "played") {
          setMessage("Opstelling bevestigd — ga verder met Na de wedstrijd.");
          queueMicrotask(() => {
            router.push(matchWorkflowHref(matchId, seasonId, "na-de-wedstrijd", { finish: "1" }));
            router.refresh();
          });
          return;
        }
        if (shouldStayOnLineupEditorAfterSave(matchStatus)) {
          setMessage("Opstelling bijgewerkt. Je kunt tot de wedstrijd nog wijzigen.");
          queueMicrotask(() => router.refresh());
          return;
        }
      }
      setMessage(confirm ? "Opstelling bevestigd." : "Concept bewaard.");
      queueMicrotask(() => router.refresh());
    });
  }

  const confirmedFuture = futureConfirmedLineupIsEditable(matchStatus, initialStatus);

  const pickerSlot = dialog?.kind === "pick-player" ? dialog.slot : dialog?.kind === "replace-pick" ? dialog.slot : null;
  const slotLabel = pickerSlot
    ? FORMATION_4231_SLOTS.find((s) => s.code === pickerSlot)?.labelNl ?? pickerSlot
    : "";
  const occupiedPlayerId = dialog?.kind === "occupied" ? slots[dialog.slot] : null;
  const movePlayerId = dialog?.kind === "move-slot" ? dialog.playerId : null;

  return (
    <section className="space-y-5 rounded-2xl border border-zvv-border bg-white p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zvv-primary">Opstelling & selectie</p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-zvv-ink md:text-3xl">
            1-4-2-3-1 · basis, bank en afwezig
          </h2>
          <p className="mt-1 text-sm text-zvv-muted">
            Status:{" "}
            {confirmedFuture
              ? "Bevestigd — tot de wedstrijd nog wijzigbaar"
              : initialStatus === "confirmed"
                ? "Bevestigd"
                : "Concept"}{" "}
            · tik een speelster om te verplaatsen, verwisselen of vervangen
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {confirmedFuture ? (
            <button type="button" disabled={pending} onClick={() => save(true)} className="club-btn-primary club-btn-primary-sm">
              Wijzigingen opslaan
            </button>
          ) : (
            <>
              <button type="button" disabled={pending} onClick={() => save(false)} className="club-btn-secondary club-btn-primary-sm">
                Concept bewaren
              </button>
              <button type="button" disabled={pending} onClick={() => save(true)} className="club-btn-primary club-btn-primary-sm">
                Opstelling bevestigen
              </button>
            </>
          )}
        </div>
      </div>

      {message ? (
        <p className="rounded-xl border border-zvv-border bg-zvv-card-mid/60 px-3 py-2 text-sm font-medium text-zvv-ink" role="status">
          {message}
        </p>
      ) : null}

      <div
        className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] xl:items-start"
        data-lineup-workspace
      >
        <div className="min-w-0">
          <FormationPitch
            title=""
            interactive
            size="workspace"
            activeSlot={pickerSlot ?? (dialog?.kind === "occupied" ? dialog.slot : null)}
            onSlotClick={onSlotClick}
            slots={slots}
            playersById={pitchPlayersById}
          />
        </div>

        <aside
          className="xl:sticky xl:top-24"
          data-testid="lineup-selection-panel"
          data-selection-panel
        >
          <div className="flex flex-col overflow-hidden rounded-2xl border border-zvv-border bg-white xl:max-h-[min(780px,62vh)]">
            <div className="border-b border-zvv-border px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-zvv-primary">Selectie</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold">
                {(
                  [
                    ["basis", `Basis (${starters.length})`, false],
                    ["bank", `Bank (${bench.length})`, false],
                    ["absent", `Afwezig (${absent.length})`, false],
                    ["unassigned", `Nog indelen (${unassigned.length})`, unassigned.length > 0],
                  ] as const
                ).map(([id, label, warn]) => (
                  <button
                    key={id}
                    type="button"
                    data-selection-tab={id}
                    aria-pressed={tab === id}
                    onClick={() => setTab(id)}
                    className={
                      tab === id
                        ? "rounded-full bg-zvv-primary px-2.5 py-1 text-white"
                        : warn
                          ? "rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-amber-950"
                          : "rounded-full border border-zvv-border bg-white px-2.5 py-1 text-zvv-ink"
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              {tab === "basis" ? (
                <ul className="space-y-0.5">
                  {starters.map(({ player, slot }) =>
                    renderPlayerRow(
                      player,
                      slot.code,
                      <RowActions>
                        <button type="button" className={actionBtnClass()} onClick={() => setDialog({ kind: "occupied", slot: slot.code })}>
                          Bewerk
                        </button>
                        <button type="button" className={actionBtnClass()} onClick={() => moveToBench(player.player_id)}>
                          Bank
                        </button>
                        <button type="button" className={actionBtnClass()} onClick={() => moveToAbsent(player.player_id)}>
                          Afwezig
                        </button>
                        <button
                          type="button"
                          className={actionBtnClass("danger")}
                          onClick={() => clearFromAll(player.player_id)}
                        >
                          Nog indelen
                        </button>
                      </RowActions>,
                    ),
                  )}
                  {starters.length === 0 ? (
                    <li className="px-1 py-3 text-sm text-zvv-muted">
                      Nog geen speelsters op het veld. Klik een positie.
                    </li>
                  ) : null}
                </ul>
              ) : null}

              {tab === "bank" ? (
                <ul className="space-y-0.5">
                  {sortPlayersBySquadNumber(bench.map((id) => byId[id]!).filter(Boolean)).map((p) =>
                    renderPlayerRow(
                      p,
                      "Bank",
                      <RowActions>
                        <button type="button" className={actionBtnClass()} onClick={() => requestFieldPick(p.player_id)}>
                          Op veld
                        </button>
                        <button type="button" className={actionBtnClass()} onClick={() => moveToAbsent(p.player_id)}>
                          Afwezig
                        </button>
                        <button
                          type="button"
                          className={actionBtnClass("danger")}
                          onClick={() => clearFromAll(p.player_id)}
                        >
                          Nog indelen
                        </button>
                      </RowActions>,
                    ),
                  )}
                  {bench.length === 0 ? <li className="px-1 py-3 text-sm text-zvv-muted">Nog niemand op de bank.</li> : null}
                </ul>
              ) : null}

              {tab === "absent" ? (
                <ul className="space-y-0.5">
                  {sortPlayersBySquadNumber(absent.map((id) => byId[id]!).filter(Boolean)).map((p) =>
                    renderPlayerRow(
                      p,
                      "Afwezig",
                      <RowActions>
                        <button type="button" className={actionBtnClass()} onClick={() => requestFieldPick(p.player_id)}>
                          Op veld
                        </button>
                        <button type="button" className={actionBtnClass()} onClick={() => moveToBench(p.player_id)}>
                          Bank
                        </button>
                        <button
                          type="button"
                          className={actionBtnClass("danger")}
                          onClick={() => clearFromAll(p.player_id)}
                        >
                          Nog indelen
                        </button>
                      </RowActions>,
                    ),
                  )}
                  {absent.length === 0 ? <li className="px-1 py-3 text-sm text-zvv-muted">Niemand afwezig.</li> : null}
                </ul>
              ) : null}

              {tab === "unassigned" ? (
                unassigned.length > 0 ? (
                  <ul className="space-y-0.5">
                    {unassigned.map((p) =>
                      renderPlayerRow(
                        p,
                        p.position_label || (p.is_guest ? "Gast" : "Nog indelen"),
                        <RowActions>
                          <button type="button" className={actionBtnClass()} onClick={() => requestFieldPick(p.player_id)}>
                            Op veld
                          </button>
                          <button type="button" className={actionBtnClass()} onClick={() => moveToBench(p.player_id)}>
                            Bank
                          </button>
                          <button type="button" className={actionBtnClass()} onClick={() => moveToAbsent(p.player_id)}>
                            Afwezig
                          </button>
                        </RowActions>,
                      ),
                    )}
                  </ul>
                ) : (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                    Iedereen is ingedeeld: basis · bank · afwezig.
                  </p>
                )
              ) : null}
            </div>

            {guestPanel ? (
              <div className="border-t border-dashed border-zvv-primary/35 p-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left text-sm font-semibold text-zvv-primary"
                  onClick={() => setGuestOpen((v) => !v)}
                >
                  <span>+ Gastspeelster toevoegen</span>
                  <span className="text-xs font-normal text-zvv-muted">{guestOpen ? "Inklappen" : "Openen"}</span>
                </button>
                {guestOpen ? <div className="mt-3">{guestPanel}</div> : null}
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      <MatchPlayerPicker
        open={dialog?.kind === "pick-player" || dialog?.kind === "replace-pick" || dialog?.kind === "swap-pick"}
        title={
          dialog?.kind === "swap-pick"
            ? "Verwissel met"
            : dialog?.kind === "replace-pick"
              ? `${dialog.slot} · vervang`
              : pickerSlot
                ? `${pickerSlot} · ${slotLabel}`
                : "Positie"
        }
        players={
          dialog?.kind === "swap-pick"
            ? sortedPlayers.filter((p) => locationOfPlayer(draft, p.player_id).kind === "field" && slots[dialog.slot] !== p.player_id)
            : dialog?.kind === "replace-pick"
              ? sortedPlayers.filter((p) => {
                  const loc = locationOfPlayer(draft, p.player_id);
                  return loc.kind === "bench" || loc.kind === "unassigned";
                })
              : sortedPlayers
        }
        playerHint={hintFor}
        allowClear={dialog?.kind === "pick-player"}
        onClose={() => setDialog(null)}
        onPick={(id) => {
          if (dialog?.kind === "swap-pick") {
            if (!id) return;
            placeOnSlot(id, dialog.slot, "swap");
            return;
          }
          if (dialog?.kind === "replace-pick") {
            if (!id) return;
            placeOnSlot(id, dialog.slot, "replace");
            return;
          }
          if (dialog?.kind !== "pick-player") return;
          if (!id) {
            const occupant = slots[dialog.slot];
            if (occupant) clearFromAll(occupant);
            else setDialog(null);
            return;
          }
          placeOnSlot(id, dialog.slot);
        }}
      />

      {dialog?.kind === "occupied" && occupiedPlayerId ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Speelster bewerken"
        >
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Sluiten" onClick={() => setDialog(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-zvv-border bg-white p-4 shadow-xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-zvv-primary">{dialog.slot}</p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl text-zvv-ink">
              {byId[occupiedPlayerId]?.name ?? "Speelster"}
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-2" data-testid="lineup-occupied-actions">
              <button
                type="button"
                className="club-btn-primary club-btn-primary-sm"
                onClick={() => setDialog({ kind: "move-slot", playerId: occupiedPlayerId, fromSlot: dialog.slot })}
              >
                Verplaats
              </button>
              <button type="button" className="club-btn-secondary club-btn-primary-sm" onClick={() => setDialog({ kind: "swap-pick", slot: dialog.slot })}>
                Verwisselen
              </button>
              <button type="button" className="club-btn-secondary club-btn-primary-sm" onClick={() => moveToBench(occupiedPlayerId)}>
                Naar bank
              </button>
              <button type="button" className="club-btn-secondary club-btn-primary-sm" onClick={() => setDialog({ kind: "replace-pick", slot: dialog.slot })}>
                Vervangen
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <button type="button" className="flex-1 rounded-xl border border-zvv-border px-3 py-2 text-sm font-semibold" onClick={() => moveToAbsent(occupiedPlayerId)}>
                Afwezig
              </button>
              <button type="button" className="flex-1 rounded-xl border border-zvv-border px-3 py-2 text-sm font-semibold" onClick={() => clearFromAll(occupiedPlayerId)}>
                Nog indelen
              </button>
            </div>
            <button type="button" className="club-btn-secondary club-btn-primary-sm mt-3 w-full" onClick={() => setDialog(null)}>
              Annuleren
            </button>
          </div>
        </div>
      ) : null}

      {dialog?.kind === "move-slot" && movePlayerId ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Kies veldpositie"
        >
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Sluiten" onClick={() => setDialog(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-zvv-border bg-white p-4 shadow-xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-zvv-primary">Verplaats</p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl text-zvv-ink">
              {byId[movePlayerId]?.name ?? "Speelster"} · kies positie
            </h3>
            <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FORMATION_4231_SLOTS.filter((s) => s.code !== dialog.fromSlot).map((s) => {
                const occupant = slots[s.code];
                return (
                  <li key={s.code}>
                    <button
                      type="button"
                      className="flex min-h-11 w-full flex-col items-center justify-center rounded-xl border border-zvv-border px-2 py-2 text-sm font-semibold hover:border-zvv-primary/40 hover:bg-zvv-primary-muted"
                      onClick={() => placeOnSlot(movePlayerId, s.code)}
                    >
                      <span className="text-zvv-primary">{s.code}</span>
                      <span className="text-[11px] font-normal text-zvv-muted">
                        {occupant ? byId[occupant]?.name ?? "Bezet" : s.labelNl}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <button type="button" className="club-btn-secondary club-btn-primary-sm mt-4" onClick={() => setDialog(null)}>
              Annuleren
            </button>
          </div>
        </div>
      ) : null}

      {dialog?.kind === "conflict" ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Positie bezet"
        >
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Sluiten" onClick={() => setDialog(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-zvv-border bg-white p-4 shadow-xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-zvv-primary">{dialog.target} is bezet</p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl text-zvv-ink">
              {byId[dialog.occupantId]?.name ?? "Speelster"} staat hier
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="club-btn-primary club-btn-primary-sm" onClick={() => placeOnSlot(dialog.playerId, dialog.target, "swap")}>
                Verwisselen
              </button>
              <button type="button" className="club-btn-secondary club-btn-primary-sm" onClick={() => placeOnSlot(dialog.playerId, dialog.target, "replace")}>
                Vervangen
              </button>
            </div>
            <p className="mt-3 text-xs text-zvv-muted">
              Verwisselen ruilt de posities. Vervangen zet de huidige speelster op de bank.
            </p>
            <button type="button" className="club-btn-secondary club-btn-primary-sm mt-3 w-full" onClick={() => setDialog(null)}>
              Annuleren
            </button>
          </div>
        </div>
      ) : null}

      {dialog?.kind === "field-pick" ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Kies veldpositie"
        >
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Sluiten" onClick={() => setDialog(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-zvv-border bg-white p-4 shadow-xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-zvv-primary">Op veld zetten</p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl text-zvv-ink">
              {byId[dialog.playerId]?.name ?? "Speelster"} · kies positie
            </h3>
            <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FORMATION_4231_SLOTS.map((s) => {
                const occupant = slots[s.code];
                return (
                  <li key={s.code}>
                    <button
                      type="button"
                      className="flex min-h-11 w-full flex-col items-center justify-center rounded-xl border border-zvv-border px-2 py-2 text-sm font-semibold hover:border-zvv-primary/40 hover:bg-zvv-primary-muted"
                      onClick={() => placeOnSlot(dialog.playerId, s.code, occupant ? "replace" : undefined)}
                    >
                      <span className="text-zvv-primary">{s.code}</span>
                      <span className="text-[11px] font-normal text-zvv-muted">
                        {occupant ? byId[occupant]?.name ?? "Bezet" : s.labelNl}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {freeSlots.length === 0 ? (
              <p className="mt-3 text-sm text-zvv-muted">Alle plaatsen bezet — tik een positie om te vervangen.</p>
            ) : null}
            <button type="button" className="club-btn-secondary club-btn-primary-sm mt-4" onClick={() => setDialog(null)}>
              Annuleren
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
