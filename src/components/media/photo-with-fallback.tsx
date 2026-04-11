"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const s = url.trim();
  if (!s) return false;
  if (s.startsWith("file:")) return false;
  if (s.startsWith("blob:")) return false;
  if (s.startsWith("data:")) return false;
  if (s.startsWith("/")) return true;
  if (s.startsWith("http://") || s.startsWith("https://")) return true;
  return false;
}

/** `next/image` + `remotePatterns`: alleen pad of Supabase-host; anders `<img>`. */
export function isNextImageRemoteSrc(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    const u = new URL(url);
    return u.hostname.endsWith(".supabase.co") && (u.protocol === "https:" || u.protocol === "http:");
  } catch {
    return false;
  }
}

type Attempt = "primary" | "secondary" | "fallback";

function initialAttempt(url: string | null, secondaryUrl: string | null): Attempt {
  if (url) return "primary";
  if (secondaryUrl) return "secondary";
  return "fallback";
}

function SafeRemoteImage({
  src,
  alt,
  className,
  sizes,
  priority,
  onError,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  onError: () => void;
}) {
  const nextOk = isNextImageRemoteSrc(src);
  if (nextOk) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={cn("z-0", className)}
        sizes={sizes ?? "(max-width: 640px) 100vw, 400px"}
        priority={priority}
        onError={onError}
        unoptimized={src.includes("?") || src.startsWith("/")}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- allowed hosts outside next/image remotePatterns
    <img
      src={src}
      alt={alt}
      className={cn("absolute inset-0 z-0 h-full w-full object-cover", className)}
      onError={onError}
    />
  );
}

/**
 * Full-bleed image in a `relative` + sized parent: tries `url`, then optional `secondaryUrl` (e.g. `/team.jpg`),
 * then renders `fallback` (initials, placeholder UI, etc.).
 */
export function PhotoOrFallback({
  url,
  secondaryUrl,
  alt,
  className,
  sizes,
  priority,
  fallback,
}: {
  url: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  secondaryUrl?: string | null;
  fallback: ReactNode;
}) {
  const primaryRaw = url?.trim() || null;
  const secondaryRaw = secondaryUrl?.trim() || null;
  const primary = primaryRaw && isValidImageUrl(primaryRaw) ? primaryRaw : null;
  const secondary = secondaryRaw && isValidImageUrl(secondaryRaw) ? secondaryRaw : null;

  const [attempt, setAttempt] = useState<Attempt>(() => initialAttempt(primary, secondary));

  useEffect(() => {
    setAttempt(initialAttempt(primary, secondary));
  }, [primary, secondary]);

  const onPrimaryError = useCallback(() => {
    setAttempt(secondary ? "secondary" : "fallback");
  }, [secondary]);

  const onSecondaryError = useCallback(() => {
    setAttempt("fallback");
  }, []);

  if (attempt === "primary" && primary) {
    return (
      <SafeRemoteImage
        src={primary}
        alt={alt}
        className={className}
        sizes={sizes}
        priority={priority}
        onError={onPrimaryError}
      />
    );
  }

  if (attempt === "secondary" && secondary) {
    return (
      <SafeRemoteImage
        src={secondary}
        alt={alt}
        className={className}
        sizes={sizes}
        priority={priority}
        onError={onSecondaryError}
      />
    );
  }

  return <div className="absolute inset-0 flex items-center justify-center bg-zvv-card-mid">{fallback}</div>;
}
