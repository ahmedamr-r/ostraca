/* ===========================================================================
   Inbox: a two tier letter tray on a low stand, seen from the side.
   Inbox zero, no messages yet, new mail coming in, a message that failed
   to send.

   This file is one of the two worked examples the contract points at
   (CONTRACT.md). Read it top to bottom: constants, then the parts in build
   order, then the description the engine turns into six states. There is
   no state code here: the engine decides what each state shows.

   The trays face left (their open fronts toward x 0) so the ladder, the
   crew and the plumb line all have room on the right.
   =========================================================================== */

// Everything is measured off the lower tray's front edge (X0) and its length.
// A worker is 45 tall; these trays come out at about 124 by 76.
const X0 = 60, L = 124, XB = X0 + L; //  front, length, back
const STAND = -7;                     //  top of the stand's board
const FLOOR = -10, LIP = -20, BACK = -34;         // lower tray: floor top, lip top, back top
const STEP = 30;                                  // the upper tray sits this far back
const UFLOOR_B = -46, UFLOOR = -49, ULIP = -59, UBACK = -76; // upper tray
const GAP = 3.2;                      //  between stacked letters, enough to stay apart at 240px
const MAX = 8;                        //  letters drawn before the count goes on a chain

export default {
  name: "inbox",
  title: "Inbox",
  shelf: "messages",
  use: "Inbox zero, no messages yet, new mail coming in, a message that failed to send",
  width: 300,
  height: 112,
  measures: { what: "Unread messages", sample: 12 },

  draw({ n, SET_OUT, rng, seedFrom, rectPath, dimension, opts }) {
    // How many letters. A real count (opts.figure.value) draws one sheet
    // each up to MAX, lower tray first; 0 draws empty trays. With no count
    // the trays hold a few, which is a drawing, not a number.
    const count = Number.isFinite(opts.figure?.value) ? Math.max(0, Math.floor(opts.figure.value)) : null;
    const total = count == null ? 5 : Math.min(count, MAX);
    const lower = Math.min(total, 4), upper = total - lower;

    // A tray in profile: floor, a low front lip, a taller back. One closed
    // path with the paper fill, so whatever is behind it is knocked out.
    const tray = (x0, x1, fb, ft, lip, back) =>
      `<path class="paper" d="M${x0} ${fb}V${lip}H${x0 + 3}V${ft}H${x1 - 3}V${back}H${x1}V${fb}Z"/>`;

    // Letters lie on a slope from the lip down to the floor at the back,
    // each a thin sheet whose front corner shows past the lip. Seeded, so a
    // given count is always drawn the same way.
    const r = rng(seedFrom(`inbox-${total}`));
    const sheets = (front, floor, lip, k0, k1) => {
      let d = "", top = null;
      for (let k = k0; k < k1; k++) {
        const j = k - k0, nudge = (r() - 0.5) * 5;
        const fx = front - 5 + nudge, fy = lip - 1 - GAP * j;
        const bx = XB - 9 + nudge / 2, by = floor - 1.5 - GAP * j;
        // The sheet, and its turned front corner (a short tick down).
        d += `M${n(fx)} ${n(fy)}L${n(bx)} ${n(by)}M${n(fx)} ${n(fy)}l1.6 2.2`;
        top = { fx, fy, bx, by };
      }
      return { svg: d ? `<path d="${d}"/>` : "", top };
    };
    const low = sheets(X0, FLOOR, LIP, 0, lower);
    const up = sheets(X0 + STEP, UFLOOR, ULIP, 0, upper);

    // The stand: two feet and a board. A still course, so when the trays
    // lean the stand stays put under them.
    const stand = rectPath(X0 + 6, -3, 8, 3) + rectPath(XB - 14, -3, 8, 3) + rectPath(X0 - 2, STAND, L + 4, 3);
    // Four posts carry the upper tray; from the side two show, the back
    // one standing on the lower tray's back so no letter runs through it.
    const posts = rectPath(X0 + STEP + 3, UFLOOR_B, 3, FLOOR - UFLOOR_B) + rectPath(XB - 3, UFLOOR_B, 3, BACK - UFLOOR_B);

    // Courses, bottom to top: the build order loading inks them in, and the
    // paint order (later courses cover earlier ones). An empty letter
    // course is left out rather than drawn blank.
    const courses = [
      { svg: `<path class="paper" d="${stand}"/>`, still: true },
      tray(X0, XB, STAND, FLOOR, LIP, BACK),
      low.svg,
      `<path class="paper" d="${posts}"/>`,
      tray(X0 + STEP, XB, UFLOOR_B, UFLOOR, ULIP, UBACK),
      up.svg,
    ].filter(Boolean);

    // The set-out: both trays' profiles and the stand, dashed. Contents:
    // where the letters will lie, faint.
    const outline =
      `<path d="M${X0} ${STAND}V${LIP}H${X0 + 3}V${FLOOR}H${XB - 3}V${BACK}H${XB}V${STAND}Z` +
      `M${X0 + STEP} ${UFLOOR_B}V${ULIP}H${X0 + STEP + 3}V${UFLOOR}H${XB - 3}V${UBACK}H${XB}V${UFLOOR_B}Z` +
      `${stand}" stroke-dasharray="${SET_OUT}"/>`;
    const contents = `<path d="M${X0 + STEP + 3} ${FLOOR}V${UFLOOR_B}M${X0 - 4} ${LIP - 1}L${XB - 9} ${FLOOR - 1.5}M${X0 + STEP - 4} ${ULIP - 1}L${XB - 9} ${UFLOOR - 1.5}"/>`;

    // The revision cloud goes round the top letter, the one that changed;
    // with no letters, round the upper tray.
    const t = up.top ?? low.top;
    const revise = t ? [n(t.fx - 3), n(t.fy - 5), n(t.bx - t.fx + 2), n(t.by - t.fy + 7)] : [X0 + STEP - 4, ULIP - 6, L - STEP + 8, 16];

    // Past MAX, the real count on a short chain over the upper tray, clear
    // of the sitter at the back and the letterer at the front.
    const extras = count != null && count > MAX ? dimension(X0 + STEP, UBACK - 10, XB - 18, UBACK - 10, String(count)) : "";

    const LADDER = XB + 44; // the ladder's foot
    return {
      courses,
      outline,
      contents,
      foot: [XB, STAND], // the trays lean off the stand's back corner
      top: UBACK,
      error: "lean",
      lean: 5,
      revise,
      tag: [XB + 16, revise[1] - 2], // clear of the back, right of the cloud
      tick: [XB + 26, UBACK + 4], // past the sitter's feet on the back
      access: { kind: "ladder", at: LADDER, height: 76, lean: 22 },
      extras,
      stations: {
        empty: { pose: "letterer", x: XB + 24, y: 0 },        // pen at the back's set-out
        loading: { pose: "carrier", x: LADDER - 8, y: -40 },  // on a rung, letter held over the tray
        waiting: { pose: "hauler", x: LADDER + 56, y: 0, flip: true }, // at the gin wheel's fall
        idle: { pose: "sitter", x: XB - 1.5, y: UBACK + 3, flip: true },  // on the upper tray's back
        success: { pose: "sitter", x: XB - 1.5, y: UBACK + 3, flip: true },
        changed: { pose: "letterer", x: X0 - 30, y: 0, flip: true },
        error: { pose: "shrugger", x: XB + 50, y: 0 },        // beside the plumb line
      },
    };
  },
};
