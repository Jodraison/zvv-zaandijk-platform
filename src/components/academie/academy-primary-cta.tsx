"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type CtaTone = "primary" | "on-dark" | "secondary";

type Common = {
  label: string;
  durationHint?: string;
  icon?: "play" | "continue" | "next";
  className?: string;
  tone?: CtaTone;
  disabled?: boolean;
  loading?: boolean;
  testId?: string;
};

type AsLink = Common & { href: string; onClick?: never };
type AsButton = Common & { href?: never; onClick: () => void };

export type AcademyPrimaryCtaProps = AsLink | AsButton;

const toneClass: Record<CtaTone, string> = {
  primary:
    "bg-zvv-primary text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.55)] hover:bg-zvv-primary-hover hover:shadow-[0_10px_28px_-8px_rgba(37,99,235,0.65)] active:scale-[0.985] focus-visible:outline-zvv-primary",
  "on-dark":
    "bg-white text-zvv-ink shadow-[0_8px_24px_-8px_rgba(15,23,42,0.35)] hover:bg-blue-50 active:scale-[0.985] focus-visible:outline-white",
  secondary:
    "border border-zvv-border bg-white text-zvv-ink hover:border-zvv-primary/40 hover:bg-slate-50 active:scale-[0.985] focus-visible:outline-zvv-primary",
};

function Icon({ kind }: { kind: NonNullable<Common["icon"]> }) {
  if (kind === "next") {
    return (
      <span aria-hidden className="text-lg leading-none">
        →
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-sm"
    >
      ▶
    </span>
  );
}

/** Premium Academy learning CTA — not a form-input bar. */
export function AcademyPrimaryCta(props: AcademyPrimaryCtaProps) {
  const {
    label,
    durationHint,
    icon = "play",
    className,
    tone = "primary",
    disabled,
    loading,
    testId = "academy-primary-cta",
  } = props;

  const classes = cn(
    "group inline-flex min-h-12 max-w-full items-center justify-center gap-3 rounded-2xl px-6 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55",
    toneClass[tone],
    className,
  );

  const inner = (
    <>
      <Icon kind={loading ? "play" : icon} />
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold leading-tight tracking-tight sm:text-base">
          {loading ? "Laden…" : label}
        </span>
        {durationHint ? (
          <span
            className={cn(
              "mt-0.5 block text-xs font-medium",
              tone === "primary" && "text-white/80",
              tone === "on-dark" && "text-zvv-muted",
              tone === "secondary" && "text-zvv-muted",
            )}
          >
            {durationHint}
          </span>
        ) : null}
      </span>
    </>
  );

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes} data-testid={testId} aria-disabled={disabled || loading}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={disabled || loading}
      className={classes}
      data-testid={testId}
    >
      {inner}
    </button>
  );
}
