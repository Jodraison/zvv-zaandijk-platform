import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdmin } from "@/lib/auth/is-admin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

function isPublicPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/auth");
}

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/beheer") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/actions")
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (process.env.SUPABASE_DEBUG_AUTH === "1" || process.env.SUPABASE_DEBUG_AUTH === "true") {
    console.log("MIDDLEWARE RUNNING:", pathname);
  }

  const response = NextResponse.next({ request });

  // ✅ ALWAYS allow public auth routes
  if (isPublicPath(pathname)) {
    return response;
  }

  // 🔐 PROTECT ADMIN ROUTES
  if (isProtectedPath(pathname)) {
    if (!supabaseUrl || !supabaseAnonKey) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "config");
      return NextResponse.redirect(loginUrl);
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ❌ NOT LOGGED IN
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ❌ NOT ADMIN
    if (!isAdmin(user)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/beheer", "/beheer/:path*", "/api/admin/:path*", "/actions/:path*"],
};
