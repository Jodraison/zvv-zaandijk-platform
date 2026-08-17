"use client";

import { TacticalIllustration } from "@/components/academie/tactical-illustration";
import {
  GS_ORIENTATION,
  type TacticalOrientationSpec,
} from "@/lib/academie/tactical-canonical-perspective";
import { cn } from "@/lib/utils";

/** Compacte tactische preview met verplichte orientation chrome (C-007). */
export function SessionTacticalPreview({
  situationId,
  className,
  seekMs,
  orientation = GS_ORIENTATION,
}: {
  situationId: string;
  className?: string;
  seekMs?: number;
  orientation?: TacticalOrientationSpec | null;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        className,
      )}
    >
      <TacticalIllustration
        situationId={situationId}
        className="min-h-[200px] w-full md:min-h-[280px] [&_figcaption]:hidden"
        autoplay={false}
        cameraMode="press-detail"
        hierarchyQuiet
        compact
        showControls={false}
        showLegend={false}
        seekMs={seekMs}
        orientation={orientation}
        showOrientation={orientation != null}
      />
    </div>
  );
}
