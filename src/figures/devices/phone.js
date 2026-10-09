/* ===========================================================================
   Phone: a smartphone standing in a desk dock, front on. Mobile apps, scan
   to install, a code sent by text, two step sign in, push notifications.

   Reads by the rounded corners, the earpiece slot and the home bar. The
   body goes up in two courses, each an open path filled with the paper, so
   no seam shows where they meet.
   =========================================================================== */
import { rrect, lowerHalf, upperHalf } from "./_parts.js";

// Measured off the phone's left edge (X0). A worker is 45 tall.
const X0 = 96, W = 54, X1 = X0 + W, XM = X0 + W / 2;
const SEAT = -10, TOP = -118, R = 9;          // the body sits in the dock at SEAT
const CUT = (SEAT + TOP) / 2;                 // where the two body courses meet
const DOCK_B = 34, DOCK_T = 29, CHEEK = -16;  // dock half widths at foot and top, cheek top
const BEZEL = 4, SCR_T = TOP + 13, SCR_B = SEAT - 11;
const LADDER = X1 + 46;

export default {
  name: "phone",
  title: "Phone",
  shelf: "devices",
  use: "Mobile apps, scan to install, a code sent by text, two step sign in, push notifications",
  width: 300,
  height: 140,

  draw({ n, SET_OUT }) {
    // The dock: a low wedge, wider at the foot, with a cheek each side that
    // holds the phone's foot. Still, so it stays put when the phone leans.
    const dockFace = `M${XM - DOCK_B} 0L${XM - DOCK_T} ${SEAT}H${XM + DOCK_T}L${XM + DOCK_B} 0Z`;
    const cheeks = `M${X0 - 2} ${SEAT}V${CHEEK}H${X0 - 5}L${X0 - 6} ${SEAT}ZM${X1 + 2} ${SEAT}V${CHEEK}H${X1 + 5}L${X1 + 6} ${SEAT}Z`;

    // The body goes up in four bands. Each is filled with the paper and
    // open at its foot, reaching 2 below the band under it, so its fill
    // covers that band's flat top: no seam shows once the next is laid.
    const SX = X0 + BEZEL, SW = W - 2 * BEZEL;
    const tops = [0, 1, 2, 3].map((k) => SEAT + ((TOP - SEAT) * (k + 1)) / 4);
    const band = (k) => {
      const ya = tops[k], yb = k ? tops[k - 1] + 2 : SEAT;
      const body = k === 0 ? lowerHalf(X0, ya, W, SEAT, R) + "Z" : k === 3 ? upperHalf(X0, yb, W, TOP, R) : `M${X0} ${n(yb)}V${n(ya)}H${X1}V${n(yb)}`;
      const scr = k === 0 ? lowerHalf(SX, ya, SW, SCR_B, 4) : k === 3 ? upperHalf(SX, yb, SW, SCR_T, 4) : `M${SX} ${n(yb)}V${n(ya)}M${SX + SW} ${n(ya)}V${n(yb)}`;
      return `<path class="paper" d="${body}"/><path d="${scr}"/>`;
    };
    const screen = rrect(SX, SCR_T, SW, SCR_B - SCR_T, 4);

    // Last, the finish: a grid of app tiles under a short status row, faint,
    // standing for whatever the app shows; the earpiece slot near the top,
    // the home bar near the bottom, and the side buttons.
    let tiles = `M${SX + 5} ${SCR_T + 5}h7M${SX + SW - 12} ${SCR_T + 5}h7`;
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 3; c++) tiles += rrect(SX + 6 + c * 12.5, SCR_T + 12 + r * 14, 8, 8, 2);
    const ear = rrect(XM - 7, TOP + 5, 14, 2.6, 1.3);
    const bar = `M${XM - 9} ${SEAT - 5}H${XM + 9}`;
    const keys = `M${X0} ${TOP + 22}h-1.4v8h1.4M${X0} ${TOP + 34}h-1.4v8h1.4M${X1} ${TOP + 26}h1.4v13h-1.4`;
    const finish = `<path class="faint" d="${tiles}"/><path class="paper" d="${ear}"/><path d="${bar}${keys}" opacity="0.6"/>`;

    const courses = [
      { svg: `<path class="paper" d="${dockFace}"/><path class="paper" d="${cheeks}"/>`, still: true },
      band(0), band(1), band(2), band(3),
      finish,
    ];

    const outline = `<path d="${rrect(X0, TOP, W, SEAT - TOP, R)}${dockFace}${cheeks}" stroke-dasharray="${SET_OUT}"/>`;

    return {
      courses,
      outline,
      contents: `<path d="${screen}${ear}${bar}"/>`,
      foot: [X1, SEAT],         // leans off the dock's right cheek, toward the ladder
      top: TOP,
      error: "lean",
      lean: 4,
      revise: [SX - 3, SCR_T - 3, SW + 6, SCR_B - SCR_T + 6],
      tag: [X1 + 24, SCR_T + 6],
      tick: [X1 + 9, TOP - 4],
      access: { kind: "ladder", at: LADDER, height: -TOP - 14, lean: 22 },
      letter: { at: [14, -104], angle: -2, arrow: true },
      stations: {
        empty: { pose: "letterer", x: X1 + 26, y: 0 },             // pen at the dock's set-out
        loading: { pose: "carrier", x: LADDER - 10, y: -52 },      // on a rung, the screen held up
        waiting: { pose: "hauler", x: LADDER + 56, y: 0, flip: true },
        idle: { pose: "leaner", x: X0 - 44, y: 0 },
        success: { pose: "caller", x: X0 - 40, y: 0, flip: true },  // can to the ear, facing the phone
        changed: { pose: "letterer", x: X0 - 22, y: 0, flip: true },
        error: { pose: "shrugger", x: X1 + 52, y: 0 },             // beside the plumb line
      },
    };
  },
};
