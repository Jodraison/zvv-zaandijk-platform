/**
 * Decision Lab trainingsblokken — groepering van bestaande sessies.
 * Geen nieuwe football content; alleen leerlogica op order/wave.
 */

import { listDecisionLabSessions } from "@/lib/decision-lab/session-catalog";
import type { DecisionLabSession } from "@/lib/decision-lab/types";

export type DecisionLabBlok = {
  id: string;
  order: number;
  title: string;
  promise: string;
  sessionOrders: number[];
};

/** Logische trainingsblokken over Orders #1–#18. */
export const DECISION_LAB_BLOKKEN: DecisionLabBlok[] = [
  {
    id: "blok.druk-herkennen",
    order: 1,
    title: "Druk herkennen",
    promise: "Trigger zien en de binnenkant eerst dichtzetten.",
    sessionOrders: [1, 2, 3],
  },
  {
    id: "blok.samen-druk",
    order: 2,
    title: "Samen drukzetten",
    promise: "Eerste druk, tweede druk en diepte als één keten.",
    sessionOrders: [4, 5, 6, 7],
  },
  {
    id: "blok.press-herstellen",
    order: 3,
    title: "Press herstellen",
    promise: "Weten wanneer je doorgaat — en wanneer je herstelt.",
    sessionOrders: [8, 9],
  },
  {
    id: "blok.omschakelen",
    order: 4,
    title: "Omschakelen",
    promise: "De eerste actie na balverlies of balwinst.",
    sessionOrders: [10, 11, 12],
  },
  {
    id: "blok.opbouwen",
    order: 5,
    title: "Opbouwen",
    promise: "Veilig spelen onder druk — en door wanneer het mag.",
    sessionOrders: [13, 14],
  },
  {
    id: "blok.ruimte",
    order: 6,
    title: "Ruimte benutten",
    promise: "1v1, halfspace en switch op het juiste moment.",
    sessionOrders: [15, 16, 17],
  },
  {
    id: "blok.afronden",
    order: 7,
    title: "Afronden",
    promise: "In de box aanwezig zijn wanneer de bal komt.",
    sessionOrders: [18],
  },
];

export type BlokWithSessions = DecisionLabBlok & {
  sessions: DecisionLabSession[];
};

export function listDecisionLabBlokken(): BlokWithSessions[] {
  const sessions = listDecisionLabSessions();
  const byOrder = new Map(sessions.map((s) => [s.order, s]));
  return DECISION_LAB_BLOKKEN.map((blok) => ({
    ...blok,
    sessions: blok.sessionOrders
      .map((n) => byOrder.get(n))
      .filter((s): s is DecisionLabSession => Boolean(s)),
  })).filter((b) => b.sessions.length > 0);
}

export function getBlokForSession(session: DecisionLabSession): BlokWithSessions | undefined {
  return listDecisionLabBlokken().find((b) => b.sessions.some((s) => s.id === session.id));
}
