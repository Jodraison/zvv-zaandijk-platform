"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  changeShirtNumberWithResult,
  removePlayerFromSeasonWithResult,
  restorePlayerToSeasonWithResult,
} from "@/actions/players";
import { cancelUpcomingTrainingAction } from "@/actions/training";
import { formatHumanDateNL } from "@/lib/utils/format-date";

type PlayerOpt = {
  id: string;
  name: string;
  shirt: number;
  position: string;
  display_position: string;
};

export function RemoveFromSquadForm({
  seasonId,
  players,
}: {
  seasonId: string;
  players: PlayerOpt[];
}) {
  const router = useRouter();
  const [playerId, setPlayerId] = useState(players[0]?.id ?? "");
  const [reason, setReason] = useState("gestopt");
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [undo, setUndo] = useState<PlayerOpt | null>(null);
  const [pending, start] = useTransition();
  const selected = players.find((p) => p.id === playerId) ?? null;

  return (
    <div className="space-y-4 rounded-2xl border border-zvv-border bg-white p-4 md:p-5">
      <div>
        <label className="block text-sm font-medium text-zvv-ink" htmlFor="remove-player">
          Speelster
        </label>
        <select
          id="remove-player"
          className="mt-1 w-full min-h-11 rounded-xl border border-zvv-border bg-white px-3"
          value={playerId}
          onChange={(e) => {
            setPlayerId(e.target.value);
            setConfirm(false);
            setMsg(null);
            setErr(null);
          }}
        >
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              #{p.shirt} {p.name}
            </option>
          ))}
        </select>
      </div>
      {selected ? (
        <p className="text-sm text-zvv-muted">
          Nu in selectie 2026/27 · rugnummer {selected.shirt} · {selected.display_position || selected.position}
        </p>
      ) : null}
      <div>
        <label className="block text-sm font-medium text-zvv-ink" htmlFor="remove-reason">
          Reden (optioneel)
        </label>
        <select
          id="remove-reason"
          className="mt-1 w-full min-h-11 rounded-xl border border-zvv-border px-3"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          <option value="gestopt">Gestopt</option>
          <option value="niet_beschikbaar">Niet beschikbaar dit seizoen</option>
          <option value="overig">Overig</option>
        </select>
      </div>
      <p className="rounded-xl bg-zvv-card-mid/60 px-3 py-3 text-sm text-zvv-ink">
        Historische wedstrijden, statistieken en persoongegevens blijven behouden. Alleen het lidmaatschap van dit
        seizoen wordt beëindigd.
      </p>
      <label className="flex items-start gap-2 text-sm text-zvv-ink">
        <input
          type="checkbox"
          className="mt-1"
          checked={confirm}
          onChange={(e) => setConfirm(e.target.checked)}
        />
        Ik bevestig: uit selectie 2026/27 halen
      </label>
      <button
        type="button"
        disabled={!confirm || !selected || pending}
        className="club-btn-primary club-btn-primary-sm disabled:opacity-50"
        onClick={() => {
          if (!selected) return;
          start(async () => {
            setErr(null);
            setMsg(null);
            const r = await removePlayerFromSeasonWithResult({
              player_id: selected.id,
              season_id: seasonId,
              reason,
            });
            if (!r.ok) {
              setErr(r.error);
              return;
            }
            setUndo(selected);
            setMsg(`${selected.name} is uit de selectie gehaald.`);
            router.refresh();
          });
        }}
      >
        Uit selectie 2026/27 halen
      </button>
      {err ? <p className="text-sm text-red-700">{err}</p> : null}
      {msg ? <p className="text-sm font-medium text-emerald-800">{msg}</p> : null}
      {undo ? (
        <button
          type="button"
          className="club-btn-secondary club-btn-primary-sm"
          disabled={pending}
          onClick={() => {
            start(async () => {
              const r = await restorePlayerToSeasonWithResult({
                player_id: undo.id,
                season_id: seasonId,
                shirt_number: undo.shirt,
                position: undo.position,
                display_position: undo.display_position || undo.position,
              });
              if (!r.ok) {
                setErr(r.error);
                return;
              }
              setMsg(`${undo.name} is teruggezet in de selectie.`);
              setUndo(null);
              router.refresh();
            });
          }}
        >
          Ongedaan maken — terug in selectie
        </button>
      ) : null}
    </div>
  );
}

export function ChangeShirtForm({ seasonId, players }: { seasonId: string; players: PlayerOpt[] }) {
  const router = useRouter();
  const [playerId, setPlayerId] = useState(players[0]?.id ?? "");
  const selected = players.find((p) => p.id === playerId) ?? null;
  const [shirt, setShirt] = useState(String(selected?.shirt ?? ""));
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4 rounded-2xl border border-zvv-border bg-white p-4 md:p-5">
      <div>
        <label className="block text-sm font-medium text-zvv-ink" htmlFor="shirt-player">
          Speelster
        </label>
        <select
          id="shirt-player"
          className="mt-1 w-full min-h-11 rounded-xl border border-zvv-border px-3"
          value={playerId}
          onChange={(e) => {
            const id = e.target.value;
            setPlayerId(id);
            const p = players.find((x) => x.id === id);
            setShirt(String(p?.shirt ?? ""));
            setMsg(null);
            setErr(null);
          }}
        >
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              #{p.shirt} {p.name}
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm text-zvv-muted">Huidig rugnummer: {selected?.shirt ?? "—"}</p>
      <div>
        <label className="block text-sm font-medium text-zvv-ink" htmlFor="shirt-new">
          Nieuw rugnummer
        </label>
        <input
          id="shirt-new"
          type="number"
          min={1}
          max={99}
          className="mt-1 w-full min-h-11 rounded-xl border border-zvv-border px-3"
          value={shirt}
          onChange={(e) => setShirt(e.target.value)}
        />
      </div>
      <button
        type="button"
        disabled={pending || !selected}
        className="club-btn-primary club-btn-primary-sm disabled:opacity-50"
        onClick={() => {
          if (!selected) return;
          start(async () => {
            setErr(null);
            setMsg(null);
            const r = await changeShirtNumberWithResult({
              player_id: selected.id,
              season_id: seasonId,
              shirt_number: Number(shirt),
            });
            if (!r.ok) {
              setErr(r.error);
              return;
            }
            setMsg(`Rugnummer van ${selected.name} is nu ${shirt}.`);
            router.refresh();
          });
        }}
      >
        Rugnummer opslaan
      </button>
      {err ? <p className="text-sm text-red-700">{err}</p> : null}
      {msg ? <p className="text-sm font-medium text-emerald-800">{msg}</p> : null}
    </div>
  );
}

export function CancelTrainingForm({
  seasonId,
  dates,
}: {
  seasonId: string;
  dates: string[];
}) {
  const router = useRouter();
  const [date, setDate] = useState(dates[0] ?? "");
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const label = useMemo(() => (date ? formatHumanDateNL(date, { includeYear: true }) : ""), [date]);

  if (!dates.length) {
    return (
      <p className="rounded-2xl border border-dashed border-zvv-border bg-white p-5 text-sm text-zvv-muted">
        Geen toekomstige trainingsdata beschikbaar om af te gelasten.
      </p>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-zvv-border bg-white p-4 md:p-5">
      <div>
        <label className="block text-sm font-medium text-zvv-ink" htmlFor="cancel-date">
          Training
        </label>
        <select
          id="cancel-date"
          className="mt-1 w-full min-h-11 rounded-xl border border-zvv-border px-3"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setConfirm(false);
            setMsg(null);
            setErr(null);
          }}
        >
          {dates.map((d) => (
            <option key={d} value={d}>
              {formatHumanDateNL(d, { includeYear: true })} · 20:00–21:00
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm text-zvv-muted">Gekozen: {label}</p>
      <div>
        <label className="block text-sm font-medium text-zvv-ink" htmlFor="cancel-reason">
          Reden
        </label>
        <input
          id="cancel-reason"
          className="mt-1 w-full min-h-11 rounded-xl border border-zvv-border px-3"
          placeholder="Bijv. veld onbespeelbaar"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
        Bevestig afgelasten — training blijft in de planning staan als “Afgelast”
      </label>
      <button
        type="button"
        disabled={!confirm || pending}
        className="club-btn-primary club-btn-primary-sm disabled:opacity-50"
        onClick={() => {
          start(async () => {
            setErr(null);
            setMsg(null);
            const r = await cancelUpcomingTrainingAction({
              season_id: seasonId,
              session_date_iso: date,
              reason,
            });
            if (!r.ok) {
              setErr(r.error);
              return;
            }
            setMsg(r.message);
            router.refresh();
          });
        }}
      >
        Training afgelasten
      </button>
      {err ? <p className="text-sm text-red-700">{err}</p> : null}
      {msg ? <p className="text-sm font-medium text-emerald-800">{msg}</p> : null}
    </div>
  );
}
