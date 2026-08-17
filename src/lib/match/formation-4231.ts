/**
 * Canonieke 1-4-2-3-1 startslots + absolute pitch-geometrie (één bron voor beheer + publiek).
 * Coördinaten: x/y in % van het speelveld (links/boven = 0), aanvallend naar boven.
 */

export type FormationSlotCode =
  | "GK"
  | "LB"
  | "LCB"
  | "RCB"
  | "RB"
  | "LCVM"
  | "RCVM"
  | "LM"
  | "CAM"
  | "RM"
  | "SP";

export type FormationLine = "GK" | "DEF" | "CDM" | "AM" | "ST";

export type FormationSlot = {
  code: FormationSlotCode;
  labelNl: string;
  line: FormationLine;
  /** Pitch row 0 = GK (bottom), 4 = SP (top) — legacy grouping */
  row: number;
  /** Order within row left→right */
  col: number;
  /** Horizontal position 0–100 (left→right) */
  x: number;
  /** Vertical position 0–100 (top→bottom of attack direction) */
  y: number;
};

export const FORMATION_CODE = "1-4-2-3-1" as const;
export const FORMATION_DISPLAY = "4-2-3-1" as const;

/**
 * Exacte 1-4-2-3-1-geometrie — horizontale linies, geen verticale ketting.
 *
 * ```
 *                  SP
 * LM              CAM              RM
 *           LCVM         RCVM
 * LB          LCB       RCB          RB
 *                  GK
 * ```
 */
/** Volgorde stabiel (GK→SP) voor codes/tests; x/y bepalen de visuele 1-4-2-3-1. */
export const FORMATION_4231_SLOTS: readonly FormationSlot[] = [
  { code: "GK", labelNl: "Keeper", line: "GK", row: 0, col: 0, x: 50, y: 88 },
  { code: "LB", labelNl: "Linksback", line: "DEF", row: 1, col: 0, x: 14, y: 68 },
  { code: "LCB", labelNl: "Linker centrale verdediger", line: "DEF", row: 1, col: 1, x: 38, y: 66 },
  { code: "RCB", labelNl: "Rechter centrale verdediger", line: "DEF", row: 1, col: 2, x: 62, y: 66 },
  { code: "RB", labelNl: "Rechtsback", line: "DEF", row: 1, col: 3, x: 86, y: 68 },
  { code: "LCVM", labelNl: "Linker controlerende middenvelder", line: "CDM", row: 2, col: 0, x: 38, y: 47 },
  { code: "RCVM", labelNl: "Rechter controlerende middenvelder", line: "CDM", row: 2, col: 1, x: 62, y: 47 },
  { code: "LM", labelNl: "Linkermidden", line: "AM", row: 3, col: 0, x: 20, y: 30 },
  { code: "CAM", labelNl: "Aanvallende middenvelder", line: "AM", row: 3, col: 1, x: 50, y: 28 },
  { code: "RM", labelNl: "Rechtermidden", line: "AM", row: 3, col: 2, x: 80, y: 30 },
  { code: "SP", labelNl: "Spits", line: "ST", row: 4, col: 0, x: 50, y: 12 },
] as const;

export const FORMATION_SLOT_CODES: readonly FormationSlotCode[] = FORMATION_4231_SLOTS.map((s) => s.code);

export function isFormationSlotCode(value: string | null | undefined): value is FormationSlotCode {
  return !!value && (FORMATION_SLOT_CODES as readonly string[]).includes(value);
}

export function formationSlotLabel(code: string): string {
  return FORMATION_4231_SLOTS.find((s) => s.code === code)?.labelNl ?? code;
}

export function formationSlotByCode(code: FormationSlotCode): FormationSlot {
  const slot = FORMATION_4231_SLOTS.find((s) => s.code === code);
  if (!slot) throw new Error(`Unknown formation slot: ${code}`);
  return slot;
}

export function emptyFormationMap(): Record<FormationSlotCode, string | null> {
  return {
    GK: null,
    LB: null,
    LCB: null,
    RCB: null,
    RB: null,
    LCVM: null,
    RCVM: null,
    LM: null,
    CAM: null,
    RM: null,
    SP: null,
  };
}

/** Minimale horizontale spreiding per linie (overlap-check). */
export function formationLineSpread(line: FormationLine): { codes: FormationSlotCode[]; xs: number[] } {
  const slots = FORMATION_4231_SLOTS.filter((s) => s.line === line);
  return { codes: slots.map((s) => s.code), xs: slots.map((s) => s.x) };
}
