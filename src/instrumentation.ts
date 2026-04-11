export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { assertSupabasePublicEnv } = await import("@/lib/supabase/env-validate");

  assertSupabasePublicEnv();
  console.log("[instrumentation] Supabase public env (URL + anon): OK");
  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.log("[instrumentation] SUPABASE_SERVICE_ROLE_KEY: present (server scripts / storage)");
  } else {
    console.log("[instrumentation] SUPABASE_SERVICE_ROLE_KEY: absent (team upload / seeds disabled op deze omgeving)");
  }
}
