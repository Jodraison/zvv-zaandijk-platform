/**
 * Golden Session timing constants — shared by film + UI previews (C-007).
 * Keep in sync: film steps are authored against these absolutes.
 */
export const GS_SEEKS = {
  t0: 0,
  t1: 2000,
  t2: 3800,
  t2Arrive: 5200,
  t3: 6600,
  liveEnd: 10200,
  t4: 10200,
  t5: 12400,
  t6: 14600,
  t7: 16600,
  end: 18600,
  /** Decision freeze — lesson decision step only */
  freeze: 6800,
  /**
   * Hub/Academy preview — opening trigger after first touch:
   * LB has the ball, inside lane readable, RW not yet on the solution curve.
   */
  previewOpening: 5550,
} as const;
