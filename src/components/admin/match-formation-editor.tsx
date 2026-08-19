"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FORMATION_4231_SLOTS, type FormationSlotCode } from "@/lib/match/formation-4231";
import { validateConfirmedFormation } from "@/lib/match/match-shape";
import { saveMatchFormationAction } from "@/actions/match-formation";
import { FormationPitch } from "@/components/match/formation-pitch";
import { MatchPlayerPicker, type PickerPlayer } from "@/components/admin/match-player-picker";
import { PlayerPhotoAvatar } from "@/components/players/player-photo-avatar";
import { sortPlayersBySquadNumber } from "@/lib/players/sort-by-squad-number";
import { matchWorkflowHref } from "@/lib/match/match-workflow-steps";

type PlayerOpt = PickerPlayer;
type SelectionTab = "basis" | "bank" | "absent" | "unassigned";

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
  const [pickerSlot, setPickerSlot] = useState<FormationSlotCode | null>(null);
  /** Speler uit "Nog indelen" die een vrij veldslot moet kiezen */
  const [fieldPickPlayerId, setFieldPickPlayerId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [prepComplete, setPrepComplete] = useState(false);
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

  function requestFieldPick(playerId: string) {
    if (freeSlots.length === 0) {
      setMessage("Alle elf veldplaatsen zijn bezet. Maak eerst een slot leeg.");
      return;
    }
    setFieldPickPlayerId(playerId);
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

  function clearFromAll(playerId: string) {
    setSlots((prev) => {
      const next = { ...prev };
      for (const s of FORMATION_4231_SLOTS) {
        if (next[s.code] === playerId) next[s.code] = null;
      }
      return next;
    });
    setBench((b) => b.filter((id) => id !== playerId));
    setAbsent((a) => a.filter((id) => id !== playerId));
  }

  function setSlot(code: FormationSlotCode, playerId: string | null) {
    if (playerId) clearFromAll(playerId);
    setSlots((prev) => ({ ...prev, [code]: playerId }));
    setPickerSlot(null);
  }

  function moveToBench(playerId: string) {
    clearFromAll(playerId);
    setBench((b) => sortPlayersBySquadNumber([...b, playerId].map((id) => byId[id]!).filter(Boolean)).map((p) => p.player_id));
  }

  function moveToAbsent(playerId: string) {
    clearFromAll(playerId);
    setAbsent((a) =>
      sortPlayersBySquadNumber([...a, playerId].map((id) => byId[id]!).filter(Boolean)).map((p) => p.player_id),
    );
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
          // refresh/push buiten de transition-status zodat de knop niet disabled blijft
          queueMicrotask(() => {
            router.push(matchWorkflowHref(matchId, seasonId, "na-de-wedstrijd", { finish: "1" }));
            router.refresh();
          });
          return;
        }
        setPrepComplete(true);
        setMessage("Wedstrijdvoorbereiding compleet.");
        queueMicrotask(() => router.refresh());
        return;
      }
      setMessage("Concept bewaard.");
      queueMicrotask(() => router.refresh());
    });
  }

  if (prepComplete) {
    return (
      <section className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Klaar</p>
        <h2 className="font-[family-name:var(--font-display)] text-3xl text-zvv-ink">Wedstrijdvoorbereiding compleet</h2>
        <p className="max-w-xl text-sm text-zvv-muted">
          Basis, bank en afwezig zijn vastgelegd. Na de wedstrijd vul je eindstand, doelpunten, wissels en MVP in.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/beheer/wedstrijden?season=${encodeURIComponent(seasonId)}`} className="club-btn-primary">
            Terug naar wedstrijden
          </Link>
          <Link
            href={matchWorkflowHref(matchId, seasonId, "opstelling")}
            className="club-btn-secondary"
            onClick={() => setPrepComplete(false)}
          >
            Wedstrijd bekijken
          </Link>
        </div>
      </section>
    );
  }

  const slotLabel = pickerSlot
    ? FORMATION_4231_SLOTS.find((s) => s.code === pickerSlot)?.labelNl ?? pickerSlot
    : "";

  return (
    <section className="space-y-5 rounded-2xl border border-zvv-border bg-white p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zvv-primary">Opstelling & selectie</p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-zvv-ink md:text-3xl">
            1-4-2-3-1 · basis, bank en afwezig
          </h2>
          <p className="mt-1 text-sm text-zvv-muted">
            Status: {initialStatus === "confirmed" ? "Bevestigd" : "Concept"} · klik een positie om een speelster te kiezen
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={pending} onClick={() => save(false)} className="club-btn-secondary club-btn-primary-sm">
            Concept bewaren
          </button>
          <button type="button" disabled={pending} onClick={() => save(true)} className="club-btn-primary club-btn-primary-sm">
            Opstelling bevestigen
          </button>
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
            activeSlot={pickerSlot}
            onSlotClick={(code) => setPickerSlot(code)}
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
                        <button type="button" className={actionBtnClass()} onClick={() => setPickerSlot(slot.code)}>
                          Wissel
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
        open={!!pickerSlot}
        title={pickerSlot ? `${pickerSlot} · ${slotLabel}` : "Positie"}
        players={sortedPlayers}
        disabledIds={new Set([...used].filter((id) => id !== (pickerSlot ? slots[pickerSlot] : null)))}
        allowClear
        onClose={() => setPickerSlot(null)}
        onPick={(id) => {
          if (!pickerSlot) return;
          setSlot(pickerSlot, id);
        }}
      />

      {fieldPickPlayerId ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Kies veldpositie"
        >
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Sluiten" onClick={() => setFieldPickPlayerId(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-zvv-border bg-white p-4 shadow-xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-zvv-primary">Op veld zetten</p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl text-zvv-ink">
              {byId[fieldPickPlayerId]?.name ?? "Speelster"} · kies positie
            </h3>
            <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {freeSlots.map((s) => (
                <li key={s.code}>
                  <button
                    type="button"
                    className="flex min-h-11 w-full flex-col items-center justify-center rounded-xl border border-zvv-border px-2 py-2 text-sm font-semibold hover:border-zvv-primary/40 hover:bg-zvv-primary-muted"
                    onClick={() => {
                      setSlot(s.code, fieldPickPlayerId);
                      setFieldPickPlayerId(null);
                    }}
                  >
                    <span className="text-zvv-primary">{s.code}</span>
                    <span className="text-[11px] font-normal text-zvv-muted">{s.labelNl}</span>
                  </button>
                </li>
              ))}
            </ul>
            {freeSlots.length === 0 ? (
              <p className="mt-3 text-sm text-zvv-muted">Geen vrije slots. Maak eerst een positie leeg.</p>
            ) : null}
            <button type="button" className="club-btn-secondary club-btn-primary-sm mt-4" onClick={() => setFieldPickPlayerId(null)}>
              Annuleren
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
