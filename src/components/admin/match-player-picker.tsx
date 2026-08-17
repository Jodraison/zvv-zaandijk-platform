"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  formatPlayerOptionLabel,
  sortPlayersBySquadNumber,
} from "@/lib/players/sort-by-squad-number";

export type PickerPlayer = {
  player_id: string;
  name: string;
  shirt_number: number | null;
  position_label?: string | null;
  is_guest?: boolean;
  is_captain?: boolean;
  is_vice_captain?: boolean;
};

export function MatchPlayerPicker({
  open,
  title,
  players,
  disabledIds,
  onPick,
  onClose,
  allowClear,
}: {
  open: boolean;
  title: string;
  players: PickerPlayer[];
  disabledIds?: Set<string>;
  onPick: (playerId: string | null) => void;
  onClose: () => void;
  allowClear?: boolean;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const sorted = useMemo(() => sortPlayersBySquadNumber(players), [players]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return sorted;
    return sorted.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        String(p.shirt_number ?? "").includes(needle) ||
        (p.position_label ?? "").toLowerCase().includes(needle),
    );
  }, [sorted, q]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-3"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Sluiten" onClick={onClose} />
      <div className="relative z-10 flex max-h-[min(80vh,36rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zvv-border bg-white shadow-xl">
        <div className="border-b border-zvv-border px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zvv-primary">Kies speelster</p>
          <h3 className="font-[family-name:var(--font-display)] text-xl text-zvv-ink">{title}</h3>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op naam of rugnummer…"
            className="mt-2 min-h-11 w-full rounded-xl border border-zvv-border px-3 text-sm outline-none focus:border-zvv-primary/50 focus:ring-2 focus:ring-zvv-primary/20"
          />
        </div>
        <ul className="flex-1 overflow-y-auto p-2">
          {allowClear ? (
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-zvv-muted hover:bg-zvv-card-mid"
                onClick={() => onPick(null)}
              >
                Slot leegmaken
              </button>
            </li>
          ) : null}
          {filtered.map((p) => {
            const disabled = disabledIds?.has(p.player_id);
            return (
              <li key={p.player_id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onPick(p.player_id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                    disabled ? "opacity-40" : "hover:bg-zvv-primary-muted",
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zvv-card-mid text-sm font-bold text-zvv-ink">
                    {p.shirt_number ?? "—"}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-zvv-ink">{formatPlayerOptionLabel(p)}</span>
                    <span className="block text-xs text-zvv-muted">
                      {[
                        p.position_label || (p.is_guest ? "Gast" : "Selectie"),
                        p.is_captain ? "C · Aanvoerder" : p.is_vice_captain ? "VC · Vice-aanvoerder" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-zvv-muted">Geen speelsters gevonden.</li>
          ) : null}
        </ul>
        <div className="border-t border-zvv-border p-3">
          <button type="button" className="club-btn-secondary club-btn-primary-sm w-full" onClick={onClose}>
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}
