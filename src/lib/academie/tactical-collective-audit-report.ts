import { getTacticalSituation } from "@/components/academie/tactical-situations";
import { getTacticalAnimation } from "@/lib/academie/tactical-animation-registry";
import { evaluateTacticalAnimation } from "@/lib/academie/tactical-animation-engine";
import {
  measureTeamLength,
  measureLineHeightsUs,
  measureLineGapsUs,
  auditCollectiveFrame,
} from "@/lib/academie/tactical-collective";

for (const id of ["kw-r6-ball", "connected-team"] as const) {
  const sit = getTacticalSituation(id)!;
  const anim = getTacticalAnimation(id)!;
  const times = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.floor(anim.durationMs * p));
  console.log(`\n=== ${id} dur=${anim.durationMs} ===`);
  for (const t of times) {
    const f = evaluateTacticalAnimation(sit, anim, t);
    const len = measureTeamLength(f.playerAt, "us");
    const oppLen = measureTeamLength(f.playerAt, "opponent");
    const h = measureLineHeightsUs(f.playerAt);
    const g = measureLineGapsUs(f.playerAt);
    const a = auditCollectiveFrame({
      timeMs: t,
      ball: f.ball ?? { x: 50, y: 50 },
      playerAt: f.playerAt,
      pressureOnBall: "controlled",
      depthThreat: "limited",
    });
    const gk = f.playerAt["us.GK"];
    console.log(
      `${t}ms len=${len.length.toFixed(0)} oppLen=${oppLen.length.toFixed(0)} def=${h.defense.toFixed(0)} mid=${h.midfield.toFixed(0)} atk=${h.attack.toFixed(0)} gapMD=${g.midfieldDefenseGap.toFixed(0)} LL=${a.lastLineDecision} rest=${a.restDefenseStructure} gk=${gk ? `${gk.x.toFixed(0)},${gk.y.toFixed(0)}` : "-"}`,
    );
  }
}
