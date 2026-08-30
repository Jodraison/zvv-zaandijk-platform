/**
 * Verplaats de bestaande eerstvolgende fitheidssessie 2026-09-02 → 2026-09-07.
 * Zelfde id, geen insert, geen resultaatmutatie.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { SEASON_2026_27_ID } from "../src/lib/season/season-operations-2026-27";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!.replace(/^"|"$/g, "");
  }
}

const SESSION_ID = "83ff1fbe-fcb0-4803-81f7-f05aa84e79bb";
const FROM = "2026-09-02";
const TO = "2026-09-07";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("missing supabase env");
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: sessions, error: sErr } = await sb
    .from("fitness_test_sessions")
    .select("*")
    .eq("season_id", SEASON_2026_27_ID);
  if (sErr) throw sErr;
  const session = (sessions ?? []).find((s) => s.id === SESSION_ID);
  if (!session) throw new Error(`session ${SESSION_ID} not found`);
  const currentOn = String(session.test_on).slice(0, 10);
  if (currentOn !== FROM && currentOn !== TO) {
    throw new Error(`unexpected test_on ${currentOn}`);
  }

  const clash = (sessions ?? []).find(
    (s) => s.id !== SESSION_ID && String(s.test_on).slice(0, 10) === TO,
  );
  if (clash) throw new Error(`duplicate session already on ${TO}: ${clash.id}`);

  const { data: results, error: rErr } = await sb
    .from("fitness_test_results")
    .select("id,session_id,player_id,participation_status")
    .eq("session_id", SESSION_ID);
  if (rErr) throw rErr;

  const { data: training7, error: tErr } = await sb
    .from("training_sessions")
    .select("id,title,session_at,status")
    .eq("season_id", SEASON_2026_27_ID)
    .eq("id", "84493ff3-83a9-4c24-bb53-4dc5f4f0985a");
  if (tErr) throw tErr;

  const outDir = join(process.cwd(), ".review-backups", "fitness-reschedule-2026-09-07");
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  writeFileSync(
    join(outDir, `before-${stamp}.json`),
    JSON.stringify(
      {
        session,
        resultCount: results?.length ?? 0,
        resultIds: (results ?? []).map((r) => r.id),
        allSessions: sessions,
        training7sept: training7,
      },
      null,
      2,
    ),
  );

  if (currentOn === TO) {
    console.log(JSON.stringify({ alreadyMoved: true, sessionId: SESSION_ID, test_on: TO, resultCount: results?.length ?? 0 }));
    return;
  }

  const { error: uErr } = await sb
    .from("fitness_test_sessions")
    .update({ test_on: TO, updated_at: new Date().toISOString() })
    .eq("id", SESSION_ID)
    .eq("test_on", FROM);
  if (uErr) throw uErr;

  const { data: afterSessions, error: aErr } = await sb
    .from("fitness_test_sessions")
    .select("id,test_on,status,note,published_at,season_id")
    .eq("season_id", SEASON_2026_27_ID);
  if (aErr) throw aErr;
  const after = (afterSessions ?? []).find((s) => s.id === SESSION_ID);
  const { count: afterResults, error: cErr } = await sb
    .from("fitness_test_results")
    .select("id", { count: "exact", head: true })
    .eq("session_id", SESSION_ID);
  if (cErr) throw cErr;
  const { count: orphan, error: oErr } = await sb
    .from("fitness_test_results")
    .select("id", { count: "exact", head: true })
    .eq("session_id", SESSION_ID);
  if (oErr) throw oErr;
  const on2 = (afterSessions ?? []).filter((s) => String(s.test_on).slice(0, 10) === FROM);
  const on7 = (afterSessions ?? []).filter((s) => String(s.test_on).slice(0, 10) === TO);

  if (!after || String(after.test_on).slice(0, 10) !== TO) throw new Error("update did not persist");
  if (after.status !== session.status) throw new Error("status changed");
  if ((afterResults ?? 0) !== (results?.length ?? 0)) throw new Error("result count changed");
  if (on7.length !== 1) throw new Error(`expected 1 session on ${TO}`);
  if (on2.length !== 0) throw new Error(`still have session on ${FROM}`);

  const { data: trainingAfter } = await sb
    .from("training_sessions")
    .select("id,title,session_at,status")
    .eq("id", "84493ff3-83a9-4c24-bb53-4dc5f4f0985a")
    .maybeSingle();

  console.log(
    JSON.stringify(
      {
        ok: true,
        sessionId: SESSION_ID,
        from: FROM,
        to: TO,
        status: after.status,
        published_at: after.published_at,
        resultsBefore: results?.length ?? 0,
        resultsAfter: afterResults ?? 0,
        orphans: orphan ?? 0,
        duplicatesOn7: on7.length,
        leftoverOn2: on2.length,
        training7sept: trainingAfter,
      },
      null,
      2,
    ),
  );
}

void main();
