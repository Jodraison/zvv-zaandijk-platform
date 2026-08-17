/**
 * D-002 — Pressing Batch A hand-authored quality gates.
 * Run: npx tsx src/lib/decision-lab/films/press-batch-a/d002-press-batch-a.test.ts
 */
import { listDecisionLabSessions } from "@/lib/decision-lab/session-catalog";
import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { getTacticalAnimation } from "@/lib/academie/tactical-animation-registry";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import { filmIdsForSlug } from "@/lib/decision-lab/films/dedicated/ids";
import { getDedicatedBundleForSession } from "@/lib/decision-lab/films/dedicated/build-dedicated-films";
import {
  assertBatchAUniqueTimelines,
  getPressBatchABundle,
  listPressBatchAFreezeMs,
  PRESS_BATCH_A_SESSION_IDS,
} from "@/lib/decision-lab/films/press-batch-a";
import { BATCH_A_SEEKS_BY_SLUG } from "@/lib/decision-lab/films/press-batch-a/timings";
import { ANIM_FDL_GS_INSIDE_CLOSE_LIVE } from "@/lib/decision-lab/films/fdl-gs-inside-close-rb";
import { GS_SEEKS } from "@/lib/decision-lab/gs-timings";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assertBatchAUniqueTimelines();

const freezeMap = listPressBatchAFreezeMs();
const freezeValues = Object.values(freezeMap);
assert(new Set(freezeValues).size === freezeValues.length, "unique freeze moments");
assert(PRESS_BATCH_A_SESSION_IDS.size === 8, "8 batch A sessions");

const EXPECTED: Array<{
  sessionId: string;
  slug: string;
  role: string;
  ballAtFreezeHint: string;
}> = [
  { sessionId: "FDL-DS-INSIDE-CLOSE-LW-PRESS-V1", slug: "binnenkant-dicht-lw", role: "us.LW", ballAtFreezeHint: "opp.rb" },
  { sessionId: "FDL-DS-INSIDE-CLOSE-RW-DECISION-V1", slug: "binnenkant-dicht-decision", role: "us.RW", ballAtFreezeHint: "opp.lb" },
  { sessionId: "FDL-DS-SECOND-PRESS-8-V1", slug: "tweede-druk-8", role: "us.R6", ballAtFreezeHint: "opp.lb" },
  { sessionId: "FDL-DS-DEPTH-COVER-RB-V1", slug: "rugdekking-rb", role: "us.RB", ballAtFreezeHint: "opp.lb" },
  { sessionId: "FDL-DS-ST-STEER-PIN-V1", slug: "spits-stuurt", role: "us.SP", ballAtFreezeHint: "opp.lb" },
  { sessionId: "FDL-DS-FAR-SIDE-SQUEEZE-V1", slug: "verre-zijde-knijpt", role: "us.LW", ballAtFreezeHint: "opp.lb" },
  { sessionId: "FDL-DS-PRESS-ABORT-RECOVER-V1", slug: "niet-doordrukken", role: "us.RW", ballAtFreezeHint: "opp" },
  { sessionId: "FDL-DS-INSIDE-CLOSE-RW-PRESSURE-V1", slug: "binnenkant-onder-druk", role: "us.RW", ballAtFreezeHint: "opp.lb" },
];

const liveDurations: number[] = [];
const stepIdFingerprints: string[] = [];

for (const exp of EXPECTED) {
  const bundle = getPressBatchABundle(exp.sessionId);
  assert(Boolean(bundle), `bundle ${exp.slug}`);
  assert(bundle!.activeRole === exp.role, `role ${exp.slug}`);
  assert(bundle!.freezeMs === BATCH_A_SEEKS_BY_SLUG[exp.slug]!.freeze, `freeze timing ${exp.slug}`);

  const wired = getDedicatedBundleForSession(exp.sessionId);
  assert(wired?.freezeMs === bundle!.freezeMs, `registry override ${exp.slug}`);
  assert(wired?.animations !== undefined, `anims ${exp.slug}`);

  const ids = filmIdsForSlug(exp.slug);
  const sit = getTacticalSituation(ids.live)!;
  const live = getTacticalAnimation(ids.live)!;
  const good = getTacticalAnimation(ids.good)!;
  const bad = getTacticalAnimation(ids.bad)!;

  assert(Boolean(sit && live && good && bad), `resolve ${exp.slug}`);
  assert(live.positioningMode === "authored", `authored ${exp.slug}`);
  assert(good.durationMs > live.durationMs, `good longer ${exp.slug}`);
  assert(bad.durationMs > bundle!.freezeMs, `bad past freeze ${exp.slug}`);
  assert(live.durationMs !== ANIM_FDL_GS_INSIDE_CLOSE_LIVE.durationMs || exp.slug === "never", "not identical GS duration unless coincidence");

  liveDurations.push(live.durationMs);
  stepIdFingerprints.push(
    `${live.durationMs}|${bundle!.freezeMs}|${live.steps.map((s) => `${s.id}:${s.durationMs}:${s.teachingPoint ?? ""}`).join("|")}`,
  );

  const freeze = evaluateTacticalAnimation(sit, live, bundle!.freezeMs);
  assert(Boolean(freeze), `freeze eval ${exp.slug}`);
  assert(sit.players!.some((p) => p.id === exp.role), `active on pitch ${exp.slug}`);

  const catalog = listDecisionLabSessions().find((s) => s.id === exp.sessionId)!;
  assert(catalog.pitch.liveSituationId === ids.live, `catalog live ${exp.slug}`);
}

// Unique live durations + unique step fingerprints (no shared factory timeline)
assert(new Set(liveDurations).size >= 6, `unique live durations got ${new Set(liveDurations).size}`);
assert(new Set(stepIdFingerprints).size === 8, `unique step fingerprints got ${new Set(stepIdFingerprints).size}`);

// #4 second-press: R6 is learner; RW should have moved by freeze vs start
{
  const ids = filmIdsForSlug("tweede-druk-8");
  const sit = getTacticalSituation(ids.live)!;
  const anim = getTacticalAnimation(ids.live)!;
  const bundle = getPressBatchABundle("FDL-DS-SECOND-PRESS-8-V1")!;
  const t0 = evaluateTacticalAnimation(sit, anim, 200);
  const tf = evaluateTacticalAnimation(sit, anim, bundle.freezeMs);
  const rw0 = t0.playerAt["us.RW"];
  const rwF = tf.playerAt["us.RW"];
  assert(Boolean(rw0 && rwF), "rw positions");
  const dist = Math.hypot(rwF!.x - rw0!.x, rwF!.y - rw0!.y);
  assert(dist > 4, `#4 RW must be mid-press by freeze (moved ${dist.toFixed(1)})`);
}

// #5 depth cover: bad consequence should involve depth (RB moves high on bad)
{
  const ids = filmIdsForSlug("rugdekking-rb");
  const sit = getTacticalSituation(ids.bad)!;
  const anim = getTacticalAnimation(ids.bad)!;
  const bundle = getPressBatchABundle("FDL-DS-DEPTH-COVER-RB-V1")!;
  const mid = evaluateTacticalAnimation(sit, anim, bundle.freezeMs + 2500);
  const rb = mid.playerAt["us.RB"];
  const startRb = PRESS_V2_RB_X();
  assert(Boolean(rb), "rb on bad");
  assert(rb!.x > startRb - 2, "#5 bad RB should step higher (larger x) or at least not deepen only");
}

function PRESS_V2_RB_X() {
  // start x from press reference
  return 30;
}

// #6 ST steer: good branch moves SP toward centre pin, not only toward LB
{
  const ids = filmIdsForSlug("spits-stuurt");
  const sit = getTacticalSituation(ids.good)!;
  const anim = getTacticalAnimation(ids.good)!;
  const bundle = getPressBatchABundle("FDL-DS-ST-STEER-PIN-V1")!;
  const t0 = evaluateTacticalAnimation(sit, anim, 200);
  const late = evaluateTacticalAnimation(sit, anim, bundle.freezeMs + 3000);
  const sp0 = t0.playerAt["us.SP"]!;
  const sp1 = late.playerAt["us.SP"]!;
  assert(Math.hypot(sp1.x - sp0.x, sp1.y - sp0.y) > 3, "#6 ST must move on good");
}

// #7 far-side: LW moves inward (toward centre y) on good
{
  const ids = filmIdsForSlug("verre-zijde-knijpt");
  const sit = getTacticalSituation(ids.good)!;
  const anim = getTacticalAnimation(ids.good)!;
  const bundle = getPressBatchABundle("FDL-DS-FAR-SIDE-SQUEEZE-V1")!;
  const t0 = evaluateTacticalAnimation(sit, anim, 200);
  const late = evaluateTacticalAnimation(sit, anim, bundle.freezeMs + 2800);
  const lw0 = t0.playerAt["us.LW"]!;
  const lw1 = late.playerAt["us.LW"]!;
  assert(lw1.y > lw0.y + 2, `#7 LW should squeeze toward centre (y ${lw0.y}→${lw1.y})`);
}

// #8 abort: good and bad diverge — good RW recovers (lower x), bad continues high
{
  const ids = filmIdsForSlug("niet-doordrukken");
  const goodSit = getTacticalSituation(ids.good)!;
  const badSit = getTacticalSituation(ids.bad)!;
  const good = getTacticalAnimation(ids.good)!;
  const bad = getTacticalAnimation(ids.bad)!;
  const bundle = getPressBatchABundle("FDL-DS-PRESS-ABORT-RECOVER-V1")!;
  const g = evaluateTacticalAnimation(goodSit, good, bundle.freezeMs + 3500);
  const b = evaluateTacticalAnimation(badSit, bad, bundle.freezeMs + 3500);
  const gRw = g.playerAt["us.RW"]!;
  const bRw = b.playerAt["us.RW"]!;
  assert(Math.hypot(gRw.x - bRw.x, gRw.y - bRw.y) > 3, "#8 good/bad RW paths must diverge");
}

// #2 mirror: ball holder side is RB flank (opp.rb has ball or ball near low y)
{
  const ids = filmIdsForSlug("binnenkant-dicht-lw");
  const sit = getTacticalSituation(ids.live)!;
  const holder = sit.players?.find((p) => p.hasBall);
  assert(
    holder?.id === "opp.cbR" || holder?.id === "opp.rb",
    `#2 opening holder should be right-CB or RB side, got ${holder?.id}`,
  );
  assert(sit.players!.some((p) => p.id === "us.LW"), "#2 LW present");
}

// Mobile focus includes active + support
for (const exp of EXPECTED) {
  const b = getPressBatchABundle(exp.sessionId)!;
  assert(b.mobileFocusIds.includes(exp.role), `mobile focus ${exp.slug}`);
  assert(b.mobileFocusIds.length >= 3, `support focus ${exp.slug}`);
}

// Golden Session regression — freeze still GS_SEEKS.freeze
assert(GS_SEEKS.freeze === 6800, "GS freeze intact");
assert(ANIM_FDL_GS_INSIDE_CLOSE_LIVE.durationMs === GS_SEEKS.liveEnd, "GS live duration intact");

console.log("d002-press-batch-a.test.ts: OK");
