import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertSupabaseServiceRoleEnv, getServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env-validate";

/**
 * SERVER ONLY — DO NOT USE IN CLIENT
 *
 * Service-role client (bypass RLS). Alleen `SUPABASE_SERVICE_ROLE_KEY`, nooit anon.
 */
export function createSupabaseServiceClient(): SupabaseClient {
  assertSupabaseServiceRoleEnv();
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
