import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAcademyEnabled } from "@/lib/academy/feature-flag";
import { academyRoutes } from "@/lib/academy/routes";

type RequireAcademyAccessOptions = {
  /** Geen sessie: standaard login met next=Academy root. */
  loginRedirect?: string;
};

/**
 * Server-side Academy pages (T-01-01): feature flag ON + authenticated session.
 * Does not invent team/speelster roles — any valid Supabase session (platform login).
 * Flag OFF → home (same as middleware).
 */
export async function requireAcademyAccess(
  options?: RequireAcademyAccessOptions,
): Promise<{ userId: string }> {
  if (!isAcademyEnabled()) {
    redirect("/");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    const next = encodeURIComponent(academyRoutes.root);
    redirect(options?.loginRedirect ?? `/login?next=${next}`);
  }

  return { userId: user.id };
}
