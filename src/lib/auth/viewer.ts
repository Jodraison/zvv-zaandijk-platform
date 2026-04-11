import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/is-admin";

/** Server-only: Beheer-nav alleen voor de vaste eigenaar-e-mail (isAdmin). */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isAdmin(user);
}
