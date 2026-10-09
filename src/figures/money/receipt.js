/* ===========================================================================
   Receipt: a receipt printer on a short stand, front on, its paper rising
   out of the slot and curling over to hang down the front past the stand,
   torn off in a zigzag. Invoices, receipts, billing history, statements,
   refunds.

   Reads by the zigzag torn edge. Built stand, box, slot, then the strip
   line by line as it prints, from the slot out to the torn end. The ladder
   is on the right (the brief asked for the left, but the gin wheel's jib
   only reaches out to the right), and the box leans that way.

   opts.figure: with a unit, the total on a chain standing up the box's
   left side, from the ground to over the curl ({ value: 1240, unit: "EGP" }); a whole number with no unit is a count
   of line items, one ruled line each up to ten ({ value: 4 }).
   =========================================================================== */
import { shown, countOf, roundTop, upright } from "./_parts.js";

// Measured off the box's left side (X0). A worker is 45 tall.
const X0 = 116, BW = 76, X1 = X0 + BW, CX = X0 + BW / 2;
const STAND = -24, BT = -56;                 // stand's top, box top
const SW = 44, SX0 = CX - SW / 2, SX1 = CX + SW / 2;  // the strip
const CURL = BT - 8;                         // the fold, just over the slot
const HEAD = BT + 4;                         // where the printed part starts
const SLOTS = 10, LH = 4.3;                  // ruled lines, and their pitch
const END = -2;                              // the torn end, past the stand
const TEETH = 6, BITE = 4.5;

export default {
  name: "receipt",
  title: "Receipt",
  shelf: "money",
  use: "Invoices, receipts, billing history, statements, refunds",
  width: 300,
  height: 118,
  measures: { what: "The total, or with no unit a count of line items", unit: "EGP", sample: 1240 },

  draw(ctx) {
    const { n, SET_OUT, rng, seedFrom, rectPath, opts } = ctx;
    const count = countOf(opts.figure);
    const lines = count == null ? 6 : Math.min(count, SLOTS);
    const total = count == null ? shown(opts.figure) : count > SLOTS ? String(count) : "";
    const r = rng(seedFrom("receipt"));
    const lens = Array.from({ length: SLOTS }, () => 0.35 + r() * 0.35);

    // The stand: a board on two legs set wide, so the strip hangs between them.
    const stand = rectPath(X0 + 3, STAND + 3, 6, -STAND - 3) + rectPath(X1 - 9, STAND + 3, 6, -STAND - 3) + rectPath(X0 - 3, STAND, BW + 6, 3);
    const box = roundTop(X0, BT, BW, STAND - BT, 7);
    // The lid's seam and a feed button either side of where the strip hangs.
    const lid = `M${X0} ${BT + 10}H${SX0}M${SX1} ${BT + 10}H${X1}`;
    const button = `M${X1 - 12} ${BT + 17}h5v3h-5Z`;
    // The slot, with the tear bar's teeth along its lip.
    let slot = `M${SX0 - 6} ${BT}V${BT + 2.5}H${SX1 + 6}V${BT}`;
    for (let x = SX0 - 5; x < SX1 + 5; x += 2.5) slot += `M${n(x)} ${BT + 2.5}l1.25 1.2l1.25 -1.2`;

    // The strip in pieces, each a paper face with only its sides stroked, so
    // the pieces join without seams. The first is the curl over the top.
    const side = (y0, y1) => `<path d="M${SX0} ${n(y0)}V${n(y1)}M${SX1} ${n(y0)}V${n(y1)}"/>`;
    const face = (d) => `<path class="paper" style="stroke:none" d="${d}"/>`;
    const capD = `M${SX0} ${HEAD}V${CURL + 4}Q${SX0} ${CURL} ${SX0 + 4} ${CURL}H${SX1 - 4}Q${SX1} ${CURL} ${SX1} ${CURL + 4}V${HEAD}`;
    const cap = face(capD + "Z") + `<path d="${capD}"/><path d="M${SX0} ${CURL + 4.5}Q${CX} ${CURL + 8} ${SX1} ${CURL + 4.5}" opacity="0.45"/>`;
    const rowY = (i) => HEAD + (i + 1) * LH;
    // Under the last item, the total's double rule.
    const rule = (i) => `M${SX0 + 4} ${n(rowY(i) - 3)}H${SX1 - 4}M${SX0 + 4} ${n(rowY(i) - 1.2)}H${SX1 - 4}`;
    const ruled = (i) => `M${SX0 + 4} ${n(rowY(i) - 1.5)}H${n(SX0 + 4 + (SW - 18) * lens[i])}M${SX1 - 10} ${n(rowY(i) - 1.5)}H${SX1 - 4}`;
    const pieces = [];
    for (let i = 0; i < SLOTS; i++) {
      const y0 = HEAD + i * LH, y1 = y0 + LH;
      const mark = i < lines ? `<path d="${ruled(i)}" opacity="0.5"/>` : i === lines ? `<path d="${rule(i)}" opacity="0.6"/>` : "";
      pieces.push(face(rectPath(SX0, y0, SW, LH)) + side(y0, y1) + mark);
    }
    // The foot: the torn end.
    const FOOT0 = HEAD + SLOTS * LH;
    let zig = `M${SX0} ${FOOT0}V${END}`;
    for (let k = 0; k < TEETH; k++) zig += `L${n(SX0 + ((k + 0.5) * SW) / TEETH)} ${END - BITE}L${n(SX0 + ((k + 1) * SW) / TEETH)} ${END}`;
    zig += `V${FOOT0}`;
    const foot = face(zig + "Z") + `<path d="${zig}"/>` + (lines >= SLOTS ? `<path d="${rule(SLOTS)}" opacity="0.6"/>` : "");

    const courses = [
      { svg: `<path class="paper" d="${stand}"/>`, still: true },
      `<path class="paper" d="${box}"/><path d="${lid}${button}" opacity="0.5"/>`,
      `<path d="${slot}"/>`,
      cap,
      ...pieces,
      foot,
    ];

    let strip = capD;
    strip += `M${SX0} ${HEAD}V${END}`;
    for (let k = 0; k < TEETH; k++) strip += `L${n(SX0 + ((k + 0.5) * SW) / TEETH)} ${END - BITE}L${n(SX0 + ((k + 1) * SW) / TEETH)} ${END}`;
    strip += `V${HEAD}`;
    const outline = `<path d="${stand}${box}${strip}" stroke-dasharray="${SET_OUT}"/>`;
    const contents = `<path d="${Array.from({ length: SLOTS }, (_, i) => ruled(i)).join("")}"/>`;

    const ry = rowY(Math.min(2, Math.max(lines - 1, 0))) - 1.5; // the third line is the charge that changed
    const LADDER = X1 + 30; // on the right: the gin wheel's jib only reaches out that way
    const TOTAL = X0 - 14; // the total stands up the left side, clear of the strip and the legs
    return {
      courses,
      outline,
      contents,
      foot: [X1, STAND],
      top: CURL,
      error: "lean",
      lean: 5,
      revise: [SX0 - 3, n(ry - 4.5), SW + 6, 9],
      tag: [X1 + 20, BT - 12],
      tick: [X1 + 8, BT - 8],
      letter: { at: [X1 + 14, -24], angle: -2, arrow: false },
      access: { kind: "ladder", at: LADDER, height: -BT, lean: 18 },
      extras: total ? upright(ctx, TOTAL, 0, CURL - 8, total) : "",
      stations: {
        empty: { pose: "letterer", x: X1 + 20.8, y: 0 },               // pen at the box's set-out
        loading: { pose: "carrier", x: LADDER - 6, y: -36 },           // on the ladder, the paper roll held up
        waiting: { pose: "hauler", x: LADDER + 56, y: 0, flip: true },
        idle: { pose: "leaner", x: X1 + 10, y: 0 },                     // by the stand, clear of the total
        success: { pose: "sitter", x: X1 + 26, y: 0 },                  // on the ground, facing the finished work
        changed: { pose: "letterer", x: X1 + 26, y: 0 },                // pointing up at the line
        error: { pose: "shrugger", x: X1 + 52, y: 0 },                  // beside the plumb line
      },
    };
  },
};
