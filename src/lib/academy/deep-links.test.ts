/**
 * T-02-02 — deep-link builders, layer/origin policy, acceptance paths.
 */
import assert from "node:assert/strict";
import {
  academyNavIntentForContentEntry,
  academyNavIntentForLayerChange,
  academyNavIntentForReflectieComplete,
  parseAcademyHighlightQuery,
  parseAcademyLayerQuery,
  parseAcademyOriginQuery,
  parseAcademyWedstrijdFase,
} from "@/lib/academy/navigation-policy";
import { resolveActiveAcademyTab } from "@/lib/academy/resolve-active-academy-tab";
import {
  academyContentPath,
  academyOefeningPath,
  academyPositiePath,
  academyProbleemPath,
  academyReflectiePath,
  academyRoutes,
  academySeizoenReflectiesPath,
  academySeizoenSpeelboekPath,
  academySituatieDetailPath,
  academySituatiePoortPath,
  academyWedstrijdFasePath,
} from "@/lib/academy/routes";

// --- Acceptance deep links (backlog) ---
assert.equal(academyPositiePath({ highlight: "week" }), "/academy/positie?highlight=week");
assert.equal(academyWedstrijdFasePath("voor"), "/academy/wedstrijd/voor");
assert.equal(academyProbleemPath("uitstappen-twijfel"), "/academy/probleem/uitstappen-twijfel");
assert.equal(academyContentPath("pb.27", { layer: "L2" }), "/academy/content/pb.27?layer=L2");

// --- Proto §3.5 + §2.1 builders ---
assert.equal(academyWedstrijdFasePath("rust"), "/academy/wedstrijd/rust");
assert.equal(academyWedstrijdFasePath("na"), "/academy/wedstrijd/na");
assert.equal(academySituatiePoortPath("wij-hebben-bal"), "/academy/situatie/wij-hebben-bal");
assert.equal(
  academySituatieDetailPath("wij-hebben-bal", "opbouwen"),
  "/academy/situatie/wij-hebben-bal/opbouwen",
);
assert.equal(academyOefeningPath("ex.27"), "/academy/oefening/ex.27");
assert.equal(academyReflectiePath("match.1"), "/academy/reflectie/match.1");
assert.equal(academySeizoenReflectiesPath(), "/academy/seizoen/reflecties");
assert.equal(academySeizoenSpeelboekPath(), "/academy/seizoen/speelboek");
assert.equal(
  academyContentPath("pb.27", { layer: "L2", origin: academyRoutes.probleem }),
  "/academy/content/pb.27?layer=L2&origin=%2Facademy%2Fprobleem",
);

const deepPaths = [
  academyPositiePath({ highlight: "week" }).split("?")[0]!,
  academyWedstrijdFasePath("voor"),
  academyProbleemPath("uitstappen-twijfel"),
  academyContentPath("pb.27").split("?")[0]!,
  academySituatiePoortPath("wij-hebben-bal"),
  academySituatieDetailPath("wij-hebben-bal", "opbouwen"),
  academyOefeningPath("ex.27"),
  academyReflectiePath("match.1"),
  academySeizoenReflectiesPath(),
  academySeizoenSpeelboekPath(),
];
for (const p of deepPaths) {
  assert.equal(p.includes("//"), false, `no double slash: ${p}`);
  assert.ok(p.startsWith("/academy"), `under mount: ${p}`);
}

// --- Layer / highlight / origin parse ---
assert.equal(parseAcademyLayerQuery("L2"), "L2");
assert.equal(parseAcademyLayerQuery("nope"), null);
assert.equal(parseAcademyHighlightQuery("week"), "week");
assert.equal(parseAcademyHighlightQuery("other"), null);
assert.equal(parseAcademyOriginQuery("/academy/probleem"), "/academy/probleem");
assert.equal(parseAcademyOriginQuery("https://evil.example"), null);
assert.equal(parseAcademyOriginQuery("/academie"), null);
assert.equal(parseAcademyWedstrijdFase("voor"), "voor");
assert.equal(parseAcademyWedstrijdFase("half"), null);

// --- Replace vs push policy ---
assert.equal(academyNavIntentForLayerChange(), "replace");
assert.equal(academyNavIntentForContentEntry(), "push");
assert.equal(academyNavIntentForReflectieComplete(), "replace");

// --- Active tabs for deep links ---
assert.equal(resolveActiveAcademyTab(academyWedstrijdFasePath("voor")), "wedstrijd");
assert.equal(resolveActiveAcademyTab(academyProbleemPath("uitstappen-twijfel")), "probleem");
assert.equal(resolveActiveAcademyTab(academySituatiePoortPath("wij-hebben-bal")), "situatie");
assert.equal(
  resolveActiveAcademyTab(academySituatieDetailPath("wij-hebben-bal", "opbouwen")),
  "situatie",
);
assert.equal(resolveActiveAcademyTab(academySeizoenReflectiesPath()), "seizoen");
assert.equal(resolveActiveAcademyTab(academySeizoenSpeelboekPath()), "seizoen");
assert.equal(resolveActiveAcademyTab(academyPositiePath({ highlight: "week" }).split("?")[0]!), "positie");
assert.equal(resolveActiveAcademyTab(academyContentPath("pb.27")), null);
assert.equal(resolveActiveAcademyTab(academyOefeningPath("ex.27")), null);
assert.equal(resolveActiveAcademyTab(academyReflectiePath("match.1")), null);
assert.equal(resolveActiveAcademyTab(academyRoutes.zoek), null);
assert.equal(resolveActiveAcademyTab(academyRoutes.teamTrainer), null);
assert.equal(resolveActiveAcademyTab(academyRoutes.onboardingPositie), null);

console.log("deep-links.test.ts: ok");
