import Link from "next/link";
import { cn } from "@/lib/utils";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  metrics,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  metrics?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "club-section-surface relative overflow-hidden !rounded-2xl !px-4 !py-4 sm:!px-5 sm:!py-5 md:!px-6 md:!py-6",
        "border-l-4 border-zvv-primary",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-zvv-primary via-zvv-primary/80 to-zvv-primary/40"
        aria-hidden
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-3xl pl-1">
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zvv-primary">{eyebrow}</p> : null}
          <h1 className="mt-1.5 font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink sm:mt-2 sm:text-3xl md:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-zvv-muted sm:text-base">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2 sm:gap-3">{actions}</div> : null}
      </div>
      {metrics ? <div className="mt-4 border-t border-zvv-border/80 pt-4">{metrics}</div> : null}
    </header>
  );
}

export function AdminSection({
  title,
  description,
  children,
  className,
  action,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {title || action ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {title ? (
              <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-zvv-ink">{title}</h2>
            ) : null}
            {description ? <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zvv-muted">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-zvv-border bg-zvv-card-mid/70 px-6 py-10 text-left md:px-8">
      <p className="font-[family-name:var(--font-display)] text-xl text-zvv-ink">{title}</p>
      <p className="mt-2 max-w-lg text-base leading-relaxed text-zvv-muted">{description}</p>
      {action ? <div className="mt-6 flex flex-wrap gap-3">{action}</div> : null}
    </div>
  );
}

export function AdminMetric({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const body = (
    <div className="rounded-xl border border-zvv-border bg-white p-3 shadow-sm transition hover:border-zvv-primary/30">
      <p className="text-xs font-medium text-zvv-muted sm:text-sm">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink sm:text-2xl">{value}</p>
      {hint ? <p className="mt-0.5 text-xs leading-snug text-zvv-muted sm:text-sm">{hint}</p> : null}
    </div>
  );
  if (!href) return body;
  return (
    <Link href={href} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zvv-primary">
      {body}
    </Link>
  );
}

export type AdminSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export function AdminStatusBadge({ status }: { status: AdminSaveStatus }) {
  const map: Record<AdminSaveStatus, { label: string; className: string }> = {
    idle: { label: "Gereed", className: "border-zvv-border bg-white text-zvv-muted" },
    dirty: { label: "Niet opgeslagen", className: "border-amber-200 bg-amber-50 text-amber-900" },
    saving: { label: "Opslaan…", className: "border-zvv-border bg-zvv-card-mid text-zvv-ink" },
    saved: { label: "Opgeslagen", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
    error: { label: "Fout bij opslaan", className: "border-red-200 bg-red-50 text-red-800" },
  };
  const s = map[status];
  return (
    <span
      className={cn("inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold", s.className)}
      role="status"
      aria-live="polite"
    >
      {s.label}
    </span>
  );
}

export function AdminSaveBar({
  status,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  secondary,
  summary,
}: {
  status: AdminSaveStatus;
  primaryLabel: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  secondary?: React.ReactNode;
  summary?: string;
}) {
  return (
    <div className="sticky bottom-3 z-30 mt-8 rounded-2xl border border-zvv-border bg-white/95 p-3 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur md:bottom-4 md:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <AdminStatusBadge status={status} />
          {summary ? <p className="text-sm text-zvv-muted">{summary}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {secondary}
          <button
            type={onPrimary ? "button" : "submit"}
            onClick={onPrimary}
            disabled={primaryDisabled || status === "saving"}
            className="club-btn-primary club-btn-primary-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "saving" ? "Opslaan…" : primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
