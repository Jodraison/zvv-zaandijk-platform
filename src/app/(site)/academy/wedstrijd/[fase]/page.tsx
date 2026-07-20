import { AcademyRouteStub } from "@/components/academy/academy-route-stub";
import { requireAcademyWedstrijdFaseParam } from "@/lib/academy/route-params";

/** T-02-02 — `/wedstrijd/:fase` (S-51–53). Engine = WP08. */
export default async function AcademyWedstrijdFasePage({
  params,
}: {
  params: Promise<{ fase: string }>;
}) {
  const { fase: raw } = await params;
  const fase = requireAcademyWedstrijdFaseParam(raw);

  return (
    <AcademyRouteStub
      title={`Wedstrijd · ${fase}`}
      description="Wedstrijdfase-stack volgt later (WP08). Deep-link entry is actief."
    />
  );
}
