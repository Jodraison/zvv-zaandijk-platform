import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ensureMyProfileRow } from "@/lib/auth/ensure-profile";
import { isAdmin } from "@/lib/auth/is-admin";

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next") ?? "/beheer";
  const next = nextRaw.startsWith("/") ? nextRaw : "/beheer";

  if (!url || !key || !code) {
    return NextResponse.redirect(new URL("/login?error=auth", origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]),
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth", origin));
  }

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=auth", origin));
  }

  if (!isAdmin(user)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=not_admin", origin));
  }

  const ensured = await ensureMyProfileRow();
  if (!ensured.ok && process.env.SUPABASE_DEBUG_AUTH === "1") {
    console.warn("[auth/callback] ensureMyProfileRow:", ensured.error);
  }
  if (!ensured.ok) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=no_profile", origin));
  }

  return NextResponse.redirect(new URL(next, origin));
}
