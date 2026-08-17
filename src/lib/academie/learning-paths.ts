/**
 * Academy learning paths — homepage IA.
 * Decision Lab is a path inside Football Academy, not a separate product.
 */

import { academyCategoryHref } from "@/lib/academie/registry";
import { listDecisionLabSessions } from "@/lib/decision-lab/session-catalog";

export type LearningPathStatus = "ready" | "in-progress" | "coming-soon";

export type AcademyLearningPath = {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  icon: string;
  href: string;
  order: number;
  /** Static lesson count when known; null = coming soon / TBD */
  lessonCount: number | null;
  /** Typical minutes per lesson or path */
  durationLabel: string;
  statusDefault: LearningPathStatus;
  /** Highlight as primary start path */
  recommendedStart?: boolean;
};

const FDL_COUNT = listDecisionLabSessions().length;

/**
 * Canonical homepage path order.
 * "Onze Voetbalvisie" is intentionally not a top-level path — content lives under Speelwijze routes.
 */
export const ACADEMY_LEARNING_PATHS: AcademyLearningPath[] = [
  {
    id: "path.decision-lab",
    slug: "decision-lab",
    title: "Decision Lab",
    blurb: "Wedstrijdkeuzes. Eén beslissing per les.",
    icon: "◎",
    href: "/academie/decision-lab",
    order: 1,
    lessonCount: FDL_COUNT,
    durationLabel: "3–5 min",
    statusDefault: "ready",
    recommendedStart: true,
  },
  {
    id: "path.speelwijze",
    slug: "speelwijze",
    title: "Speelwijze",
    blurb: "Hoe wij het spel willen spelen.",
    icon: "◈",
    href: academyCategoryHref("speelwijze"),
    order: 2,
    lessonCount: null,
    durationLabel: "Nog niet beschikbaar",
    statusDefault: "coming-soon",
  },
  {
    id: "path.posities",
    slug: "posities",
    title: "Posities",
    blurb: "Jouw rol en taken in het team.",
    icon: "◇",
    href: academyCategoryHref("posities"),
    order: 3,
    lessonCount: null,
    durationLabel: "Nog niet beschikbaar",
    statusDefault: "coming-soon",
  },
  {
    id: "path.teamprincipes",
    slug: "teamprincipes",
    title: "Teamprincipes",
    blurb: "Afspraken waar we samen op staan.",
    icon: "○",
    href: academyCategoryHref("teamprincipes"),
    order: 4,
    lessonCount: null,
    durationLabel: "Nog niet beschikbaar",
    statusDefault: "coming-soon",
  },
  {
    id: "path.wedstrijden",
    slug: "wedstrijden",
    title: "Wedstrijden",
    blurb: "Voorbereiden, spelen, evalueren.",
    icon: "▣",
    href: academyCategoryHref("wedstrijden"),
    order: 5,
    lessonCount: null,
    durationLabel: "Nog niet beschikbaar",
    statusDefault: "coming-soon",
  },
  {
    id: "path.trainingen",
    slug: "trainingen",
    title: "Trainingen",
    blurb: "Werkvormen die de speelwijze trainen.",
    icon: "▤",
    href: academyCategoryHref("trainingen"),
    order: 6,
    lessonCount: null,
    durationLabel: "Nog niet beschikbaar",
    statusDefault: "coming-soon",
  },
  {
    id: "path.kennisbank",
    slug: "kennisbank",
    title: "Kennisbank",
    blurb: "Naslag wanneer je iets snel wilt terugvinden.",
    icon: "▦",
    href: academyCategoryHref("kennisbank"),
    order: 7,
    lessonCount: null,
    durationLabel: "Nog niet beschikbaar",
    statusDefault: "coming-soon",
  },
  {
    id: "path.media",
    slug: "media",
    title: "Media",
    blurb: "Beeld en clips bij de lesstof.",
    icon: "▶",
    href: academyCategoryHref("media"),
    order: 8,
    lessonCount: null,
    durationLabel: "Nog niet beschikbaar",
    statusDefault: "coming-soon",
  },
  {
    id: "path.quiz",
    slug: "quiz-toetsing",
    title: "Quiz & Toetsing",
    blurb: "Check of je het snapt — en onthoudt.",
    icon: "✓",
    href: academyCategoryHref("quiz-toetsing"),
    order: 9,
    lessonCount: null,
    durationLabel: "Nog niet beschikbaar",
    statusDefault: "coming-soon",
  },
];

export function listAcademyLearningPaths(): AcademyLearningPath[] {
  return [...ACADEMY_LEARNING_PATHS].sort((a, b) => a.order - b.order);
}
