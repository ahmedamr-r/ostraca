/* ===========================================================================
   Calendar: a standing desk calendar, front on, as tall as a door. A page
   of day cells hangs by its binding rings from the frame's top bar; the
   frame's two posts splay into a foot at each side.
   Schedule, bookings, events, no meetings today, a booking that failed.

   With a real date (opts.figure.value, "2026-10-09") the month's real
   length sets how many cells are drawn, weeks start on Monday, and the
   day is ringed with its number in it. With none, the cells stay empty.
   =========================================================================== */
import { dateOf, daysIn, firstWeekday, oval } from "./_parts.js";

// Measured off the page's left edge (X0). A worker is 45 tall.
const X0 = 84, PW = 105, XR = X0 + PW;      // page: left, width, right
const POST = 3, GAP = 2;                    // frame post width, gap to the page
const PL = X0 - GAP - POST, PR = XR + GAP;  // the posts' left edges
const KNEE = -18, SPLAY = 7;                // where the posts kick out, and how far
const BAR = -114, BAR_H = 4;                // the frame's top bar
const PTOP = -106, HEAD = -97, GRID = -82, PBOT = -16; // page top, header band, grid top, page foot
const INSET = 5, COLS = 7;
const CW = (PW - 2 * INSET) / COLS;         // a day cell's width
const RINGS = 11;

export default {
  name: "calendar",
  title: "Calendar",
  shelf: "time",
  use: "Schedule, bookings, events, no meetings today, a booking that failed",
  width: 320,
  height: 134,
  measures: { what: "Date", sample: "2026-10-09" },

  draw({ n, SET_OUT, rectPath, esc, opts }) {
    // The month from the app, or five empty weeks.
    const date = dateOf(opts.figure);
    const lead = date ? firstWeekday(date.year, date.month) : 0;
    const days = date ? daysIn(date.year, date.month) : COLS * 5;
    const rows = Math.ceil((lead + days) / COLS);
    const RH = (PBOT - INSET - GRID) / rows;  // a row's height
    const cellX = (c) => X0 + INSET + c * CW;
    const rowY = (r) => GRID + r * RH;        // r counts down from the top week
    const where = (k) => ({ c: (lead + k) % COLS, r: Math.floor((lead + k) / COLS) });

    // Feet: a block under each splayed post. Still, so the frame leans off them.
    const feet = rectPath(PL - SPLAY - 6, -3, 12, 3) + rectPath(PR + SPLAY - 3, -3, 12, 3);
    // The posts: straight down to the knee, then out to the foot.
    const post = (x, s) => `M${x} ${BAR + BAR_H}V${KNEE}L${x + s} -3H${x + s + POST}L${x + POST} ${KNEE}V${BAR + BAR_H}Z`;
    const posts = post(PL, -SPLAY) + post(PR, SPLAY);
    const rail = rectPath(PL, PBOT, PR + POST - PL, 3);

    // A week: the page's strip, and the outline of each day it holds.
    const week = (r) => {
      let cells = "";
      for (let c = 0; c < COLS; c++) {
        const k = r * COLS + c - lead;
        if (k >= 0 && k < days) cells += rectPath(n(cellX(c)), n(rowY(r)), n(CW), n(RH));
      }
      // The strip is filled but only its sides are drawn, so weeks do not
      // read as heavy rules; the last one closes the page's foot.
      const y0 = n(rowY(r) - (r === 0 ? 0.5 : 0)), y1 = n(rowY(r) + RH + (r === rows - 1 ? INSET : 0));
      let svg = `<path class="paper" stroke="none" d="${rectPath(X0, y0, PW, n(y1 - y0))}"/>` +
        `<path d="M${X0} ${y0}V${y1}M${XR} ${y0}V${y1}${r === rows - 1 ? `M${X0} ${y1}H${XR}` : ""}"/>`;
      if (cells) svg += `<path d="${cells}" opacity="0.55"/>`;
      // The app's day: ringed, its number in the mono face.
      if (date && where(date.day - 1).r === r) {
        const { c } = where(date.day - 1);
        const cx = cellX(c) + CW / 2, cy = rowY(r) + RH / 2;
        svg += `<path d="${oval(n(cx), n(cy), n(CW / 2 + 2.5), n(RH / 2 + 2.5))}"/>`;
        svg += `<text class="fig" x="${n(cx)}" y="${n(cy + 2.6)}" text-anchor="middle" style="font-size:7.5px">${esc(String(date.day))}</text>`;
      }
      return svg;
    };

    // The header band over the grid, with a faint mark for each weekday's name.
    let names = "";
    for (let c = 0; c < COLS; c++) names += `M${n(cellX(c) + CW / 2 - 2)} ${GRID - 4}h4`;
    const header = `<path class="paper" d="${rectPath(X0, HEAD, PW, GRID - HEAD)}"/>` +
      `<path d="${rectPath(X0 + INSET, HEAD + 3, PW - 2 * INSET, GRID - HEAD - 9)}"/><path d="${names}" opacity="0.5"/>`;

    // The binding: the page's head with a punched hole for each ring, the
    // frame's top bar, and the rings looped over it.
    const rx = (i) => n(X0 + 7 + (i * (PW - 14)) / (RINGS - 1));
    let holes = "", loops = "";
    for (let i = 0; i < RINGS; i++) {
      holes += oval(rx(i), PTOP + 4.5, 1, 1);
      loops += `M${n(rx(i) - 1.5)} ${PTOP + 5}V${BAR - 1.5}A1.5 1.5 0 0 1 ${n(rx(i) + 1.5)} ${BAR - 1.5}V${PTOP + 5}`;
    }
    const binding = `<path class="paper" d="${rectPath(X0, PTOP, PW, HEAD - PTOP)}${rectPath(PL, BAR, PR + POST - PL, BAR_H)}"/>` +
      `<path d="${holes}" opacity="0.6"/><path d="${loops}"/>`;

    const courses = [{ svg: `<path class="paper" d="${feet}"/>`, still: true }, `<path class="paper" d="${posts}${rail}"/>`];
    for (let r = rows - 1; r >= 0; r--) courses.push(week(r));
    courses.push(header, binding);

    const outline = `<path d="${feet}${posts}${rail}${rectPath(X0, PTOP, PW, PBOT - PTOP)}${rectPath(PL, BAR, PR + POST - PL, BAR_H)}" stroke-dasharray="${SET_OUT}"/>`;
    let grid = "";
    for (let r = 0; r <= rows; r++) grid += `M${X0 + INSET} ${n(rowY(r))}H${XR - INSET}`;
    for (let c = 0; c <= COLS; c++) grid += `M${n(cellX(c))} ${GRID}V${PBOT - INSET}`;

    // The event that moved: the last day of the second week from the foot,
    // a full week in any month, low enough for a letterer on the ground.
    const rr = rows - 2, revise = [n(cellX(COLS - 1) - 3), n(rowY(rr) - 3), n(CW + 6), n(RH + 6)];
    const FOOT = PR + SPLAY + 9; // the right foot's outer corner
    const SC = PR + 20;         // the scaffold bay's near standard
    return {
      courses,
      outline,
      contents: `<path d="${grid}${rectPath(X0, HEAD, PW, GRID - HEAD)}"/>`,
      foot: [FOOT, -3],
      top: BAR,
      error: "lean",
      lean: 4,
      revise,
      tag: [PR + 34, rowY(rr) - 22],
      tick: [PR + 12, BAR - 8],
      access: { kind: "scaffold", at: [SC, SC + 34] },
      stations: {
        empty: { pose: "letterer", x: PL - 18, y: 0, flip: true },     // pen at the left post's set-out
        loading: { pose: "carrier", x: SC + 24, y: -2.5, ride: true }, // on the board, the next week held up
        waiting: { pose: "hauler", x: SC + 92, y: 0, flip: true },
        idle: { pose: "leaner", x: PR + POST + 4, y: 0 },                 // hand on the right post, by its foot
        success: { pose: "letterer", x: PR + 16, y: 0 },
        changed: { pose: "letterer", x: PR + 16, y: 0 },                // pen at the moved day's cloud
        error: { pose: "shrugger", x: PR + 62, y: 0 },
      },
    };
  },
};
