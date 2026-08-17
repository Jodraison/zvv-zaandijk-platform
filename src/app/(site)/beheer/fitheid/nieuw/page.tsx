import Link from "next/link";
import { readResolvedSeasonId } from "@/actions/season";
import { readDb } from "@/lib/data/repository";
import { AdminPageHeader } from "@/components/admin/shell/admin-ui";
import { FitnessNewSessionForm } from "@/components/admin/fitness/fitness-new-session-form";
import { getSeasonOperations } from "@/lib/season/season-operations-2026-27";

type Props = { searchParams: Promise<{ season?: string; station?: string }> };

export default async function BeheerFitheidNieuwPage({ searchParams }: Props) {
  const sp = await searchParams;
  const db = await readDb();
  const seasonId = await readResolvedSeasonId(db, sp.season);
  const ops = getSeasonOperations(seasonId);
  const defaultDate = ops?.fitness.firstTestOn ?? new Date().toISOString().slice(0, 10);
  const q = `?season=${encodeURIComponent(seasonId)}`;
  const startStation = ["sprint", "agility", "plank", "run"].includes(sp.station ?? "")
    ? (sp.station as "sprint" | "agility" | "plank" | "run")
    : "sprint";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Nieuw testmoment"
        description={
          ops
            ? `Standaarddatum: ${ops.fitness.firstTestOn}. Je kunt de testdatum later altijd wijzigen.`
            : "Kies de datum. Daarna: Sprint → Agility → Plank → Zes minuten → Controle → Publiceren."
        }
        actions={
          <Link href={`/beheer/fitheid${q}`} className="club-btn-secondary club-btn-primary-sm">
            Terug
          </Link>
        }
      />
      <FitnessNewSessionForm seasonId={seasonId} defaultDate={defaultDate} startStation={startStation} />
    </div>
  );
}
