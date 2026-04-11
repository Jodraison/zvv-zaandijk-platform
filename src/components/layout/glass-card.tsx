import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "glass-panel",
  subtle: "glass-panel-subtle",
  elevated: "glass-panel inner-highlight shadow-[var(--shadow-zvv-card)]",
} as const;

export function GlassCard({
  children,
  className,
  glow,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  variant?: keyof typeof variants;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 transition-[border-color,box-shadow,transform] duration-300 ease-out md:p-7",
        variants[variant],
        glow && "hover:border-zvv-primary/20 hover:shadow-[var(--shadow-zvv-lift)]",
        className,
      )}
    >
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
