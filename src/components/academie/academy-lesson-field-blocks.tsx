import { GlassCard } from "@/components/layout/glass-card";
import { cn } from "@/lib/utils";
import {
  AcademyLessonAnchorSlot,
  AcademyLessonPracticeExampleBlock,
} from "@/components/academie/academy-lesson-section";
import type {
  AcademyLessonFieldSlot,
  AcademyLessonOnThePitch,
  AcademyLessonPitchSlot,
  AcademyLessonPracticeExample,
  AcademyLessonWhenToUse,
  AcademyLessonWhyLearning,
} from "@/lib/academie/lesson-types";
import { hasLessonText, resolveFieldSlotAnchor } from "@/lib/academie/lesson-utils";

export const WHY_LEARNING_SLOT_LABELS: Record<string, string> = {
  "why-important": "Waarom is dit belangrijk?",
  delivers: "Wat levert dit op?",
  "helps-team": "Hoe helpt dit het team?",
  "wins-matches": "Waarom winnen we hierdoor wedstrijden?",
};

export const PITCH_FORMAT_LABELS: Record<string, string> = {
  "warming-up": "Warming-up",
  positiespel: "Positiespel",
  partijvorm: "Partijvorm",
  omschakelvorm: "Omschakelvorm",
  afwerkvorm: "Afwerkvorm",
  wedstrijd: "Wedstrijd",
};

export const USAGE_CONTEXT_LABELS: Record<string, string> = {
  balbezit: "Balbezit",
  balverlies: "Balverlies",
  omschakeling: "Omschakeling",
  standaardsituaties: "Standaardsituaties",
  coaching: "Coaching",
};

function FieldSlotCard({
  label,
  slot,
  baseAnchor,
  compact,
}: {
  label: string;
  slot: AcademyLessonFieldSlot;
  baseAnchor?: string;
  compact?: boolean;
}) {
  const anchorId = resolveFieldSlotAnchor(baseAnchor, slot);
  const hasBody = hasLessonText(slot.body);

  return (
    <div className={cn("rounded-xl border border-zvv-border/80 bg-white/90 px-4 py-3.5", compact && "py-3")}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zvv-muted">{label}</p>
      {hasBody ? (
        <p className={cn("mt-2 text-[15px] leading-relaxed text-zvv-ink", compact && "text-sm")}>{slot.body}</p>
      ) : anchorId ? (
        <div className="mt-2">
          <AcademyLessonAnchorSlot anchorId={anchorId} className={cn("min-h-[3rem] bg-white/60", compact ? "min-h-[2.75rem]" : "sm:min-h-[3.5rem]")} />
        </div>
      ) : null}
    </div>
  );
}

function PitchFormatCard({ slot, baseAnchor }: { slot: AcademyLessonPitchSlot; baseAnchor?: string }) {
  const label = slot.label ?? PITCH_FORMAT_LABELS[slot.id] ?? slot.id;
  const anchorId = resolveFieldSlotAnchor(baseAnchor, slot);
  const hasBody = hasLessonText(slot.body);
  const hasVideo = hasLessonText(slot.videoAnchorId);
  const hasDrill = hasLessonText(slot.drillAnchorId);

  return (
    <div className="rounded-xl border border-emerald-600/20 bg-gradient-to-br from-emerald-50/50 to-white px-4 py-3.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-800/70">{label}</p>
      {hasBody ? (
        <p className="mt-2 text-sm leading-relaxed text-zvv-ink">{slot.body}</p>
      ) : anchorId ? (
        <div className="mt-2">
          <AcademyLessonAnchorSlot anchorId={anchorId} className="min-h-[2.75rem] border-emerald-600/20 bg-white/60 sm:min-h-[3rem]" />
        </div>
      ) : null}
      {(hasVideo || hasDrill) && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {hasVideo ? (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-zvv-muted">Video</p>
              <AcademyLessonAnchorSlot anchorId={slot.videoAnchorId!} className="mt-1 min-h-[2.5rem] bg-white/50" />
            </div>
          ) : null}
          {hasDrill ? (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-zvv-muted">Oefenvorm</p>
              <AcademyLessonAnchorSlot anchorId={slot.drillAnchorId!} className="mt-1 min-h-[2.5rem] bg-white/50" />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function UsageContextChip({ slot, baseAnchor }: { slot: AcademyLessonFieldSlot; baseAnchor?: string }) {
  const label = slot.label ?? USAGE_CONTEXT_LABELS[slot.id] ?? slot.id;
  const anchorId = resolveFieldSlotAnchor(baseAnchor, slot);
  const hasBody = hasLessonText(slot.body);

  return (
    <div className="rounded-xl border border-zvv-primary/20 bg-zvv-primary-muted/25 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wider text-zvv-primary">{label}</p>
      {hasBody ? (
        <p className="mt-1.5 text-sm leading-relaxed text-zvv-ink">{slot.body}</p>
      ) : anchorId ? (
        <div className="mt-2">
          <AcademyLessonAnchorSlot anchorId={anchorId} className="min-h-[2.5rem] bg-white/50" />
        </div>
      ) : null}
    </div>
  );
}

export function AcademyLessonWhyLearningBlock({
  block,
  sectionAnchorId,
  practiceExample,
}: {
  block?: AcademyLessonWhyLearning;
  sectionAnchorId?: string;
  practiceExample?: AcademyLessonPracticeExample;
}) {
  if (!block?.items?.length && !sectionAnchorId) return null;

  const baseAnchor = sectionAnchorId;

  return (
    <section aria-labelledby="lesson-why-learning-heading">
      <GlassCard className="club-card-lift border-zvv-blue-deep/15 bg-gradient-to-br from-white to-zvv-card-mid/25 px-4 py-5 sm:px-6 sm:py-6">
        <p className="club-page-eyebrow">Waarom</p>
        <h2 id="lesson-why-learning-heading" className="mt-1 font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink sm:text-2xl">
          Waarom leer ik dit?
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-zvv-muted">
          Begrijp waarom deze les ertoe doet — op het veld én in wedstrijden.
        </p>

        {block?.items && block.items.length > 0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
            {block.items.map((item) => (
              <FieldSlotCard
                key={item.id}
                label={item.label ?? WHY_LEARNING_SLOT_LABELS[item.id] ?? item.id}
                slot={item}
                baseAnchor={baseAnchor}
              />
            ))}
          </div>
        ) : baseAnchor ? (
          <div className="mt-5">
            <AcademyLessonAnchorSlot anchorId={baseAnchor} className="min-h-[4.5rem] sm:min-h-[5rem]" />
          </div>
        ) : null}

        {practiceExample ? <AcademyLessonPracticeExampleBlock example={practiceExample} /> : null}
      </GlassCard>
    </section>
  );
}

export function AcademyLessonWhenToUseBlock({
  block,
  sectionAnchorId,
  practiceExample,
}: {
  block?: AcademyLessonWhenToUse;
  sectionAnchorId?: string;
  practiceExample?: AcademyLessonPracticeExample;
}) {
  if (!block?.items?.length && !sectionAnchorId) return null;

  const baseAnchor = sectionAnchorId;

  return (
    <section aria-labelledby="lesson-when-to-use-heading">
      <GlassCard className="club-card-lift border-zvv-primary/20 bg-gradient-to-br from-zvv-primary-muted/20 to-white px-4 py-5 sm:px-6 sm:py-6">
        <p className="club-page-eyebrow">Wanneer</p>
        <h2 id="lesson-when-to-use-heading" className="mt-1 font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink sm:text-2xl">
          Wanneer gebruik je dit?
        </h2>
        <p className="mt-2 max-w-prose text-sm text-zvv-muted">Herken de momenten waarop je dit op training of wedstrijd toepast.</p>

        {block?.items && block.items.length > 0 ? (
          <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {block.items.map((item) => (
              <UsageContextChip key={item.id} slot={item} baseAnchor={baseAnchor} />
            ))}
          </div>
        ) : baseAnchor ? (
          <div className="mt-5">
            <AcademyLessonAnchorSlot anchorId={baseAnchor} className="min-h-[4.5rem] sm:min-h-[5rem]" />
          </div>
        ) : null}

        {practiceExample ? <AcademyLessonPracticeExampleBlock example={practiceExample} /> : null}
      </GlassCard>
    </section>
  );
}

export function AcademyLessonOnThePitchBlock({
  block,
  sectionAnchorId,
  practiceExample,
}: {
  block?: AcademyLessonOnThePitch;
  sectionAnchorId?: string;
  practiceExample?: AcademyLessonPracticeExample;
}) {
  if (!block?.slots?.length && !sectionAnchorId) return null;

  const baseAnchor = sectionAnchorId;

  return (
    <section aria-labelledby="lesson-on-the-pitch-heading">
      <GlassCard className="club-card-lift border-emerald-600/25 bg-gradient-to-br from-emerald-50/40 to-white px-4 py-5 sm:px-6 sm:py-6">
        <p className="club-page-eyebrow text-emerald-800/80">Trainingsveld</p>
        <h2 id="lesson-on-the-pitch-heading" className="mt-1 font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink sm:text-2xl">
          Op het trainingsveld
        </h2>
        <p className="mt-2 max-w-prose text-sm text-zvv-muted">Waar kom je dit tegen tijdens training — en hoe sluit het aan op wedstrijden?</p>

        {block?.slots && block.slots.length > 0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {block.slots.map((slot) => (
              <PitchFormatCard key={slot.id} slot={slot} baseAnchor={baseAnchor} />
            ))}
          </div>
        ) : baseAnchor ? (
          <div className="mt-5">
            <AcademyLessonAnchorSlot anchorId={baseAnchor} className="min-h-[4.5rem] sm:min-h-[5rem]" />
          </div>
        ) : null}

        {practiceExample ? <AcademyLessonPracticeExampleBlock example={practiceExample} /> : null}
      </GlassCard>
    </section>
  );
}
