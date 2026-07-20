/**
 * CI: academy:validate-registries (T-03-02).
 *
 *   cd platform && npm run academy:validate-registries
 */
import { clearAcademyRegistryCache, loadAllRegistries, listMvpProblems } from "@/lib/academy/registry/loaders";
import { validateAcademyRegistries } from "@/lib/academy/registry/validate";

clearAcademyRegistryCache();

try {
  const data = loadAllRegistries();
  console.log("Registries loaded:");
  console.log(`  problems:   ${data.problems.length}`);
  console.log(`  situations: ${data.situations.length}`);
  console.log(`  moments:    ${data.moments.length}`);
  console.log(`  playbooks:  ${data.playbooks.length}`);
  console.log(`  positions:  ${data.positions.length}`);
  console.log(`  anchors:    ${data.anchors.length}`);
  console.log(`  tags:       ${data.tags.length}`);
  console.log(`  visuals:    ${data.visuals.length}`);
  console.log(`  MVP problems: ${listMvpProblems().length}`);

  const issues = validateAcademyRegistries();
  if (issues.length > 0) {
    console.error("\nValidation FAILED:");
    for (const issue of issues) {
      console.error(`  [${issue.code}] ${issue.message}`);
    }
    process.exit(1);
  }

  console.log("\nacademy:validate-registries: ok");
} catch (err) {
  console.error("academy:validate-registries: fatal");
  console.error(err);
  process.exit(1);
}
