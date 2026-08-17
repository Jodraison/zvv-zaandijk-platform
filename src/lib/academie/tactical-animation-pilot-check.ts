import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { getTacticalAnimation } from "@/lib/academie/tactical-animation-registry";
import { validateAnimationRealism } from "@/lib/academie/tactical-animation-realism";

const ids = [
  "connected-team",
  "press-bad",
  "press-good",
  "kw-choice-force",
  "kw-choice-relocate",
  "ta-lcv-buildup",
  "ta-rb-alone",
  "ta-rb-support",
  "gr-10-loss",
  "in-r6-win",
  "in-moment-press",
  "in-moment-rest",
  "me-spits-miss",
  "me-10-refocus",
  "me-moment-late",
];

for (const id of ids) {
  const sit = getTacticalSituation(id)!;
  const anim = getTacticalAnimation(id)!;
  const issues = validateAnimationRealism(sit, anim);
  const e = issues.filter((i) => i.level === "error");
  const w = issues.filter((i) => i.level === "warn");
  console.log(
    id,
    "dur",
    anim.durationMs,
    "err",
    e.map((x) => `${x.code}:${x.playerId ?? ""}`).join("|") || "-",
    "warns",
    w.length,
    "shape",
    !!(sit.homeShape && sit.opponentShape),
    "opp",
    sit.players.filter((p) => p.team === "opponent").length,
  );
}
