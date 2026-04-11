import { cn } from "@/lib/utils";

const tones = {
  win: "border-emerald-500/40 bg-emerald-50 text-emerald-800",
  loss: "border-red-400/40 bg-red-50 text-red-800",
  draw: "border-zvv-border bg-zvv-card-mid text-zvv-muted",
  muted: "border-zvv-border bg-white text-zvv-muted",
  gold: "border-amber-400/45 bg-amber-50 text-amber-900",
  live: "border-zvv-primary/35 bg-zvv-primary-muted text-zvv-primary",
} as const;

export function Badge({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
