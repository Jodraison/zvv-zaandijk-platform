import {
  attendanceDistributionAriaLabel,
  attendanceSlicesWithCount,
  type AttendanceSliceKey,
  type PlayerAttendanceDistribution,
} from "@/lib/training/training-performance";

/** Gedempte sport-dashboardkleuren, ZVV-blauw als werk/school. */
export const ATTENDANCE_SLICE_COLORS: Record<AttendanceSliceKey, string> = {
  present: "#2F6B4F",
  private: "#5C4D7A",
  sick: "#A86B72",
  injured: "#B57A3C",
  work_school: "#1D4ED8",
  vacation: "#3A7F86",
  no_reason: "#7B8494",
};

function conicFromCounts(slices: { key: AttendanceSliceKey; count: number }[], total: number): string {
  if (!total) return "conic-gradient(#e2e8f0 0deg 360deg)";
  let acc = 0;
  const stops = slices.map((slice) => {
    const start = (acc / total) * 360;
    acc += slice.count;
    const end = (acc / total) * 360;
    return `${ATTENDANCE_SLICE_COLORS[slice.key]} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export function AttendanceDonut({
  name,
  pct,
  present,
  total,
  distribution,
  size = 112,
  centerPrimary,
  centerSecondary,
  ariaLabel,
}: {
  name: string;
  pct: number;
  present: number;
  total: number;
  distribution: PlayerAttendanceDistribution;
  size?: number;
  centerPrimary?: string;
  centerSecondary?: string;
  ariaLabel?: string;
}) {
  const slices = attendanceSlicesWithCount(distribution);
  const aria = ariaLabel ?? attendanceDistributionAriaLabel(name, distribution);
  return (
    <div className="flex min-w-0 items-center gap-3" data-testid="player-attendance-donut">
      <div
        role="img"
        aria-label={aria}
        className="relative shrink-0 rounded-full"
        style={{
          width: size,
          height: size,
          background: conicFromCounts(slices, distribution.total),
        }}
      >
        <div className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full bg-white text-center shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04)]">
          <span className="font-[family-name:var(--font-display)] text-[1.35rem] leading-none tracking-wide text-zvv-primary">
            {centerPrimary ?? `${pct}%`}
          </span>
          <span className="mt-0.5 text-[10px] font-semibold tabular-nums text-zvv-muted">
            {centerSecondary ?? `${present}/${total}`}
          </span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1" data-testid="player-attendance-legend">
        {slices.map((slice) => (
          <li key={slice.key} className="flex items-center justify-between gap-2 text-[12px] leading-tight">
            <span className="flex min-w-0 items-center gap-1.5">
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: ATTENDANCE_SLICE_COLORS[slice.key] }}
              />
              <span className="truncate text-zvv-ink">{slice.label}</span>
            </span>
            <span className="tabular-nums font-semibold text-zvv-ink">{slice.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TeamAbsenceDonut({ counts }: { counts: Record<Exclude<AttendanceSliceKey, "present">, number> }) {
  const dist: PlayerAttendanceDistribution = {
    total: 0,
    present: 0,
    private: counts.private,
    sick: counts.sick,
    injured: counts.injured,
    work_school: counts.work_school,
    vacation: counts.vacation,
    no_reason: counts.no_reason,
  };
  dist.total = dist.private + dist.sick + dist.injured + dist.work_school + dist.vacation + dist.no_reason;
  if (!dist.total) {
    return <p className="text-sm text-zvv-muted">Nog geen afwezigheidsredenen.</p>;
  }
  return (
    <AttendanceDonut
      name="Team"
      pct={0}
      present={0}
      total={dist.total}
      distribution={dist}
      size={120}
      centerPrimary={String(dist.total)}
      centerSecondary="afwezig"
      ariaLabel={`Team: ${attendanceSlicesWithCount(dist)
        .map((slice) => `${slice.count} ${slice.label.toLowerCase()}`)
        .join(", ")}.`}
    />
  );
}
