import Link from "next/link";
import type { ReactNode } from "react";
import { GlassCard } from "@/components/layout/glass-card";
import { Badge } from "@/components/layout/badge";
import { AcademyBreadcrumbs, type AcademyBreadcrumbItem } from "@/components/academie/academy-breadcrumbs";
import {
  AcademyLessonAnchorSlot,
  AcademyLessonPracticeExampleBlock,
  AcademyLessonSection,
  LESSON_DETAIL_GAP,
  LESSON_FIELD_GAP,
  LESSON_SCAN_GAP,
} from "@/components/academie/academy-lesson-section";
import { AcademyLessonCoachNotebook } from "@/components/academie/academy-lesson-coach-notebook";
import {
  AcademyLessonOnThePitchBlock,
  AcademyLessonWhenToUseBlock,
  AcademyLessonWhyLearningBlock,
} from "@/components/academie/academy-lesson-field-blocks";
import { AcademyLessonKeyTakeaway } from "@/components/academie/academy-lesson-key-takeaway";
import { AcademyLessonQuickReference } from "@/components/academie/academy-lesson-quick-reference";
import { AcademyLessonVisualBlock } from "@/components/academie/academy-lesson-visual";
import { AcademyLessonNavigation } from "@/components/academie/academy-lesson-navigation";
import type { AcademyChapterLessonNav } from "@/lib/academie/chapter-types";
import type { AcademyLesson } from "@/lib/academie/lesson-types";
import { academyTopicHref } from "@/lib/academie";
import {
  getLessonSectionAnchor,
  getSectionPracticeExample,
  hasCoachNotebook,
  hasLessonList,
  hasLessonText,
  hasQuickReference,
  hasSelfCheck,
  hasTrainerFocus,
  hasOnThePitch,
  hasWhenToUse,
  hasWhyLearning,
  normalizeLessonParagraphs,
  resolveLessonVisuals,
  shouldRenderFieldBlock,
  shouldRenderLessonSection,
} from "@/lib/academie/lesson-utils";
import { cn } from "@/lib/utils";

function LessonReadingTime({ minutes }: { minutes: number }) {
  if (minutes <= 0) return null;
  return (
    <Badge tone="muted" className="shrink-0">
      ± {minutes} min lezen
    </Badge>
  );
}

export function AcademyLessonLayout({
  breadcrumbs,
  lesson,
  sidebar,
  chapterNav,
}: {
  breadcrumbs: AcademyBreadcrumbItem[];
  lesson: AcademyLesson;
  sidebar?: ReactNode;
  /** Vorige/volgende navigatie — alleen wanneer les onderdeel is van een chapter. */
  chapterNav?: AcademyChapterLessonNav;
}) {
  const practicalParagraphs = normalizeLessonParagraphs(lesson.practicalExplanation);
  const showQuiz = lesson.quiz?.enabled === true;
  const lessonVisuals = resolveLessonVisuals(lesson);
  const readingTime = lesson.estimatedReadingTime ?? lesson.quickReference?.readingTimeMinutes;

  const summaryAnchor = getLessonSectionAnchor(lesson, "summary");
  const quickRefAnchor = getLessonSectionAnchor(lesson, "quickReference");
  const visualAnchor = getLessonSectionAnchor(lesson, "visual");
  const keyTakeawayAnchor = getLessonSectionAnchor(lesson, "keyTakeaway");
  const whyAnchor = getLessonSectionAnchor(lesson, "whyImportant");
  const practicalAnchor = getLessonSectionAnchor(lesson, "practicalExplanation");
  const mistakesAnchor = getLessonSectionAnchor(lesson, "commonMistakes");
  const notebookAnchor = getLessonSectionAnchor(lesson, "coachNotebook");
  const trainerFocusAnchor = getLessonSectionAnchor(lesson, "trainerFocus") ?? lesson.trainerFocus?.anchorId;
  const selfCheckAnchor = getLessonSectionAnchor(lesson, "selfCheck") ?? lesson.selfCheck?.anchorId;
  const relatedAnchor = getLessonSectionAnchor(lesson, "relatedTopics");
  const whyLearningAnchor = getLessonSectionAnchor(lesson, "whyLearning");
  const onThePitchAnchor = getLessonSectionAnchor(lesson, "onThePitch");
  const whenToUseAnchor = getLessonSectionAnchor(lesson, "whenToUse");

  const summaryPractice = getSectionPracticeExample(lesson, "summary");

  const showQuickRef = shouldRenderLessonSection(lesson, "quickReference", hasQuickReference(lesson.quickReference));
  const showVisual = lessonVisuals.length > 0;
  const showKeyTakeaway = shouldRenderLessonSection(lesson, "keyTakeaway", hasLessonText(lesson.keyTakeaway));
  const hasScanZone = showQuickRef || showVisual || showKeyTakeaway;

  const showWhyLearning = shouldRenderFieldBlock(lesson, "whyLearning", hasWhyLearning(lesson.whyLearning));
  const showWhenToUse = shouldRenderFieldBlock(lesson, "whenToUse", hasWhenToUse(lesson.whenToUse));
  const showOnThePitch = shouldRenderFieldBlock(lesson, "onThePitch", hasOnThePitch(lesson.onThePitch));
  const hasFieldZone = showWhyLearning || showWhenToUse || showOnThePitch;

  return (
    <div className="space-y-8 md:space-y-10">
      <AcademyBreadcrumbs items={breadcrumbs} />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start xl:gap-12">
        <article className="space-y-8 md:space-y-10 lg:space-y-12">
          <header className="club-section-surface club-reveal border-b border-zvv-border/60 pb-8 md:pb-10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="club-page-eyebrow">Les</p>
              {typeof readingTime === "number" ? <LessonReadingTime minutes={readingTime} /> : null}
            </div>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(2rem,5.5vw,3.5rem)] leading-[0.98] tracking-wide text-zvv-ink">
              {lesson.title}
            </h1>
            {hasLessonText(lesson.summary) ? (
              <p className="mt-5 max-w-prose text-[15px] leading-[1.8] text-zvv-muted md:text-base md:leading-[1.75]">{lesson.summary}</p>
            ) : summaryAnchor ? (
              <div className="mt-5 max-w-prose">
                <AcademyLessonAnchorSlot anchorId={summaryAnchor} className="min-h-[4.5rem]" />
              </div>
            ) : null}
            {summaryPractice ? (
              <div className="mt-5 max-w-prose rounded-2xl border border-zvv-border/80 bg-white/80 px-5 py-4 md:px-6 md:py-5">
                <AcademyLessonPracticeExampleBlock example={summaryPractice} />
              </div>
            ) : null}
          </header>

          {hasScanZone ? (
            <div className={cn(LESSON_SCAN_GAP, "scroll-mt-24")} aria-label="Snelle samenvatting">
              {showQuickRef ? (
                <AcademyLessonQuickReference
                  quickReference={lesson.quickReference}
                  anchorId={quickRefAnchor}
                  practiceExample={getSectionPracticeExample(lesson, "quickReference")}
                  suppressReadingTime={typeof readingTime === "number"}
                />
              ) : null}

              {showVisual ? (
                <AcademyLessonVisualBlock
                  visuals={lessonVisuals}
                  anchorId={visualAnchor}
                  practiceExample={getSectionPracticeExample(lesson, "visual")}
                />
              ) : null}

              {showKeyTakeaway ? (
                <AcademyLessonKeyTakeaway
                  message={lesson.keyTakeaway}
                  anchorId={keyTakeawayAnchor}
                  practiceExample={getSectionPracticeExample(lesson, "keyTakeaway")}
                />
              ) : null}
            </div>
          ) : null}

          {hasFieldZone ? (
            <div className={cn(LESSON_FIELD_GAP, "scroll-mt-24")} aria-label="Koppeling met training en wedstrijd">
              {showWhyLearning ? (
                <AcademyLessonWhyLearningBlock
                  block={lesson.whyLearning}
                  sectionAnchorId={whyLearningAnchor}
                  practiceExample={getSectionPracticeExample(lesson, "whyLearning")}
                />
              ) : null}

              {showWhenToUse ? (
                <AcademyLessonWhenToUseBlock
                  block={lesson.whenToUse}
                  sectionAnchorId={whenToUseAnchor}
                  practiceExample={getSectionPracticeExample(lesson, "whenToUse")}
                />
              ) : null}

              {showOnThePitch ? (
                <AcademyLessonOnThePitchBlock
                  block={lesson.onThePitch}
                  sectionAnchorId={onThePitchAnchor}
                  practiceExample={getSectionPracticeExample(lesson, "onThePitch")}
                />
              ) : null}
            </div>
          ) : null}

          <div className={cn(LESSON_DETAIL_GAP, "scroll-mt-24")} aria-label="Lesinhoud">
            {shouldRenderLessonSection(lesson, "whyImportant", hasLessonText(lesson.whyImportant)) ? (
              <AcademyLessonSection
                sectionId="lesson-why-important"
                eyebrow="Context"
                title="Waarom is dit belangrijk?"
                variant="highlight"
                anchorId={whyAnchor}
                practiceExample={getSectionPracticeExample(lesson, "whyImportant")}
              >
                {hasLessonText(lesson.whyImportant) ? <p>{lesson.whyImportant}</p> : null}
              </AcademyLessonSection>
            ) : null}

            {shouldRenderLessonSection(lesson, "practicalExplanation", practicalParagraphs.length > 0) ? (
              <AcademyLessonSection
                sectionId="lesson-practical"
                eyebrow="Uitleg"
                title="Praktische uitleg"
                anchorId={practicalAnchor}
                practiceExample={getSectionPracticeExample(lesson, "practicalExplanation")}
              >
                {practicalParagraphs.length > 0 ? (
                  <div className="space-y-4">
                    {practicalParagraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                ) : null}
              </AcademyLessonSection>
            ) : null}

            {shouldRenderLessonSection(lesson, "commonMistakes", hasLessonList(lesson.commonMistakes)) ? (
              <AcademyLessonSection
                sectionId="lesson-mistakes"
                eyebrow="Let op"
                title="Veelgemaakte fouten"
                anchorId={mistakesAnchor}
                practiceExample={getSectionPracticeExample(lesson, "commonMistakes")}
              >
                {hasLessonList(lesson.commonMistakes) ? (
                  <ul className="space-y-2.5" role="list">
                    {lesson.commonMistakes.map((mistake) => (
                      <li key={mistake} className="flex gap-3 rounded-xl border border-zvv-border/80 bg-white/70 px-4 py-3.5 text-zvv-ink">
                        <span className="shrink-0 text-rose-500" aria-hidden>
                          ✕
                        </span>
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="space-y-2.5">
                    <AcademyLessonAnchorSlot anchorId={`${mistakesAnchor}.1`} />
                    <AcademyLessonAnchorSlot anchorId={`${mistakesAnchor}.2`} />
                  </div>
                )}
              </AcademyLessonSection>
            ) : null}

            {shouldRenderLessonSection(lesson, "coachNotebook", hasCoachNotebook(lesson.coachNotebook)) ? (
              <AcademyLessonCoachNotebook
                notebook={lesson.coachNotebook}
                anchorId={notebookAnchor}
                practiceExample={getSectionPracticeExample(lesson, "coachNotebook")}
              />
            ) : null}

            {shouldRenderLessonSection(lesson, "trainerFocus", hasTrainerFocus(lesson.trainerFocus)) ? (
              <AcademyLessonSection
                sectionId="lesson-trainer-focus"
                eyebrow="Trainer"
                title="Let hier op"
                className="border-l-4 border-l-amber-500"
                anchorId={trainerFocusAnchor}
              >
                {hasLessonText(lesson.trainerFocus?.body) ? <p className="text-zvv-ink">{lesson.trainerFocus?.body}</p> : null}
              </AcademyLessonSection>
            ) : null}

            {shouldRenderLessonSection(lesson, "selfCheck", hasSelfCheck(lesson.selfCheck)) ? (
              <AcademyLessonSection sectionId="lesson-self-check" eyebrow="Reflectie" title="Zelf controleren" anchorId={selfCheckAnchor}>
                {lesson.selfCheck?.items && lesson.selfCheck.items.length > 0 ? (
                  <fieldset className="space-y-3">
                    <legend className="sr-only">Controleer of je dit kunt toepassen</legend>
                    <ul className="space-y-3" role="list">
                      {lesson.selfCheck.items.map((item) => {
                        const itemAnchor = selfCheckAnchor ? `${selfCheckAnchor}.${item.id}` : undefined;
                        const checkboxId = `self-check-${item.id}`;
                        return (
                          <li key={item.id}>
                            <label
                              htmlFor={checkboxId}
                              className="flex min-h-[48px] cursor-default items-start gap-3 rounded-xl border border-zvv-border/80 bg-white/70 px-4 py-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-zvv-primary/40 has-[:focus-visible]:ring-offset-2"
                            >
                              <input
                                id={checkboxId}
                                type="checkbox"
                                disabled
                                readOnly
                                aria-disabled
                                className="mt-0.5 h-5 w-5 shrink-0 rounded border-zvv-border accent-zvv-primary"
                              />
                              {hasLessonText(item.label) ? (
                                <span className="text-[15px] leading-relaxed text-zvv-ink">{item.label}</span>
                              ) : itemAnchor ? (
                                <AcademyLessonAnchorSlot anchorId={itemAnchor} className="min-h-[2.75rem] flex-1 bg-white/50" />
                              ) : null}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </fieldset>
                ) : null}
              </AcademyLessonSection>
            ) : null}

            {hasLessonText(lesson.coachTip) ? (
              <AcademyLessonSection sectionId="lesson-coach-tip" eyebrow="Trainer" title="Coach-tip" variant="tip">
                <p className="text-zvv-ink">{lesson.coachTip}</p>
              </AcademyLessonSection>
            ) : null}

            {hasLessonList(lesson.keyPoints) ? (
              <AcademyLessonSection sectionId="lesson-key-points" eyebrow="Samenvatting" title="Belangrijkste punten">
                <ul className="space-y-2.5" role="list">
                  {lesson.keyPoints.map((point) => (
                    <li key={point} className="flex gap-3 rounded-xl border border-zvv-border bg-white/70 px-4 py-3.5">
                      <span className="mt-0.5 shrink-0 font-bold text-zvv-primary" aria-hidden>
                        ✓
                      </span>
                      <span className="text-zvv-ink">{point}</span>
                    </li>
                  ))}
                </ul>
              </AcademyLessonSection>
            ) : null}

            {shouldRenderLessonSection(lesson, "relatedTopics", !!(lesson.relatedTopics && lesson.relatedTopics.length > 0)) ? (
              <AcademyLessonSection sectionId="lesson-related" eyebrow="Verder lezen" title="Gerelateerde onderwerpen" anchorId={relatedAnchor}>
                {lesson.relatedTopics && lesson.relatedTopics.length > 0 ? (
                  <ul className="grid gap-2.5 sm:grid-cols-2" role="list">
                    {lesson.relatedTopics.map((related) => (
                      <li key={`${related.categorySlug}-${related.topicSlug}`}>
                        <Link
                          href={academyTopicHref(related.categorySlug, related.topicSlug)}
                          className="flex min-h-[48px] items-center justify-between rounded-xl border border-zvv-border bg-white/70 px-4 py-3 text-sm font-semibold text-zvv-ink transition-colors hover:border-zvv-primary/25 hover:text-zvv-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zvv-primary/40 focus-visible:ring-offset-2"
                        >
                          {related.title}
                          <span aria-hidden>→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </AcademyLessonSection>
            ) : null}

            {showQuiz ? (
              <GlassCard className="club-card-lift border-dashed border-zvv-border bg-zvv-card-mid/30 px-4 py-5 sm:px-6 sm:py-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="club-page-eyebrow">Toetsing</p>
                    <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl tracking-wide text-zvv-ink md:text-2xl">
                      {lesson.quiz?.label ?? "Quiz"}
                    </h2>
                  </div>
                  <Badge tone="gold">Binnenkort</Badge>
                </div>
                {hasLessonText(lesson.quiz?.description) ? (
                  <p className="mt-4 max-w-prose text-sm leading-relaxed text-zvv-muted">{lesson.quiz.description}</p>
                ) : null}
                <div className="mt-6 min-h-[88px] rounded-xl border border-dashed border-zvv-border bg-white/50" aria-hidden />
              </GlassCard>
            ) : null}

            {chapterNav ? <AcademyLessonNavigation nav={chapterNav} /> : null}
          </div>
        </article>

        {sidebar ? (
          <aside aria-label="Les-navigatie" className="xl:sticky xl:top-24">
            {sidebar}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
