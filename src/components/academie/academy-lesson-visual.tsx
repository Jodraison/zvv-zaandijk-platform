import { GlassCard } from "@/components/layout/glass-card";
import { cn } from "@/lib/utils";
import { AcademyLessonAnchorSlot, AcademyLessonPracticeExampleBlock } from "@/components/academie/academy-lesson-section";
import type { AcademyLessonPracticeExample, AcademyLessonVisual } from "@/lib/academie/lesson-types";
import { hasLessonText } from "@/lib/academie/lesson-utils";

const KIND_LABELS: Record<AcademyLessonVisual["kind"], string> = {
  placeholder: "Media",
  image: "Afbeelding",
  tactical: "Tactische illustratie",
  youtube: "Video",
};

function LessonVisualItem({ visual, slotAnchorId }: { visual: AcademyLessonVisual; slotAnchorId?: string }) {
  const isTactical = visual.kind === "tactical";
  const isImage = visual.kind === "image";

  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zvv-muted">{KIND_LABELS[visual.kind]}</p>

      {visual.kind === "placeholder" ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-zvv-border/90 bg-gradient-to-b from-zvv-card-mid/30 to-white/50 px-3 py-8 sm:min-h-[220px] md:min-h-[260px]">
          {slotAnchorId ? (
            <AcademyLessonAnchorSlot anchorId={slotAnchorId} className="min-h-[9rem] w-full border-zvv-border/70 bg-white/40 sm:min-h-[11rem]" />
          ) : (
            <span className="text-3xl opacity-30" aria-hidden>
              🖼️
            </span>
          )}
        </div>
      ) : null}

      {isImage || isTactical ? (
        <figure className="overflow-hidden rounded-2xl border border-zvv-border bg-white shadow-sm">
          <div className={cn("flex items-center justify-center", isTactical ? "bg-[#1a472a]/[0.06] p-2 sm:p-3" : "bg-zvv-card-mid/20 p-1")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={visual.src}
              alt={visual.alt}
              loading="lazy"
              decoding="async"
              className={cn(
                "h-auto w-full max-w-full",
                isTactical ? "max-h-[min(420px,55vh)] object-contain" : "max-h-[min(480px,60vh)] object-contain",
              )}
            />
          </div>
          {hasLessonText(visual.caption) ? (
            <figcaption className="border-t border-zvv-border/70 px-4 py-3 text-sm leading-relaxed text-zvv-muted">{visual.caption}</figcaption>
          ) : null}
        </figure>
      ) : null}

      {visual.kind === "youtube" ? (
        <figure className="overflow-hidden rounded-2xl border border-zvv-border bg-zvv-ink shadow-sm">
          <div className="relative aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${visual.videoId}`}
              title={visual.title ?? "Academy-video"}
              loading="lazy"
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {hasLessonText(visual.caption) ? (
            <figcaption className="border-t border-zvv-border/70 bg-white px-4 py-3 text-sm leading-relaxed text-zvv-muted">{visual.caption}</figcaption>
          ) : null}
        </figure>
      ) : null}
    </div>
  );
}

const VISUAL_SLOT_NAMES = ["afbeelding", "tactisch", "video", "media"] as const;

export function AcademyLessonVisualBlock({
  visuals,
  anchorId,
  practiceExample,
}: {
  visuals: AcademyLessonVisual[];
  anchorId?: string;
  practiceExample?: AcademyLessonPracticeExample;
}) {
  if (visuals.length === 0) return null;

  const multi = visuals.length > 1;

  return (
    <section aria-labelledby="lesson-visual-heading">
      <GlassCard
        glow
        className="club-card-lift overflow-hidden border-zvv-primary/20 bg-gradient-to-br from-white to-zvv-card-mid/20 p-0 shadow-[var(--shadow-zvv-lift)]"
      >
        <div className="border-b border-zvv-border/70 bg-white/70 px-4 py-4 sm:px-6 sm:py-5">
          <p className="club-page-eyebrow">Visual first</p>
          <h2 id="lesson-visual-heading" className="mt-1 font-[family-name:var(--font-display)] text-lg tracking-wide text-zvv-ink sm:text-xl">
            {multi ? "Beeld & tactiek" : KIND_LABELS[visuals[0].kind]}
          </h2>
        </div>

        <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-7">
          <div className={cn("grid grid-cols-1 gap-5", multi && "md:grid-cols-2 md:gap-6")}>
            {visuals.map((visual, index) => {
              const slotName = VISUAL_SLOT_NAMES[index] ?? `slot-${index + 1}`;
              const slotAnchorId = anchorId ? `${anchorId}.${slotName}` : undefined;
              return <LessonVisualItem key={`${visual.kind}-${index}`} visual={visual} slotAnchorId={slotAnchorId} />;
            })}
          </div>

          {practiceExample && (hasLessonText(practiceExample.body) || hasLessonText(practiceExample.anchorId)) ? (
            <AcademyLessonPracticeExampleBlock example={practiceExample} />
          ) : null}
        </div>
      </GlassCard>
    </section>
  );
}
