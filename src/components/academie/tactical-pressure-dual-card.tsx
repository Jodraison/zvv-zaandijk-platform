"use client";

/**
 * Dual-view pressure comparison card (Tactical Film Standard V2).
 * Overview (full pitch, quiet) + Detail (crop on pressing zone).
 * Used only for press-bad / press-good — not side-by-side tiny pitches.
 */

import { useRef, useState } from "react";
import { TacticalIllustration } from "@/components/academie/tactical-illustration";
import { cn } from "@/lib/utils";

export type PressureDualVariant = "bad" | "good";

const STYLES: Record<
  PressureDualVariant,
  { shell: string; accent: string; label: string; takeaway: string; consequence: string }
> = {
  bad: {
    shell: "border-slate-200/90 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)]",
    accent: "bg-rose-500/80",
    label: "text-rose-700",
    takeaway: "border-rose-100 bg-rose-50/80 text-rose-950",
    consequence: "text-rose-800/90",
  },
  good: {
    shell: "border-slate-200/90 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)]",
    accent: "bg-teal-500/80",
    label: "text-teal-700",
    takeaway: "border-teal-100 bg-teal-50/80 text-teal-950",
    consequence: "text-teal-900/90",
  },
};

export function TacticalPressureDualCard({
  variant,
  label,
  title,
  situationId,
  takeaway,
  consequence,
  contrastHint,
  className,
}: {
  variant: PressureDualVariant;
  label: string;
  title: string;
  situationId: string;
  takeaway: string;
  consequence?: string;
  /** Non-color distinction for FOUT/GOED (Golden Session). */
  contrastHint?: string;
  className?: string;
}) {
  const styles = STYLES[variant];
  const headingId = `pressure-dual-${variant}`;
  const [mobileTab, setMobileTab] = useState<"overview" | "detail">("overview");
  const detailRef = useRef<HTMLDivElement>(null);

  const enterFullscreen = () => {
    const el = detailRef.current;
    if (!el) return;
    const req =
      el.requestFullscreen ??
      (el as HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen;
    void req?.call(el);
  };

  return (
    <article
      className={cn(
        "relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-3 sm:p-4",
        styles.shell,
        className,
      )}
      aria-labelledby={headingId}
      data-comparison-side={variant}
      data-situation-id={situationId}
      data-pressure-dual="v2"
      data-visual-system="v2-premium"
    >
      <span className={cn("absolute inset-y-0 left-0 w-[3px]", styles.accent)} aria-hidden />

      <header className="pl-2">
        <p className={cn("text-[10px] font-bold uppercase tracking-[0.18em]", styles.label)}>
          {label}
          {contrastHint ? (
            <span className="ml-2 font-semibold tracking-normal text-slate-500">· {contrastHint}</span>
          ) : null}
        </p>
        <h3 id={headingId} className="mt-1 text-base font-bold leading-snug text-slate-900 sm:text-lg">
          {title}
        </h3>
      </header>

      {/* Mobile: one view at a time */}
      <div className="flex flex-wrap items-center gap-2 pl-2 md:hidden">
        <button
          type="button"
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide",
            mobileTab === "overview" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600",
          )}
          onClick={() => setMobileTab("overview")}
        >
          Overzicht
        </button>
        <button
          type="button"
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide",
            mobileTab === "detail" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600",
          )}
          onClick={() => setMobileTab("detail")}
        >
          Detail
        </button>
        <button
          type="button"
          className="ml-auto rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-700"
          onClick={enterFullscreen}
          data-pressure-fullscreen
        >
          Fullscreen
        </button>
      </div>

      <div className="grid gap-3 pl-1 md:grid-cols-2">
        <div
          className={cn("min-w-0", mobileTab !== "overview" && "hidden md:block")}
          data-pressure-view="overview"
        >
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Teamoverzicht
          </p>
          <TacticalIllustration
            situationId={situationId}
            showLegend={false}
            cameraMode="full"
            hierarchyQuiet
            showControls={false}
            className="[&_figcaption]:sr-only"
          />
        </div>
        <div
          ref={detailRef}
          className={cn("min-w-0 bg-white", mobileTab !== "detail" && "hidden md:block")}
          data-pressure-view="detail"
        >
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Drukzone
            </p>
            <button
              type="button"
              className="hidden rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 md:inline-block"
              onClick={enterFullscreen}
              data-pressure-fullscreen
            >
              Fullscreen
            </button>
          </div>
          <TacticalIllustration
            situationId={situationId}
            showLegend={false}
            cameraMode="press-detail"
            hierarchyQuiet={false}
            showControls
            className="[&_figcaption]:sr-only"
          />
        </div>
      </div>

      <div className={cn("rounded-xl border px-3 py-2.5", styles.takeaway)}>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-75">
          {variant === "bad" ? "Wat gaat fout?" : "Wat doe je?"}
        </p>
        <p className="mt-1 text-sm font-semibold leading-snug">{takeaway}</p>
        {consequence ? (
          <p className={cn("mt-1.5 text-xs leading-snug", styles.consequence)}>
            <span className="font-bold">Gevolg: </span>
            {consequence}
          </p>
        ) : null}
      </div>
    </article>
  );
}
