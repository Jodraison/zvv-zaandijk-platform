import type {
  AcademyLesson,
  AcademyLessonCoachNotebook,
  AcademyLessonFieldSlot,
  AcademyLessonOnThePitch,
  AcademyLessonPracticeExample,
  AcademyLessonQuickReference,
  AcademyLessonSectionKey,
  AcademyLessonSelfCheck,
  AcademyLessonTrainerFocus,
  AcademyLessonVisual,
  AcademyLessonWhenToUse,
  AcademyLessonWhyLearning,
} from "@/lib/academie/lesson-types";

/** True wanneer een optionele les-sectie getoond mag worden. */
export function hasLessonText(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function hasLessonList(value: string[] | undefined): value is string[] {
  return Array.isArray(value) && value.length > 0;
}

export function normalizeLessonParagraphs(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((p) => p.trim().length > 0);
  return hasLessonText(value) ? [value] : [];
}

export function normalizeLessonItems(value: string | string[] | undefined): string[] {
  return normalizeLessonParagraphs(value);
}

export function hasQuickReference(quickReference: AcademyLessonQuickReference | undefined): quickReference is AcademyLessonQuickReference {
  if (!quickReference) return false;
  return (
    hasLessonText(quickReference.mainTask) ||
    hasLessonText(quickReference.keyFocus) ||
    typeof quickReference.readingTimeMinutes === "number" ||
    normalizeLessonItems(quickReference.doThis).length > 0 ||
    normalizeLessonItems(quickReference.doNot).length > 0
  );
}

export function hasCoachNotebook(notebook: AcademyLessonCoachNotebook | undefined): notebook is AcademyLessonCoachNotebook {
  return !!notebook && hasLessonText(notebook.body);
}

export function getLessonSectionAnchor(lesson: AcademyLesson, section: AcademyLessonSectionKey): string | undefined {
  return lesson.contentAnchors?.[section]?.id;
}

export function lessonSectionIsAnchored(lesson: AcademyLesson, section: AcademyLessonSectionKey): boolean {
  return hasLessonText(getLessonSectionAnchor(lesson, section));
}

export function shouldRenderLessonSection(
  lesson: AcademyLesson,
  section: AcademyLessonSectionKey,
  hasContent: boolean,
): boolean {
  return hasContent || lessonSectionIsAnchored(lesson, section);
}

export function getSectionPracticeExample(lesson: AcademyLesson, section: AcademyLessonSectionKey) {
  return lesson.sectionExtras?.[section]?.practiceExample;
}

export function hasPracticeExample(example: AcademyLessonPracticeExample | undefined): boolean {
  return !!example && (hasLessonText(example.anchorId) || hasLessonText(example.body));
}

export function hasTrainerFocus(focus: AcademyLessonTrainerFocus | undefined): boolean {
  return !!focus && (hasLessonText(focus.anchorId) || hasLessonText(focus.body));
}

export function hasSelfCheck(selfCheck: AcademyLessonSelfCheck | undefined): boolean {
  if (!selfCheck) return false;
  return hasLessonText(selfCheck.anchorId) || !!(selfCheck.items && selfCheck.items.length > 0);
}

export function hasFieldSlots(items: AcademyLessonFieldSlot[] | undefined): boolean {
  if (!items?.length) return false;
  return items.some((item) => hasLessonText(item.body) || hasLessonText(item.label) || hasLessonText(item.anchorId));
}

export function hasWhyLearning(block: AcademyLessonWhyLearning | undefined): boolean {
  if (!block) return false;
  return hasLessonText(block.anchorId) || hasFieldSlots(block.items);
}

export function hasOnThePitch(block: AcademyLessonOnThePitch | undefined): boolean {
  if (!block) return false;
  return hasLessonText(block.anchorId) || !!(block.slots && block.slots.length > 0);
}

export function hasWhenToUse(block: AcademyLessonWhenToUse | undefined): boolean {
  if (!block) return false;
  return hasLessonText(block.anchorId) || hasFieldSlots(block.items);
}

export function shouldRenderFieldBlock(
  lesson: AcademyLesson,
  section: Extract<AcademyLessonSectionKey, "whyLearning" | "onThePitch" | "whenToUse">,
  hasBlockData: boolean,
): boolean {
  return hasBlockData || lessonSectionIsAnchored(lesson, section);
}

export function resolveFieldSlotAnchor(baseAnchor: string | undefined, slot: AcademyLessonFieldSlot): string | undefined {
  if (hasLessonText(slot.anchorId)) return slot.anchorId;
  if (baseAnchor) return `${baseAnchor}.${slot.id}`;
  return undefined;
}

export function resolveLessonVisuals(lesson: AcademyLesson): AcademyLessonVisual[] {
  if (lesson.visuals && lesson.visuals.length > 0) return lesson.visuals;
  if (lesson.visual) return [lesson.visual];
  return [];
}

export function lessonHasVisualBlock(lesson: AcademyLesson): boolean {
  return resolveLessonVisuals(lesson).length > 0;
}
