import { cn } from "@/lib/utils";

/** Compact role chip for RoleMenu (S-03). */
export function AcademyRoleBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "active" | "locked";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        tone === "active" && "bg-zvv-primary/15 text-zvv-primary",
        tone === "locked" && "bg-zvv-muted/40 text-zvv-muted",
        tone === "neutral" && "bg-zvv-surface text-zvv-ink",
      )}
      data-academy-component="RoleBadge"
    >
      {label}
    </span>
  );
}
