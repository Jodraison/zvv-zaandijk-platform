import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdmin } from "@/lib/auth/is-admin";
import {
  isMaintenanceAdminBypass,
  isMaintenanceExemptPath,
  isMaintenanceMode,
  isStaticOrNextAsset,
} from "@/lib/maintenance";

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

async function getUser(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) return null;

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
  return user;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (process.env.SUPABASE_DEBUG_AUTH === "1" || process.env.SUPABASE_DEBUG_AUTH === "true") {
    console.log("MIDDLEWARE RUNNING:", pathname);
  }

  if (isStaticOrNextAsset(pathname)) {
    return NextResponse.next({ request });
  }

  if (isMaintenanceMode() && pathname !== "/maintenance" && !isMaintenanceExemptPath(pathname)) {
    let allowBypass = false;
    if (isMaintenanceAdminBypass()) {
      const user = await getUser(request);
      if (isAdmin(user)) {
        allowBypass = true;
      }
    }
    if (!allowBypass) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
  }

  const response = NextResponse.next({ request });

  if (isPublicPath(pathname)) {
    return response;
  }

  if (isProtectedPath(pathname)) {
    if (!supabaseUrl || !supabaseAnonKey) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "config");
      return NextResponse.redirect(loginUrl);
    }

    const user = await getUser(request);

    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!isAdmin(user)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
