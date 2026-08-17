import Link from "next/link";
import { cn } from "@/lib/utils";
import { OperationsCountdownLabel } from "@/components/admin/operations/operations-countdown";
import type { CountdownUrgency } from "@/lib/operations/countdown";

export type CockpitUrgency = CountdownUrgency | "action";

export type CockpitCardModel = {
  id: "match" | "training" | "fitness";
  title: string;
  headline: string;
  detailLines: string[];
  targetIso: string | null;
  durationMs?: number;
  expectedLabel?: boolean;
  statusText: string;
  urgency: CockpitUrgency;
  actionHref: string;
  actionLabel: string;
  /** Sort key: lower = more urgent */
  sortRank: number;
};

function urgencyBadgeLabel(urgency: CockpitUrgency): string {
  if (urgency === "overdue" || urgency === "action") return "Actie nodig";
  if (urgency === "today") return "Vandaag";
  if (urgency === "upcoming") return "Binnenkort";
  // neutral = verder weg dan een paar dagen — niet misleidend “binnenkort”
  return "Gepland";
}

const urgencyStyle: Record<CockpitUrgency, string> = {
  overdue: "border-amber-300 bg-amber-50/80",
  action: "border-amber-300 bg-amber-50/80",
  today: "border-zvv-primary/40 bg-zvv-primary-muted/40",
  upcoming: "border-zvv-border bg-white",
  neutral: "border-zvv-border bg-white",
};

export function OperationsCockpitCard({ card }: { card: CockpitCardModel }) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border p-4 shadow-sm md:p-5",
        urgencyStyle[card.urgency],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zvv-primary">{card.title}</p>
          <h3 className="mt-1.5 font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink md:text-2xl">
            {card.headline}
          </h3>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold",
            card.urgency === "overdue" || card.urgency === "action"
              ? "border-amber-300 bg-amber-100 text-amber-950"
              : card.urgency === "today"
                ? "border-zvv-primary/30 bg-white text-zvv-primary"
                : "border-zvv-border bg-white text-zvv-muted",
          )}
        >
          {urgencyBadgeLabel(card.urgency)}
        </span>
      </div>

      {card.detailLines.filter(Boolean).length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm text-zvv-muted">
          {card.detailLines.filter(Boolean).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}

      <p className="mt-3 text-sm font-semibold text-zvv-ink">{card.statusText}</p>

      {card.targetIso ? (
        <p className="mt-2 text-sm text-zvv-muted">
          <OperationsCountdownLabel
            targetIso={card.targetIso}
            durationMs={card.durationMs}
            expectedLabel={card.expectedLabel}
          />
        </p>
      ) : null}

      <div className="mt-auto pt-5">
        <Link href={card.actionHref} className="club-btn-primary club-btn-primary-sm inline-flex">
          {card.actionLabel}
        </Link>
      </div>
    </article>
  );
}

export function sortCockpitCards(cards: CockpitCardModel[]): CockpitCardModel[] {
  return [...cards].sort((a, b) => a.sortRank - b.sortRank || a.title.localeCompare(b.title, "nl"));
}

/** Map countdown urgency + overdue attendance into visual sort rank. */
export function cockpitSortRank(opts: {
  urgency: CockpitUrgency;
  state?: string;
  attendanceMissing?: boolean;
}): number {
  if (opts.attendanceMissing || opts.urgency === "overdue" || opts.urgency === "action") return 0;
  if (opts.urgency === "today" || opts.state === "live" || opts.state === "soon") return 1;
  if (opts.state === "tomorrow") return 2;
  if (opts.urgency === "upcoming") return 3;
  return 4;
}
