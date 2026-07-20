/**
 * Academy registry loaders + typed getters (T-03-02).
 * Loads Phase B YAML from docs/academy — no content invention.
 */
import { readAcademyYamlFile } from "@/lib/academy/registry/yaml-io";
import {
  playbooksFileSchema,
  positionsFileSchema,
  problemsFileSchema,
  situationsFileSchema,
  tagsFileSchema,
  visualsFileSchema,
} from "@/lib/academy/registry/file-schemas";
import type {
  Moment,
  PlaybookRegistryEntry,
  PositieAnker,
  PositionRegistryEntry,
  ProblemRegistryEntry,
  SituationRegistryEntry,
  TagRegistryEntry,
  VisualRegistryEntry,
} from "@/lib/academy/schema/registry-entries";
import type { PositionSlug } from "@/lib/academy/schema/ids";

type RegistryCaches = {
  problems: ProblemRegistryEntry[] | null;
  situations: SituationRegistryEntry[] | null;
  moments: Moment[] | null;
  playbooks: PlaybookRegistryEntry[] | null;
  positions: PositionRegistryEntry[] | null;
  anchors: PositieAnker[] | null;
  tags: TagRegistryEntry[] | null;
  visuals: VisualRegistryEntry[] | null;
};

const cache: RegistryCaches = {
  problems: null,
  situations: null,
  moments: null,
  playbooks: null,
  positions: null,
  anchors: null,
  tags: null,
  visuals: null,
};

/** Test/CI helper — clears memoized registries. */
export function clearAcademyRegistryCache(): void {
  cache.problems = null;
  cache.situations = null;
  cache.moments = null;
  cache.playbooks = null;
  cache.positions = null;
  cache.anchors = null;
  cache.tags = null;
  cache.visuals = null;
}

export function loadProblems(): ProblemRegistryEntry[] {
  if (!cache.problems) {
    const data = problemsFileSchema.parse(readAcademyYamlFile("academy-registry-problems.yaml"));
    cache.problems = data.problems;
  }
  return cache.problems;
}

export function loadSituations(): SituationRegistryEntry[] {
  if (!cache.situations) {
    const data = situationsFileSchema.parse(readAcademyYamlFile("academy-registry-situations.yaml"));
    cache.situations = data.situations;
    cache.moments = data.moments;
  }
  return cache.situations;
}

export function loadMoments(): Moment[] {
  if (!cache.moments) {
    loadSituations();
  }
  return cache.moments ?? [];
}

export function loadPlaybooks(): PlaybookRegistryEntry[] {
  if (!cache.playbooks) {
    const data = playbooksFileSchema.parse(readAcademyYamlFile("academy-registry-playbooks.yaml"));
    cache.playbooks = data.playbooks;
  }
  return cache.playbooks;
}

export function loadPositions(): PositionRegistryEntry[] {
  if (!cache.positions) {
    const data = positionsFileSchema.parse(readAcademyYamlFile("academy-registry-positions.yaml"));
    cache.positions = data.positions;
    cache.anchors = data.anchors;
  }
  return cache.positions;
}

export function loadAnchors(): PositieAnker[] {
  if (!cache.anchors) {
    loadPositions();
  }
  return cache.anchors ?? [];
}

export function loadTags(): TagRegistryEntry[] {
  if (!cache.tags) {
    const data = tagsFileSchema.parse(readAcademyYamlFile("academy-registry-tags.yaml"));
    cache.tags = data.tags;
  }
  return cache.tags;
}

export function loadVisuals(): VisualRegistryEntry[] {
  if (!cache.visuals) {
    const data = visualsFileSchema.parse(readAcademyYamlFile("academy-registry-visuals.yaml"));
    cache.visuals = data.visuals;
  }
  return cache.visuals;
}

export function getProblem(slugOrId: string): ProblemRegistryEntry | undefined {
  const all = loadProblems();
  return all.find((p) => p.slug === slugOrId || p.id === slugOrId);
}

export function getSituation(slugOrId: string): SituationRegistryEntry | undefined {
  const all = loadSituations();
  return all.find((s) => s.slug === slugOrId || s.id === slugOrId);
}

export function getPlaybook(idOrNumber: string | number): PlaybookRegistryEntry | undefined {
  const all = loadPlaybooks();
  if (typeof idOrNumber === "number") {
    return all.find((p) => p.number === idOrNumber);
  }
  return all.find((p) => p.id === idOrNumber || p.slug === idOrNumber);
}

export function getPosition(slugOrId: string): PositionRegistryEntry | undefined {
  const all = loadPositions();
  return all.find((p) => p.slug === slugOrId || p.id === slugOrId);
}

export function getTag(slugOrId: string): TagRegistryEntry | undefined {
  const all = loadTags();
  return all.find((t) => t.slug === slugOrId || t.id === slugOrId);
}

export function getVisual(idOrSlug: string): VisualRegistryEntry | undefined {
  const all = loadVisuals();
  return all.find((v) => v.id === idOrSlug || v.slug === idOrSlug);
}

export function getMoment(idOrSlug: string): Moment | undefined {
  const all = loadMoments();
  return all.find((m) => m.id === idOrSlug || m.slug === idOrSlug);
}

/**
 * PositieAnkers for a position slug or id — exactly 3 tasks when registry is valid.
 * Full DoD for accessor samples is also covered by T-03-03; included here per T-03-02 DoD.
 */
export function getAnkers(pos: string | PositionSlug): PositieAnker | undefined {
  const position = getPosition(pos);
  if (!position) return undefined;
  const anchors = loadAnchors();
  if (position.anchor_ref) {
    return anchors.find((a) => a.id === position.anchor_ref);
  }
  return anchors.find((a) => a.position_id === position.id);
}

export function listMvpProblems(): ProblemRegistryEntry[] {
  return loadProblems()
    .filter((p) => p.mvp_priority != null && p.mvp_priority >= 1 && p.mvp_priority <= 7)
    .sort((a, b) => (a.mvp_priority ?? 99) - (b.mvp_priority ?? 99));
}

/** Load + structural counts used by CI validation. */
export function loadAllRegistries() {
  return {
    problems: loadProblems(),
    situations: loadSituations(),
    moments: loadMoments(),
    playbooks: loadPlaybooks(),
    positions: loadPositions(),
    anchors: loadAnchors(),
    tags: loadTags(),
    visuals: loadVisuals(),
  };
}
