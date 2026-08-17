/**
 * WP-1 — public nav visibility (desktop + mobile share buildSiteNavItems).
 * Run: `npx tsx src/lib/navigation/public-nav.test.ts`
 */
import assert from "node:assert/strict";
import {
  BASE_NAV_ITEMS,
  buildSiteNavItems,
} from "@/lib/navigation/public-nav";

const coreWithoutAcademie = BASE_NAV_ITEMS.filter((i) => i.href !== "/academie").map((i) => i.href);

function hrefs(opts: Parameters<typeof buildSiteNavItems>[0]) {
  return buildSiteNavItems(opts).map((i) => i.href);
}

const hidden = hrefs({ academyPublicVisible: false, academyEnabled: false, isAdmin: false });
assert.ok(!hidden.includes("/academie"), "feature off → no /academie in nav");
assert.deepEqual(
  hidden,
  coreWithoutAcademie,
  "feature off → remaining core nav items unchanged (order preserved)",
);

const mobileSame = hrefs({ academyPublicVisible: false, academyEnabled: false, isAdmin: false });
assert.deepEqual(hidden, mobileSame, "desktop and mobile use the same builder");

const shown = hrefs({ academyPublicVisible: true, academyEnabled: false, isAdmin: false });
assert.ok(shown.includes("/academie"), "feature on → Academie present");
assert.equal(
  shown.indexOf("/academie"),
  shown.indexOf("/statistieken") + 1,
  "Academie stays between Statistieken and Training",
);
assert.equal(shown.indexOf("/training"), shown.indexOf("/academie") + 1);

const withMvpOff = hrefs({ academyPublicVisible: false, academyEnabled: true, isAdmin: false });
assert.ok(!withMvpOff.includes("/academie"));
assert.ok(withMvpOff.includes("/academy"), "ACADEMY_ENABLED still adds MVP link independently");

const withAdmin = hrefs({ academyPublicVisible: false, academyEnabled: false, isAdmin: true });
assert.ok(!withAdmin.includes("/academie"));
assert.ok(withAdmin.includes("/beheer"), "Beheer unaffected");

const allOn = hrefs({ academyPublicVisible: true, academyEnabled: true, isAdmin: true });
assert.ok(allOn.includes("/academie"));
assert.ok(allOn.includes("/academy"));
assert.ok(allOn.includes("/beheer"));
assert.ok(allOn.includes("/fitheid"));

console.log("public-nav.test.ts: ok");
