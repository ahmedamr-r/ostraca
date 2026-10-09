/* ===========================================================================
   Coffee cup: a cup on its saucer on a cafe table, seen from the side.
   Breaks and away messages, waiting rooms, a quiet feed, an order being
   made, a session that timed out.

   The cup is small next to the crew, so it stands on a table that brings
   it up to working height; the table is a still course and stays put
   when the cup tips.
   =========================================================================== */

// Measured off the cup's centre line (CX). A worker is 45 tall.
const CX = 130;
const TOP = -48, SLAB = 4;                  // table top's upper face, its thickness
const T0 = CX - 33, T1 = 198;              // table top's ends; short on the left so the plumb line hangs clear
const RIM = -94, BASE = -54;                // cup: rim and base
const RW = 26, BW = 20;                     // half widths at the rim and at the base
const S0 = CX - 32, S1 = CX + 32;           // saucer's ends

export default {
  name: "coffee-cup",
  title: "Coffee cup",
  shelf: "time",
  use: "Away messages, waiting rooms, a quiet feed, an order being made, a session that timed out",
  width: 300,
  height: 132,

  draw({ n, SET_OUT, rectPath }) {
    // The table: a cross foot, a column and a top. One still course.
    const table = rectPath(CX - 26, -4, 52, 4) + rectPath(CX - 4, TOP + SLAB, 8, -TOP - SLAB - 4) + rectPath(T0, TOP, T1 - T0, SLAB);

    // The saucer: a foot ring and a shallow dish with its rims turned up.
    const saucer = `M${CX - 12} ${TOP}V${TOP - 2}H${CX + 12}V${TOP}Z` +
      `M${S0} ${BASE}L${S0 + 7} ${TOP - 2}H${S1 - 7}L${S1} ${BASE}Z`;

    // The cup: tapered sides, the base rounded off, a faint rim line.
    const xAt = (y, side) => CX + side * (BW + ((RW - BW) * (BASE - y)) / (BASE - RIM));
    const cup = `M${CX - RW} ${RIM}L${n(xAt(BASE - 3, -1))} ${BASE - 3}Q${CX - BW + 1} ${BASE} ${CX - BW + 4} ${BASE}` +
      `H${CX + BW - 4}Q${CX + BW - 1} ${BASE} ${n(xAt(BASE - 3, 1))} ${BASE - 3}L${CX + RW} ${RIM}Z`;
    const rimLine = `M${n(xAt(RIM + 3, -1))} ${RIM + 3}H${n(xAt(RIM + 3, 1))}`;

    // The handle: a loop off the right side, outer and inner edge in one
    // closed path, its two ends on the cup's side.
    const h0 = -86, h1 = -64, hx0 = xAt(h0, 1), hx1 = xAt(h1, 1);
    const handle = `M${n(hx0)} ${h0}C${CX + 44} ${h0 - 3} ${CX + 44} ${h1 + 1} ${n(hx1)} ${h1}` +
      `L${n(hx1 + 0.4)} ${h1 - 4}C${CX + 36} ${h1 - 5} ${CX + 36} ${h0 + 4} ${n(hx0 - 0.2)} ${h0 + 4}Z`;

    // Steam: three faint wisps, the last course, so a full cup is the
    // last thing built.
    const wisp = (x, k) => `M${x} ${RIM - 5}c-4 -4 4 -7 0 -11s4 -7 0 ${-9 - k}`;
    const steam = `<path class="faint" d="${wisp(CX - 9, 0)}${wisp(CX + 1, 3)}${wisp(CX + 11, 1)}"/>`;

    const courses = [
      { svg: `<path class="paper" d="${table}"/>`, still: true },
      `<path class="paper" d="${saucer}"/>`,
      `<path class="paper" d="${cup}"/><path class="faint" d="${rimLine}"/>`,
      `<path class="paper" d="${handle}"/>`,
      steam,
    ];

    const LADDER = T1 + 32; // the ladder's foot; it leans on the table's end
    return {
      courses,
      outline: `<path d="${table}${saucer}${cup}${handle}" stroke-dasharray="${SET_OUT}"/>`,
      contents: `<path d="${rimLine}"/>`,
      foot: [CX - BW, BASE], // the cup tips off its base's left corner, away from the handle
      top: RIM,
      error: "lean",
      lean: 6,
      revise: [n(hx0 - 2), h0 - 6, CX + 44 - hx0, h1 - h0 + 10], // round the handle
      tick: [CX + RW + 10, RIM - 8],
      tag: [T1 - 4, RIM - 18],
      access: { kind: "ladder", at: LADDER, height: -RIM, lean: 24 },
      stations: {
        empty: { pose: "letterer", x: T1 + 8, y: 0 },               // on the ground: the table is not built yet
        loading: { pose: "carrier", x: LADDER - 8, y: -40 },        // on a rung
        waiting: { pose: "hauler", x: LADDER + 56, y: 0, flip: true },
        idle: { pose: "sitter", x: CX - RW + 4, y: RIM },         // on the rim, legs over the side
        success: { pose: "sitter", x: CX - RW + 4, y: RIM },       // clear of the tick on the right
        changed: { pose: "letterer", x: T1 - 6, y: TOP },           // on the table, pen at the handle
        error: { pose: "shrugger", x: T1 + 30, y: 0 },              // the cup tips away from it
      },
    };
  },
};
