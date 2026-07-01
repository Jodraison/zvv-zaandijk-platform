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
    description: "Wie we zijn — het fundament onder alle Academy-onderwerpen.",
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
    description: "Waar we voor staan — leidend principe binnen deze categorie.",
    icon: "💎",
    order: 2,
    visible: true,
    comingSoon: true,
  },
  {
    id: "topic.voetbalvisie.teamafspraken",
    categoryId: VOETBALVISIE_CATEGORY_ID,
    slug: "teamafspraken",
    title: "Teamafspraken",
    description: "Collectieve afspraken — onderdeel van onze visielaag.",
    icon: "📋",
    order: 3,
    visible: true,
    comingSoon: true,
  },
  {
    id: "topic.voetbalvisie.gedragsregels",
    categoryId: VOETBALVISIE_CATEGORY_ID,
    slug: "gedragsregels",
    title: "Gedragsregels",
    description: "Verwachtingen en kaders — vastgelegd op teamniveau.",
    icon: "📌",
    order: 4,
    visible: true,
    comingSoon: true,
  },
  {
    id: "topic.voetbalvisie.intensiteit",
    categoryId: VOETBALVISIE_CATEGORY_ID,
    slug: "intensiteit",
    title: "Intensiteit",
    description: "Onze lijn rond inzet — uitgewerkt per onderwerp.",
    icon: "🔥",
    order: 5,
    visible: true,
    comingSoon: true,
  },
  {
    id: "topic.voetbalvisie.mentaliteit",
    categoryId: VOETBALVISIE_CATEGORY_ID,
    slug: "mentaliteit",
    title: "Mentaliteit",
    description: "Mindset en houding — persoonlijke ontwikkeling vanuit visie.",
    icon: "🧠",
    order: 6,
    visible: true,
    comingSoon: true,
  },
];
