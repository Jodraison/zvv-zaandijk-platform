"use client";

import { PhotoOrFallback, isValidImageUrl } from "@/components/media/photo-with-fallback";
import { cn } from "@/lib/utils";

export function playerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

/**
 * Ronde speelsterfoto via bestaande `players.photo_url`.
 * Identity: altijd `playerId` → record → url. Geen lineup-foto-opslag.
 */
export function PlayerPhotoAvatar({
  playerId,
  name,
  photoUrl,
  shirtNumber,
  className,
  sizes = "64px",
  fallbackTone = "list",
}: {
  playerId: string;
  name: string;
  photoUrl?: string | null;
  shirtNumber?: number | null;
  className?: string;
  sizes?: string;
  fallbackTone?: "list" | "field";
}) {
  const initials = playerInitials(name);
  const fallbackLabel = shirtNumber != null ? `#${shirtNumber}` : initials;
  const hasPhoto = isValidImageUrl(photoUrl);
  const fallbackClass =
    fallbackTone === "field"
      ? "bg-zvv-primary text-white"
      : "bg-zvv-card-mid text-zvv-ink";

  return (
    <span
      data-testid="player-photo-avatar"
      data-player-id={playerId}
      data-has-photo={hasPhoto ? "true" : "false"}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        className ?? "h-10 w-10",
      )}
    >
      {hasPhoto ? (
        <PhotoOrFallback
          key={`${playerId}:${photoUrl}`}
          url={photoUrl}
          alt={name}
          className="object-cover object-[center_20%]"
          sizes={sizes}
          fallback={
            <span className="text-[11px] font-bold leading-none text-zvv-ink/70">{fallbackLabel}</span>
          }
        />
      ) : (
        <span
          className={cn(
            "flex h-full w-full items-center justify-center text-[11px] font-bold leading-none",
            fallbackClass,
          )}
        >
          {fallbackLabel}
        </span>
      )}
    </span>
  );
}
