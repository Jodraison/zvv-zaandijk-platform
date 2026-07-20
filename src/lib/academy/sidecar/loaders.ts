/**
 * Playbook sidecar loader (T-C-01) — server-side YAML under docs/academy/sidecars/.
 */
import {
  parsePlaybookSidecar,
  type PlaybookSidecar,
} from "@/lib/academy/schema/sidecar";
import { positionSlugSchema, type PositionSlug } from "@/lib/academy/schema/ids";
import { readAcademyYamlFile } from "@/lib/academy/registry/yaml-io";

const ALL_POSITION_SLUGS = positionSlugSchema.options;

export function sidecarFilenameForPb(pbNumber: number): string {
  return `sidecars/pb-${String(pbNumber).padStart(2, "0")}-meta.yaml`;
}

export function loadPlaybookSidecar(pbNumber: number): PlaybookSidecar {
  const filename = sidecarFilenameForPb(pbNumber);
  const raw = readAcademyYamlFile(filename);
  const parsed = parsePlaybookSidecar(raw);
  if (parsed.pb !== pbNumber) {
    throw new Error(`Sidecar ${filename}: pb field ${parsed.pb} ≠ expected ${pbNumber}`);
  }
  return parsed;
}

export type SidecarPilotIssue = { code: string; message: string };

/** Extra T-C-01 DoD checks beyond Zod shape. */
export function validatePilotSidecarDoD(sidecar: PlaybookSidecar): SidecarPilotIssue[] {
  const issues: SidecarPilotIssue[] = [];

  if (!sidecar.exercise || !sidecar.exercise.trim()) {
    issues.push({ code: "exercise_missing", message: "exercise string required for pilot" });
  }

  if (!sidecar.captain_points || sidecar.captain_points.length < 1) {
    issues.push({ code: "cues_missing", message: "captain_points (cues) required for pilot" });
  }

  if (!sidecar.layers.L0.shared?.trim()) {
    issues.push({ code: "l0_missing", message: "L0.shared trigger required" });
  }

  for (const layer of ["L2", "L3", "L4"] as const) {
    const block = sidecar.layers[layer] as Record<string, unknown>;
    for (const slug of ALL_POSITION_SLUGS) {
      if (!(slug in block)) {
        issues.push({
          code: "position_missing",
          message: `${layer} missing position ${slug}`,
        });
      }
    }
  }

  const lb = sidecar.layers.L2.lb ?? [];
  const rb = sidecar.layers.L2.rb ?? [];
  if (lb.length > 0 && rb.length > 0 && JSON.stringify(lb) === JSON.stringify(rb)) {
    issues.push({
      code: "lb_rb_identical",
      message: "L2 lb and rb must differ (pilot acceptatie)",
    });
  }

  return issues;
}

export function listSidecarPositionKeys(sidecar: PlaybookSidecar, layer: "L2" | "L3" | "L4"): PositionSlug[] {
  return Object.keys(sidecar.layers[layer]).filter((k): k is PositionSlug =>
    positionSlugSchema.safeParse(k).success,
  );
}
