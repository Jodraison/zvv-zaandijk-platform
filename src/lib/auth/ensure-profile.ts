import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Zorgt dat er een rij in `public.profiles` bestaat voor de ingelogde gebruiker.
 * Vereist migratie met policy `profiles_insert_self` (INSERT eigen id, role `user`).
 * Admin blijft via SQL/trigger; geen zelf-promotie naar admin.
 */
export async function ensureMyProfileRow(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return { ok: false, error: "Geen actieve sessie." };
  }

  const { data: existing, error: selErr } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();

  if (selErr) {
    return { ok: false, error: selErr.message };
  }
  if (existing) {
    return { ok: true };
  }

  const { error: insErr } = await supabase.from("profiles").insert({ id: user.id, role: "user" });

  if (insErr) {
    // Race met trigger / andere request: duplicate key = ok
    if (/duplicate key|unique constraint|23505/i.test(insErr.message)) {
      return { ok: true };
    }
    return { ok: false, error: insErr.message };
  }

  return { ok: true };
}
