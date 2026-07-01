import { GlassCard } from "@/components/layout/glass-card";
import { ACADEMY_HOME_INTRO } from "@/lib/academie";

export function AcademyIntroBlock() {
  return (
    <GlassCard className="club-card-lift border-zvv-primary/15 bg-gradient-to-r from-zvv-primary-muted/40 via-white to-white">
      <p className="club-page-eyebrow">Doel</p>
      <p className="mt-3 max-w-3xl text-[16px] leading-[1.75] text-zvv-ink md:text-lg md:leading-[1.7]">{ACADEMY_HOME_INTRO}</p>
    </GlassCard>
  );
}
