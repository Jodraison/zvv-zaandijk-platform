import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdmin } from "@/lib/auth/is-admin";
import { isAcademyEnabled, isAcademyPath } from "@/lib/academy/feature-flag";
import { isAcademyOnboardingComplete } from "@/lib/academy/onboarding-complete";
import { resolveAcademyOnboardingGate } from "@/lib/academy/onboarding-gate";
import { shouldBlockAcademiePublicAccess } from "@/lib/features/academy-public-visibility";
import {
  isMaintenanceAdminBypass,
  isMaintenanceExemptPath,
  isMaintenanceMode,
  isStaticOrNextAsset,
} from "@/lib/maintenance";

/**
 * Must live at `src/middleware.ts` when the App Router is under `src/app`.
 * A root-level `middleware.ts` is ignored by Next.js in this layout (empty
 * middleware-manifest) — WP-1 moved the file here so guards actually run.
 */

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

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (isPublicPath(pathname)) {
    return response;
  }

  // Lokale Admin 2.0 screenshot-galerij — alleen met ADMIN_UI_PREVIEW=1 (build/runtime).
  if (pathname.startsWith("/review/admin-ui")) {
    if (process.env.ADMIN_UI_PREVIEW === "1") {
      return response;
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // WP-1: legacy public Football Academy (`/academie`) — fail closed when ACADEMY_PUBLIC_VISIBLE is off.
  // Distinct from `/academy` MVP (`ACADEMY_ENABLED`). Redirect target `/` is not an academie path (no loop).
  if (shouldBlockAcademiePublicAccess(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // T-01-01: Football Academy MVP mount — flag OFF hides routes; flag ON requires session.
  // T-02-03: after auth, onboarding_complete gate (S-10 first-launch).
  if (isAcademyPath(pathname)) {
    if (!isAcademyEnabled()) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "config");
      return NextResponse.redirect(loginUrl);
    }

    const academyUser = await getUser(request);
    if (!academyUser) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const gate = resolveAcademyOnboardingGate({
      onboardingComplete: isAcademyOnboardingComplete(
        (academyUser.user_metadata ?? {}) as Record<string, unknown>,
      ),
      pathname,
    });
    if (gate.action === "redirect") {
      return NextResponse.redirect(new URL(gate.to, request.url));
    }

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
