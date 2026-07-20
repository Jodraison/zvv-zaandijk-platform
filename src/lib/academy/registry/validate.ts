/**
 * Cross-registry reference validation (T-03-02).
 * Fail-fast with collected errors.
 */
import { loadAllRegistries } from "@/lib/academy/registry/loaders";

export type RegistryValidationIssue = {
  code: string;
  message: string;
};

export function validateAcademyRegistries(): RegistryValidationIssue[] {
  const issues: RegistryValidationIssue[] = [];
  const { problems, situations, moments, playbooks, positions, anchors, tags, visuals } =
    loadAllRegistries();

  const pbIds = new Set(playbooks.map((p) => p.id));
  const sitIds = new Set(situations.map((s) => s.id));
  const probIds = new Set(problems.map((p) => p.id));
  const tagIds = new Set(tags.map((t) => t.id));
  const momentIds = new Set(moments.map((m) => m.id));
  const posIds = new Set(positions.map((p) => p.id));
  const visIds = new Set(visuals.map((v) => v.id));

  if (moments.length !== 6) {
    issues.push({ code: "moments_count", message: `Expected 6 moments, got ${moments.length}` });
  }
  if (positions.length !== 11) {
    issues.push({
      code: "positions_count",
      message: `Expected 11 positions, got ${positions.length}`,
    });
  }

  const mvp = problems.filter((p) => p.mvp_priority != null && p.mvp_priority <= 7);
  if (mvp.length !== 7) {
    issues.push({
      code: "mvp_problems_count",
      message: `Expected 7 MVP problems (mvp_priority 1–7), got ${mvp.length}`,
    });
  }

  const coreSituations = situations.filter((s) => s.status === "core");
  if (coreSituations.length !== 22) {
    issues.push({
      code: "core_situations_count",
      message: `Expected 22 core situations, got ${coreSituations.length}`,
    });
  }

  if (anchors.length !== 11) {
    issues.push({
      code: "anchors_count",
      message: `Expected 11 anchors, got ${anchors.length}`,
    });
  }

  for (const a of anchors) {
    if (a.tasks.length !== 3) {
      issues.push({
        code: "anchor_tasks",
        message: `${a.id} must have exactly 3 tasks`,
      });
    }
    if (!posIds.has(a.position_id)) {
      issues.push({
        code: "anchor_position_missing",
        message: `${a.id} references missing ${a.position_id}`,
      });
    }
    for (const t of a.tasks) {
      if (!pbIds.has(t.pb_ref)) {
        issues.push({
          code: "anchor_pb_missing",
          message: `${a.id} task references missing ${t.pb_ref}`,
        });
      }
    }
  }

  for (const p of problems) {
    for (const id of p.pb_refs) {
      if (!pbIds.has(id)) {
        issues.push({ code: "problem_pb_missing", message: `${p.id} → missing ${id}` });
      }
    }
    for (const id of p.situation_refs) {
      if (!sitIds.has(id)) {
        issues.push({ code: "problem_sit_missing", message: `${p.id} → missing ${id}` });
      }
    }
    for (const id of p.tag_refs) {
      if (!tagIds.has(id)) {
        issues.push({ code: "problem_tag_missing", message: `${p.id} → missing ${id}` });
      }
    }
  }

  for (const s of situations) {
    if (s.moment_id && !momentIds.has(s.moment_id)) {
      issues.push({ code: "situation_moment_missing", message: `${s.id} → missing ${s.moment_id}` });
    }
    for (const id of s.pb_refs) {
      if (!pbIds.has(id)) {
        issues.push({ code: "situation_pb_missing", message: `${s.id} → missing ${id}` });
      }
    }
    for (const id of s.tag_refs) {
      if (!tagIds.has(id)) {
        issues.push({ code: "situation_tag_missing", message: `${s.id} → missing ${id}` });
      }
    }
  }

  for (const pb of playbooks) {
    for (const id of pb.tags) {
      if (!tagIds.has(id)) {
        issues.push({ code: "playbook_tag_missing", message: `${pb.id} → missing ${id}` });
      }
    }
    for (const id of pb.situation_refs) {
      if (!sitIds.has(id)) {
        issues.push({ code: "playbook_sit_missing", message: `${pb.id} → missing ${id}` });
      }
    }
    for (const id of pb.problem_refs) {
      if (!probIds.has(id)) {
        issues.push({ code: "playbook_prob_missing", message: `${pb.id} → missing ${id}` });
      }
    }
    if (pb.visual_primary_ref && !visIds.has(pb.visual_primary_ref)) {
      issues.push({
        code: "playbook_visual_missing",
        message: `${pb.id} → missing ${pb.visual_primary_ref}`,
      });
    }
  }

  for (const v of visuals) {
    if (v.pb_ref && !pbIds.has(v.pb_ref)) {
      issues.push({ code: "visual_pb_missing", message: `${v.id} → missing ${v.pb_ref}` });
    }
    for (const id of v.highlight_positions) {
      if (!posIds.has(id)) {
        issues.push({
          code: "visual_pos_missing",
          message: `${v.id} → missing ${id}`,
        });
      }
    }
  }

  // Unique IDs
  const checkUnique = (ids: string[], label: string) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) {
        issues.push({ code: "duplicate_id", message: `Duplicate ${label} id: ${id}` });
      }
      seen.add(id);
    }
  };
  checkUnique(problems.map((p) => p.id), "problem");
  checkUnique(situations.map((s) => s.id), "situation");
  checkUnique(playbooks.map((p) => p.id), "playbook");
  checkUnique(positions.map((p) => p.id), "position");
  checkUnique(tags.map((t) => t.id), "tag");
  checkUnique(visuals.map((v) => v.id), "visual");
  checkUnique(moments.map((m) => m.id), "moment");

  return issues;
}
