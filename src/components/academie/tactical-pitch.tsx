/**
 * Tactical Visual System V2 — Premium Analysis renderer.
 * SVG presentation layer only — no animation logic changes.
 */
import {
  TACTICAL_COLORS,
  TACTICAL_PLAYER_STYLES,
  TACTICAL_STROKES,
  TACTICAL_TYPOGRAPHY,
  TACTICAL_VIEWBOX,
  fieldPointToSvg,
  resolveZoneTone,
  type TacticalLine,
  type TacticalLineKind,
  type TacticalPlayerMarker,
  type TacticalPoint,
  type TacticalZone,
} from "@/lib/academie/tactical-visual-system";
import { academyDisplayRole } from "@/lib/academie/tactical-film-standard-v1";
import { type BodyShape, shoulderTiltForBody } from "@/lib/academie/tactical-orientation";
import { cn } from "@/lib/utils";

const LINE_COLOR: Record<TacticalLineKind, string> = {
  run: TACTICAL_COLORS.runLine,
  pass: TACTICAL_COLORS.passLine,
  press: TACTICAL_COLORS.pressLine,
  fault: TACTICAL_COLORS.faultLine,
};

const LINE_WIDTH: Record<TacticalLineKind, number> = {
  run: TACTICAL_STROKES.run,
  pass: TACTICAL_STROKES.pass,
  press: TACTICAL_STROKES.press,
  fault: TACTICAL_STROKES.fault,
};

function markerIds(uid: string) {
  return {
    run: `tac-arrow-run-${uid}`,
    pass: `tac-arrow-pass-${uid}`,
    press: `tac-arrow-press-${uid}`,
    fault: `tac-arrow-fault-${uid}`,
  };
}

function isDashed(line: TacticalLine): boolean {
  if (typeof line.dashed === "boolean") return line.dashed;
  return line.kind === "run" || line.kind === "press";
}

/** Soft quadratic curve for coaching annotations. */
function curvedPath(a: { cx: number; cy: number }, b: { cx: number; cy: number }, kind: TacticalLineKind): string {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const len = Math.hypot(dx, dy) || 1;
  const bend = kind === "press" ? 0.22 : kind === "run" ? 0.14 : 0.06;
  const ox = (-dy / len) * len * bend;
  const oy = (dx / len) * len * bend;
  const mx = (a.cx + b.cx) / 2 + ox;
  const my = (a.cy + b.cy) / 2 + oy;
  return `M ${a.cx} ${a.cy} Q ${mx} ${my} ${b.cx} ${b.cy}`;
}

function zonePalette(tone: ReturnType<typeof resolveZoneTone>, lit: boolean) {
  if (lit) {
    return { fill: TACTICAL_COLORS.zoneHighlight, stroke: TACTICAL_COLORS.zoneHighlightStroke };
  }
  switch (tone) {
    case "space":
      return { fill: TACTICAL_COLORS.zoneSpace, stroke: TACTICAL_COLORS.zoneSpaceStroke };
    case "risk":
      return { fill: TACTICAL_COLORS.zoneRisk, stroke: TACTICAL_COLORS.zoneRiskStroke };
    case "press":
      return { fill: TACTICAL_COLORS.zonePress, stroke: TACTICAL_COLORS.zonePressStroke };
    case "compact":
      return { fill: TACTICAL_COLORS.zoneCompact, stroke: TACTICAL_COLORS.zoneCompactStroke };
    default:
      return { fill: TACTICAL_COLORS.zone, stroke: TACTICAL_COLORS.zoneStroke };
  }
}

/** Premium analysis pitch — deep grass, soft lines, vignette. */
export function TacticalPitchBase({ uid = "main" }: { uid?: string }) {
  const { field } = TACTICAL_VIEWBOX;
  const ids = markerIds(uid);
  const midX = field.x + field.w / 2;
  const midY = field.y + field.h / 2;
  const boxW = field.w * 0.16;
  const boxH = field.h * 0.52;
  const sixW = field.w * 0.07;
  const sixH = field.h * 0.28;
  const arcR = field.h * 0.14;
  const penSpot = field.w * 0.11;

  return (
    <>
      <defs>
        <linearGradient id={`tac-grass-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={TACTICAL_COLORS.pitchDeep} />
          <stop offset="45%" stopColor={TACTICAL_COLORS.pitch} />
          <stop offset="100%" stopColor={TACTICAL_COLORS.pitchLight} />
        </linearGradient>
        <pattern id={`tac-mow-${uid}`} width="42" height={field.h} patternUnits="userSpaceOnUse">
          <rect width="21" height={field.h} fill={TACTICAL_COLORS.pitchStripe} />
        </pattern>
        <radialGradient id={`tac-vignette-${uid}`} cx="50%" cy="50%" r="68%">
          <stop offset="55%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor={TACTICAL_COLORS.pitchVignette} />
        </radialGradient>
        <filter id={`tac-soft-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
        {(Object.keys(LINE_COLOR) as TacticalLineKind[]).map((kind) => (
          <marker
            key={kind}
            id={ids[kind]}
            markerWidth={TACTICAL_STROKES.arrow}
            markerHeight={TACTICAL_STROKES.arrow}
            refX="6.5"
            refY="3.5"
            orient="auto"
          >
            <path d="M0,0.4 L7,3.5 L0,6.6 Z" fill={LINE_COLOR[kind]} opacity="0.9" />
          </marker>
        ))}
      </defs>

      {/* Outer frame */}
      <rect
        x={field.x - 3}
        y={field.y - 3}
        width={field.w + 6}
        height={field.h + 6}
        rx="10"
        fill={TACTICAL_COLORS.panelInset}
      />

      <rect
        x={field.x}
        y={field.y}
        width={field.w}
        height={field.h}
        rx="8"
        fill={`url(#tac-grass-${uid})`}
      />
      <rect
        x={field.x}
        y={field.y}
        width={field.w}
        height={field.h}
        rx="8"
        fill={`url(#tac-mow-${uid})`}
      />
      <rect
        x={field.x}
        y={field.y}
        width={field.w}
        height={field.h}
        rx="8"
        fill={`url(#tac-vignette-${uid})`}
      />

      <g stroke={TACTICAL_COLORS.pitchLine} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect
          x={field.x}
          y={field.y}
          width={field.w}
          height={field.h}
          rx="8"
          strokeWidth={TACTICAL_STROKES.pitchOuter}
          opacity="0.9"
        />
        <line
          x1={midX}
          y1={field.y}
          x2={midX}
          y2={field.y + field.h}
          strokeWidth={TACTICAL_STROKES.pitchInner}
          stroke={TACTICAL_COLORS.pitchLineSoft}
        />
        <circle
          cx={midX}
          cy={midY}
          r={field.h * 0.118}
          strokeWidth={TACTICAL_STROKES.pitchInner}
          stroke={TACTICAL_COLORS.pitchLineSoft}
        />
        <circle cx={midX} cy={midY} r="2.8" fill={TACTICAL_COLORS.pitchLineSoft} stroke="none" />

        {/* Penalty areas */}
        <rect
          x={field.x}
          y={midY - boxH / 2}
          width={boxW}
          height={boxH}
          strokeWidth={TACTICAL_STROKES.pitchInner}
          stroke={TACTICAL_COLORS.pitchLineSoft}
        />
        <rect
          x={field.x}
          y={midY - sixH / 2}
          width={sixW}
          height={sixH}
          strokeWidth={TACTICAL_STROKES.pitchSoft}
          stroke={TACTICAL_COLORS.pitchLineSoft}
        />
        <rect
          x={field.x + field.w - boxW}
          y={midY - boxH / 2}
          width={boxW}
          height={boxH}
          strokeWidth={TACTICAL_STROKES.pitchInner}
          stroke={TACTICAL_COLORS.pitchLineSoft}
        />
        <rect
          x={field.x + field.w - sixW}
          y={midY - sixH / 2}
          width={sixW}
          height={sixH}
          strokeWidth={TACTICAL_STROKES.pitchSoft}
          stroke={TACTICAL_COLORS.pitchLineSoft}
        />

        {/* Penalty arcs (visual only) */}
        <path
          d={`M ${field.x + boxW} ${midY - arcR * 0.55} A ${arcR} ${arcR} 0 0 1 ${field.x + boxW} ${midY + arcR * 0.55}`}
          strokeWidth={TACTICAL_STROKES.pitchSoft}
          stroke={TACTICAL_COLORS.pitchLineSoft}
        />
        <path
          d={`M ${field.x + field.w - boxW} ${midY - arcR * 0.55} A ${arcR} ${arcR} 0 0 0 ${field.x + field.w - boxW} ${midY + arcR * 0.55}`}
          strokeWidth={TACTICAL_STROKES.pitchSoft}
          stroke={TACTICAL_COLORS.pitchLineSoft}
        />

        {/* Penalty spots */}
        <circle cx={field.x + penSpot} cy={midY} r="2.2" fill={TACTICAL_COLORS.pitchLineSoft} stroke="none" />
        <circle
          cx={field.x + field.w - penSpot}
          cy={midY}
          r="2.2"
          fill={TACTICAL_COLORS.pitchLineSoft}
          stroke="none"
        />

        {/* Goal mouths */}
        <rect
          x={field.x - 7}
          y={midY - field.h * 0.09}
          width="7"
          height={field.h * 0.18}
          strokeWidth={TACTICAL_STROKES.pitchSoft}
          stroke={TACTICAL_COLORS.pitchLine}
          fill="rgba(255,255,255,0.03)"
        />
        <rect
          x={field.x + field.w}
          y={midY - field.h * 0.09}
          width="7"
          height={field.h * 0.18}
          strokeWidth={TACTICAL_STROKES.pitchSoft}
          stroke={TACTICAL_COLORS.pitchLine}
          fill="rgba(255,255,255,0.03)"
        />

        {/* Corners */}
        {[
          [field.x, field.y],
          [field.x + field.w, field.y],
          [field.x, field.y + field.h],
          [field.x + field.w, field.y + field.h],
        ].map(([cx, cy], i) => (
          <path
            key={`corner-${i}`}
            d={
              i === 0
                ? `M ${cx + 10} ${cy} A 10 10 0 0 1 ${cx} ${cy + 10}`
                : i === 1
                  ? `M ${cx - 10} ${cy} A 10 10 0 0 0 ${cx} ${cy + 10}`
                  : i === 2
                    ? `M ${cx + 10} ${cy} A 10 10 0 0 0 ${cx} ${cy - 10}`
                    : `M ${cx - 10} ${cy} A 10 10 0 0 1 ${cx} ${cy - 10}`
            }
            strokeWidth={TACTICAL_STROKES.pitchSoft}
            stroke={TACTICAL_COLORS.pitchLineSoft}
          />
        ))}
      </g>

      <g opacity="0.55">
        <text
          x={field.x + field.w - 16}
          y={field.y + 20}
          textAnchor="end"
          fill="rgba(226,232,240,0.55)"
          fontSize="10"
          fontFamily={TACTICAL_TYPOGRAPHY.zoneLabel.family}
          fontWeight="600"
          letterSpacing="0.12em"
        >
          AANVAL →
        </text>
      </g>
    </>
  );
}

export function TacticalZoneLayer({
  zones = [],
  highlightedIndexes,
  /** When true (author/debug), show all zones including structural labels. */
  showStructuralZones = false,
}: {
  zones?: TacticalZone[];
  highlightedIndexes?: number[];
  showStructuralZones?: boolean;
}) {
  const { field } = TACTICAL_VIEWBOX;
  const hi = new Set(highlightedIndexes ?? []);
  /** Misleidende “blok bewijst verbonden”-vlakken — niet in normale UI. */
  const MISLEADING =
    /verbonden|rest\s*2\+1|rest\s*3\+1|opp\s*blok|teamblok|compact blok|verbonden blok/i;

  return (
    <g data-tactical-zones>
      {zones.map((zone, index) => {
        if (!showStructuralZones && zone.label && MISLEADING.test(zone.label)) {
          return null;
        }
        if (
          !showStructuralZones &&
          zone.w >= 28 &&
          zone.h >= 28 &&
          (!zone.label || /blok|verbonden|rest/i.test(zone.label))
        ) {
          return null;
        }
        const lit = hi.has(index);
        const tone = resolveZoneTone(zone.label, zone.kind);
        const pal = zonePalette(tone, lit);
        const soft =
          zone.kind === "cover-shadow" ||
          zone.kind === "pocket" ||
          zone.kind === "scan" ||
          Boolean(zone.geometry);

        // Football-shaped cues — never axis-aligned rounded rect for soft kinds.
        if (zone.geometry || soft) {
          const geo = zone.geometry ?? (
            zone.kind === "cover-shadow"
              ? ({
                  type: "taper-shadow" as const,
                  apex: { x: zone.x + zone.w * 0.15, y: zone.y + zone.h * 0.5 },
                  dirDeg: 0,
                  nearWidth: Math.max(2, zone.h * 0.25),
                  farWidth: Math.max(4, zone.h * 0.85),
                  length: zone.w,
                })
              : zone.kind === "scan"
                ? ({
                    type: "sector" as const,
                    at: { x: zone.x, y: zone.y + zone.h / 2 },
                    facingDeg: 0,
                    halfAngleDeg: 18,
                    length: Math.max(zone.w, 8),
                  })
                : ({ type: "ellipse" as const })
          );

          if (geo.type === "ellipse") {
            const cx = field.x + ((zone.x + zone.w / 2) / 100) * field.w;
            const cy = field.y + ((zone.y + zone.h / 2) / 100) * field.h;
            const rx = (zone.w / 100) * field.w * 0.5;
            const ry = (zone.h / 100) * field.h * 0.5;
            return (
              <g key={`zone-${index}`} opacity={lit ? 0.95 : 0.7} data-zone-geo="ellipse">
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx={rx}
                  ry={ry}
                  fill={pal.fill}
                  stroke={pal.stroke}
                  strokeWidth={0.7}
                />
              </g>
            );
          }

          if (geo.type === "taper-shadow") {
            const apex = fieldPointToSvg(geo.apex);
            const rad = (geo.dirDeg * Math.PI) / 180;
            const tip = {
              cx: apex.cx + Math.cos(rad) * (geo.length / 100) * field.w,
              cy: apex.cy + Math.sin(rad) * (geo.length / 100) * field.h,
            };
            const nx = -Math.sin(rad);
            const ny = Math.cos(rad);
            const near = (geo.nearWidth / 100) * field.h * 0.5;
            const far = (geo.farWidth / 100) * field.h * 0.5;
            const d = [
              `M ${apex.cx + nx * near} ${apex.cy + ny * near}`,
              `L ${tip.cx + nx * far} ${tip.cy + ny * far}`,
              `L ${tip.cx - nx * far} ${tip.cy - ny * far}`,
              `L ${apex.cx - nx * near} ${apex.cy - ny * near}`,
              "Z",
            ].join(" ");
            return (
              <g key={`zone-${index}`} opacity={lit ? 0.9 : 0.62} data-zone-geo="taper-shadow">
                <path d={d} fill={pal.fill} stroke={pal.stroke} strokeWidth={0.6} strokeDasharray="3 4" />
              </g>
            );
          }

          if (geo.type === "sector") {
            const c = fieldPointToSvg(geo.at);
            const len = (geo.length / 100) * field.w;
            const half = (geo.halfAngleDeg * Math.PI) / 180;
            const facing = (geo.facingDeg * Math.PI) / 180;
            const a1 = facing - half;
            const a2 = facing + half;
            const p1 = { x: c.cx + Math.cos(a1) * len, y: c.cy + Math.sin(a1) * len };
            const p2 = { x: c.cx + Math.cos(a2) * len, y: c.cy + Math.sin(a2) * len };
            const d = `M ${c.cx} ${c.cy} L ${p1.x} ${p1.y} A ${len} ${len} 0 0 1 ${p2.x} ${p2.y} Z`;
            return (
              <g key={`zone-${index}`} opacity={lit ? 0.88 : 0.65} data-zone-geo="sector">
                <path d={d} fill={pal.fill} stroke={pal.stroke} strokeWidth={0.55} />
              </g>
            );
          }

          if (geo.type === "corridor") {
            const a = fieldPointToSvg(geo.from);
            const b = fieldPointToSvg(geo.to);
            const dx = b.cx - a.cx;
            const dy = b.cy - a.cy;
            const len = Math.hypot(dx, dy) || 1;
            const nx = (-dy / len) * ((geo.width / 100) * field.h * 0.5);
            const ny = (dx / len) * ((geo.width / 100) * field.h * 0.5);
            const d = `M ${a.cx + nx} ${a.cy + ny} L ${b.cx + nx} ${b.cy + ny} L ${b.cx - nx} ${b.cy - ny} L ${a.cx - nx} ${a.cy - ny} Z`;
            return (
              <g key={`zone-${index}`} opacity={lit ? 0.9 : 0.6} data-zone-geo="corridor">
                <path d={d} fill={pal.fill} stroke={pal.stroke} strokeWidth={0.55} />
              </g>
            );
          }
        }

        const x = field.x + (zone.x / 100) * field.w;
        const y = field.y + (zone.y / 100) * field.h;
        const w = (zone.w / 100) * field.w;
        const h = (zone.h / 100) * field.h;
        return (
          <g key={`zone-${index}`} opacity={lit ? 1 : 0.88}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={10}
              fill={pal.fill}
              stroke={pal.stroke}
              strokeWidth={lit ? TACTICAL_STROKES.zoneLit : TACTICAL_STROKES.zone}
            />
            {zone.label ? (
              <g>
                <rect
                  x={x + 8}
                  y={y + 8}
                  width={Math.min(w - 16, zone.label.length * 7.2 + 16)}
                  height={18}
                  rx="5"
                  fill="rgba(6,12,20,0.55)"
                />
                <text
                  x={x + 16}
                  y={y + 20}
                  fill="rgba(248,250,252,0.88)"
                  fontSize={TACTICAL_TYPOGRAPHY.zoneLabel.size}
                  fontFamily={TACTICAL_TYPOGRAPHY.zoneLabel.family}
                  fontWeight={600}
                  letterSpacing={TACTICAL_TYPOGRAPHY.zoneLabel.tracking}
                >
                  {zone.label.toUpperCase()}
                </text>
              </g>
            ) : null}
          </g>
        );
      })}
    </g>
  );
}

export function TacticalLineLayer({
  lines = [],
  uid = "main",
}: {
  lines?: TacticalLine[];
  uid?: string;
}) {
  const ids = markerIds(uid);
  // Cap visual noise: prefer primary lines (fault/press/pass before many runs)
  const ranked = [...lines].sort((a, b) => {
    const order = { fault: 0, press: 1, pass: 2, run: 3 };
    return order[a.kind] - order[b.kind];
  });
  const visible = ranked.slice(0, 8);

  return (
    <g data-tactical-lines>
      {visible.map((line, index) => {
        const a = fieldPointToSvg(line.from);
        const b = fieldPointToSvg(line.to);
        const dashed = isDashed(line);
        const d = curvedPath(a, b, line.kind);
        const color = LINE_COLOR[line.kind];
        const baseOp = line.kind === "run" ? 0.78 : 0.92;
        const op = typeof line.opacity === "number" ? Math.max(0, Math.min(1, line.opacity)) * baseOp : baseOp;
        return (
          <g key={`line-${index}`} opacity={op}>
            {/* Soft underglow */}
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={LINE_WIDTH[line.kind] + 2.4}
              strokeLinecap="round"
              opacity="0.18"
            />
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={LINE_WIDTH[line.kind]}
              strokeLinecap="round"
              strokeDasharray={dashed ? (line.kind === "press" ? "5 7" : "7 6") : undefined}
              markerEnd={`url(#${ids[line.kind]})`}
            />
          </g>
        );
      })}
    </g>
  );
}

export function TacticalPlayer({
  player,
  highlighted = false,
  secondary = false,
  facingDeg,
  showGazeCone = false,
  bodyShape,
  receivingFoot,
  showReceivingFoot = false,
}: {
  player: TacticalPlayerMarker & { highlighted?: boolean };
  highlighted?: boolean;
  secondary?: boolean;
  /** Degrees — 0 = right (attack). */
  facingDeg?: number;
  /** Primary focus: short gaze fan (Academy + Coach). */
  showGazeCone?: boolean;
  bodyShape?: string;
  /** Authored receiving side — Marker V6 foot cue. */
  receivingFoot?: "left" | "right" | "either" | "front" | "back-foot";
  showReceivingFoot?: boolean;
}) {
  const { cx, cy } = fieldPointToSvg(player.at);
  const isUs = player.team === "us";
  const r = TACTICAL_PLAYER_STYLES.radius;
  const lit = highlighted || player.highlighted;
  const label = academyDisplayRole(player.id || player.label);
  const facing = facingDeg ?? (isUs ? 0 : 180);
  const scale = lit || player.hasBall ? TACTICAL_PLAYER_STYLES.scaleActive : 1;
  const fill = isUs ? TACTICAL_COLORS.us : TACTICAL_COLORS.opponent;
  const inner = isUs ? TACTICAL_COLORS.usInner : TACTICAL_COLORS.opponentInner;
  const stroke = isUs ? TACTICAL_COLORS.usStroke : TACTICAL_COLORS.opponentStroke;
  const labelFill = isUs ? TACTICAL_COLORS.usLabel : TACTICAL_COLORS.opponentLabel;
  const dim = !lit && !player.hasBall && secondary ? 0.78 : !lit && !player.hasBall ? 0.88 : 1;
  const strong = Boolean(lit || player.hasBall);
  /** Academy noise rule — only dim to the faint state when nothing calls for this player's body cues. */
  const isQuiet = !strong && !showReceivingFoot;
  const shoulderTilt = shoulderTiltForBody(bodyShape as BodyShape | undefined, strong);
  const coneHalf = TACTICAL_PLAYER_STYLES.gazeConeDeg / 2;
  const coneLen = Math.min(TACTICAL_PLAYER_STYLES.gazeConeLen, 16);
  /** Gaze is a focus cue — only earns screen time when the player is actually lit. */
  const showGaze = showGazeCone && strong;
  /** Outside ring — front torso plate + shoulders + optional foot (never through label). */
  const ringR = r + 4.6;
  const wedgeLen = TACTICAL_PLAYER_STYLES.frontWedgeLen;
  const wedgeHalf = TACTICAL_PLAYER_STYLES.frontWedgeHalfDeg + Math.abs(shoulderTilt) * 0.25;
  const toRad = (d: number) => (d * Math.PI) / 180;
  /** V7 front-torso plate — wide trapezoid (near edge hugs ring, far edge flares out), not a vanishing tip. */
  const frontTorsoPath = (() => {
    const nearHalf = wedgeHalf * TACTICAL_PLAYER_STYLES.frontPlateNearFactor;
    const nearR = ringR + 0.4;
    const farR = ringR + wedgeLen;
    const a0n = toRad(-nearHalf);
    const a1n = toRad(nearHalf);
    const a0f = toRad(-wedgeHalf);
    const a1f = toRad(wedgeHalf);
    const x0 = Math.cos(a0n) * nearR;
    const y0 = Math.sin(a0n) * nearR;
    const x1 = Math.cos(a0f) * farR;
    const y1 = Math.sin(a0f) * farR;
    const x2 = Math.cos(a1f) * farR;
    const y2 = Math.sin(a1f) * farR;
    const x3 = Math.cos(a1n) * nearR;
    const y3 = Math.sin(a1n) * nearR;
    return `M ${x0.toFixed(2)} ${y0.toFixed(2)} L ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} Z`;
  })();
  const frontOpacity = strong
    ? TACTICAL_PLAYER_STYLES.strongFrontOpacity
    : isQuiet
      ? TACTICAL_PLAYER_STYLES.quietFrontOpacity
      : 0.62;
  const shoulderLen = TACTICAL_PLAYER_STYLES.shoulderLen;
  const shoulderThick = TACTICAL_PLAYER_STYLES.shoulderThick;
  const shoulderY = ringR + 0.2;
  const shoulderOpacity = strong
    ? TACTICAL_PLAYER_STYLES.strongShoulderOpacity
    : isQuiet
      ? TACTICAL_PLAYER_STYLES.quietShoulderOpacity
      : 0.55;
  const footOff = TACTICAL_PLAYER_STYLES.receivingFootOffset;
  const footR = TACTICAL_PLAYER_STYLES.receivingFootR;
  const footSide =
    receivingFoot === "left" || receivingFoot === "back-foot"
      ? -1
      : receivingFoot === "right" || receivingFoot === "front"
        ? 1
        : receivingFoot === "either"
          ? 1
          : 0;
  const footXY =
    footSide === 0
      ? null
      : receivingFoot === "front"
        ? { x: footOff, y: 0 }
        : { x: footOff * 0.55, y: footSide * footOff * 0.72 };
  /** Chevron nub pointing radially outward from the foot dot — makes the cue read at a glance. */
  const footChevronPath = footXY
    ? (() => {
        const ang = Math.atan2(footXY.y, footXY.x) || 0;
        const tip = { x: footXY.x + Math.cos(ang) * footR * 1.9, y: footXY.y + Math.sin(ang) * footR * 1.9 };
        const perp = ang + Math.PI / 2;
        const base1 = {
          x: footXY.x + Math.cos(perp) * footR * 0.85,
          y: footXY.y + Math.sin(perp) * footR * 0.85,
        };
        const base2 = {
          x: footXY.x - Math.cos(perp) * footR * 0.85,
          y: footXY.y - Math.sin(perp) * footR * 0.85,
        };
        return `M ${base1.x.toFixed(2)} ${base1.y.toFixed(2)} L ${tip.x.toFixed(2)} ${tip.y.toFixed(2)} L ${base2.x.toFixed(2)} ${base2.y.toFixed(2)} Z`;
      })()
    : null;

  return (
    <g
      data-player={player.id}
      data-testid={`tactical-player-${player.id}`}
      data-facing={facing.toFixed(0)}
      data-body-shape={bodyShape ?? ""}
      data-orientation-v4="1"
      data-orientation-v6="1"
      data-orientation-v7="1"
      data-receiving-foot={receivingFoot ?? ""}
      data-display-label={label}
      transform={`translate(${cx} ${cy}) scale(${scale})`}
      opacity={dim}
      style={{ filter: "drop-shadow(0 1.5px 2.5px rgba(0,0,0,0.4))" }}
    >
      {/* Layer 1 — orientation OUTSIDE marker (rotates with facing) */}
      <g transform={`rotate(${facing})`} data-orientation-ring>
        {showGaze ? (
          <path
            d={`M ${ringR + 0.5} 0 L ${coneLen} ${(-coneLen * Math.tan(toRad(coneHalf))).toFixed(2)} L ${coneLen} ${(coneLen * Math.tan(toRad(coneHalf))).toFixed(2)} Z`}
            fill={isUs ? "rgba(56,189,248,0.11)" : "rgba(248,113,113,0.08)"}
            stroke={isUs ? "rgba(125,211,252,0.32)" : "rgba(252,165,165,0.25)"}
            strokeWidth={0.5}
            opacity={0.7}
            data-gaze-cone
          />
        ) : null}
        {/* V7 front torso plate — wide trapezoid; clear chest / facing at a glance */}
        <path
          d={frontTorsoPath}
          fill={isUs ? "rgba(248,250,252,0.92)" : "rgba(255,247,237,0.9)"}
          stroke={isUs ? "#e2e8f0" : "#fed7aa"}
          strokeWidth={0.6}
          opacity={frontOpacity}
          data-front-torso
          data-front-wedge
          data-front-arc
        />
        {/* V7 shoulder capsules — perpendicular to facing, joined by a thin shoulder line */}
        <line
          x1="0"
          y1={-shoulderY + shoulderTilt * 0.05}
          x2="0"
          y2={shoulderY + shoulderTilt * 0.05}
          stroke={isUs ? "rgba(248,250,252,0.85)" : "rgba(255,247,237,0.8)"}
          strokeWidth={0.55}
          opacity={shoulderOpacity}
          data-shoulder-line
        />
        <rect
          x={-shoulderLen / 2}
          y={-shoulderY - shoulderThick / 2 + shoulderTilt * 0.05}
          width={shoulderLen}
          height={shoulderThick}
          rx={shoulderThick / 2}
          fill={isUs ? "#f8fafc" : "#fff7ed"}
          opacity={shoulderOpacity}
          data-shoulder-anchor="left"
        />
        <rect
          x={-shoulderLen / 2}
          y={shoulderY - shoulderThick / 2 + shoulderTilt * 0.05}
          width={shoulderLen}
          height={shoulderThick}
          rx={shoulderThick / 2}
          fill={isUs ? "#f8fafc" : "#fff7ed"}
          opacity={shoulderOpacity}
          data-shoulder-anchor="right"
        />
        {showReceivingFoot && footXY ? (
          <g data-receiving-foot-marker>
            {footChevronPath ? (
              <path d={footChevronPath} fill={TACTICAL_COLORS.ball} opacity="0.95" />
            ) : null}
            <circle
              cx={footXY.x}
              cy={footXY.y}
              r={footR}
              fill={TACTICAL_COLORS.ball}
              stroke="#0f172a"
              strokeWidth={0.8}
              opacity={0.97}
            />
          </g>
        ) : null}
      </g>

      {lit ? (
        <circle
          r={TACTICAL_PLAYER_STYLES.focusRadius}
          fill="none"
          stroke={TACTICAL_COLORS.focusRing}
          strokeWidth={1.15}
          opacity="0.85"
        />
      ) : null}

      {player.hasBall ? (
        <circle
          r={TACTICAL_PLAYER_STYLES.possessionRadius}
          fill="none"
          stroke={TACTICAL_COLORS.possessionHalo}
          strokeWidth={1.1}
          opacity="0.7"
        />
      ) : null}

      {/* Layer 2 — marker body (no orientation ink inside) */}
      <circle r={r + 1.35} fill={stroke} opacity="0.95" />
      <circle r={r} fill={fill} />
      <circle r={r - 2.2} fill={inner} opacity="0.28" />

      {/* Layer 3 — label on top, never rotated, never crossed */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill={labelFill}
        fontSize={label.length > 2 ? TACTICAL_TYPOGRAPHY.playerLabel.sizeLong : TACTICAL_TYPOGRAPHY.playerLabel.size}
        fontFamily={TACTICAL_TYPOGRAPHY.playerLabel.family}
        fontWeight={TACTICAL_TYPOGRAPHY.playerLabel.weight}
        letterSpacing="0.02em"
        style={{ pointerEvents: "none" }}
        data-label-layer="top"
      >
        {label}
      </text>
    </g>
  );
}

export function TacticalBall({
  at,
  trail = false,
  trailPoints = [],
}: {
  at: TacticalPoint;
  trail?: boolean;
  trailPoints?: TacticalPoint[];
}) {
  const { cx, cy } = fieldPointToSvg(at);
  return (
    <g data-ball data-testid="tactical-ball" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
      {trail && trailPoints.length > 1
        ? (() => {
            const pts = [...trailPoints, at].map(fieldPointToSvg);
            const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.cx} ${p.cy}`).join(" ");
            return (
              <path
                d={d}
                fill="none"
                stroke={TACTICAL_COLORS.ballTrail}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.55"
              />
            );
          })()
        : null}
      {trail
        ? trailPoints.map((p, i) => {
            const pt = fieldPointToSvg(p);
            const t = (i + 1) / (trailPoints.length + 1);
            return (
              <circle
                key={`trail-${i}`}
                cx={pt.cx}
                cy={pt.cy}
                r={2.2 + t * 2.4}
                fill={TACTICAL_COLORS.ball}
                opacity={0.1 + t * 0.28}
              />
            );
          })
        : null}
      <g transform={`translate(${cx} ${cy})`}>
        <circle r="11" fill={TACTICAL_COLORS.ballHalo} opacity="0.25" />
        <circle r="7.2" fill={TACTICAL_COLORS.ballStroke} opacity="0.35" />
        <circle r="6.2" fill={TACTICAL_COLORS.ball} stroke={TACTICAL_COLORS.ballStroke} strokeWidth="1.4" />
        <circle r="3.4" fill={TACTICAL_COLORS.ballCore} opacity="0.85" />
        <circle r="1.6" fill="rgba(255,255,255,0.55)" cx="-1.8" cy="-1.8" />
      </g>
    </g>
  );
}

export function TacticalLegend({ className }: { className?: string }) {
  const items = [
    { color: TACTICAL_COLORS.us, label: "Wij" },
    { color: TACTICAL_COLORS.opponent, label: "Tegenstander" },
    { color: TACTICAL_COLORS.ball, label: "Bal" },
    { color: TACTICAL_COLORS.runLine, label: "Loop" },
    { color: TACTICAL_COLORS.passLine, label: "Pass" },
    { color: TACTICAL_COLORS.pressLine, label: "Druk" },
    { color: TACTICAL_COLORS.faultLine, label: "Fout" },
  ];

  return (
    <ul className={cn("mt-2.5 flex flex-wrap gap-1.5 sm:gap-2", className)} role="list">
      {items.map((item) => (
        <li
          key={item.label}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200/80 bg-white/90 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-700 sm:text-[11px]"
        >
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
