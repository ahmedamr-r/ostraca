/* ===========================================================================
   Market stall: a counter under a striped awning, front on.
   Storefront, seller dashboard, product catalogue, a shop with no products
   yet, store closed.

   Out of true it sags: the counter top and the awning drop between the
   posts under a taut string line, and the goods ride the counter down.
   Every part that moves is drawn twice through ctx.sag(), from one
   builder, so the two drawings share their commands and tween.
   The valance hangs straight; it is never scalloped, so it cannot be read
   as a revision cloud.
   =========================================================================== */
import { countOf } from "./_parts.js";

// Measured off the left post's inner face (X0). A worker is 45 tall.
const X0 = 58, W = 160, X1 = X0 + W, XM = X0 + W / 2;
const PANEL = -40, TOP = -45;          // counter front's top, counter top's upper face
const POST = 3, POST_TOP = -100;       // post width, where the awning sits
const EAVE = -98, VAL = -86, RIDGE = -114; // awning front edge, valance foot, back of the slope
const OVER = 9;                         // the awning overhangs the posts
const STRIPE = 12;                      // valance stripe width
const DROP = 6;                         // the sag at the middle, in error
const MAX = 8;

export default {
  name: "market-stall",
  title: "Market stall",
  shelf: "shopping",
  use: "Storefront, seller dashboard, product catalogue, a shop with no products yet, store closed",
  width: 330,
  height: 136,
  measures: { what: "Products", sample: 6 },

  draw({ n, SET_OUT, sag, opts }) {
    const count = countOf(opts.figure);
    const total = count == null ? 5 : Math.min(count, MAX);

    // The sag: nothing at the posts, most in the middle.
    const dip = (x, s) => Math.max(0, s * (1 - ((x - XM) / (W / 2)) ** 2));
    const moves = (build, cls = "") => sag(build(0), build(DROP), cls);
    const P = (x, y, s) => `${n(x)} ${n(y + dip(x, s))}`;
    const q = (y, s) => n(y + 2 * dip(XM, s)); // a quadratic's control, twice the drop

    // The counter: a plain front panel between the posts, its top edge
    // riding the sag, a plinth line at its foot; the board on top.
    const panel = (s) => `M${X0} 0V${PANEL}Q${XM} ${q(PANEL, s)} ${X1} ${PANEL}V0Z`;
    const plinth = `<path d="M${X0} -5H${X1}" opacity="0.5"/>`;
    const board = (s) => `M${X0 - 6} ${TOP}Q${XM} ${q(TOP, s)} ${X1 + 6} ${TOP}V${TOP + 5}Q${XM} ${q(TOP + 5, s)} ${X0 - 6} ${TOP + 5}Z`;

    // The posts stand on the ground and do not move.
    const posts = `<path class="paper" d="M${X0 - POST} 0V${POST_TOP}H${X0}V0ZM${X1} 0V${POST_TOP}H${X1 + POST}V0Z"/>`;

    // The awning: its slope seen from the front, narrowing to the back, the
    // stripes running up it faint; then the valance hung off the eave.
    const ax0 = X0 - POST - OVER, ax1 = X1 + POST + OVER;
    const slope = (s) => `M${ax0} ${EAVE}Q${XM} ${q(EAVE, s)} ${ax1} ${EAVE}L${X1 + 4} ${RIDGE}H${X0 - 4}Z`;
    const stripesX = [];
    for (let x = ax0 + STRIPE; x < ax1 - 1; x += STRIPE) stripesX.push(x);
    const ribs = (s) => stripesX.map((x) => `M${P(x, EAVE, s)}L${n(X0 - 4 + ((x - ax0) / (ax1 - ax0)) * (X1 - X0 + 8))} ${RIDGE}`).join("");
    const valance = (s) => `M${P(ax0, EAVE, s)}Q${XM} ${q(EAVE, s)} ${ax1} ${EAVE}V${VAL}Q${XM} ${q(VAL, s)} ${ax0} ${VAL}Z`;
    // Alternate stripes carry faint lines, so the stripes read without a fill.
    const fill = (s) => {
      let d = "";
      [ax0, ...stripesX].forEach((x, i) => {
        if (i % 2) return;
        for (let k = 3; k < STRIPE && x + k < ax1 - 1; k += 3) d += `M${P(x + k, EAVE + 1, s)}L${P(x + k, VAL - 1, s)}`;
      });
      return d;
    };
    const divisions = (s) => stripesX.map((x) => `M${P(x, EAVE, s)}L${P(x, VAL, s)}`).join("");

    // The goods along the counter, left to right: a slatted crate, then a
    // pile of round fruit, in turn. Each rides the counter's sag.
    const SLOT = W / MAX;
    const crate = (x) => (s) => {
      const y = TOP - 12, w = SLOT - 3;
      return `M${P(x, TOP, s)}L${P(x, y, s)}L${P(x + w, y, s)}L${P(x + w, TOP, s)}Z`;
    };
    const slats = (x) => (s) => `M${P(x, TOP - 4, s)}L${P(x + SLOT - 3, TOP - 4, s)}M${P(x, TOP - 8, s)}L${P(x + SLOT - 3, TOP - 8, s)}`;
    const fruit = (x) => (s) => {
      const r = 2.8, cx = x + (SLOT - 3) / 2, row = [[-2 * r, -r], [0, -r], [2 * r, -r], [-r, -2.7 * r], [r, -2.7 * r], [0, -4.4 * r]];
      return row.map(([dx, dy]) => {
        const px = cx + dx, py = TOP + dy + dip(cx, s);
        return `M${n(px - r)} ${n(py)}A${r} ${r} 0 1 0 ${n(px + r)} ${n(py)}A${r} ${r} 0 1 0 ${n(px - r)} ${n(py)}Z`;
      }).join("");
    };
    const goods = [];
    for (let k = 0; k < total; k++) {
      const x = X0 + 1.5 + k * SLOT;
      goods.push(k % 2 === 0 ? moves(crate(x), "paper") + `<g opacity="0.5">${moves(slats(x))}</g>` : moves(fruit(x), "paper"));
    }

    const courses = [
      moves(panel, "paper") + plinth,
      moves(board, "paper"),
      posts,
      moves(slope, "paper") + `<g opacity="0.4">${moves(ribs)}</g>`,
      moves(valance, "paper") + `<g opacity="0.35">${moves(fill)}</g>` + moves(divisions),
      ...goods,
    ];

    const outline = `<path d="${panel(0)}${board(0)}M${X0 - POST} 0V${POST_TOP}H${X0}V0M${X1} 0V${POST_TOP}H${X1 + POST}V0${slope(0)}${valance(0)}" stroke-dasharray="${SET_OUT}"/>`;
    const contents = `<path d="${divisions(0)}${Array.from({ length: MAX }, (_, k) => k % 2 ? "" : crate(X0 + 1.5 + k * SLOT)(0)).join("")}"/>`;

    const SC = [X1 + 14, X1 + 44];
    return {
      courses,
      outline,
      contents,
      error: "sag",
      string: [[X0 - 8, TOP], [X1 + 8, TOP]],
      foot: [X1 + POST, 0],
      top: EAVE, // the scaffold climbs to the eave, not the awning's back
      revise: total ? [X0 - 2, TOP - 17, SLOT + 2, 20] : [X0 - 2, TOP - 14, W + 4, 16],
      tag: [X0 - 22, TOP - 30],
      tick: [ax1 + 6, EAVE - 6],
      access: { kind: "scaffold", at: SC },
      stations: {
        empty: { pose: "letterer", x: X0 - 26, y: 0, flip: true },
        loading: { pose: "carrier", x: SC[1] - 6, y: -2.5, ride: true },
        waiting: { pose: "hauler", x: SC[1] + 52, y: 0, flip: true },
        idle: { pose: "leaner", x: X1 + POST + 1, y: 0 },
        success: { pose: "caller", x: X0 - 18, y: 0 },
        changed: { pose: "letterer", x: X0 - 26, y: 0, flip: true },
        error: { pose: "shrugger", x: X1 + 30, y: 0 },
      },
    };
  },
};
