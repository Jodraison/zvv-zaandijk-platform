"use server";

import { ensureMyProfileRow } from "@/lib/auth/ensure-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/is-admin";

/** Na browser-login (password): profielrij aanmaken indien nodig. */
export async function ensureProfileAfterLoginAction(): Promise<{ ok: boolean; error?: string }> {
  const r = await ensureMyProfileRow();
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true };
}

/** Na wachtwoordlogin: alleen vaste eigenaar-e-mail (isAdmin); anders sessie wissen. */
export async function enforceOwnerSessionAfterLoginAction(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return { ok: false, error: "Geen actieve sessie." };
  }

  if (!isAdmin(user)) {
    await supabase.auth.signOut();
    return { ok: false, error: "Geen beheerdersrechten. Alleen het vaste beheerdersaccount kan inloggen." };
  }

  return { ok: true };
}
