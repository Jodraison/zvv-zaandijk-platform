import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/layout/badge";

export function ChartWidget({
  kicker,
  title,
  subtitle,
  badge,
  action,
  children,
  className,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("club-card club-card-lift overflow-hidden md:rounded-[var(--radius-3xl)]", className)}>
      <div className="border-b border-zvv-border bg-gradient-to-r from-zvv-primary-muted via-white to-zvv-card-mid px-7 py-6 md:px-9 md:py-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            {kicker ? <p className="club-page-eyebrow">{kicker}</p> : null}
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.65rem,3vw,2.35rem)] leading-tight tracking-wide text-zvv-ink md:text-3xl">
                {title}
              </h2>
              {badge ? (typeof badge === "string" ? <Badge tone="muted">{badge}</Badge> : badge) : null}
            </div>
            {subtitle ? <p className="max-w-md text-[15px] leading-relaxed text-zvv-muted">{subtitle}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>
      <div className="p-6 md:p-8">{children}</div>
    </div>
  );
}
