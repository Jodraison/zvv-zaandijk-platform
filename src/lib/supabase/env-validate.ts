/**
 * Harde validatie van Supabase-omgeving (server / Node-scripts).
 * Geen lege strings, geen stille fallbacks.
 *
 * - Publieke app (SSR, RLS met anon + sessie): alleen URL + anon key.
 * - Service-role scripts / storage bypass: URL + service role key.
 */

function trimmed(name: string): string | undefined {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : undefined;
}

/** Next.js SSR, middleware, readDb: PostgREST met anon + gebruikers-JWT (RLS). */
export function assertSupabasePublicEnv(): void {
  if (!trimmed("NEXT_PUBLIC_SUPABASE_URL")) {
    throw new Error("Missing SUPABASE URL");
  }
  if (!trimmed("NEXT_PUBLIC_SUPABASE_ANON_KEY")) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
}

/** Server-only scripts en `createSupabaseServiceClient` (RLS bypass). */
export function assertSupabaseServiceRoleEnv(): void {
  if (!trimmed("NEXT_PUBLIC_SUPABASE_URL")) {
    throw new Error("Missing SUPABASE URL");
  }
  if (!trimmed("SUPABASE_SERVICE_ROLE_KEY")) {
    throw new Error("Missing SERVICE ROLE KEY");
  }
}

/**
 * @deprecated Voorheen: elke `readDb` vereiste ook service key. Dat is niet nodig voor RLS-reads.
 * Gebruik `assertSupabasePublicEnv` of `assertSupabaseServiceRoleEnv` per use-case.
 */
export function assertSupabaseServerEnv(): void {
  assertSupabasePublicEnv();
  assertSupabaseServiceRoleEnv();
}

export function getSupabaseUrl(): string {
  const v = trimmed("NEXT_PUBLIC_SUPABASE_URL");
  if (!v) throw new Error("Missing SUPABASE URL");
  return v;
}

export function getAnonKey(): string {
  const v = trimmed("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!v) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return v;
}

export function getServiceRoleKey(): string {
  const v = trimmed("SUPABASE_SERVICE_ROLE_KEY");
  if (!v) throw new Error("Missing SERVICE ROLE KEY");
  return v;
}
