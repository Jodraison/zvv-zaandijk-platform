"use client";

import { usePathname } from "next/navigation";
import { shouldShowAcademyBottomTabBar } from "@/lib/academy/resolve-active-academy-tab";
import { cn } from "@/lib/utils";

/**
 * Main content wrapper — reserves space for fixed BottomTabBar on mobile
 * when the shell rule shows the bar (T-01-03).
 */
export function AcademyShellMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const showTabs = shouldShowAcademyBottomTabBar(pathname);

  return (
    <div
      className={cn(
        "flex-1",
        showTabs && "pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-0",
      )}
    >
      {children}
    </div>
  );
}
