"use client";

import { cn } from "@/lib/utils";

/** Dedicated Academy application frame — club nav stays outside. */
export function AcademyAppShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "academy-app mx-auto w-full max-w-[min(96vw,1580px)] px-1 sm:px-2 md:px-3",
        className,
      )}
      data-testid="academy-app-shell"
    >
      {children}
    </div>
  );
}
