/**
 * One-shot: clear club_profile.team_photo_url so the homepage shows the placeholder.
 * Keeps Storage object and public/team.jpg archive.
 *
 * Run: npx tsx scripts/clear-team-photo-url.ts
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const client = createClient(url, key, { auth: { persistSession: false } });

  const { data: before, error: readErr } = await client
    .from("club_profile")
    .select("team_photo_url, schema_version")
    .eq("id", "default")
    .maybeSingle();

  if (readErr) {
    console.error("Read failed:", readErr.message);
    process.exit(1);
  }

  console.log("Before:", before?.team_photo_url ? `${String(before.team_photo_url).slice(0, 80)}…` : "(null)");

  const { error: upErr } = await client
    .from("club_profile")
    .update({
      team_photo_url: null,
      schema_version: Number(before?.schema_version ?? 0) + 1,
    })
    .eq("id", "default");

  if (upErr) {
    console.error("Update failed:", upErr.message);
    process.exit(1);
  }

  console.log(
    "Cleared club_profile.team_photo_url. Homepage will show placeholder after revalidate/cache refresh.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
