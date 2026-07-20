/**
 * CI: academy:validate-sidecar-pb27 (T-C-01)
 *
 *   cd platform && npm run academy:validate-sidecar-pb27
 */
import { getPlaybook } from "@/lib/academy/registry/loaders";
import {
  loadPlaybookSidecar,
  validatePilotSidecarDoD,
} from "@/lib/academy/sidecar/loaders";

try {
  const sidecar = loadPlaybookSidecar(27);
  const issues = validatePilotSidecarDoD(sidecar);

  const pb = getPlaybook("pb.27");
  if (!pb) {
    issues.push({ code: "registry_missing", message: "pb.27 not in playbook registry" });
  } else {
    if (!pb.title.trim() || /pb\.?\s*27/i.test(pb.title) || /PB\s*27/i.test(pb.title)) {
      issues.push({
        code: "human_title",
        message: `Registry title must be human (no PB#): got "${pb.title}"`,
      });
    }
    if (pb.slug !== sidecar.slug) {
      issues.push({
        code: "slug_mismatch",
        message: `registry slug ${pb.slug} ≠ sidecar ${sidecar.slug}`,
      });
    }
  }

  console.log("Sidecar pb.27:");
  console.log(`  slug:     ${sidecar.slug}`);
  console.log(`  exercise: ${sidecar.exercise}`);
  console.log(`  cues:     ${sidecar.captain_points.length}`);
  console.log(`  L2 keys:  ${Object.keys(sidecar.layers.L2).length}`);
  console.log(`  title:    ${pb?.title ?? "(missing)"}`);

  if (issues.length > 0) {
    console.error("\nValidation FAILED:");
    for (const issue of issues) {
      console.error(`  [${issue.code}] ${issue.message}`);
    }
    process.exit(1);
  }

  console.log("\nacademy:validate-sidecar-pb27: ok");
} catch (err) {
  console.error("academy:validate-sidecar-pb27: fatal");
  console.error(err);
  process.exit(1);
}
