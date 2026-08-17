import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/shell/admin-ui";
import { FITNESS_COMPONENTS } from "@/lib/fitness/protocol";
import { FitnessStationEntry } from "@/components/admin/fitness/fitness-station-entry";

/** Preview: station workflow with ~21 speelsters (ADMIN_UI_PREVIEW). No DB writes. */
export default function FitnessStationPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ station?: string }>;
}) {
  return <StationPreview searchParams={searchParams} />;
}

async function StationPreview({ searchParams }: { searchParams: Promise<{ station?: string }> }) {
  const sp = await searchParams;
  const station = (sp.station ?? "sprint") as "sprint" | "agility" | "plank" | "run";
  const meta = FITNESS_COMPONENTS.find((c) => c.tabId === station) ?? FITNESS_COMPONENTS[0]!;

  const firstNames = [
    "Renée", "Jelisa", "Mandy", "Lisa", "Sanne", "Eva", "Noa", "Fleur", "Iris", "Lotte",
    "Emma", "Sofie", "Nina", "Anna", "Sara", "Tess", "Lynn", "Bo", "Kim", "Vera", "Roos",
  ];
  const players = firstNames.map((name, i) => ({
    player_id: `p${i + 1}`,
    name: `${name} Koopman`.replace("Jelisa Koopman", "Jelisa de Jonge").replace("Mandy Koopman", "Mandy Kalmeijer"),
    shirt_number: i + 1,
  }));

  const initialRows = players.map((p, i) => ({
    player_id: p.player_id,
    flying_sprint_30m_seconds: i < 3 ? 4.5 + i * 0.2 : null,
    agility_10_20_10_seconds: i < 2 ? 16.5 + i * 0.4 : null,
    plank_seconds: i === 0 ? 105 : null,
    six_minute_run_meters: i === 0 ? 1345 : null,
    participation_status: (i < 1 ? "partial" : "pending") as "partial" | "pending",
    participation_reason: null,
    note: null,
  }));

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Station (preview)"
        description="Snelle invoer per station — 21 speelsters. Preview zonder database-opslag."
        actions={
          <div className="flex flex-wrap gap-2">
            {FITNESS_COMPONENTS.map((c) => (
              <Link
                key={c.tabId}
                href={`/review/admin-ui/fitheid-invoer?station=${c.tabId}`}
                className="club-btn-secondary club-btn-primary-sm"
              >
                {c.shortLabel}
              </Link>
            ))}
          </div>
        }
      />
      <FitnessStationEntry
        sessionId="preview-session"
        seasonId="preview-season"
        testOn="2026-08-30"
        status="draft"
        stationTab={meta.tabId}
        players={players}
        initialRows={initialRows}
      />
    </div>
  );
}
