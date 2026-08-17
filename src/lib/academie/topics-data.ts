import type { AcademyTopic } from "@/lib/academie/types";

const VOETBALVISIE_CATEGORY_ID = "cat.voetbalvisie";

/**
 * Onderwerpen per categorie — statische brondata.
 * Omschrijvingen beschrijven de IA-rol, geen voetbalinhoud.
 */
export const ACADEMY_TOPIC_DEFINITIONS: AcademyTopic[] = [
  {
    id: "topic.voetbalvisie.identiteit",
    categoryId: VOETBALVISIE_CATEGORY_ID,
    slug: "onze-identiteit",
    title: "Onze identiteit",
    description: "Wie zijn wij? Samen, moedig, intens, slim en verantwoordelijk.",
    icon: "🛡️",
    order: 1,
    visible: true,
    comingSoon: false,
  },
  {
    id: "topic.voetbalvisie.kernwaarden",
    categoryId: VOETBALVISIE_CATEGORY_ID,
    slug: "kernwaarden",
    title: "Kernwaarden",
    description: "Hoe kiezen wij? Ruimte, aansluiting, risico en teambelang.",
    icon: "💎",
    order: 2,
    visible: true,
    comingSoon: false,
  },
  {
    id: "topic.voetbalvisie.teamafspraken",
    categoryId: VOETBALVISIE_CATEGORY_ID,
    slug: "teamafspraken",
    title: "Teamafspraken",
    description: "Hoe voeren wij samen uit? Kijken, steun, aansluiten en coachen.",
    icon: "📋",
    order: 3,
    visible: true,
    comingSoon: false,
  },
  {
    id: "topic.voetbalvisie.gedragsregels",
    categoryId: VOETBALVISIE_CATEGORY_ID,
    slug: "gedragsregels",
    title: "Gedragsregels",
    description: "Hoe gedragen wij ons bij fouten, spanning en emotie?",
    icon: "📌",
    order: 4,
    visible: true,
    comingSoon: false,
  },
  {
    id: "topic.voetbalvisie.intensiteit",
    categoryId: VOETBALVISIE_CATEGORY_ID,
    slug: "intensiteit",
    title: "Intensiteit",
    description: "Wanneer versnellen wij — en wanneer houden wij rust?",
    icon: "🔥",
    order: 5,
    visible: true,
    comingSoon: false,
  },
  {
    id: "topic.voetbalvisie.mentaliteit",
    categoryId: VOETBALVISIE_CATEGORY_ID,
    slug: "mentaliteit",
    title: "Mentaliteit",
    description: "Hoe blijven wij onder druk goede beslissingen nemen?",
    icon: "🧠",
    order: 6,
    visible: true,
    comingSoon: false,
  },
];
