import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/is-admin";

type RequireAdminOptions = {
  /** Geen sessie: standaard `/login`. */
  loginRedirect?: string;
  /** Wel ingelogd maar niet admin-e-mail: standaard `/`. */
  forbiddenRedirect?: string;
};

/**
 * Server-side layout/pages: alleen vaste eigenaar-e-mail (`isAdmin`).
 * Geen sessie → login; verkeerde gebruiker → home (niet de admin-login).
 */
export async function requireAdmin(options?: RequireAdminOptions): Promise<{ userId: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    redirect(options?.loginRedirect ?? "/login");
  }

  if (!isAdmin(user)) {
    redirect(options?.forbiddenRedirect ?? "/");
  }

  return { userId: user.id };
}

/**
 * Server actions / mutateDb:zelfde regel als `requireAdmin`, maar `redirect()` is hier ongewenst;
 * fout moet de actie laten falen zodat er geen writes plaatsvinden.
 */
export async function assertAdminServerAction(): Promise<{ userId: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user || !isAdmin(user)) {
    throw new Error("UNAUTHORIZED");
  }

  return { userId: user.id };
}
