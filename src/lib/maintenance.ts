/** Server-only flags — never use NEXT_PUBLIC_ for maintenance toggles. */

function envFlag(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === "true" || v === "1";
}

export function isMaintenanceMode(): boolean {
  return envFlag("MAINTENANCE_MODE");
}

export function isMaintenanceAdminBypass(): boolean {
  return envFlag("MAINTENANCE_ADMIN_BYPASS");
}

export function isStaticOrNextAsset(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname)) return true;
  return false;
}

/** Routes that stay reachable while maintenance mode is active (before admin-auth checks). */
export function isMaintenanceExemptPath(pathname: string): boolean {
  if (pathname === "/maintenance") return true;
  if (pathname === "/login") return true;
  if (pathname.startsWith("/auth")) return true;
  if (pathname.startsWith("/beheer")) return true;
  if (pathname.startsWith("/api/admin")) return true;
  return false;
}
