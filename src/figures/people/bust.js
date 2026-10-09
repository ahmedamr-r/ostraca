/* ===========================================================================
   Bust: a sculptor's bust on a plinth, front on. Profile, account, no photo
   yet, finish your profile, a deleted account.

   A plain oval head with no features, a neck, shoulders cut straight across
   the chest, on a plinth with a moulded cap and a base: the shape of a
   default avatar. Out of true it leans off the base's right corner.
   =========================================================================== */

// Measured off the plinth's centre line (CX). A worker is 45 tall.
const CX = 120;
const BASE_W = 34, BASE = -8;                 // base slab: half width, top
const PL_W = 26, PL_T = -54;                  // plinth body: half width, top
const CAP_W = 36, CAP_M = -57, CAP_T = -62;   // cap: overhang, moulding line, top
const SH_W = 27, SH_T = -76, NECK = -88;      // shoulders: half width, top of the arm, neck base
const NK_W = 7, HEAD_CY = -108, HEAD_RX = 14, HEAD_RY = 18;

export default {
  name: "bust",
  title: "Bust",
  shelf: "people",
  use: "Profile, account, no photo yet, finish your profile, a deleted account",
  width: 300,
  height: 150,

  draw({ SET_OUT, rectPath }) {
    const base = rectPath(CX - BASE_W, BASE, BASE_W * 2, -BASE);
    const plinth = rectPath(CX - PL_W, PL_T, PL_W * 2, BASE - PL_T);
    const panel = rectPath(CX - PL_W + 6, PL_T + 7, (PL_W - 6) * 2, BASE - PL_T - 14);   // the sunk face
    // The cap: a thin fillet over the plinth, then the overhanging top.
    const cap = `M${CX - PL_W - 3} ${PL_T}V${CAP_M}H${CX + PL_W + 3}V${PL_T}Z` +
      `M${CX - CAP_W} ${CAP_M}V${CAP_T}H${CX + CAP_W}V${CAP_M}Z`;
    // Shoulders, cut straight across the chest, rising to the neck.
    const shoulders = `M${CX - SH_W} ${CAP_T}V${SH_T}C${CX - SH_W} ${SH_T - 8} ${CX - 16} ${NECK + 1} ${CX - NK_W - 1} ${NECK}` +
      `H${CX + NK_W + 1}C${CX + 16} ${NECK + 1} ${CX + SH_W} ${SH_T - 8} ${CX + SH_W} ${SH_T}V${CAP_T}Z`;
    const neck = `M${CX - NK_W} ${NECK + 2}V${HEAD_CY + HEAD_RY - 6}H${CX + NK_W}V${NECK + 2}Z`;
    const head = `M${CX} ${HEAD_CY - HEAD_RY}a${HEAD_RX} ${HEAD_RY} 0 1 0 0.01 0Z`;
    const fold = `M${CX - 14} ${CAP_T - 3}Q${CX} ${CAP_T - 7} ${CX + 14} ${CAP_T - 3}`; // the cut's edge

    const LADDER = CX + 66;
    return {
      courses: [
        { svg: `<path class="paper" d="${base}"/>`, still: true },
        `<path class="paper" d="${plinth}"/><path d="${panel}" opacity="0.45"/>`,
        `<path class="paper" d="${cap}"/>`,
        `<path class="paper" d="${shoulders}"/><path d="${fold}" opacity="0.4"/>`,
        `<path class="paper" d="${neck}"/>`,
        `<path class="paper" d="${head}"/>`,
      ],
      outline: `<path d="${base}${plinth}${cap}${shoulders}${head}" stroke-dasharray="${SET_OUT}"/>`,
      contents: `<path d="${panel}${neck}"/>`,
      foot: [CX + BASE_W, BASE],
      top: HEAD_CY - HEAD_RY,
      error: "lean",
      lean: 4,
      revise: [CX - HEAD_RX - 4, HEAD_CY - HEAD_RY - 4, HEAD_RX * 2 + 8, HEAD_RY * 2 + 6],
      tag: [CX + HEAD_RX + 30, HEAD_CY - HEAD_RY - 2], // clear of the cloud and the letterer on the cap
      tick: [CX + SH_W + 10, HEAD_CY - 4],
      access: { kind: "ladder", at: LADDER, height: -SH_T + 10, lean: 20 },
      stations: {
        empty: { pose: "letterer", x: CX + BASE_W + 22, y: 0 },
        loading: { pose: "carrier", x: LADDER - 8, y: -40 },
        waiting: { pose: "hauler", x: LADDER + 52, y: 0, flip: true },
        idle: { pose: "leaner", x: CX - BASE_W - 7, y: 0, flip: true },
        success: { pose: "sitter", x: CX + CAP_W - 4, y: CAP_T + 3, flip: true },
        changed: { pose: "letterer", x: CX + CAP_W - 1, y: CAP_T },
        error: { pose: "shrugger", x: CX + BASE_W + 44, y: 0 },
      },
    };
  },
};
