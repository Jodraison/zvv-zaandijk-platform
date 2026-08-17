/**
 * Golden Session film — mute-test + first-touch + freeze gates (C-003B).
 */
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import {
  ANIM_FDL_GS_INSIDE_CLOSE_BAD,
  ANIM_FDL_GS_INSIDE_CLOSE_GOOD,
  ANIM_FDL_GS_INSIDE_CLOSE_LIVE,
  FDL_GS_INSIDE_CLOSE_SITUATION,
  GS_SEEKS,
} from "@/lib/decision-lab/films/fdl-gs-inside-close-rb";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const sit = FDL_GS_INSIDE_CLOSE_SITUATION;

const t0 = evaluateTacticalAnimation(sit, ANIM_FDL_GS_INSIDE_CLOSE_LIVE, 400);
assert(t0.holderId === "opp.cbL", "T0 holder LCB");
assert(Boolean(t0.orientationAt["us.RW"]), "T0 RW orientation");
assert(Boolean(t0.orientationAt["us.R6"]), "T0 8 orientation");

const t2 = evaluateTacticalAnimation(sit, ANIM_FDL_GS_INSIDE_CLOSE_LIVE, GS_SEEKS.t2 + 600);
assert(t2.isTrigger === true || t2.statusLabel === "TRIGGER", "T2 trigger");
assert(t2.ball != null, "T2 ball exists");

/** First touch — ball settling, LB has possession, receiving foot authored */
const touch = evaluateTacticalAnimation(sit, ANIM_FDL_GS_INSIDE_CLOSE_LIVE, GS_SEEKS.t2Arrive + 350);
assert(touch.activeStepId === "t2b-first-touch", "first-touch step");
assert(touch.holderId === "opp.lb", "touch holder LB");
assert(touch.orientationAt["opp.lb"]?.receivingFoot === "right", "LB receiving foot");
assert(touch.orientationAt["opp.lb"]?.bodyShape === "closed", "LB closed receive");

/** Freeze — inside open, RW not committed, answer not revealed */
const freeze = evaluateTacticalAnimation(sit, ANIM_FDL_GS_INSIDE_CLOSE_LIVE, GS_SEEKS.freeze);
assert(freeze.statusLabel === "BESLIS", "freeze label");
assert(freeze.holderId === "opp.lb", "freeze holder");
assert((freeze.playerAt["us.RW"]?.x ?? 99) < 50, "freeze RW before curve");
assert(freeze.zones.some((z) => z.kind === "risk"), "freeze inside risk visible");
assert(!freeze.lines.some((l) => l.kind === "press" && !l.dashed), "no solid press solution line");

const liveEnd = evaluateTacticalAnimation(sit, ANIM_FDL_GS_INSIDE_CLOSE_LIVE, GS_SEEKS.liveEnd - 40);
assert((liveEnd.playerAt["us.RW"]?.x ?? 99) < 50, "live ends pre-curve");

const goodMid = evaluateTacticalAnimation(sit, ANIM_FDL_GS_INSIDE_CLOSE_GOOD, GS_SEEKS.t5 + 1200);
assert((goodMid.playerAt["us.RW"]?.x ?? 0) > 60, "GOOD RW on curve");
assert((goodMid.playerAt["us.R6"]?.x ?? 0) > 55, "GOOD 8 connected");

const badMid = evaluateTacticalAnimation(sit, ANIM_FDL_GS_INSIDE_CLOSE_BAD, GS_SEEKS.t4 + 800);
assert(badMid.zones.some((z) => z.kind === "risk"), "BAD inside still open during chase");
assert((badMid.playerAt["us.R6"]?.x ?? 99) < 48, "BAD 8 not magically covering");

const badEnd = evaluateTacticalAnimation(sit, ANIM_FDL_GS_INSIDE_CLOSE_BAD, GS_SEEKS.t6 + 200);
assert(badEnd.holderId === "opp.8" || badEnd.statusLabel === "PRESS WEG", "BAD break");

console.log("fdl-gs-inside-close-rb.test: ok");
