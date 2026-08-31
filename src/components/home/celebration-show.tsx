"use client";

import { createPortal } from "react-dom";
import {
  CELEBRATION_Z_INDEX,
  buildCelebrationShow,
  type CelebrationKind,
  type CelebrationPiece,
} from "@/lib/home/celebration-show";

function Burst({ piece, motion }: { piece: CelebrationPiece; motion: boolean }) {
  const sparks = piece.sparks ?? 8;
  return (
    <div
      className={motion ? "zvv-fx-burst" : undefined}
      data-testid="homepage-celebration-burst"
      style={{
        position: "absolute",
        left: `${piece.leftPct}%`,
        top: `${piece.topPct}%`,
        width: piece.width,
        height: piece.height,
        marginLeft: -piece.width / 2,
        marginTop: -piece.height / 2,
        pointerEvents: "none",
        animationDelay: motion ? `${piece.delayMs}ms` : undefined,
        animationDuration: motion ? `${piece.durationMs}ms` : undefined,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: "28%",
          borderRadius: 999,
          background: piece.color,
          opacity: 0.95,
          filter: "blur(5px)",
        }}
      />
      {Array.from({ length: sparks }, (_, i) => (
        <span
          key={`${piece.id}-sp-${i}`}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 6,
            height: 30,
            marginLeft: -3,
            marginTop: -15,
            borderRadius: 999,
            background: piece.color,
            transform: `rotate(${i * (360 / sparks)}deg) translateY(-38px)`,
            opacity: 0.95,
          }}
        />
      ))}
    </div>
  );
}

function Piece({ piece, motion }: { piece: CelebrationPiece; motion: boolean }) {
  if (piece.kind === "burst") return <Burst piece={piece} motion={motion} />;
  const isStreamer = piece.kind === "streamer";
  return (
    <span
      data-testid={isStreamer ? "homepage-celebration-streamer" : "homepage-celebration-piece"}
      className={motion ? (isStreamer ? "zvv-fx-streamer" : "zvv-fx-confetti") : undefined}
      style={{
        position: "absolute",
        left: `${piece.leftPct}%`,
        top: `${piece.topPct}%`,
        width: piece.width,
        height: piece.height,
        background: piece.color,
        borderRadius: isStreamer ? 999 : 3,
        opacity: 1,
        transform: `rotate(${piece.rotate}deg)`,
        pointerEvents: "none",
        animationDelay: motion ? `${piece.delayMs}ms` : undefined,
        animationDuration: motion ? `${piece.durationMs}ms` : undefined,
        ["--rot" as string]: `${piece.rotate}deg`,
        ["--dx" as string]: `${piece.dx}px`,
      }}
    />
  );
}

export function CelebrationShow({
  type,
  seed,
  hold = false,
  reduced = false,
}: {
  type: CelebrationKind;
  seed: string;
  hold?: boolean;
  reduced?: boolean;
}) {
  if (typeof document === "undefined") return null;

  const width = typeof window !== "undefined" ? window.innerWidth : 1440;
  const pieces = buildCelebrationShow({ kind: type, width, seed });
  const motion = !hold && !reduced;

  return createPortal(
    <div
      id="homepage-celebration-root"
      data-testid="homepage-celebration-show"
      data-celebration-engine="show-v2"
      data-celebration-kind={type}
      data-celebration-motion={reduced ? "reduced" : hold ? "hold" : "normal"}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: CELEBRATION_Z_INDEX,
        pointerEvents: "none",
        overflow: "hidden",
        opacity: 1,
      }}
    >
      <div
        data-testid="homepage-celebration-wash"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 16% 22%, rgba(255,216,77,0.42), transparent 38%), radial-gradient(circle at 84% 26%, rgba(255,255,255,0.34), transparent 36%), radial-gradient(circle at 50% 8%, rgba(56,189,248,0.24), transparent 42%)",
        }}
      />
      {pieces.map((piece) => (
        <Piece key={piece.id} piece={piece} motion={motion} />
      ))}
    </div>,
    document.body,
  );
}
