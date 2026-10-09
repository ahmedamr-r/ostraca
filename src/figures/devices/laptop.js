/* ===========================================================================
   Laptop: an open laptop on a desk top carried on two trestles, front on.
   Desktop apps, installs, signing in on a new computer, sync, a device gone
   offline.

   The second worked example in CONTRACT.md, and the one for "sag": out of
   true, the desk top sags under a taut string line and the laptop rides it
   down. Every part that moves in error is drawn twice through ctx.sag(d0,
   d1), once true and once dropped, from the same path builder, so the two
   paths share their commands and the engine can tween between them.
   =========================================================================== */

// Measured off the desk's left end (X0). A worker is 45 tall.
const X0 = 50, DW = 150, XM = X0 + DW / 2;   // desk: left end, width, middle
const DESK = -54, BOARD = 4;                  // desk top's upper face, its thickness
const TRESTLES = [X0 + 26, X0 + DW - 26];     // where the two trestles stand
const SPLAY = 12;                             // each trestle leg's spread at the floor
const BASE_W = 92, BASE_H = 6;                // the laptop's deck
const LID_W = 72, LID_H = 50, BEZEL = 4;      // its lid, and the screen's inset
const DROP = 6;                               // the desk top's sag at its middle, in error

export default {
  name: "laptop",
  title: "Laptop",
  shelf: "devices",
  use: "Desktop apps, installs, signing in on a new computer, a device gone offline",
  width: 300,
  height: 132,

  draw({ n, SET_OUT, sag, rectPath }) {
    // The sag. A point on the desk drops by `dip(x)` (most in the middle,
    // none at the trestles' ends). The laptop is rigid, so it drops by the
    // dip under its own two ends: it comes to rest on them.
    const dip = (x, s) => s * (1 - ((x - XM) / (DW / 2)) ** 2);
    const bx0 = XM - BASE_W / 2, bx1 = XM + BASE_W / 2;
    const ride = (x, s) => dip(bx0, s) + ((dip(bx1, s) - dip(bx0, s)) * (x - bx0)) / BASE_W;
    // Each builder takes the drop `s` and returns path data. moves(build)
    // gives the true and the dropped drawing as one engine sag.
    const moves = (build, cls = "") => sag(build(0), build(DROP), cls);
    const P = (x, y, s) => `${n(x)} ${n(y + ride(x, s))}`;
    const box = (x, y, w, h) => (s) => `M${P(x, y, s)}L${P(x + w, y, s)}L${P(x + w, y + h, s)}L${P(x, y + h, s)}Z`;

    // Trestles: an A each, a head block under the board, a bar across.
    // Their heads go down with the board; their feet stay on the ground.
    const trestle = (x) => {
      const top = DESK + BOARD;
      const head = (s) => { const y = top + dip(x, s); return `M${n(x - 8)} ${n(y)}H${x + 8}V${n(y + 3)}H${x - 8}Z`; };
      const legs = (s) => { const y = n(top + 3 + dip(x, s)); return `M${x - 4} ${y}L${x - SPLAY} 0M${x + 4} ${y}L${x + SPLAY} 0`; };
      return moves(head, "paper") + moves(legs) + `<path d="M${x - 9} -18H${x + 9}"/>`;
    };

    // The desk top: a board whose faces curve down by dip() when it sags.
    const board = (s) => {
      const q = (y) => n(y + 2 * dip(XM, s)); // a quadratic's control sits at twice the drop
      return `M${X0} ${DESK}Q${XM} ${q(DESK)} ${X0 + DW} ${DESK}V${DESK + BOARD}Q${XM} ${q(DESK + BOARD)} ${X0} ${DESK + BOARD}Z`;
    };

    // The laptop: the deck with a faint row of keys, then the lid with the
    // screen inset and a few faint rows standing for what is on it.
    const LX = XM - LID_W / 2, LT = DESK - BASE_H - LID_H;
    const keys = (s) => {
      let d = "";
      for (let x = bx0 + 6; x < bx1 - 8; x += 5) d += `M${P(x, DESK - 2.5, s)}L${P(x + 2.5, DESK - 2.5, s)}`;
      return d;
    };
    const SX = LX + BEZEL, ST = LT + BEZEL, SW = LID_W - 2 * BEZEL, SH = LID_H - BEZEL - 6;
    const rows = (s) => [0.55, 0.8, 0.4, 0.7].map((f, i) => `M${P(SX + 6, ST + 10 + i * 7, s)}L${P(SX + 6 + (SW - 12) * f, ST + 10 + i * 7, s)}`).join("");

    const courses = [
      trestle(TRESTLES[0]),
      trestle(TRESTLES[1]),
      moves(board, "paper"),
      moves(box(bx0, DESK - BASE_H, BASE_W, BASE_H), "paper") + moves(keys, "faint"),
      moves(box(LX, LT, LID_W, LID_H), "paper") + moves(box(SX, ST, SW, SH)) +
        `<g opacity="0.6">${moves((s) => `M${P(XM - 0.6, LT + 2, s)}L${P(XM + 0.6, LT + 2, s)}`)}</g>`, // the camera
      moves(rows, "faint"),
    ];

    const outline =
      `<path d="${board(0)}${box(bx0, DESK - BASE_H, BASE_W, BASE_H)(0)}${box(LX, LT, LID_W, LID_H)(0)}` +
      TRESTLES.map((x) => `M${x - SPLAY} 0L${x - 4} ${DESK + BOARD + 3}H${x + 4}L${x + SPLAY} 0`).join("") + `" stroke-dasharray="${SET_OUT}"/>`;

    const LADDER = X0 + DW + 20; // the ladder's foot; it leans on the desk's end
    return {
      courses,
      outline,
      contents: `<path d="${box(SX, ST, SW, SH)(0)}${rows(0)}"/>`,
      foot: [X0 + DW, DESK],
      top: LT,
      error: "sag",
      string: [[X0 - 4, DESK], [X0 + DW + 4, DESK]],
      revise: [SX - 3, ST - 3, SW + 6, SH + 6],
      tag: [LX + LID_W + 26, LT + 2], // above the letterer's head, even for a long version
      tick: [LX + LID_W + 7, LT - 7],
      access: { kind: "ladder", at: LADDER, height: -DESK, lean: 14 },
      stations: {
        empty: { pose: "letterer", x: X0 + DW + 22, y: 0 },         // setting out the desk's end
        loading: { pose: "carrier", x: LADDER - 6, y: -36 },        // on the ladder, the lid held up
        waiting: { pose: "hauler", x: LADDER + 56, y: 0, flip: true },
        idle: { pose: "sitter", x: X0 + 6, y: DESK + 3 },               // on the desk's end, legs over
        success: { pose: "sitter", x: X0 + 6, y: DESK + 3 },
        changed: { pose: "letterer", x: X0 + DW - 4, y: DESK },     // on the desk, pen at the cloud
        error: { pose: "shrugger", x: X0 + DW + 30, y: 0 },        // off the desk's end, clear of the sag
      },
    };
  },
};
