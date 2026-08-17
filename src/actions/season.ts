"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ClubDatabase } from "@/types";
import { defaultSeasonId, readDb } from "@/lib/data/repository";
import { resolveSeasonId } from "@/lib/season";

const COOKIE = "zvv_season_id";

const COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 400,
  sameSite: "lax" as const,
};

/** Cookie write — only call from Server Actions / Route Handlers, never during RSC render. */
export async function writeSeasonCookie(seasonId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, seasonId, COOKIE_OPTIONS);
}

/**
 * Read-only season resolution for layouts and pages.
 * Does not mutate cookies (Next.js forbids cookie writes during Server Component render).
 * Preference sync happens via setPreferredSeason / selectSeasonFormAction.
 */
export async function readResolvedSeasonId(
  db: ClubDatabase,
  urlSeason?: string | null,
): Promise<string> {
  const cookieSeason = (await cookies()).get(COOKIE)?.value;
  return resolveSeasonId(db, cookieSeason, urlSeason);
}

export async function setPreferredSeason(seasonId: string) {
  await writeSeasonCookie(seasonId);
  revalidatePath("/", "layout");
}

export async function getSeasonCookieValue(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value;
}

export async function selectSeasonFormAction(formData: FormData) {
  const id = String(formData.get("season_id") ?? "");
  if (!id) return;

  const db = await readDb();
  const season = db.seasons.find((s) => s.id === id);
  if (season && !season.is_active) {
    const activeId = defaultSeasonId(db);
    await writeSeasonCookie(activeId);
    redirect(`/?season=${encodeURIComponent(id)}`);
  }

  await setPreferredSeason(id);
}
