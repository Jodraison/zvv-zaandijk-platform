import { AcademyRouteStub } from "@/components/academy/academy-route-stub";
import { requireAcademyMatchParam } from "@/lib/academy/route-params";

/** T-02-02 — `/reflectie/:match` (S-54). Engine = WP08/WP09. */
export default async function AcademyReflectiePage({
  params,
}: {
  params: Promise<{ match: string }>;
}) {
  const { match: raw } = await params;
  const matchId = requireAcademyMatchParam(raw);

  return (
    <AcademyRouteStub
      title="Reflectie"
      description={`Reflectie voor match “${matchId}” volgt later. Deep-link entry is actief.`}
    />
  );
}
