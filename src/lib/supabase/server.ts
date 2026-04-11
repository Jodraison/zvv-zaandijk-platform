import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { assertSupabasePublicEnv, getAnonKey, getSupabaseUrl } from "@/lib/supabase/env-validate";

let serverEnvAsserted = false;

function ensureServerSupabaseEnv(): void {
  if (serverEnvAsserted) return;
  assertSupabasePublicEnv();
  serverEnvAsserted = true;
}

/**
 * Supabase server client: anon key + gebruikerssessie via cookies (RLS, auth.uid()).
 * Geen service role — alleen voor scripts/storage via `createSupabaseServiceClient`.
 */
export async function createSupabaseServerClient() {
  ensureServerSupabaseEnv();
  const url = getSupabaseUrl();
  const key = getAnonKey();

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]),
          );
        } catch {
          /* Server Component */
        }
      },
    },
  });
}
