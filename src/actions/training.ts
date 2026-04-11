"use server";

import { randomUUID } from "crypto";
import { trainingSessionSchema, attendanceRowSchema } from "@/lib/validations/forms";
import { mutateDb } from "@/lib/data/mutate";
import { flattenZodIssues, normalizeMutationError, type AdminFormState } from "@/lib/forms/admin-action-state";
import type { TrainingVerificationPayload } from "@/lib/admin/verification-types";
import type { z } from "zod";

function parseTrainingSessionForm(formData: FormData) {
  const raw = {
    season_id: formData.get("season_id"),
    title: formData.get("title") || undefined,
    session_at: formData.get("session_at"),
    location: formData.get("location") || undefined,
  };
  return trainingSessionSchema.safeParse(raw);
}

function verifyTrainingIntegrity(
  db: import("@/types").ClubDatabase,
  sessionId: string,
  seasonId: string,
  expectedStatus: "completed" | "cancelled",
  expectedRows: number,
) {
  const sess = db.training_sessions.find((s) => s.id === sessionId);
  if (!sess) throw new Error("Post-validatie: trainingssessie ontbreekt.");
  if (sess.season_id !== seasonId) throw new Error("Post-validatie: trainingssessie seizoen mismatch.");
  if (sess.status !== expectedStatus) throw new Error("Post-validatie: trainingsstatus mismatch.");
  const rows = db.training_attendance.filter((a) => a.session_id === sessionId);
  if (expectedStatus === "cancelled") {
    if (rows.length !== 0) throw new Error("Post-validatie: afgelaste sessie bevat attendance.");
    return;
  }
  if (rows.length !== expectedRows) throw new Error("Post-validatie: attendance rijtelling mismatch.");
}

async function insertTrainingSessionRow(data: z.infer<typeof trainingSessionSchema>) {
  const kickoff = new Date(data.session_at);
  if (Number.isNaN(kickoff.getTime())) {
    throw new Error("Kies een geldige datum en tijd voor de trainingssessie.");
  }
  const id = randomUUID();
  await mutateDb(
    (db) => {
      db.training_sessions.push({
        id,
        season_id: data.season_id,
        title: data.title ?? null,
        session_at: kickoff.toISOString(),
        location: data.location ?? null,
        status: "completed",
      });
      const members = db.player_season_memberships.filter((m) => m.season_id === data.season_id);
      for (const mem of members) {
        db.training_attendance.push({ session_id: id, player_id: mem.player_id, present: true, note: null });
      }
    },
    { action: "training_session_create", entity: "training_session", entity_id: id },
  );
}

export async function createTrainingSession(formData: FormData): Promise<void> {
  const parsed = parseTrainingSessionForm(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Ongeldige trainingssessie — controleer datum en velden.");
  }
  await insertTrainingSessionRow(parsed.data);
}

export async function saveAttendance(formData: FormData): Promise<void> {
  const rows = JSON.parse(String(formData.get("rows_json") ?? "[]")) as unknown[];
  const cleaned: { session_id: string; player_id: string; present: boolean }[] = [];
  for (const r of rows) {
    if (typeof r !== "object" || !r) continue;
    const p = attendanceRowSchema.safeParse(r);
    if (p.success) cleaned.push(p.data);
  }

  if (!cleaned.length) {
    throw new Error("Geen geldige aanwezigheidsregels om op te slaan.");
  }

  const sid = cleaned[0]?.session_id ?? "bulk";
  await mutateDb(
    (db) => {
      const sid = cleaned[0]?.session_id;
      const sess = sid ? db.training_sessions.find((s) => s.id === sid) : null;
      if (sess && sess.status === "cancelled") {
        throw new Error("Training is afgelast. Aanwezigheid opslaan is uitgeschakeld.");
      }
      for (const r of cleaned) {
        const row = db.training_attendance.find((a) => a.session_id === r.session_id && a.player_id === r.player_id);
        if (row) row.present = r.present;
        else db.training_attendance.push({ ...r, note: null });
      }
    },
    { action: "training_attendance_save", entity: "training_attendance", entity_id: sid },
  );
}

export async function saveAttendanceFromForm(formData: FormData): Promise<void> {
  const session_id = String(formData.get("session_id") ?? "");
  if (!session_id) {
    throw new Error("Geen trainingssessie geselecteerd — kies een sessie en probeer opnieuw.");
  }

  await mutateDb(
    (db) => {
      const sess = db.training_sessions.find((s) => s.id === session_id);
      if (!sess) {
        throw new Error("Trainingssessie niet gevonden — aanwezigheid niet opgeslagen.");
      }
      if (sess.status === "cancelled") {
        throw new Error("Training is afgelast. Aanwezigheid opslaan is uitgeschakeld.");
      }
      const members = db.player_season_memberships.filter((m) => m.season_id === sess.season_id);
      for (const mem of members) {
        const present = formData.get(`present__${mem.player_id}`) === "on";
        const noteRaw = formData.get(`note__${mem.player_id}`);
        const note = noteRaw && String(noteRaw).trim() ? String(noteRaw).trim() : null;
        const row = db.training_attendance.find((a) => a.session_id === session_id && a.player_id === mem.player_id);
        if (row) {
          row.present = present;
          row.note = note;
        } else {
          db.training_attendance.push({ session_id, player_id: mem.player_id, present, note });
        }
      }
    },
    { action: "training_attendance_form", entity: "training_session", entity_id: session_id },
  );
}

export async function setTrainingSessionStatusAction(raw: {
  session_id: string;
  status: "completed" | "cancelled";
}): Promise<AdminFormState> {
  const session_id = String(raw.session_id ?? "").trim();
  const status = raw.status === "cancelled" ? "cancelled" : "completed";
  if (!session_id) return { status: "error", error: "Geen trainingssessie geselecteerd." };
  try {
    await mutateDb(
      (db) => {
        const sess = db.training_sessions.find((s) => s.id === session_id);
        if (!sess) throw new Error("Trainingssessie niet gevonden.");
        sess.status = status;
        if (status === "cancelled") {
          db.training_attendance = db.training_attendance.filter((a) => a.session_id !== session_id);
        }
      },
      { action: "training_session_status", entity: "training_session", entity_id: session_id },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Status opslaan mislukt.";
    return { status: "error", error: normalizeMutationError(msg) };
  }
  return {
    status: "success",
    message:
      status === "cancelled"
        ? "Training gemarkeerd als afgelast; aanwezigheid is verwijderd."
        : "Training gemarkeerd als geweest.",
  };
}

export async function saveTrainingControlCenterAction(raw: {
  season_id: string;
  session_date_iso: string; // YYYY-MM-DD
  session_status: "completed" | "cancelled";
  rows: { player_id: string; present: boolean }[];
}): Promise<
  | {
      ok: true;
      session_id: string;
      message: string;
      verification: TrainingVerificationPayload;
    }
  | { ok: false; error: string }
> {
  const seasonId = String(raw.season_id ?? "").trim();
  const dateIso = String(raw.session_date_iso ?? "").trim();
  const status = raw.session_status === "cancelled" ? "cancelled" : "completed";
  if (!seasonId) return { ok: false, error: "Seizoen ontbreekt." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return { ok: false, error: "Ongeldige sessiedatum." };

  let sessionId = "";
  const verificationRef: {
    value?: {
      session_id: string;
      session_date: string;
      session_status: "completed" | "cancelled";
      expected_attendance_rows: number;
      actual_attendance_rows: number;
      present_count: number;
      absent_count: number;
      present_set_count: number;
      absent_set_count: number;
    };
  } = {};
  let verification: {
    session_id: string;
    session_date: string;
    session_status: "completed" | "cancelled";
    expected_attendance_rows: number;
    actual_attendance_rows: number;
    present_count: number;
    absent_count: number;
    present_set_count: number;
    absent_set_count: number;
  } | null = null;
  let beforeSnapshot: unknown = null;
  let afterSnapshot: unknown = null;
  let auditAction: "create" | "update" = "update";
  try {
    await mutateDb(
      (db) => {
        const members = db.player_season_memberships.filter((m) => m.season_id === seasonId);
        if (!members.length) throw new Error("Geen actieve seizoensselectie gevonden.");
        const memberSet = new Set(members.map((m) => m.player_id));

        const wantedAt = `${dateIso}T19:30:00.000Z`;
        const existing = db.training_sessions.find(
          (s) => s.season_id === seasonId && new Date(s.session_at).toISOString().slice(0, 10) === dateIso,
        );
        if (existing) {
          sessionId = existing.id;
          auditAction = "update";
        } else {
          sessionId = randomUUID();
          auditAction = "create";
          db.training_sessions.push({
            id: sessionId,
            season_id: seasonId,
            title: "Training",
            session_at: wantedAt,
            location: null,
            status: "completed",
          });
        }

        const sess = db.training_sessions.find((s) => s.id === sessionId);
        if (!sess) throw new Error("Trainingssessie kon niet worden aangemaakt.");
        const beforeRows = db.training_attendance.filter((a) => a.session_id === sessionId);
        beforeSnapshot = {
          session_id: sessionId,
          session_status: sess.status,
          attendance: beforeRows.map((r) => ({ player_id: r.player_id, present: r.present })),
        };
        sess.status = status;

        if (status === "cancelled") {
          db.training_attendance = db.training_attendance.filter((a) => a.session_id !== sessionId);
          verifyTrainingIntegrity(db, sessionId, seasonId, "cancelled", 0);
          verification = {
            session_id: sessionId,
            session_date: dateIso,
            session_status: "cancelled",
            expected_attendance_rows: 0,
            actual_attendance_rows: 0,
            present_count: 0,
            absent_count: 0,
            present_set_count: 0,
            absent_set_count: 0,
          };
          verificationRef.value = verification;
          afterSnapshot = { session_id: sessionId, session_status: "cancelled", attendance: [] };
          return;
        }

        const byPlayer = new Map<string, boolean>();
        for (const row of raw.rows ?? []) {
          if (!memberSet.has(row.player_id)) continue;
          byPlayer.set(row.player_id, !!row.present);
        }
        db.training_attendance = db.training_attendance.filter((a) => a.session_id !== sessionId);
        for (const mem of members) {
          db.training_attendance.push({
            session_id: sessionId,
            player_id: mem.player_id,
            present: byPlayer.get(mem.player_id) ?? false,
            note: null,
          });
        }
        verifyTrainingIntegrity(db, sessionId, seasonId, "completed", members.length);
        const rowsNow = db.training_attendance.filter((a) => a.session_id === sessionId);
        const present = rowsNow.filter((r) => r.present).length;
        const beforeMap = new Map((beforeSnapshot as { attendance?: { player_id: string; present: boolean }[] } | null)?.attendance?.map((r) => [r.player_id, r.present]) ?? []);
        let presentSet = 0;
        let absentSet = 0;
        for (const r of rowsNow) {
          const prev = beforeMap.get(r.player_id);
          if (prev === undefined) {
            if (r.present) presentSet += 1;
            else absentSet += 1;
          } else if (prev !== r.present) {
            if (r.present) presentSet += 1;
            else absentSet += 1;
          }
        }
        verification = {
          session_id: sessionId,
          session_date: dateIso,
          session_status: "completed",
          expected_attendance_rows: members.length,
          actual_attendance_rows: rowsNow.length,
          present_count: present,
          absent_count: rowsNow.length - present,
          present_set_count: presentSet,
          absent_set_count: absentSet,
        };
        verificationRef.value = verification;
        afterSnapshot = {
          session_id: sessionId,
          session_status: "completed",
          attendance: rowsNow.map((r) => ({ player_id: r.player_id, present: r.present })),
        };
      },
      {
        action: () => auditAction,
        entity: "training",
        entity_id: () => sessionId || null,
        before_snapshot: () => beforeSnapshot,
        after_snapshot: () => afterSnapshot,
        verification: () => verificationRef.value ?? null,
      },
    );
  } catch (e) {
    return { ok: false, error: normalizeMutationError(e instanceof Error ? e.message : "Opslaan mislukt.") };
  }
  const verifiedBase = verificationRef.value;
  if (!verifiedBase) return { ok: false, error: "Geen verificatieresultaat ontvangen." };
  return {
    ok: true,
    session_id: sessionId,
    message: "Training opgeslagen en geverifieerd",
    verification: {
      session_id: verifiedBase.session_id,
      session_date: verifiedBase.session_date,
      session_status: verifiedBase.session_status,
      expected_attendance_rows: verifiedBase.expected_attendance_rows,
      actual_attendance_rows: verifiedBase.actual_attendance_rows,
      present_count: verifiedBase.present_count,
      absent_count: verifiedBase.absent_count,
      present_set_count: verifiedBase.present_set_count,
      absent_set_count: verifiedBase.absent_set_count,
      verified: true,
      verified_at: new Date().toISOString(),
    },
  };
}

export async function createTrainingSessionFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const parsed = parseTrainingSessionForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Controleer titel en datum/tijd.",
      fieldErrors: flattenZodIssues(parsed.error),
    };
  }
  try {
    await insertTrainingSessionRow(parsed.data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Trainingssessie kon niet worden aangemaakt.";
    return {
      status: "error",
      error: normalizeMutationError(msg),
      fieldErrors: /datum en tijd/i.test(msg) ? { session_at: [msg] } : undefined,
    };
  }
  return {
    status: "success",
    message: "Trainingssessie aangemaakt. Iedereen staat standaard op aanwezig — pas hieronder aan en sla op.",
  };
}

export async function saveTrainingAttendanceFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    await saveAttendanceFromForm(formData);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Aanwezigheid kon niet worden opgeslagen.";
    return { status: "error", error: normalizeMutationError(msg) };
  }
  return { status: "success", message: "Aanwezigheid opgeslagen." };
}
