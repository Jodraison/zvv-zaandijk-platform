import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Na elke Supabase-write: volledige App Router-cache onder de root layout invalideren.
 * Daarmee verversen o.a. /, /selectie, /selectie/[id], /ranking, /wedstrijden, training, fitheid en beheer
 * op de eerstvolgende request — zonder aparte client-state voor clubdata.
 *
 * Propagatie-audit (handmatig na wijzigingen):
 * - Doelpunten / assists / MVP → ranking + speler-detail (`computeRanking`, aggregates uit DB)
 * - Wedstrijddatum / status → home countdown, wedstrijdenlijst, hero preview
 * - Aanvoerder / assistent → selectie en badges (lidmaatschapvelden)
 * - Teamfoto → `TeamPhotoBlock` op home (`club_profile.team_photo_url`)
 * - Seizoen (cookie/URL) → `SeasonHydrate` + server `resolveSeasonId` op volgende load
 *
 * Layout + dynamische segmenten (`[playerId]`, `[matchId]`, beheer-wedstrijd) worden expliciet meegenomen.
 */
export function revalidateClubDataAfterMutation(): void {
  revalidateTag("players");
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/ranking");
  revalidatePath("/wedstrijden");
  revalidatePath("/selectie");
  revalidatePath("/fitheid");
  revalidatePath("/training");
  revalidatePath("/beheer");
  /** Layout-type: nested routes onder deze paden (incl. dynamische segmenten). */
  revalidatePath("/wedstrijden", "layout");
  revalidatePath("/selectie", "layout");
  revalidatePath("/beheer", "layout");
  /** Dynamische pagina’s expliciet (Next kan segment-paden cachen). */
  revalidatePath("/selectie/[playerId]", "page");
  revalidatePath("/wedstrijden/[matchId]", "page");
  revalidatePath("/beheer/wedstrijden/[matchId]", "page");
}
