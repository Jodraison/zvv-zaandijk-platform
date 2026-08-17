import { getTacticalSituation } from "@/components/academie/tactical-situations";
import {
  getTacticalAnimation,
  listAnimatedSituationIds,
} from "@/lib/academie/tactical-animation-registry";
import { validateAnimationRealism } from "@/lib/academie/tactical-animation-realism";

const fails: string[] = [];
for (const id of listAnimatedSituationIds()) {
  const sit = getTacticalSituation(id)!;
  const anim = getTacticalAnimation(id)!;
  const errs = validateAnimationRealism(sit, anim).filter((i) => i.level === "error");
  if (errs.length) {
    fails.push(`${id}: ${[...new Set(errs.map((e) => e.code))].join(", ")}`);
    for (const e of errs.slice(0, 3)) console.log(" ", e.message);
  }
}
console.log("FAIL_COUNT", fails.length);
fails.forEach((f) => console.log(f));
