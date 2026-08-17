import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^"|"$/g, "");
  }
}

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await sb
    .from("fitness_test_results")
    .select("id,player_id,flying_sprint_30m_seconds,agility_10_20_10_seconds,plank_seconds,six_minute_run_meters,participation_status,note")
    .eq("session_id", "83ff1fbe-fcb0-4803-81f7-f05aa84e79bb");
  if (error) throw error;
  const filled = (data ?? []).filter((r) =>
    [r.flying_sprint_30m_seconds, r.agility_10_20_10_seconds, r.plank_seconds, r.six_minute_run_meters].some((v) => v != null),
  );
  console.log(JSON.stringify({ total: data?.length ?? 0, filled_count: filled.length, filled }, null, 2));
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
