import type { AcademyLesson } from "@/lib/academie/lesson-types";

const VOETBALVISIE_CATEGORY_ID = "cat.voetbalvisie";
const IDENTITEIT_TOPIC_ID = "topic.voetbalvisie.identiteit";

/** Content anchors — invulschema voor definitieve lesinhoud ZVV Zaandijk VRZ1. */
const IDENTITEIT_ANCHORS = {
  summary: { id: "les.identiteit.summary" },
  quickReference: { id: "les.identiteit.quick-reference" },
  visual: { id: "les.identiteit.visual" },
  keyTakeaway: { id: "les.identiteit.key-takeaway" },
  whyImportant: { id: "les.identiteit.why-important" },
  practicalExplanation: { id: "les.identiteit.practical" },
  commonMistakes: { id: "les.identiteit.mistakes" },
  coachNotebook: { id: "les.identiteit.coach-notebook" },
  trainerFocus: { id: "les.identiteit.trainer-focus" },
  selfCheck: { id: "les.identiteit.zelf-controleren" },
  relatedTopics: { id: "les.identiteit.related" },
  whyLearning: { id: "les.identiteit.waarom-leer-ik-dit" },
  onThePitch: { id: "les.identiteit.op-het-trainingsveld" },
  whenToUse: { id: "les.identiteit.wanneer-gebruik-je-dit" },
} as const;

/**
 * Les: Onze identiteit — content-ready structuur.
 * Definitieve tekst invullen per `data-content-anchor` in dit bestand.
 */
export const ACADEMY_LESSON_DEFINITIONS: AcademyLesson[] = [
  {
    id: "lesson.voetbalvisie.identiteit",
    topicId: IDENTITEIT_TOPIC_ID,
    categoryId: VOETBALVISIE_CATEGORY_ID,
    slug: "onze-identiteit",
    title: "Onze identiteit",
    lessonLevel: "intro",
    estimatedReadingTime: 3,
    qualityLevel: "foundation",
    requiredVisuals: {
      images: 1,
      videos: 0,
      tacticalIllustrations: 0,
    },
    contentAnchors: IDENTITEIT_ANCHORS,
    sectionExtras: {
      summary: { practiceExample: { anchorId: "les.identiteit.summary.praktijk" } },
      quickReference: { practiceExample: { anchorId: "les.identiteit.quick-reference.praktijk" } },
      visual: { practiceExample: { anchorId: "les.identiteit.visual.praktijk" } },
      keyTakeaway: { practiceExample: { anchorId: "les.identiteit.key-takeaway.praktijk" } },
      whyImportant: { practiceExample: { anchorId: "les.identiteit.why-important.praktijk" } },
      practicalExplanation: { practiceExample: { anchorId: "les.identiteit.practical.praktijk" } },
      commonMistakes: { practiceExample: { anchorId: "les.identiteit.mistakes.praktijk" } },
      coachNotebook: { practiceExample: { anchorId: "les.identiteit.coach-notebook.praktijk" } },
      whyLearning: { practiceExample: { anchorId: "les.identiteit.waarom-leer-ik-dit.praktijk" } },
      onThePitch: { practiceExample: { anchorId: "les.identiteit.op-het-trainingsveld.praktijk" } },
      whenToUse: { practiceExample: { anchorId: "les.identiteit.wanneer-gebruik-je-dit.praktijk" } },
    },
    quickReference: {
      readingTimeMinutes: 3,
    },
    visuals: [{ kind: "placeholder" }, { kind: "placeholder" }],
    trainerFocus: {
      anchorId: "les.identiteit.trainer-focus",
    },
    selfCheck: {
      anchorId: "les.identiteit.zelf-controleren",
      items: [{ id: "hoofdtaak" }, { id: "belangrijkste-fout" }, { id: "toepassing" }],
    },
    whyLearning: {
      items: [
        { id: "why-important" },
        { id: "delivers" },
        { id: "helps-team" },
        { id: "wins-matches" },
      ],
    },
    whenToUse: {
      items: [
        { id: "balbezit" },
        { id: "balverlies" },
        { id: "omschakeling" },
        { id: "standaardsituaties" },
        { id: "coaching" },
      ],
    },
    onThePitch: {
      slots: [
        { id: "warming-up", videoAnchorId: "les.identiteit.veld.warming-up.video", drillAnchorId: "les.identiteit.veld.warming-up.oefenvorm" },
        { id: "positiespel", videoAnchorId: "les.identiteit.veld.positiespel.video", drillAnchorId: "les.identiteit.veld.positiespel.oefenvorm" },
        { id: "partijvorm", videoAnchorId: "les.identiteit.veld.partijvorm.video", drillAnchorId: "les.identiteit.veld.partijvorm.oefenvorm" },
        { id: "omschakelvorm", videoAnchorId: "les.identiteit.veld.omschakelvorm.video", drillAnchorId: "les.identiteit.veld.omschakelvorm.oefenvorm" },
        { id: "afwerkvorm", videoAnchorId: "les.identiteit.veld.afwerkvorm.video", drillAnchorId: "les.identiteit.veld.afwerkvorm.oefenvorm" },
        { id: "wedstrijd", videoAnchorId: "les.identiteit.veld.wedstrijd.video", drillAnchorId: "les.identiteit.veld.wedstrijd.oefenvorm" },
      ],
    },
    relatedTopics: [
      { categorySlug: "onze-voetbalvisie", topicSlug: "kernwaarden", title: "Kernwaarden" },
      { categorySlug: "onze-voetbalvisie", topicSlug: "teamafspraken", title: "Teamafspraken" },
    ],
  },
];
