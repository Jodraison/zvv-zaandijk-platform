import { TacticalIllustration } from "@/components/academie/tactical-illustration";
import { cn } from "@/lib/utils";

/** @deprecated Gebruik `TacticalIllustration` — behouden als compat-wrapper. */
export type AcademyLessonFieldPreset =
  | "default"
  | "connected-team"
  | "buildup-gk"
  | "press-good"
  | "press-bad"
  | "kw-r6-ball";

const PRESET_TO_SITUATION: Record<AcademyLessonFieldPreset, string> = {
  default: "connected-team",
  "connected-team": "connected-team",
  "buildup-gk": "buildup-gk",
  "press-good": "press-good",
  "press-bad": "press-bad",
  "kw-r6-ball": "kw-r6-ball",
};

/**
 * Compat-laag voor Lesstandaard V2.
 * Alle presets renderen via Tactical Visual System V1.
 */
export function AcademyLessonFieldSvg({
  className,
  preset = "default",
  situationId,
}: {
  className?: string;
  highlightZones?: string[];
  preset?: AcademyLessonFieldPreset;
  situationId?: string;
}) {
  const id = situationId ?? PRESET_TO_SITUATION[preset];
  return (
    <div className={cn(className)}>
      <TacticalIllustration situationId={id} showLegend />
    </div>
  );
}
