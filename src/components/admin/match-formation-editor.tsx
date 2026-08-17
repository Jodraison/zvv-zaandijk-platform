"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FORMATION_4231_SLOTS, type FormationSlotCode } from "@/lib/match/formation-4231";
import { validateConfirmedFormation } from "@/lib/match/match-shape";
import { saveMatchFormationAction } from "@/actions/match-formation";
import { FormationPitch } from "@/components/match/formation-pitch";
import { MatchPlayerPicker, type PickerPlayer } from "@/components/admin/match-player-picker";
import { sortPlayersBySquadNumber } from "@/lib/players/sort-by-squad-number";
import { matchWorkflowHref } from "@/lib/match/match-workflow-steps";

type PlayerOpt = PickerPlayer;

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
  guestPanel?: React.ReactNode;
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

      <div className="space-y-6">
        {/* Pitch eerst — trainers moeten het veld zien zonder te scrollen voorbij bank/lijsten. */}
        <FormationPitch
          title=""
          interactive
          size="hero"
          activeSlot={pickerSlot}
          onSlotClick={(code) => setPickerSlot(code)}
          slots={slots}
          playersById={Object.fromEntries(
            sortedPlayers.map((p) => [
              p.player_id,
              {
                player_id: p.player_id,
                name: p.name,
                shirt_number: p.shirt_number,
                is_captain: !!p.is_captain,
                is_vice_captain: !!p.is_vice_captain,
              },
            ]),
          )}
        />

        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          <span className="rounded-full bg-zvv-primary px-3 py-1.5 text-white">
            Basis {Object.values(slots).filter(Boolean).length}/11
          </span>
          <span className="rounded-full border border-zvv-border bg-white px-3 py-1.5 text-zvv-ink">Bank {bench.length}</span>
          <span className="rounded-full border border-zvv-border bg-white px-3 py-1.5 text-zvv-ink">Afwezig {absent.length}</span>
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-amber-950">
            Nog indelen {unassigned.length}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-zvv-border bg-zvv-card-mid/30 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-zvv-ink">Bank</h3>
              <span className="text-xs text-zvv-muted">{bench.length}</span>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {sortPlayersBySquadNumber(bench.map((id) => byId[id]!).filter(Boolean)).map((p) => (
                <li key={p.player_id}>
                  <div className="flex items-center gap-1 rounded-full border border-zvv-border bg-white pl-2.5 pr-1 py-1 text-xs font-semibold">
                    <span>#{p.shirt_number ?? "—"} {p.name.split(" ").slice(-1)[0]}</span>
                    <button
                      type="button"
                      className="rounded-full px-2 py-0.5 text-zvv-primary hover:bg-zvv-primary-muted"
                      onClick={() => {
                        if (freeSlots.length === 0) {
                          setMessage("Alle elf veldplaatsen zijn bezet.");
                          return;
                        }
                        setFieldPickPlayerId(p.player_id);
                      }}
                      title="Op veld"
                    >
                      Veld
                    </button>
                    <button type="button" className="rounded-full px-2 py-0.5 text-zvv-muted hover:bg-zvv-card-mid" onClick={() => moveToAbsent(p.player_id)} title="Naar afwezig">
                      →A
                    </button>
                    <button type="button" className="rounded-full px-2 py-0.5 text-red-700 hover:bg-red-50" onClick={() => clearFromAll(p.player_id)} title="Nog indelen">
                      ×
                    </button>
                  </div>
                </li>
              ))}
              {bench.length === 0 ? <li className="text-sm text-zvv-muted">Nog niemand op de bank.</li> : null}
            </ul>
          </div>

          <div className="rounded-2xl border border-zvv-border bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-zvv-ink">Afwezig</h3>
              <span className="text-xs text-zvv-muted">{absent.length}</span>
            </div>
            <ul className="mt-3 space-y-1">
              {sortPlayersBySquadNumber(absent.map((id) => byId[id]!).filter(Boolean)).map((p) => (
                <li key={p.player_id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-zvv-card-mid/50">
                  <span>
                    #{p.shirt_number ?? "—"} {p.name}
                  </span>
                  <button type="button" className="text-xs font-semibold text-zvv-primary" onClick={() => moveToBench(p.player_id)}>
                    Naar bank
                  </button>
                </li>
              ))}
              {absent.length === 0 ? <li className="text-sm text-zvv-muted">Niemand afwezig.</li> : null}
            </ul>
          </div>

          {unassigned.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-amber-950">Nog indelen</h3>
                <span className="text-xs text-amber-900">{unassigned.length}</span>
              </div>
              <ul className="mt-3 space-y-1">
                {unassigned.map((p) => (
                  <li key={p.player_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/80 px-2 py-1.5 text-sm">
                    <span>
                      #{p.shirt_number ?? "—"} {p.name}
                      {p.is_captain ? " · C" : p.is_vice_captain ? " · VC" : ""}
                    </span>
                    <span className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        className="rounded-lg border border-zvv-primary/40 bg-zvv-primary-muted px-2 py-1 text-xs font-semibold text-zvv-primary"
                        onClick={() => {
                          if (freeSlots.length === 0) {
                            setMessage("Alle elf veldplaatsen zijn bezet. Maak eerst een slot leeg.");
                            return;
                          }
                          setFieldPickPlayerId(p.player_id);
                        }}
                      >
                        Op veld
                      </button>
                      <button type="button" className="rounded-lg border border-zvv-border px-2 py-1 text-xs font-semibold" onClick={() => moveToBench(p.player_id)}>
                        Bank
                      </button>
                      <button type="button" className="rounded-lg border border-zvv-border px-2 py-1 text-xs font-semibold" onClick={() => moveToAbsent(p.player_id)}>
                        Afwezig
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              Iedereen is ingedeeld: basis · bank · afwezig.
            </p>
          )}

          {guestPanel ? (
            <div className="rounded-2xl border border-dashed border-zvv-primary/35 p-3">
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
