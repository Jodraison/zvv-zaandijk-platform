"use client";

import { useMemo, useState } from "react";
import type { PlayerPosition } from "@/types";
import type { PlayerSeasonRankingRow } from "@/types";
import { PlayerCard } from "@/components/players/player-card";
import { cn } from "@/lib/utils";
import { isValidImageUrl, PhotoOrFallback } from "@/components/media/photo-with-fallback";
import { TEAM_DISPLAY_LABEL_UPPER } from "@/constants/club";

const positions: { id: PlayerPosition | "ALL"; label: string }[] = [
  { id: "ALL", label: "Alle linies" },
  { id: "GK", label: "Keepers" },
  { id: "DEF", label: "Verdediging" },
  { id: "MID", label: "Middenveld" },
  { id: "ATT", label: "Aanval" },
];

export function SelectieClient({
  rows,
  seasonId,
}: {
  rows: PlayerSeasonRankingRow[];
  seasonId: string;
}) {
  const [q, setQ] = useState("");
  const [pos, setPos] = useState<PlayerPosition | "ALL">("ALL");
  const [sort, setSort] = useState<"shirt" | "name">("shirt");

  const safeRows = useMemo(
    () =>
      rows.map((row) => {
        const full_name =
          typeof row.full_name === "string" && row.full_name.trim() ? row.full_name.trim() : "Speelster";
        const photo_url = isValidImageUrl(row.photo_url) ? row.photo_url : null;
        const shirt_number = Number.isFinite(row.shirt_number) ? row.shirt_number : 0;
        const display_position =
          typeof row.display_position === "string" && row.display_position.trim()
            ? row.display_position
            : "—";
        const position: PlayerPosition =
          row.position === "GK" || row.position === "DEF" || row.position === "MID" || row.position === "ATT"
            ? row.position
            : "MID";
        return { ...row, full_name, photo_url, shirt_number, display_position, position };
      }),
    [rows],
  );

  const featured = safeRows[0] ?? null;
  const keyPlayers = safeRows.slice(0, 3);

  const filtered = useMemo(() => {
    let r = safeRows.slice();
    if (pos !== "ALL") r = r.filter((x) => x.position === pos);
    if (q.trim()) {
      const n = q.trim().toLowerCase();
      r = r.filter((x) => x.full_name.toLowerCase().includes(n));
    }
    r.sort((a, b) =>
      sort === "shirt"
        ? a.shirt_number - b.shirt_number || a.full_name.localeCompare(b.full_name)
        : a.full_name.localeCompare(b.full_name),
    );
    return r;
  }, [safeRows, pos, q, sort]);

  return (
    <div className="space-y-10 md:space-y-16">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#020817] via-[#0b1f5f] to-[#1d4ed8] px-4 pb-8 pt-10 text-white shadow-[0_28px_70px_rgba(2,6,23,0.38)] sm:rounded-[2.2rem] sm:px-6 sm:pb-10 sm:pt-12 md:px-10 md:pb-16 md:pt-20 xl:px-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_14%,rgba(147,197,253,0.25),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_38%_at_78%_26%,rgba(191,219,254,0.22),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_130%_90%_at_50%_50%,transparent_58%,rgba(2,6,23,0.26)_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(rgba(255,255,255,0.6)_0.6px,transparent_0.6px)] [background-size:3px_3px]" />
        <span className="pointer-events-none absolute -left-6 top-6 z-[1] font-[family-name:var(--font-display)] text-[clamp(8rem,18vw,14rem)] leading-none tracking-tight text-white/[0.05]">
          11
        </span>
        <div className="relative grid gap-8 xl:grid-cols-[1fr_0.9fr] xl:items-end">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-100/85 md:text-[11px]">
              ZVV {TEAM_DISPLAY_LABEL_UPPER}
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.65rem,9vw,6rem)] leading-[0.9] tracking-[0.03em] md:mt-4">
              ONZE SELECTIE
            </h1>
            <p className="mt-4 text-[clamp(1rem,2.2vw,1.3rem)] font-semibold uppercase tracking-[0.08em] text-blue-100 md:mt-5">
              Een team. Een standaard.
            </p>
          </div>
          {featured ? (
            <article className="group relative min-h-[17rem] overflow-hidden rounded-2xl [clip-path:inset(0_round_1.25rem)] sm:min-h-[20rem] sm:rounded-3xl sm:[clip-path:inset(0_round_1.5rem)] xl:min-h-[24rem]">
              <span className="pointer-events-none absolute -bottom-8 right-1 z-[1] font-[family-name:var(--font-display)] text-[10rem] leading-none tracking-tight text-white/10">
                {featured.shirt_number}
              </span>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[inherit] bg-zvv-night shadow-[inset_0_0_120px_rgba(2,6,23,0.34)] [clip-path:inset(0_round_inherit)]">
                <PhotoOrFallback
                  url={featured.photo_url}
                  alt={featured.full_name}
                  className="rounded-[inherit] object-cover object-top transition-transform duration-200 motion-safe:group-hover:scale-[1.01]"
                  sizes="(max-width: 1280px) 100vw, 560px"
                  fallback={<span className="font-[family-name:var(--font-display)] text-6xl text-white/60">#{featured.shirt_number}</span>}
                />
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-t from-black/76 via-black/26 to-transparent" />
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(ellipse_70%_40%_at_75%_18%,rgba(191,219,254,0.22),transparent_70%)]" />
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_90px_rgba(15,23,42,0.42)]" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="font-[family-name:var(--font-display)] text-4xl leading-none tracking-wide text-white">{featured.full_name}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-100">{featured.display_position} · #{featured.shirt_number}</p>
                </div>
              </div>
            </article>
          ) : null}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zvv-primary">Key players</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,3rem)] tracking-wide text-zvv-ink">Spelers in focus</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {keyPlayers.map((p) => (
            <article
              key={p.player_id}
              className="group relative w-full overflow-hidden rounded-2xl border border-zvv-border/70 bg-gradient-to-br from-[#0b1222] via-[#111827] to-[#1e293b] p-4 shadow-[0_12px_26px_rgba(2,6,23,0.18)] transition-[transform,border-color] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-blue-300/25"
            >
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-zvv-night">
                <PhotoOrFallback
                  url={p.photo_url}
                  alt={p.full_name}
                  className="object-cover object-top transition-transform duration-200 motion-safe:group-hover:scale-[1.01]"
                  sizes="(max-width: 1280px) 100vw, 420px"
                  fallback={<span className="font-[family-name:var(--font-display)] text-5xl text-white/60">#{p.shirt_number}</span>}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/76 via-black/20 to-transparent" />
                <span className="pointer-events-none absolute -bottom-5 left-2 font-[family-name:var(--font-display)] text-7xl leading-none tracking-tight text-white/12">
                  {p.shirt_number}
                </span>
              </div>
              <p className="mt-4 font-[family-name:var(--font-display)] text-[1.7rem] leading-none tracking-wide text-white">{p.full_name}</p>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">{p.display_position}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="club-section-surface !rounded-2xl !px-5 !py-7 md:!rounded-3xl md:!px-10 md:!py-11">
        <div className="flex flex-col gap-6 md:gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="min-w-0 max-w-lg">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zvv-primary">Controls</p>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.5rem)] leading-tight tracking-wide text-zvv-ink">
              Filter & sorteer
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-zvv-muted">Zoek direct op naam, linie of volgorde.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:max-w-xl lg:justify-end">
            <label className="sr-only" htmlFor="selectie-zoek">
              Zoek op naam
            </label>
            <input
              id="selectie-zoek"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek speelster..."
              className="min-h-[48px] w-full min-w-0 rounded-xl border border-zvv-border bg-white px-4 py-3 text-[15px] text-zvv-ink outline-none transition-all duration-200 placeholder:text-zvv-muted focus:border-zvv-primary/45 focus:ring-2 focus:ring-zvv-primary/15 sm:max-w-xs hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
            />
            <label className="sr-only" htmlFor="selectie-sort">
              Sorteren
            </label>
            <select
              id="selectie-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as "shirt" | "name")}
              className="min-h-[48px] w-full rounded-xl border border-zvv-border bg-white px-4 py-3 text-[15px] font-medium text-zvv-ink outline-none transition-all duration-200 focus:border-zvv-primary/45 focus:ring-2 focus:ring-zvv-primary/15 sm:w-auto sm:min-w-[11rem] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
            >
              <option value="shirt">Rugnummer</option>
              <option value="name">Naam A–Z</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2.5 md:mt-10">
          {positions.map((p) => {
            const active = pos === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPos(p.id)}
                className={cn(
                  "min-h-[44px] rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300",
                  active
                    ? "border-zvv-primary bg-zvv-primary text-white shadow-md"
                    : "border-zvv-border bg-white text-zvv-muted hover:-translate-y-0.5 hover:border-zvv-primary/30 hover:bg-zvv-card-mid hover:text-zvv-ink",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zvv-border bg-zvv-card-mid/60 px-8 py-14 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zvv-primary">Geen resultaten</p>
          <p className="mt-3 text-lg font-semibold text-zvv-ink">Geen speelsters gevonden</p>
          <p className="mx-auto mt-2 max-w-sm text-[15px] text-zvv-muted">Pas je zoekterm of liniekeuze aan om resultaten te tonen.</p>
        </div>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-7 xl:grid-cols-4 xl:gap-8">
          {filtered.map((row) => (
            <li key={row.player_id} className="min-h-0">
              <PlayerCard
                id={row.player_id}
                name={row.full_name}
                shirt={row.shirt_number}
                position={row.position}
                displayPosition={row.display_position}
                photoUrl={row.photo_url}
                goals={row.goals_total}
                assists={row.assists_total}
                wotm={row.wotm_total}
                seasonId={seasonId}
                isCaptain={row.is_captain}
                isViceCaptain={row.is_vice_captain}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
