"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { CelebrationKind } from "@/lib/home/celebration-visual";
import {
  HARD_FALLBACK_ROOT_STYLE,
  hardFallbackDurationMs,
  runHardFallback,
  type HardFallbackHandle,
} from "@/lib/home/celebration-hard-fallback";

export function CelebrationHardFallback({
  type,
  hold = false,
  onDone,
}: {
  type: CelebrationKind;
  hold?: boolean;
  onDone?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const handle: HardFallbackHandle = runHardFallback(root, { kind: type, hold });
    const doneId = hold ? 0 : window.setTimeout(() => onDoneRef.current?.(), hardFallbackDurationMs(type));
    return () => {
      if (doneId) window.clearTimeout(doneId);
      handle.stop();
    };
  }, [type, hold]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={rootRef}
      data-testid="celebration-hard-fallback"
      data-celebration-engine="hard-fallback"
      data-celebration-type={type}
      aria-hidden="true"
      style={HARD_FALLBACK_ROOT_STYLE}
    />,
    document.body,
  );
}
