import { getTacticalAnimation, listAnimatedSituationIds } from "@/lib/academie/tactical-animation-registry";

const ids = listAnimatedSituationIds();
const all = ids.map((id) => getTacticalAnimation(id)!);
const main = ["connected-team", "press-good", "press-bad", "ta-lcv-buildup", "gr-10-loss", "in-r6-win", "me-spits-miss"]
  .map((id) => getTacticalAnimation(id)!)
  .filter(Boolean);
const compare = [
  "press-good",
  "press-bad",
  "kw-choice-force",
  "kw-choice-relocate",
  "ta-rb-alone",
  "ta-rb-support",
  "gr-l6-freeze",
  "gr-l6-recover",
  "in-10-late",
  "in-10-tempo",
  "me-10-hang",
  "me-10-refocus",
]
  .map((id) => getTacticalAnimation(id)!)
  .filter(Boolean);
const moments = ids.filter((id) => id.includes("moment")).map((id) => getTacticalAnimation(id)!);
const avg = (arr: { durationMs: number }[]) =>
  Math.round(arr.reduce((s, a) => s + a.durationMs, 0) / Math.max(1, arr.length));

console.log(
  JSON.stringify(
    {
      n: ids.length,
      avgAll: avg(all),
      avgMain: avg(main),
      avgCompare: avg(compare),
      avgMoments: avg(moments),
      minAll: Math.min(...all.map((a) => a.durationMs)),
      maxAll: Math.max(...all.map((a) => a.durationMs)),
    },
    null,
    2,
  ),
);
