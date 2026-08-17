"use client";

import { useEffect, useMemo, useState } from "react";
import { AcademyAppShell } from "@/components/academie/academy-app-shell";
import { AcademyFirstUseExperience } from "@/components/academie/academy-first-use";
import { AcademyReturningDashboard } from "@/components/academie/academy-returning-dashboard";
import { resolveCanonicalLearnerModel } from "@/lib/decision-lab/academy-visibility";
import { listDecisionLabSessions } from "@/lib/decision-lab/session-catalog";
import {
  readDecisionLabProgress,
  type DecisionLabProgressMap,
} from "@/lib/decision-lab/progress";

export function AcademyHomeDashboard() {
  const sessions = useMemo(() => listDecisionLabSessions(), []);
  const [progress, setProgress] = useState<DecisionLabProgressMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProgress(readDecisionLabProgress());
    setHydrated(true);
  }, []);

  const model = useMemo(
    () => resolveCanonicalLearnerModel(sessions, progress),
    [sessions, progress],
  );

  const primary = model.primary ?? sessions[0]!;
  const nextTwo = useMemo(() => {
    const idx = sessions.findIndex((s) => s.id === primary.id);
    return sessions.slice(Math.max(0, idx + 1), Math.max(0, idx + 1) + 2);
  }, [sessions, primary.id]);

  return (
    <AcademyAppShell>
      {!hydrated ? (
        <div className="space-y-6" aria-busy>
          <div className="h-10 max-w-md animate-pulse rounded-xl bg-slate-200/80" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />
          <div className="min-h-[420px] animate-pulse rounded-[1.75rem] bg-slate-200/60" />
        </div>
      ) : model.isFirstUse ? (
        <AcademyFirstUseExperience
          primary={primary}
          ctaLabel={model.ctaLabel}
          nextTwo={nextTwo}
        />
      ) : (
        <AcademyReturningDashboard model={model} progress={progress} hydrated={hydrated} />
      )}
    </AcademyAppShell>
  );
}
