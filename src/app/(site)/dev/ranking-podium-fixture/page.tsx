import { notFound } from "next/navigation";
import { RankingPodium } from "@/components/ranking/ranking-podium";

/**
 * Test-only harness for podium visual proof.
 * Not reachable in production builds. No database writes.
 */
export default function RankingPodiumFixturePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const three = [
    {
      player_id: "fixture-1",
      full_name: "Speelster Eén",
      shirt_number: 9,
      positionLabel: "SP",
      valueLabel: "5 goals",
      photo_url: null,
      rank: 1,
    },
    {
      player_id: "fixture-2",
      full_name: "Speelster Twee",
      shirt_number: 10,
      positionLabel: "CAM",
      valueLabel: "3 goals",
      photo_url: null,
      rank: 2,
    },
    {
      player_id: "fixture-3",
      full_name: "Speelster Drie",
      shirt_number: 7,
      positionLabel: "LM",
      valueLabel: "2 goals",
      photo_url: null,
      rank: 3,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
      <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
        TESTFIXTURE — niet productie · geen database · alleen lokale visual review
      </p>
      <section className="space-y-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-zvv-ink">Podium · 3 speelsters</h1>
        <RankingPodium entries={three} />
      </section>
      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">Podium · 2 speelsters</h2>
        <RankingPodium entries={three.slice(0, 2)} />
      </section>
      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-zvv-ink">Podium · 1 speelster</h2>
        <RankingPodium entries={three.slice(0, 1)} />
      </section>
    </div>
  );
}
