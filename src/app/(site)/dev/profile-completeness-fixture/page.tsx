import { notFound } from "next/navigation";
import { evaluateProfileCompleteness } from "@/lib/players/profile-completeness";
import type { Player, PlayerSeasonMembership } from "@/types";

/**
 * Test-only harness for profile completeness labels.
 * Not reachable in production. No database writes.
 */
export default function ProfileCompletenessFixturePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const samples: Array<{ title: string; player: Player; mem: PlayerSeasonMembership | null }> = [
    {
      title: "Alleen foto ontbreekt (aanbevolen)",
      player: {
        id: "a",
        full_name: "Voorbeeld Speelster",
        photo_url: null,
        is_guest: false,
        role_label: null,
        tagline: null,
      },
      mem: {
        id: "m1",
        player_id: "a",
        season_id: "s",
        shirt_number: 3,
        position: "DEF",
        display_position: "CB",
        is_captain: false,
        is_vice_captain: false,
        is_guest: false,
      },
    },
    {
      title: "Positie ontbreekt (verplicht)",
      player: {
        id: "b",
        full_name: "Zonder Positie",
        photo_url: "https://example.com/x.jpg",
        is_guest: false,
      },
      mem: {
        id: "m2",
        player_id: "b",
        season_id: "s",
        shirt_number: 8,
        position: "" as never,
        display_position: "",
        is_captain: false,
        is_vice_captain: false,
        is_guest: false,
      },
    },
    {
      title: "Interne optionele velden leeg → geen alarm",
      player: {
        id: "c",
        full_name: "Compleet Publiek",
        photo_url: "https://example.com/y.jpg",
        is_guest: false,
        role_label: null,
        tagline: null,
        bio: null,
      },
      mem: {
        id: "m3",
        player_id: "c",
        season_id: "s",
        shirt_number: 10,
        position: "MID",
        display_position: "CAM",
        is_captain: false,
        is_vice_captain: false,
        is_guest: false,
      },
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
        TESTFIXTURE — profielcompleetheid · niet productie · geen database
      </p>
      <ul className="space-y-4">
        {samples.map((s) => {
          const c = evaluateProfileCompleteness(s.player, s.mem);
          return (
            <li key={s.title} className="rounded-2xl border border-zvv-border bg-white p-4">
              <p className="font-semibold text-zvv-ink">{s.title}</p>
              <p className="mt-1 text-sm text-zvv-muted">{s.player.full_name}</p>
              <p className="mt-3 text-sm">
                isIncomplete: <strong>{String(c.isIncomplete)}</strong>
              </p>
              <p className="mt-1 text-sm">
                label: <strong>{c.summaryLabel ?? "—"}</strong>
              </p>
              <p className="mt-2 text-xs text-zvv-muted">
                verplicht: {c.requiredMissing.map((i) => i.label).join(", ") || "geen"} · aanbevolen:{" "}
                {c.recommendedMissing.map((i) => i.label).join(", ") || "geen"}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
