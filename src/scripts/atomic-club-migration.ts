/**
 * Atomaire club-migratie in één Postgres-transactie (ROLLBACK bij elke fout).
 *
 * Vereist directe database-URI (niet alleen Supabase REST):
 *   DATABASE_URL=postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres?sslmode=require
 *   (Dashboard → Project Settings → Database → Connection string → URI, poort 5432)
 *
 * Optioneel seizoen: tweede CLI-arg (UUID), default = seed seizoen.
 *
 *   cd platform && npm run migrate:club-atomic
 *   cd platform && npm run migrate:club-atomic -- <season_uuid>
 */

import "./load-platform-env";

import { randomUUID } from "crypto";
import postgres from "postgres";
import { CANONICAL_PLAYERS } from "@/lib/import/resolve-player-strict";
import {
  ATOMIC_MATCH_SPECS,
  tallySumGoals,
  tallySumAssists,
  type ClubAtomicMatchSpec,
} from "@/lib/data/club-atomic-match-specs";
import { goalRowsFromPlayerCounts, aggregateStatsFromGoals, type PlayerMatchCountInput } from "@/lib/match-goal-helpers";

const DEFAULT_SEASON_ID = "c0ffee00-0001-4000-8000-000000000001";
const GUEST_NAMES = new Set(["Esmee", "Micah"]);

const CANON_SET = new Set(CANONICAL_PLAYERS);

type TxSql = postgres.TransactionSql<Record<string, unknown>>;

function requireDatabaseUrl(): string {
  const u = process.env.DATABASE_URL?.trim();
  if (!u) {
    throw new Error(
      "DATABASE_URL ontbreekt. Gebruik de Postgres connection string (poort 5432) uit Supabase Project Settings → Database.",
    );
  }
  return u;
}

/**
 * Strikte resolver: trim alleen; exacte `full_name` match (case-sensitive).
 * Gasten Esmee/Micah: aanmaken indien nodig (is_guest = true).
 */
async function resolvePlayer(sql: TxSql, fullNameRaw: string): Promise<string> {
  const fullName = fullNameRaw.trim();
  if (!fullName) {
    throw new Error("resolvePlayer: lege naam");
  }

  if (GUEST_NAMES.has(fullName)) {
    const dup = await sql<{ c: string }[]>`
      SELECT id::text AS c FROM players WHERE full_name = ${fullName} AND is_guest = true
    `;
    if (dup.length > 1) {
      throw new Error(`resolvePlayer: meerdere gast-rijen voor "${fullName}"`);
    }
    if (dup.length === 0) {
      const ins = await sql<{ id: string }[]>`
        INSERT INTO players (id, full_name, is_guest, photo_url)
        VALUES (gen_random_uuid(), ${fullName}, true, NULL)
        RETURNING id::text
      `;
      return ins[0]!.id;
    }
    return dup[0]!.c;
  }

  const rows = await sql<{ id: string }[]>`
    SELECT id::text FROM players WHERE full_name = ${fullName} AND is_guest = false
  `;
  if (rows.length === 0) {
    throw new Error(`resolvePlayer: geen speler met exacte naam "${fullName}"`);
  }
  if (rows.length > 1) {
    throw new Error(`resolvePlayer: meerdere rijen voor "${fullName}"`);
  }
  return rows[0]!.id;
}

async function assertValidPlayerBase(sql: TxSql): Promise<void> {
  const rows = await sql<{ full_name: string }[]>`
    SELECT full_name FROM players WHERE is_guest = false ORDER BY full_name
  `;
  const names = rows.map((r) => r.full_name);
  if (names.length !== 22) {
    throw new Error(`INVALID PLAYER BASE: verwacht 22 niet-gast spelers, gevonden ${names.length}`);
  }
  const seen = new Set<string>();
  for (const n of names) {
    if (seen.has(n)) {
      throw new Error(`INVALID PLAYER BASE: dubbele full_name "${n}"`);
    }
    seen.add(n);
  }
  for (const c of CANONICAL_PLAYERS) {
    if (!seen.has(c)) {
      throw new Error(`INVALID PLAYER BASE: ontbreekt "${c}"`);
    }
  }
  for (const n of names) {
    if (!CANON_SET.has(n)) {
      throw new Error(`INVALID PLAYER BASE: extra of onbekende naam "${n}"`);
    }
  }
}

async function renamePitouInTx(sql: TxSql): Promise<void> {
  const hasLudding = await sql<{ c: number }[]>`
    SELECT COUNT(*)::int AS c FROM players WHERE full_name = 'Pitou Ludding' AND is_guest = false
  `;
  const hasShort = await sql<{ c: number }[]>`
    SELECT COUNT(*)::int AS c FROM players WHERE full_name = 'Pitou' AND is_guest = false
  `;
  if (Number(hasLudding[0]?.c) > 0 && Number(hasShort[0]?.c) > 0) {
    throw new Error('INVALID PLAYER BASE: zowel "Pitou" als "Pitou Ludding" bestaan — handmatig oplossen.');
  }
  if (Number(hasShort[0]?.c) === 1) {
    await sql`
      UPDATE players SET full_name = 'Pitou Ludding'
      WHERE full_name = 'Pitou' AND is_guest = false
    `;
  }
}

function talliesToCounts(
  tallies: Record<string, { g: number; a: number }>,
  resolve: (n: string) => Promise<string>,
): Promise<{ orderedIds: string[]; counts: PlayerMatchCountInput; idToName: Map<string, string> }> {
  return (async () => {
    const counts: PlayerMatchCountInput = {};
    const idToName = new Map<string, string>();

    for (const [name, { g, a }] of Object.entries(tallies)) {
      const id = await resolve(name);
      const cur = counts[id] ?? { goals: 0, assists: 0 };
      counts[id] = { goals: cur.goals + g, assists: cur.assists + a };
      idToName.set(id, name);
    }

    const orderedIds = Object.keys(counts).sort((idA, idB) => {
      const na = idToName.get(idA) ?? idA;
      const nb = idToName.get(idB) ?? idB;
      return na.localeCompare(nb, "nl");
    });

    return { orderedIds, counts, idToName };
  })();
}

async function validateMatchAfterWrite(sql: TxSql, matchId: string, mvpPlayerId: string, expectedGoalsFor: number): Promise<void> {
  const [ev] = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM match_goal_events WHERE match_id = ${matchId}::uuid
  `;
  const [st] = await sql<{ s: number }[]>`
    SELECT COALESCE(SUM(goals), 0)::int AS s FROM match_player_stats WHERE match_id = ${matchId}::uuid
  `;
  const [asEv] = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM match_goal_events WHERE match_id = ${matchId}::uuid AND assist_player_id IS NOT NULL
  `;
  const [asSt] = await sql<{ s: number }[]>`
    SELECT COALESCE(SUM(assists), 0)::int AS s FROM match_player_stats WHERE match_id = ${matchId}::uuid
  `;
  const [gf] = await sql<{ g: number }[]>`
    SELECT goals_for::int AS g FROM matches WHERE id = ${matchId}::uuid
  `;
  const [mvpOk] = await sql<{ ok: number }[]>`
    SELECT COUNT(*)::int AS ok FROM match_player_stats WHERE match_id = ${matchId}::uuid AND player_id = ${mvpPlayerId}::uuid
  `;
  const [dup] = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM (
      SELECT player_id FROM match_player_stats WHERE match_id = ${matchId}::uuid GROUP BY player_id HAVING COUNT(*) > 1
    ) t
  `;

  if (ev.n !== expectedGoalsFor) {
    throw new Error(`VALIDATIE match ${matchId}: COUNT(events)=${ev.n} verwacht ${expectedGoalsFor}`);
  }
  if (st.s !== expectedGoalsFor) {
    throw new Error(`VALIDATIE match ${matchId}: SUM(stats.goals)=${st.s} verwacht ${expectedGoalsFor}`);
  }
  if (gf.g !== expectedGoalsFor) {
    throw new Error(`VALIDATIE match ${matchId}: matches.goals_for=${gf.g} verwacht ${expectedGoalsFor}`);
  }
  if (asEv.n !== asSt.s) {
    throw new Error(`VALIDATIE match ${matchId}: assists events=${asEv.n} vs stats=${asSt.s}`);
  }
  if (Number(mvpOk.ok) < 1) {
    throw new Error(`VALIDATIE match ${matchId}: MVP niet in match_player_stats`);
  }
  if (dup.n > 0) {
    throw new Error(`VALIDATIE match ${matchId}: dubbele player_id in stats`);
  }
}

async function applyCaptainsInTx(sql: TxSql, seasonId: string): Promise<void> {
  const capId = await resolvePlayer(sql, "Melissa Rietveld");
  const viceId = await resolvePlayer(sql, "Dionne van Dijk");
  if (capId === viceId) {
    throw new Error("Captain en vice hetzelfde");
  }

  await sql`
    UPDATE player_season_memberships
    SET is_captain = false, is_vice_captain = false
    WHERE season_id = ${seasonId}::uuid
  `;
  await sql`
    UPDATE player_season_memberships SET is_captain = true
    WHERE season_id = ${seasonId}::uuid AND player_id = ${capId}::uuid
  `;
  await sql`
    UPDATE player_season_memberships SET is_vice_captain = true
    WHERE season_id = ${seasonId}::uuid AND player_id = ${viceId}::uuid
  `;

  const [c] = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM player_season_memberships WHERE season_id = ${seasonId}::uuid AND is_captain = true
  `;
  const [v] = await sql<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM player_season_memberships WHERE season_id = ${seasonId}::uuid AND is_vice_captain = true
  `;
  if (c.n !== 1 || v.n !== 1) {
    throw new Error(`Captain/vice check: ${c.n} captain(s), ${v.n} vice(s)`);
  }
}

async function validateAllPlayedMatches(sql: TxSql, seasonId: string): Promise<void> {
  const played = await sql<{ id: string; goals_for: number; wotm_player_id: string | null }[]>`
    SELECT id::text, goals_for::int, wotm_player_id::text
    FROM matches WHERE season_id = ${seasonId}::uuid AND status = 'played'
  `;
  for (const m of played) {
    if (!m.wotm_player_id) {
      throw new Error(`Globale validatie: geen MVP op match ${m.id}`);
    }
    await validateMatchAfterWrite(sql, m.id, m.wotm_player_id, m.goals_for);
  }
}

async function processMatch(
  sql: TxSql,
  seasonId: string,
  spec: ClubAtomicMatchSpec,
  stats: { totalGoals: number; totalAssistsInEvents: number },
): Promise<void> {
  const sumG = tallySumGoals(spec.tallies);
  const sumA = tallySumAssists(spec.tallies);
  if (sumG !== spec.goals_for) {
    throw new Error(`Match ${spec.matchId}: som tallies goals ${sumG} ≠ goals_for ${spec.goals_for}`);
  }
  if (sumA > spec.goals_for) {
    throw new Error(`Match ${spec.matchId}: som assists ${sumA} > goals_for ${spec.goals_for}`);
  }

  const mvpId = await resolvePlayer(sql, spec.mvp);
  const tallies = { ...spec.tallies };
  if (!tallies[spec.mvp]) {
    tallies[spec.mvp] = { g: 0, a: 0 };
  }

  const resolve = (n: string) => resolvePlayer(sql, n);
  const { orderedIds, counts } = await talliesToCounts(tallies, resolve);

  const gr = goalRowsFromPlayerCounts(orderedIds, counts);
  if (!gr.ok) {
    throw new Error(`Match ${spec.matchId}: ${gr.error}`);
  }

  const agg = aggregateStatsFromGoals(spec.matchId, orderedIds, gr.goals);
  if (agg.goals_for !== spec.goals_for) {
    throw new Error(`Match ${spec.matchId}: aggregate goals ${agg.goals_for} ≠ spec ${spec.goals_for}`);
  }

  await sql`DELETE FROM match_player_stats WHERE match_id = ${spec.matchId}::uuid`;
  await sql`DELETE FROM match_goal_events WHERE match_id = ${spec.matchId}::uuid`;

  await sql`
    INSERT INTO matches (
      id, season_id, opponent, kickoff_at, is_home, goals_for, goals_against, status, wotm_player_id
    ) VALUES (
      ${spec.matchId}::uuid,
      ${seasonId}::uuid,
      ${spec.opponent},
      ${spec.kickoff_at}::timestamptz,
      ${spec.is_home},
      0,
      ${spec.goals_against},
      'played',
      ${mvpId}::uuid
    )
    ON CONFLICT (id) DO UPDATE SET
      season_id = EXCLUDED.season_id,
      opponent = EXCLUDED.opponent,
      kickoff_at = EXCLUDED.kickoff_at,
      is_home = EXCLUDED.is_home,
      goals_against = EXCLUDED.goals_against,
      status = EXCLUDED.status,
      wotm_player_id = EXCLUDED.wotm_player_id,
      goals_for = 0
  `;

  for (let i = 0; i < agg.events.length; i++) {
    const e = agg.events[i]!;
    const eid = randomUUID();
    await sql`
      INSERT INTO match_goal_events (id, match_id, scorer_player_id, assist_player_id, sort_order)
      VALUES (
        ${eid}::uuid,
        ${e.match_id}::uuid,
        ${e.scorer_player_id}::uuid,
        ${e.assist_player_id ?? null},
        ${i}
      )
    `;
  }

  for (const row of agg.stats) {
    await sql`
      INSERT INTO match_player_stats (match_id, player_id, goals, assists)
      VALUES (${row.match_id}::uuid, ${row.player_id}::uuid, ${row.goals}, ${row.assists})
    `;
  }

  await sql`
    UPDATE matches
    SET goals_for = (SELECT COUNT(*)::int FROM match_goal_events WHERE match_id = ${spec.matchId}::uuid)
    WHERE id = ${spec.matchId}::uuid
  `;

  await validateMatchAfterWrite(sql, spec.matchId, mvpId, spec.goals_for);

  stats.totalGoals += agg.events.length;
  stats.totalAssistsInEvents += agg.events.filter((x) => x.assist_player_id).length;
}

async function main(): Promise<void> {
  const seasonId = process.argv[2]?.trim() || DEFAULT_SEASON_ID;
  const url = requireDatabaseUrl();
  const sql = postgres(url, { max: 1 });

  let matchesProcessed = 0;

  try {
    await sql.begin(async (tx) => {
      await tx`SELECT 1`;

      await renamePitouInTx(tx);
      await assertValidPlayerBase(tx);

      const stats = { totalGoals: 0, totalAssistsInEvents: 0 };

      for (const spec of ATOMIC_MATCH_SPECS) {
        await processMatch(tx, seasonId, spec, stats);
        matchesProcessed++;
      }

      await applyCaptainsInTx(tx, seasonId);
      await assertValidPlayerBase(tx);
      await validateAllPlayedMatches(tx, seasonId);

      console.log("\n========== TRANSACTIE SUCCES (COMMIT) ==========");
      console.log("Wedstrijden verwerkt:", matchesProcessed);
      console.log("Doelpunt-events ingevoegd (totaal regels):", stats.totalGoals);
      console.log("Events met assist (totaal):", stats.totalAssistsInEvents);
      console.log("MVP per wedstrijd: gezet + gevalideerd in stats");
      console.log("Aanvoerder: Melissa Rietveld · Vice: Dionne van Dijk");
    });
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error("[migrate:club-atomic] FATAAL — transactie ROLLBACK:", e instanceof Error ? e.message : e);
  process.exit(1);
});
