"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const COOKIE = "zvv_season_id";

export async function setPreferredSeason(seasonId: string) {
  const jar = await cookies();
  jar.set(COOKIE, seasonId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

export async function getSeasonCookieValue(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value;
}

export async function selectSeasonFormAction(formData: FormData) {
  const id = String(formData.get("season_id") ?? "");
  if (!id) return;
  await setPreferredSeason(id);
}
