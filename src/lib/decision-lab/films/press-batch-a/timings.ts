/**
 * Unique timing tables for pressing Batch A (#2–#9).
 * Freeze times deliberately differ unless football timing matches.
 */

export type BatchASeeks = {
  t0: number;
  t1: number;
  t2: number;
  t2Arrive: number;
  t3: number;
  freeze: number;
  liveEnd: number;
  t4: number;
  t5: number;
  t6: number;
  t7: number;
  end: number;
  previewOpening: number;
};

/** #2 Mirror LW — slightly slower read of opposite-side cues */
export const DS02_SEEKS: BatchASeeks = {
  t0: 0,
  t1: 2200,
  t2: 4000,
  t2Arrive: 5400,
  t3: 7000,
  freeze: 7200,
  liveEnd: 10800,
  t4: 10800,
  t5: 13200,
  t6: 15400,
  t7: 17400,
  end: 19400,
  previewOpening: 5800,
};

/** #3 Stable decision — longer hold after first touch; patience */
export const DS03_SEEKS: BatchASeeks = {
  t0: 0,
  t1: 1600,
  t2: 3400,
  t2Arrive: 4800,
  t3: 6200,
  freeze: 7600,
  liveEnd: 11000,
  t4: 11000,
  t5: 13400,
  t6: 15600,
  t7: 17600,
  end: 19600,
  previewOpening: 5200,
};

/** #4 Second press — RW already pressing; freeze later on 8's window */
export const DS04_SEEKS: BatchASeeks = {
  t0: 0,
  t1: 1800,
  t2: 3600,
  t2Arrive: 5000,
  t3: 6400,
  freeze: 8200,
  liveEnd: 11400,
  t4: 11400,
  t5: 13600,
  t6: 15800,
  t7: 17800,
  end: 19800,
  previewOpening: 7000,
};

/** #5 Depth cover — freeze after RW commits; focus last line */
export const DS05_SEEKS: BatchASeeks = {
  t0: 0,
  t1: 2000,
  t2: 3800,
  t2Arrive: 5200,
  t3: 6800,
  freeze: 7800,
  liveEnd: 11200,
  t4: 11200,
  t5: 13400,
  t6: 15600,
  t7: 17600,
  end: 19600,
  previewOpening: 6600,
};

/** #6 Striker steer — earlier ST focus during recycle read */
export const DS06_SEEKS: BatchASeeks = {
  t0: 0,
  t1: 2100,
  t2: 3900,
  t2Arrive: 5300,
  t3: 6900,
  freeze: 7400,
  liveEnd: 10600,
  t4: 10600,
  t5: 12800,
  t6: 15000,
  t7: 17000,
  end: 19000,
  previewOpening: 6000,
};

/** #7 Far-side squeeze — shorter live; wide read */
export const DS07_SEEKS: BatchASeeks = {
  t0: 0,
  t1: 1500,
  t2: 3200,
  t2Arrive: 4500,
  t3: 5800,
  freeze: 6400,
  liveEnd: 9000,
  t4: 9000,
  t5: 11000,
  t6: 12800,
  t7: 14600,
  end: 16400,
  previewOpening: 5000,
};

/** #8 Abort — window already closed; freeze after failed support read */
export const DS08_SEEKS: BatchASeeks = {
  t0: 0,
  t1: 1700,
  t2: 3300,
  t2Arrive: 4600,
  t3: 6000,
  freeze: 8600,
  liveEnd: 11800,
  t4: 11800,
  t5: 14000,
  t6: 16200,
  t7: 18200,
  end: 20200,
  previewOpening: 7400,
};

/** #9 Pressure — compressed pass flight + earlier freeze */
export const DS09_SEEKS: BatchASeeks = {
  t0: 0,
  t1: 1200,
  t2: 2600,
  t2Arrive: 3700,
  t3: 4800,
  freeze: 5400,
  liveEnd: 7800,
  t4: 7800,
  t5: 9800,
  t6: 11600,
  t7: 13200,
  end: 14800,
  previewOpening: 4000,
};

export const BATCH_A_SEEKS_BY_SLUG: Record<string, BatchASeeks> = {
  "binnenkant-dicht-lw": DS02_SEEKS,
  "binnenkant-dicht-decision": DS03_SEEKS,
  "tweede-druk-8": DS04_SEEKS,
  "rugdekking-rb": DS05_SEEKS,
  "spits-stuurt": DS06_SEEKS,
  "verre-zijde-knijpt": DS07_SEEKS,
  "niet-doordrukken": DS08_SEEKS,
  "binnenkant-onder-druk": DS09_SEEKS,
};
