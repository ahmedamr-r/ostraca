/* ===========================================================================
   Deck chair: a deck chair under a parasol, seen from the side. The chair
   faces left: its back frame runs from the front foot up to the top rail,
   its leg frame crosses it from the back foot up to the front rail, and
   the canvas sling hangs between the two rails. The parasol's pole is
   planted behind it, a low cone of canopy on ribs, a finial on top.
   Away, out of office, time off, do not disturb, quiet hours.

   Out of true, the parasol leans off the plumb line while the chair stays
   put: the chair's courses are still. opts.figure is the return date as
   the app writes it, on a chain along the ground under the chair.
   =========================================================================== */
import { shown } from "./_parts.js";

// The chair, measured off its front foot (X0). A worker is 45 tall.
const X0 = 62;
const TOP = [X0 + 56, -66];        // the top rail, where the sling hangs from
const FRONT = [X0 + 5, -28];       // the front rail, at the knee
const BACK_FOOT = X0 + 46;         // the leg frame's foot
const ARM = -36;                   // the arm rest
const SAG = 27;                    // how far the sling hangs below the rails' line
// The parasol, measured off its pole (PX).
const PX = 150, POLE = 2.4;
const RIM = -90, APEX = -110, SPAN = 56; // canopy rim, apex, half span
const RUNNER = -78;                // where the stretchers meet the pole

export default {
  name: "deck-chair",
  title: "Deck chair",
  shelf: "time",
  use: "Away, out of office, time off, do not disturb, quiet hours",
  width: 300,
  height: 146,
  measures: { what: "Back on", sample: "Oct 20" },

  draw({ n, SET_OUT, rectPath, dimension, opts }) {
    // A frame member: a slim bar between two points, as a closed outline.
    const bar = ([x0, y0], [x1, y1], w = 2.4) => {
      const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), ox = (-dy / l) * (w / 2), oy = (dx / l) * (w / 2);
      return `M${n(x0 + ox)} ${n(y0 + oy)}L${n(x1 + ox)} ${n(y1 + oy)}L${n(x1 - ox)} ${n(y1 - oy)}L${n(x0 - ox)} ${n(y0 - oy)}Z`;
    };
    // Where the back frame is at a given y (for the arm rest's back end).
    const backAt = (y) => X0 + ((TOP[0] - X0) * y) / TOP[1];

    const legs = bar([BACK_FOOT, 0], FRONT);                          // the leg frame, foot to front rail
    const back = bar([X0, 0], [TOP[0] + 2, TOP[1] - 2]);            // the back frame, a little past the top rail
    const arm = bar([FRONT[0] - 2, ARM], [backAt(ARM) + 4, ARM], 2.2) + bar([FRONT[0] + 6, ARM], [FRONT[0] + 6, FRONT[1] - 1], 1.6);
    const rails = `M${TOP[0] + 1.6} ${TOP[1]}A1.6 1.6 0 1 0 ${TOP[0] - 1.6} ${TOP[1]}A1.6 1.6 0 1 0 ${TOP[0] + 1.6} ${TOP[1]}Z` +
      `M${FRONT[0] + 1.6} ${FRONT[1]}A1.6 1.6 0 1 0 ${FRONT[0] - 1.6} ${FRONT[1]}A1.6 1.6 0 1 0 ${FRONT[0] + 1.6} ${FRONT[1]}Z`;
    // The sling: canvas from the top rail down and forward to the front
    // rail, hanging in a shallow curve. Two lines for the cloth's edge.
    const mx = (TOP[0] + FRONT[0]) / 2, my = (TOP[1] + FRONT[1]) / 2 + 2 * SAG;
    const slingD = (o) => `M${TOP[0] - 1} ${TOP[1] + 1 + o}Q${n(mx)} ${n(my + o)} ${FRONT[0] + 1} ${FRONT[1] + 1 + o}`;
    const low = { x: (TOP[0] + 2 * mx + FRONT[0]) / 4, y: (TOP[1] + 2 * my + FRONT[1]) / 4 }; // the sling's middle

    // The parasol. The canopy's upper face bows a little; its rim is a
    // straight edge seen side on, with the scallops of the valance under it.
    const canopy = `M${PX - SPAN} ${RIM}Q${PX - SPAN / 2} ${n(APEX + 4)} ${PX} ${APEX}Q${PX + SPAN / 2} ${n(APEX + 4)} ${PX + SPAN} ${RIM}Z`;
    let valance = `M${PX - SPAN} ${RIM}`;
    for (let i = 0; i < 8; i++) valance += `q${SPAN / 8} 5 ${SPAN / 4} 0`;
    // The panel seams, where the ribs run under the cloth.
    let seams = "";
    for (const f of [-0.5, 0, 0.5]) seams += `M${PX} ${APEX}L${n(PX + f * SPAN)} ${RIM}`;
    const ribs = `M${PX} ${RUNNER}L${n(PX - SPAN * 0.55)} ${RIM}M${PX} ${RUNNER}L${n(PX + SPAN * 0.55)} ${RIM}`;
    const runner = rectPath(PX - 2.5, RUNNER - 2, 5, 5);
    const pole = rectPath(PX - POLE / 2, APEX, POLE, -APEX) + rectPath(PX - 3, -6, 6, 6); // and its ground sleeve
    const finial = `M${PX - 2.5} ${APEX - 1}A2.5 3 0 1 1 ${PX + 2.5} ${APEX - 1}Z`;

    const courses = [
      { svg: `<path class="paper" d="${legs}"/>`, still: true },
      { svg: `<path class="paper" d="${back}${arm}"/><path class="paper" d="${rails}"/>`, still: true },
      { svg: `<path d="${slingD(0)}"/><path d="${slingD(2.2)}" opacity="0.5"/>`, still: true },
      `<path class="paper" d="${pole}"/>`,
      `<path d="${ribs}"/><path class="paper" d="${runner}"/>`,
      `<path class="paper" d="${valance}${canopy}"/><path d="${seams}" opacity="0.4"/>`,
      `<path class="paper" d="${finial}"/>`,
    ];

    const outline = `<path d="${legs}${back}${slingD(0)}${pole}${canopy}${finial}" stroke-dasharray="${SET_OUT}"/>`;
    const back_on = shown(opts.figure);
    // The return date on a chain under the chair, the chair's footprint or
    // wider for a long date. dimension()'s default gap is too tight for
    // the mono figure, so it is passed a wider one.
    const onGround = (t) => {
      const half = Math.max(BACK_FOOT - X0, t.length * 6.4 + 22) / 2, mid = (X0 + BACK_FOOT) / 2;
      return dimension(n(mid - half), 10, n(mid + half), 10, t, { gapPerChar: 6.4 });
    };
    const LADDER = PX + 26;
    return {
      courses,
      outline,
      contents: `<path d="${seams}${ribs}"/>`,
      foot: [PX + POLE / 2, 0],
      top: APEX - 4,
      error: "lean",
      lean: 5,
      revise: [PX - SPAN - 4, APEX - 8, 2 * SPAN + 8, RIM - APEX + 14],
      tag: [PX + SPAN + 22, RIM - 4],
      tick: [PX + 18, APEX - 12],
      access: { kind: "ladder", at: LADDER, height: -RUNNER + 4, lean: 22 },
      extras: back_on ? onGround(back_on) : "",
      stations: {
        empty: { pose: "letterer", x: X0 - 22, y: 0, flip: true },        // pen at the front foot's set-out
        loading: { pose: "carrier", x: LADDER - 9, y: -40 },             // on the ladder, a canopy panel held up
        waiting: { pose: "hauler", x: LADDER + 52, y: 0, flip: true },
        idle: { pose: "sitter", x: n(low.x - 2), y: n(low.y + 1) },       // in the sling, feet over the front rail
        success: { pose: "sitter", x: n(low.x - 2), y: n(low.y + 1) },
        changed: { pose: "letterer", x: PX + 38, y: 0 },                  // pointing up at the canopy's cloud
        error: { pose: "shrugger", x: PX + 44, y: 0 },
      },
    };
  },
};
