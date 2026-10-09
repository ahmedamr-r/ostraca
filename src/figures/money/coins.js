/* ===========================================================================
   Coins: stacks of coins side by side on the ground, front on, stepping up
   to the right. Balance, savings, earnings, points, cashback, top ups.

   Reads by the milled edges and the stepped stacks. Built one coin at a
   time from the bottom, across the stacks from left to right. Only the
   tallest stack leans when something goes wrong; the others stay true
   (still courses), and a pusher holds the leaning one.

   opts.figure: the balance, on an upright chain measuring the tallest
   stack ({ value: 1240, unit: "EGP" }).
   =========================================================================== */
import { shown, upright } from "./_parts.js";

// Measured off the first stack's left edge (X0). A worker is 45 tall.
const X0 = 72, CW = 22, GAP = 6, T = 4.6;   // coin width, gap between stacks, thickness
const STACKS = [5, 8, 11, 15];              // coins per stack, left to right
const MILL = 3;                             // spacing of the milled lines
const LAST = STACKS.length - 1;
const sx = (i) => X0 + i * (CW + GAP);
const X1 = sx(LAST) + CW;                   // the tallest stack's right edge
const TOP = -STACKS[LAST] * T;

export default {
  name: "coins",
  title: "Coins",
  shelf: "money",
  use: "Balance, savings, earnings, points, cashback, top ups",
  width: 300,
  height: 112,
  measures: { what: "The balance", unit: "EGP", sample: 1240 },

  draw(ctx) {
    const { n, SET_OUT, rng, seedFrom, opts } = ctx;
    const r = rng(seedFrom("coins"));
    // Each coin sits a little off the one under it, as stacked by hand.
    const nudge = STACKS.map((h) => Array.from({ length: h }, (_, k) => (k ? (r() - 0.5) * 2.4 : 0)));

    // A coin on its edge: a slab with eased ends, the milled lines short
    // ticks along its edge. The top coin of a stack shows its rim as a
    // second line just under its top face.
    const coin = (i, k) => {
      const x = n(sx(i) + nudge[i][k]), y = n(-(k + 1) * T), top = k === STACKS[i] - 1;
      let mill = "";
      for (let m = x + 2.5; m < x + CW - 2; m += MILL) mill += `M${n(m)} ${n(y + 1.3)}V${n(y + T - 1.1)}`;
      const slab = `M${n(x + 1)} ${y}H${n(x + CW - 1)}Q${n(x + CW)} ${y} ${n(x + CW)} ${n(y + 1)}V${n(y + T - 1)}Q${n(x + CW)} ${n(y + T)} ${n(x + CW - 1)} ${n(y + T)}H${n(x + 1)}Q${x} ${n(y + T)} ${x} ${n(y + T - 1)}V${n(y + 1)}Q${x} ${y} ${n(x + 1)} ${y}Z`;
      return `<path class="paper" d="${slab}"/><path d="${mill}" opacity="${top ? 0.35 : 0.5}"/>` +
        (top ? `<path d="M${n(x + 1.5)} ${n(y + 1.4)}H${n(x + CW - 1.5)}"/>` : "");
    };

    // Courses: level by level, left to right, so the stacks rise together
    // and the tallest goes on alone at the end.
    const courses = [];
    for (let k = 0; k < STACKS[LAST]; k++)
      STACKS.forEach((h, i) => { if (k < h) courses.push(i === LAST ? coin(i, k) : { svg: coin(i, k), still: true }); });

    // The set-out: each stack's footprint and height, the coin lines faint.
    const outline = `<path d="${STACKS.map((h, i) => `M${sx(i)} 0V${n(-h * T)}H${sx(i) + CW}V0`).join("")}" stroke-dasharray="${SET_OUT}"/>`;
    const contents = `<path d="${STACKS.map((h, i) => Array.from({ length: h - 1 }, (_, k) => `M${sx(i)} ${n(-(k + 1) * T)}h${CW}`).join("")).join("")}"/>`;

    // The first stack's top two coins are the ones that changed.
    const rev = [sx(0) - 4, n(-STACKS[0] * T - 4), CW + 8, n(2 * T + 7)];
    const balance = shown(opts.figure);
    const CHAIN = X0 - 42; // out past where the changed letterer stands
    const extras = balance
      ? `<g class="ink dim"><path d="M${CHAIN - 3} ${n(TOP)}H${sx(LAST) - 3}" opacity="0.5" stroke-dasharray="1.5 2.5"/></g>` + upright(ctx, CHAIN, 0, TOP, balance)
      : "";

    return {
      courses,
      outline,
      contents,
      foot: [X1, 0], // the tallest stack leans off its own right corner
      top: TOP,
      error: "lean",
      // A loose stack topples further than a wall.
      lean: 10,
      revise: rev,
      tag: [sx(0) + CW / 2, rev[1] - 14],
      tick: [X1 + 20, TOP - 20],
      access: { kind: "scaffold", at: [X1 + 8, X1 + 42] },
      extras,
      stations: {
        empty: { pose: "letterer", x: X1 + 20.8, y: 0 },              // pen at the tallest stack's set-out
        loading: { pose: "carrier", x: X1 + 32, y: -2.5, ride: true }, // on the board, the next coin held over
        waiting: { pose: "hauler", x: X1 + 100, y: 0, flip: true },
        idle: { pose: "sitter", x: X1 - 1.5, y: TOP + 3, flip: true },     // on the tallest stack
        success: { pose: "sitter", x: X1 - 1.5, y: TOP + 3, flip: true },
        changed: { pose: "letterer", x: X0 - 26, y: 0, flip: true },   // pen at the first stack's cloud
        error: { pose: "shrugger", x: X1 + 40, y: 0 },                 // past the plumb line, clear of the stack
      },
    };
  },
};
