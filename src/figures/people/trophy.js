/* ===========================================================================
   Trophy: a two handled cup on a stepped base, front on, twice a worker's
   height. Achievements, rewards, goals reached, streaks, leaderboards.

   Reads by the handles and the stem. Out of true the cup leans off its
   bottom step's right corner, which stays put. A real streak, rank or score
   (opts.figure) goes on a dimension chain up the cup's left side.
   =========================================================================== */

// Measured off the cup's centre line (CX). A worker is 45 tall.
const CX = 124;
const STEPS = [[30, -8], [24, -15], [18, -20]];   // base steps: half width, top
const STEM = -46, ST_W = 3.5, KNOT = -33;        // stem's top, half width, the knot's middle
const RIM = -90, RIM_T = -94, BOWL_W = 26;       // bowl's rim, the rolled rim's top, its half width

export default {
  name: "trophy",
  title: "Trophy",
  shelf: "people",
  use: "Achievements, rewards, goals reached, streaks, leaderboards",
  width: 300,
  height: 124,
  measures: { what: "A streak, rank or score", sample: 12 },

  draw({ n, SET_OUT, rectPath, dimension, opts }) {
    let below = 0;
    const steps = STEPS.map(([w, top]) => { const d = rectPath(CX - w, top, w * 2, below - top); below = top; return d; });
    const stem = `M${CX - ST_W} ${STEPS[2][1]}V${STEM + 3}H${CX + ST_W}V${STEPS[2][1]}Z` +
      `M${CX - 8} ${STEPS[2][1]}Q${CX - ST_W} ${STEPS[2][1] - 2} ${CX - ST_W} ${STEPS[2][1] - 6}H${CX + ST_W}Q${CX + ST_W} ${STEPS[2][1] - 2} ${CX + 8} ${STEPS[2][1]}Z`;
    const knot = `M${CX - 7} ${KNOT}a7 3.6 0 1 0 14 0a7 3.6 0 1 0 -14 0Z`;
    // The bowl: from the stem's head it swells out to the rim.
    const bowl = `M${CX - ST_W} ${STEM + 3}C${CX - 10} ${STEM}, ${CX - BOWL_W} ${STEM - 14}, ${CX - BOWL_W} ${RIM}` +
      `H${CX + BOWL_W}C${CX + BOWL_W} ${STEM - 14}, ${CX + 10} ${STEM}, ${CX + ST_W} ${STEM + 3}Z`;
    const band = `M${CX - BOWL_W + 6} ${RIM + 10}H${CX + BOWL_W - 6}`; // a line turned round the bowl
    const rim = `M${CX - BOWL_W - 2} ${RIM + 0.5}V${RIM_T + 2}a2 2 0 0 1 2 -2H${CX + BOWL_W}a2 2 0 0 1 2 2V${RIM + 0.5}Z`;
    // A handle loops out from the bowl's side under the rim and back in
    // lower down: an outer and an inner curve, closed at the bowl.
    const handle = (s) => {
      const x = (d) => n(CX + s * d);
      // Both roots sit on the bowl's own edge, so the closing strokes lie on it.
      return `M${x(25.9)} ${RIM + 4}C${x(BOWL_W + 14)} ${RIM + 1}, ${x(BOWL_W + 18)} ${RIM + 20}, ${x(17.2)} ${-56.4}` +
        `L${x(18.6)} ${-58.8}C${x(BOWL_W + 12)} ${RIM + 20}, ${x(BOWL_W + 10)} ${RIM + 6}, ${x(25.5)} ${RIM + 8}Z`;
    };

    const v = opts.figure?.value;
    const shown = v === 0 || (v != null && String(v).trim() !== "") ? String(v) : "";
    const extras = shown ? dimension(CX - 54, 0, CX - 54, RIM_T, shown) : "";

    const LADDER = CX + 62;
    return {
      courses: [
        { svg: `<path class="paper" d="${steps[0]}"/>`, still: true },
        `<path class="paper" d="${steps[1]}"/>`,
        `<path class="paper" d="${steps[2]}"/>`,
        `<path class="paper" d="${stem}"/>`,
        `<path class="paper" d="${knot}"/>`,
        `<path class="paper" d="${bowl}"/><path d="${band}" opacity="0.45"/>`,
        `<path class="paper" d="${rim}"/>`,
        `<path class="paper" d="${handle(-1)}${handle(1)}"/>`,
      ],
      outline: `<path d="${steps.join("")}${stem}${bowl}${rim}${handle(-1)}${handle(1)}" stroke-dasharray="${SET_OUT}"/>`,
      contents: `<path d="${knot}${band}"/>`,
      foot: [CX + STEPS[0][0], STEPS[0][1]],
      top: RIM_T,
      error: "lean",
      lean: 4,
      revise: [CX - BOWL_W - 4, RIM_T - 4, BOWL_W * 2 + 8, STEM - RIM_T + 6],
      tag: [CX + BOWL_W + 30, RIM_T - 4],
      tick: [CX + BOWL_W + 16, RIM_T - 6],
      access: { kind: "ladder", at: LADDER, height: -RIM + 6, lean: 20 },
      extras,
      stations: {
        empty: { pose: "letterer", x: CX + STEPS[0][0] + 22, y: 0 },
        loading: { pose: "carrier", x: LADDER - 8, y: -40 },
        waiting: { pose: "hauler", x: LADDER + 52, y: 0, flip: true },
        idle: { pose: "sitter", x: CX + 15, y: STEPS[2][1] + 3, flip: true },
        success: { pose: "sitter", x: CX + 15, y: STEPS[2][1] + 3, flip: true },
        changed: { pose: "letterer", x: CX + BOWL_W + 22, y: 0 },
        error: { pose: "shrugger", x: CX + STEPS[0][0] + 44, y: 0 },
      },
    };
  },
};
