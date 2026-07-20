export {
  clearAcademyRegistryCache,
  getAnkers,
  getMoment,
  getPlaybook,
  getPosition,
  getProblem,
  getSituation,
  getTag,
  getVisual,
  listMvpProblems,
  loadAllRegistries,
  loadAnchors,
  loadMoments,
  loadPlaybooks,
  loadPositions,
  loadProblems,
  loadSituations,
  loadTags,
  loadVisuals,
} from "@/lib/academy/registry/loaders";
export type { AnkerTaskTriplet } from "@/lib/academy/registry/loaders";
export { validateAcademyRegistries } from "@/lib/academy/registry/validate";
export type { RegistryValidationIssue } from "@/lib/academy/registry/validate";
