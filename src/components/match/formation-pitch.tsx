"use client";

import { cn } from "@/lib/utils";
import {
  FORMATION_4231_SLOTS,
  FORMATION_DISPLAY,
  type FormationSlotCode,
} from "@/lib/match/formation-4231";
import { PlayerPhotoAvatar } from "@/components/players/player-photo-avatar";

export type PitchOccupant = {
  player_id: string;
  name: string;
  shirt_number: number | null;
  photo_url?: string | null;
  is_captain?: boolean;
  is_vice_captain?: boolean;
};

function pitchDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? "—";
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

/**
 * Robuuste pitch: vaste clamp-hoogte (niet alleen aspect-ratio/padding),
 * markings via inline styles (Tailwind arbitrary % insets bleken 0×0 te collapsen).
 */
export function FormationPitch({
  slots,
  playersById,
  title = `Opstelling ${FORMATION_DISPLAY}`,
  className,
  interactive,
  onSlotClick,
  activeSlot,
  size = "default",
}: {
  slots: Record<FormationSlotCode, string | null>;
  playersById: Record<string, PitchOccupant>;
  title?: string;
  className?: string;
  interactive?: boolean;
  onSlotClick?: (code: FormationSlotCode) => void;
  activeSlot?: FormationSlotCode | null;
  size?: "default" | "hero" | "compact" | "workspace";
}) {
  // Fail-safe: expliciete width + height + minHeight (absolute children mogen parent niet laten collapsen).
  const boxStyle =
    size === "compact"
      ? ({
          width: "min(100%, 420px)",
          height: "clamp(480px, 70vw, 620px)",
          minHeight: "480px",
          maxWidth: "100%",
        } as const)
      : size === "workspace"
        ? ({
            width: "100%",
            height: "clamp(560px, 62vh, 780px)",
            minHeight: "560px",
            maxWidth: "100%",
          } as const)
      : size === "hero"
        ? ({
            width: "min(100%, 760px)",
            height: "clamp(760px, 78vw, 960px)",
            minHeight: "760px",
            maxWidth: "100%",
          } as const)
        : ({
            width: "min(100%, 760px)",
            height: "clamp(760px, 78vw, 960px)",
            minHeight: "760px",
            maxWidth: "100%",
          } as const);

  const chipSize =
    size === "compact"
      ? "h-11 w-11 text-sm"
      : size === "workspace"
        ? "h-12 w-12 text-sm xl:h-14 xl:w-14 xl:text-base"
        : "h-14 w-14 text-base md:h-16 md:w-16 md:text-lg";

  return (
    <section className={cn("space-y-3", className)}>
      {title ? (
        <h3 className="font-[family-name:var(--font-display)] text-xl text-zvv-ink md:text-2xl">{title}</h3>
      ) : null}
      <div
        className="lineupPitch relative mx-auto block overflow-hidden rounded-2xl border border-emerald-950/50 shadow-[0_20px_48px_rgba(6,78,59,0.35)]"
        style={boxStyle}
        data-testid="formation-pitch"
        data-lineup-pitch
      >
        <div
          className="absolute inset-0 h-full w-full"
          style={{
            background:
              "repeating-linear-gradient(90deg, #1a7a3a 0 8.33%, #166832 8.33% 16.66%), radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.12), transparent 55%), linear-gradient(180deg, #1a6b34 0%, #145a2b 100%)",
          }}
        >
          {/* Markings — inline inset percentages (betrouwbaar t.o.v. collapsed Tailwind arbitrary) */}
          <div
            className="pointer-events-none absolute rounded-[2px] border-[2.5px] border-white/70"
            style={{ top: "3.5%", left: "3.5%", right: "3.5%", bottom: "3.5%" }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute border-t-[2.5px] border-white/70"
            style={{ left: "3.5%", right: "3.5%", top: "50%" }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white/70"
            style={{ left: "50%", top: "50%", width: "24%", height: "16%" }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80"
            style={{ left: "50%", top: "50%" }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute border-[2.5px] border-t-0 border-white/70"
            style={{ left: "21%", right: "21%", top: "3.5%", height: "13%" }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute border-2 border-t-0 border-white/55"
            style={{ left: "34%", right: "34%", top: "3.5%", height: "6%" }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute border-[2.5px] border-b-0 border-white/70"
            style={{ left: "21%", right: "21%", bottom: "3.5%", height: "13%" }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute border-2 border-b-0 border-white/55"
            style={{ left: "34%", right: "34%", bottom: "3.5%", height: "6%" }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute rounded-sm bg-white/85"
            style={{ left: "41%", right: "41%", top: "1.8%", height: "1.8%" }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute rounded-sm bg-white/85"
            style={{ left: "41%", right: "41%", bottom: "1.8%", height: "1.8%" }}
            aria-hidden
          />

          {FORMATION_4231_SLOTS.map((slot) => {
            const pid = slots[slot.code];
            const p = pid ? playersById[pid] : null;
            const active = activeSlot === slot.code;
            const leadership =
              p?.is_captain ? "C" : p?.is_vice_captain ? "VC" : null;
            const chip = (
              <>
                <span className="relative">
                  {p ? (
                    <span
                      className={cn(
                        "relative block overflow-hidden rounded-full border-[2.5px] border-white shadow-[0_6px_14px_rgba(0,0,0,0.35)]",
                        chipSize,
                      )}
                    >
                      <PlayerPhotoAvatar
                        playerId={p.player_id}
                        name={p.name}
                        photoUrl={p.photo_url}
                        shirtNumber={p.shirt_number}
                        className="h-full w-full"
                        sizes="64px"
                        fallbackTone="field"
                      />
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "relative flex items-center justify-center rounded-full border-[2.5px] border-dashed border-white/70 bg-black/35 font-bold text-white shadow-lg",
                        chipSize,
                      )}
                    >
                      +
                    </span>
                  )}
                  {p && p.shirt_number != null ? (
                    <span className="absolute -bottom-0.5 -right-1 z-10 min-w-[1.15rem] rounded-full bg-white px-1 text-center text-[10px] font-black leading-4 text-zvv-ink shadow">
                      {p.shirt_number}
                    </span>
                  ) : null}
                  {leadership ? (
                    <span
                      className={cn(
                        "absolute -right-1 -top-1 z-10 rounded px-1 text-[9px] font-black leading-tight shadow",
                        leadership === "C"
                          ? "bg-amber-300 text-amber-950"
                          : "bg-slate-200 text-slate-900",
                      )}
                    >
                      {leadership}
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 max-w-[6.5rem] truncate text-center text-xs font-semibold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] md:max-w-[7.5rem] md:text-sm">
                  {p ? pitchDisplayName(p.name) : "Kies speelster"}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/85 md:text-xs">
                  {slot.code}
                  {leadership ? ` · ${leadership}` : ""}
                </span>
              </>
            );

            const wrapClass = cn(
              "absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center pointer-events-auto",
              interactive &&
                "cursor-pointer rounded-xl p-1 transition hover:scale-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              active && "z-20 ring-2 ring-white ring-offset-2 ring-offset-emerald-900",
            );

            const style = { left: `${slot.x}%`, top: `${slot.y}%` } as const;

            if (interactive) {
              return (
                <button
                  key={slot.code}
                  type="button"
                  onClick={() => onSlotClick?.(slot.code)}
                  className={wrapClass}
                  style={style}
                  aria-label={p ? `${slot.code}: ${p.name}` : `${slot.code}: leeg — speelster kiezen`}
                >
                  {chip}
                </button>
              );
            }

            return (
              <div key={slot.code} className={wrapClass} style={style}>
                {chip}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
