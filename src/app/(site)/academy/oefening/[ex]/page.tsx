import { AcademyRouteStub } from "@/components/academy/academy-route-stub";
import { requireAcademyExerciseParam } from "@/lib/academy/route-params";

/** T-02-02 — `/oefening/:ex` (S-46). Content follow-up = WP05. */
export default async function AcademyOefeningPage({
  params,
}: {
  params: Promise<{ ex: string }>;
}) {
  const { ex: raw } = await params;
  const ex = requireAcademyExerciseParam(raw);

  return (
    <AcademyRouteStub
      title="Oefening"
      description={`Oefening ${ex} volgt later (WP05). Deep-link entry is actief.`}
    />
  );
}
