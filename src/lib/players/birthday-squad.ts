import type { ClubDatabase, PlayerPosition } from "@/types";
import { activeSeasonMembers } from "@/lib/players/season-squad";
import type { BirthdayPerson } from "@/lib/players/birthdays";
import { membershipPositionShort } from "@/lib/membership-position-label";

/** Publieke positie voor verjaardagsspotlight — seizoenscode (LB/SP), Keeper i.p.v. kale GK. */
export function birthdayPublicPositionLabel(
  displayPosition: string | null | undefined,
  enumPosition: PlayerPosition,
): string {
  const t = displayPosition?.trim();
  if (!t) return membershipPositionShort(enumPosition);
  if (t.toUpperCase() === "GK") return "Keeper";
  return t;
}

/** Selectiespelers → birthday helpers met seizoenspositie. */
export function mapSquadToBirthdayPeople(db: ClubDatabase, seasonId: string): BirthdayPerson[] {
  return activeSeasonMembers(db, seasonId).map(({ player, membership }) => ({
    id: player.id,
    full_name: player.full_name,
    birth_date: player.birth_date ?? null,
    photo_url: player.photo_url,
    shirt_number: membership.shirt_number,
    position_label: birthdayPublicPositionLabel(
      membership.display_position,
      membership.position as PlayerPosition,
    ),
    is_captain: membership.is_captain,
    is_vice_captain: membership.is_vice_captain,
  }));
}
