"use client";

/**
 * Premium Fout/Beter side card — V2 analysis chrome.
 */
import { TacticalIllustration } from "@/components/academie/tactical-illustration";
import { cn } from "@/lib/utils";

export type ComparisonSideVariant = "bad" | "good";

const VARIANT_STYLES: Record<
  ComparisonSideVariant,
  { shell: string; accent: string; label: string; takeaway: string; consequence: string }
> = {
  bad: {
    shell: "border-slate-200/90 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.06)]",
    accent: "bg-rose-500/80",
    label: "text-rose-700",
    takeaway: "border-rose-100 bg-rose-50/70 text-rose-950",
    consequence: "text-rose-800/85",
  },
  good: {
    shell: "border-slate-200/90 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.06)]",
    accent: "bg-teal-500/80",
    label: "text-teal-700",
    takeaway: "border-teal-100 bg-teal-50/70 text-teal-950",
    consequence: "text-teal-900/85",
  },
};

export function TacticalComparisonSideCard({
  variant,
  label,
  title,
  description,
  situationId,
  takeaway,
  consequence,
  className,
}: {
  variant: ComparisonSideVariant;
  label: string;
  title: string;
  description?: string;
  situationId: string;
  takeaway: string;
  consequence?: string;
  className?: string;
}) {
  const styles = VARIANT_STYLES[variant];
  const headingId = `compare-${variant}-${situationId}`;

  return (
    <article
      className={cn(
        "relative flex h-full flex-col gap-2.5 overflow-hidden rounded-2xl border p-2.5 sm:p-3",
        styles.shell,
        className,
      )}
      aria-labelledby={headingId}
      data-comparison-side={variant}
      data-situation-id={situationId}
      data-visual-system="v2-premium"
    >
      <span className={cn("absolute inset-y-0 left-0 w-[3px]", styles.accent)} aria-hidden />
      <header className="pl-1.5">
        <p className={cn("text-[10px] font-bold uppercase tracking-[0.18em]", styles.label)}>{label}</p>
        <h3 id={headingId} className="mt-1 text-sm font-bold leading-snug text-slate-900 sm:text-base">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-xs leading-snug text-slate-500">{description}</p>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 pl-0.5">
        <TacticalIllustration
          situationId={situationId}
          showLegend={false}
          compact
          className="[&_figcaption]:sr-only"
        />
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
