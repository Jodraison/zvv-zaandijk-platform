import type { CelebrationDomPiece } from "@/lib/home/celebration-dom";

function Burst({ piece }: { piece: CelebrationDomPiece }) {
  const sparks = piece.sparks ?? 8;
  return (
    <div
      className="zvv-dom-burst"
      data-testid="homepage-celebration-burst"
      style={{
        left: `${piece.leftPct}%`,
        top: `${piece.topPct}%`,
        animationDelay: `${piece.delayMs}ms`,
        animationDuration: `${piece.durationMs}ms`,
      }}
    >
      <span className="zvv-dom-burst-core" style={{ background: piece.color }} />
      {Array.from({ length: sparks }, (_, i) => (
        <span
          key={`${piece.id}-sp-${i}`}
          className="zvv-dom-burst-spark"
          style={{
            background: piece.color,
            transform: `rotate(${i * (360 / sparks)}deg) translateY(-46px)`,
          }}
        />
      ))}
    </div>
  );
}

export function CelebrationDomLayer({ pieces }: { pieces: readonly CelebrationDomPiece[] }) {
  return (
    <div className="zvv-dom-confetti-layer" data-testid="homepage-celebration-dom">
      {pieces.map((piece) => {
        if (piece.kind === "burst") return <Burst key={piece.id} piece={piece} />;
        const cls =
          piece.kind === "streamer"
            ? `zvv-dom-streamer zvv-dom-streamer-${piece.variant}`
            : `zvv-dom-confetti zvv-dom-confetti-${piece.variant}`;
        return (
          <span
            key={piece.id}
            className={cls}
            data-testid={piece.kind === "streamer" ? "homepage-celebration-streamer" : "homepage-celebration-piece"}
            style={{
              left: `${piece.leftPct}%`,
              top: `${piece.topPct}%`,
              width: piece.width,
              height: piece.height,
              background: piece.color,
              animationDelay: `${piece.delayMs}ms`,
              animationDuration: `${piece.durationMs}ms`,
              ["--rot" as string]: `${piece.rotate}deg`,
              ["--dx" as string]: `${piece.dx}px`,
            }}
          />
        );
      })}
    </div>
  );
}
