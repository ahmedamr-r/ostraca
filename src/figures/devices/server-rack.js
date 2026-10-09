/* ===========================================================================
   Server rack: a cabinet frame on short feet, a stack of server units in
   it, front on. Maintenance, status pages, outages, deploys, self hosting.

   Reads by the stacked slabs with their two lights. The frame rises with
   the units, one slot a course, so loading fills the rack from the floor.
   A real count (opts.figure.value, services from the app's status list)
   draws one unit each, up to eight.
   =========================================================================== */
import { rrect } from "./_parts.js";

// Measured off the frame's left edge (X0). A worker is 45 tall.
const X0 = 96, FW = 84, X1 = X0 + FW;
const FOOT = -4, PLINTH = -10;                 // feet, then the frame's base
const POST = 6, SLOT = 12, SLOTS = 9;          // side posts, slot pitch, slots
const TOP = PLINTH - SLOT * SLOTS;             // -118, under the top cap
const CAP = TOP - 6;                           // the frame's top
const BLANK = 4;                               // the slot that takes the blank panel
const MAX = 8;

export default {
  name: "server-rack",
  title: "Server rack",
  shelf: "devices",
  use: "Maintenance, status pages, outages, deploys, self hosting",
  width: 320,
  height: 156,
  measures: { what: "Services", sample: 6 },

  draw({ n, SET_OUT, dimension, opts }) {
    const count = Number.isFinite(opts.figure?.value) ? Math.max(0, Math.floor(opts.figure.value)) : null;
    const units = Math.min(count ?? 6, MAX);
    // Units fill the slots from the floor, stepping over the blank panel.
    const filled = [0, 1, 2, 3, 5, 6, 7, 8].slice(0, units);

    const top = (k) => PLINTH - SLOT * (k + 1);
    const UX0 = X0 + POST, UX1 = X1 - POST, UW = UX1 - UX0;

    // One slot: the frame's two posts beside it (with a mounting hole each
    // side), a paper back reaching 0.5 under the slot below so its fill
    // covers that slot's top line, and whatever stands in it.
    const slot = (k) => {
      const ya = top(k), yb = ya + SLOT + (k ? 0.5 : 0);
      const back = `M${X0} ${n(yb)}V${ya}H${X1}V${n(yb)}`;
      const posts = `M${UX0} ${n(yb)}V${ya}M${UX1} ${ya}V${n(yb)}`;
      const holes = `M${X0 + 3} ${ya + 3}v1.4M${X0 + 3} ${ya + 8}v1.4M${X1 - 3} ${ya + 3}v1.4M${X1 - 3} ${ya + 8}v1.4`;
      let item = "";
      const y = ya + 1, h = SLOT - 2;
      if (k === BLANK) {
        item = `<path class="paper" d="${rrect(UX0 + 1, y, UW - 2, h, 1)}"/><path d="M${UX0 + 4} ${y + h / 2}h1M${UX1 - 5} ${y + h / 2}h1" opacity="0.5"/>`;
      } else if (filled.includes(k)) {
        // A unit: vent slots or drive bays down its face, two lights at its right end.
        let face = "";
        if (k % 2) for (let x = UX0 + 6; x < UX1 - 18; x += 3.2) face += `M${n(x)} ${y + 3}v${h - 6}`;
        else for (let x = UX0 + 5; x < UX1 - 20; x += 9) face += rrect(x, y + 2.5, 7, h - 5, 0.8);
        item = `<path class="paper" d="${rrect(UX0 + 1, y, UW - 2, h, 1)}"/><path class="faint" d="${face}"/>` +
          `<circle cx="${UX1 - 11}" cy="${y + h / 2}" r="1.5"/><circle cx="${UX1 - 6}" cy="${y + h / 2}" r="1.5"/>`;
      } else {
        item = `<path class="faint" d="M${UX0 + 2} ${ya + SLOT / 2}H${UX1 - 2}" stroke-dasharray="1 3"/>`; // rails, nothing in them
      }
      return `<path class="paper" d="${back}"/><path d="${posts}"/><path class="faint" d="${holes}"/>${item}`;
    };

    // Feet: a pair at the front corners, the far pair fainter and inboard.
    const feet = rrect(X0 + 2, FOOT, 8, -FOOT, 1) + rrect(X1 - 10, FOOT, 8, -FOOT, 1);
    const farFeet = `M${X0 + 16} 0V${FOOT}H${X0 + 22}V0M${X1 - 22} 0V${FOOT}H${X1 - 16}V0`;
    const plinth = rrect(X0 - 1, PLINTH, FW + 2, FOOT - PLINTH, 1);
    // Hinges down the left post, where the door hung.
    const hinges = [1, 4, 7].map((k) => `M${X0} ${top(k) + 2}h-1.6v6h1.6`).join("");
    const cap = rrect(X0 - 2, CAP, FW + 4, TOP - CAP, 1.5);

    const courses = [
      { svg: `<path d="${farFeet}" opacity="0.5"/><path class="paper" d="${feet}"/>`, still: true },
      `<path class="paper" d="${plinth}"/>`,
      ...Array.from({ length: SLOTS }, (_, k) => slot(k) + (k === 4 ? `<path d="${hinges}"/>` : "")),
      `<path class="paper" d="${cap}"/><path class="faint" d="M${X0 + 8} ${CAP + 3}H${X1 - 8}"/>`,
    ];

    let inside = "";
    for (let k = 0; k < SLOTS; k++) inside += `M${UX0} ${top(k)}H${UX1}`;
    const outline = `<path d="${rrect(X0 - 2, CAP, FW + 4, PLINTH - CAP, 1.5)}${rrect(X0 - 1, PLINTH, FW + 2, FOOT - PLINTH, 1)}${feet}" stroke-dasharray="${SET_OUT}"/>`;

    // The cloud goes round the top unit, the service that was updated.
    const last = filled.length ? filled[filled.length - 1] : BLANK;
    const ry = top(last);

    // Past eight, the real count on a short chain over the cap, clear of
    // the sitter at its left end.
    const extras = count != null && count > MAX ? dimension(X0 + 44, CAP - 10, X1 - 4, CAP - 10, String(count)) : "";

    return {
      courses,
      extras,
      outline,
      contents: `<path d="M${UX0} ${PLINTH}V${TOP}M${UX1} ${PLINTH}V${TOP}${inside}"/>`,
      foot: [X0, PLINTH],          // leans off the left corner, away from the crew
      top: CAP,
      error: "lean",
      lean: 5,
      revise: [UX0 - 3, ry + 0.5, UW + 6, SLOT - 1],
      tag: [X1 + 22, ry - 4],
      tick: [X1 + 12, CAP - 8],
      access: { kind: "scaffold", at: [X1 + 8, X1 + 36] },
      stations: {
        empty: { pose: "letterer", x: X1 + 26, y: 0 },
        loading: { pose: "carrier", x: X1 + 30, y: -2.5, ride: true },  // on the board, the next unit held to its slot
        waiting: { pose: "hauler", x: X1 + 100, y: 0, flip: true },
        idle: { pose: "leaner", x: X1 + 14, y: 0 },                      // against the side
        success: { pose: "sitter", x: X0 + 30, y: CAP, flip: true },     // on top
        changed: { pose: "letterer", x: X1 + 26, y: 0 },
        error: { pose: "shrugger", x: X1 + 26, y: 0 },                   // on the side it leans away from
      },
    };
  },
};
