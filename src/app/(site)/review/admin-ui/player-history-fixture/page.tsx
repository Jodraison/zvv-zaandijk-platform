import { AdminPlayerAttendanceExplain } from "@/components/admin/admin-player-attendance-explain";
import { emptyAbsenceCounts } from "@/lib/training/absence-reason";
import type { AdminPlayerAttendanceDetail } from "@/lib/training/training-performance";

/** Alleen ADMIN_UI_PREVIEW — toont schaalgedrag bij >6 sessies. Geen productiedata. */
export default function PlayerHistoryFixturePage() {
  const sessions = [
    { session_id: "a", dateKey: "2026-07-06", attended: true, absenceReason: null },
    { session_id: "b", dateKey: "2026-07-08", attended: false, absenceReason: "vacation" as const },
    { session_id: "c", dateKey: "2026-07-13", attended: true, absenceReason: null },
    { session_id: "d", dateKey: "2026-07-15", attended: false, absenceReason: "sick" as const },
    { session_id: "e", dateKey: "2026-07-20", attended: true, absenceReason: null },
    { session_id: "f", dateKey: "2026-07-22", attended: true, absenceReason: null },
    { session_id: "g", dateKey: "2026-07-27", attended: false, absenceReason: "work_school" as const },
    { session_id: "h", dateKey: "2026-07-29", attended: true, absenceReason: null },
  ];
  const reasons = emptyAbsenceCounts();
  reasons.vacation = 1;
  reasons.sick = 1;
  reasons.work_school = 1;
  const row: AdminPlayerAttendanceDetail = {
    player_id: "fixture-dionne",
    name: "Historie-demo",
    shirt_number: 10,
    photo_url: null,
    present: 5,
    absent: 3,
    total: 8,
    pct: 62.5,
    tier: "mixed",
    reasons,
    withoutReasonCount: 0,
    sessions,
  };
  return (
    <div className="p-4">
      <p className="mb-3 text-xs text-zvv-muted">Review-fixture · geen productiedata · 8 geregistreerde trainingen</p>
      <AdminPlayerAttendanceExplain rows={[row]} withoutReasonCount={0} />
    </div>
  );
}
