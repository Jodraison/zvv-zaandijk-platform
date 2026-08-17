/**
 * D-001 — dedicated films for sessions #2–#18 (no generic fallback).
 * Run: npx tsx src/lib/decision-lab/films/dedicated/d001-dedicated-films.test.ts
 */
import { listDecisionLabSessions } from "@/lib/decision-lab/session-catalog";
import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { getTacticalAnimation } from "@/lib/academie/tactical-animation-registry";
import {
  DEDICATED_SESSION_FILM_DEFS,
  filmIdsForSlug,
} from "@/lib/decision-lab/films/dedicated/ids";
import {
  buildAllDedicatedFilmBundles,
  getDedicatedBundleForSession,
} from "@/lib/decision-lab/films/dedicated/build-dedicated-films";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import { DEDICATED_FREEZE_MS } from "@/lib/decision-lab/films/dedicated/ids";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const sessions = listDecisionLabSessions();
assert(sessions.length === 18, "18 sessions");

// Golden remains dedicated
{
  const gs = sessions[0]!;
  assert(gs.pitch.liveSituationId === "fdl-gs-inside-close-live", "gs live");
  assert(Boolean(getTacticalAnimation(gs.pitch.liveSituationId)), "gs anim");
}

const bundles = buildAllDedicatedFilmBundles();
assert(bundles.length === 17, "17 dedicated bundles");
assert(DEDICATED_SESSION_FILM_DEFS.length === 17, "17 defs");

for (const def of DEDICATED_SESSION_FILM_DEFS) {
  const ids = filmIdsForSlug(def.slug);
  const session = sessions.find((s) => s.id === def.sessionId);
  assert(Boolean(session), `session ${def.sessionId}`);
  assert(session!.pitch.liveSituationId === ids.live, `${def.slug} live wired`);
  assert(session!.pitch.goodSituationId === ids.good, `${def.slug} good wired`);
  assert(session!.pitch.badSituationId === ids.bad, `${def.slug} bad wired`);
  assert(!session!.pitch.liveSituationId.startsWith("press-"), `${def.slug} not generic press`);
  assert(session!.pitch.liveSituationId !== "connected-team", `${def.slug} not connected-team`);

  for (const id of [ids.live, ids.good, ids.bad]) {
    const sit = getTacticalSituation(id);
    assert(Boolean(sit), `situation ${id}`);
    assert((sit!.players?.filter((p) => p.team === "us").length ?? 0) === 11, `11 us ${id}`);
    const anim = getTacticalAnimation(id);
    assert(Boolean(anim), `anim ${id}`);
  }

  const sit = getTacticalSituation(ids.live)!;
  const liveAnim = getTacticalAnimation(ids.live)!;
  const freezeAt = getDedicatedBundleForSession(def.sessionId)?.freezeMs ?? DEDICATED_FREEZE_MS;
  const freeze = evaluateTacticalAnimation(sit, liveAnim, freezeAt);
  assert(Boolean(freeze), `freeze eval ${def.slug}`);

  const bundle = getDedicatedBundleForSession(def.sessionId);
  assert(bundle?.activeRole === def.activeRole, `active role ${def.slug}`);
}

// Shared prelude: live ends at/near freeze; good/bad continue past freeze
{
  const sample = filmIdsForSlug("eerste-pass-na-win");
  const live = getTacticalAnimation(sample.live)!;
  const good = getTacticalAnimation(sample.good)!;
  const bad = getTacticalAnimation(sample.bad)!;
  assert(live.durationMs <= good.durationMs, "good longer than live");
  const freezeAt = getDedicatedBundleForSession("FDL-DS-FIRST-PASS-AFTER-WIN-V1")?.freezeMs ?? DEDICATED_FREEZE_MS;
  assert(good.durationMs > freezeAt, "good past freeze");
  assert(bad.durationMs > freezeAt, "bad past freeze");
}

// No-generic-fallback across catalog pitches #2–#18
{
  for (const s of sessions.slice(1)) {
    for (const id of [s.pitch.liveSituationId, s.pitch.goodSituationId, s.pitch.badSituationId]) {
      assert(id.startsWith("fdl-ds-"), `${s.slug} pitch ${id} must be dedicated`);
      assert(id !== "press-good" && id !== "press-bad" && id !== "connected-team", `no generic ${id}`);
    }
  }
}

// Required-role + 4-2-3-1 origin claim (build uses formation; press uses PRESS_V2 + subtitle)
{
  for (const def of DEDICATED_SESSION_FILM_DEFS) {
    const ids = filmIdsForSlug(def.slug);
    const sit = getTacticalSituation(ids.live)!;
    assert(sit.players!.some((p) => p.id === def.activeRole), `active role present ${def.slug}`);
    assert(
      sit.homeShape?.formation === "4-2-3-1" ||
        sit.homeShape?.phase === "high-press" ||
        sit.homeShape?.phase === "final-third" ||
        sit.homeShape?.phase === "mid-block",
      `formation origin ${def.slug}`,
    );
    assert(
      sit.homeShape?.direction === "left-to-right" || Boolean(sit.subtitle?.includes("aanval")),
      `attacking direction ${def.slug}`,
    );
  }
}

// Mobile focus ids present on every bundle
{
  for (const def of DEDICATED_SESSION_FILM_DEFS) {
    const bundle = getDedicatedBundleForSession(def.sessionId)!;
    assert(Boolean(bundle.mobileFocusIds.includes(def.activeRole)), `mobile focus ${def.slug}`);
    assert(bundle.mobileFocusIds.length >= 2, `support focus ${def.slug}`);
  }
}

console.log("d001-dedicated-films.test.ts: OK");
