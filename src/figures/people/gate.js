/* ===========================================================================
   Gate: a field gate hung between two posts, front on. Sign in, private
   pages, permission needed, locked features, access denied.

   Hung on two straps from the left post, shut on a hasp on the right one
   with a padlock hanging from it. Out of true the leaf drops at its latch
   end under a taut string from post to post, turning about its top hinge;
   every part of the leaf is drawn twice through ctx.sag().
   =========================================================================== */

// Measured off the hinge post's left face (X0). A worker is 45 tall.
const X0 = 58, SPAN = 152, X1 = X0 + SPAN;     // hinge post's left face, latch post's right face
const PW = 8, P_TOP = -74, CAP = 6;             // posts: width, top, cap's rise
const GX0 = X0 + PW + 2, GX1 = X1 - PW - 2, GW = GX1 - GX0;   // the leaf's two ends
const TOP = -62, RAIL = 4, BOT = -16;           // top rail's top, rails' depth, bottom rail's top
const STILE = 3, BAR = 1.6, BARS = 11;          // stiles, upright bars, how many bars
const HASP = -42;                               // the hasp's staple on the latch post
const DROP = 7;                                 // the latch end's drop, in error

export default {
  name: "gate",
  title: "Gate",
  shelf: "people",
  use: "Sign in, private pages, permission needed, locked features, access denied",
  width: 320,
  height: 108,

  draw({ n, SET_OUT, sag, rectPath }) {
    // The leaf turns about its top hinge: a point drops in proportion to
    // how far it is from the hinge post.
    const dip = (x, s) => (s * (x - GX0)) / GW;
    const P = (x, y, s) => `${n(x)} ${n(y + dip(x, s))}`;
    const quad = (x, y, w, h) => (s) => `M${P(x, y, s)}L${P(x + w, y, s)}L${P(x + w, y + h, s)}L${P(x, y + h, s)}Z`;
    const join = (...fs) => (s) => fs.map((f) => f(s)).join("");
    const moves = (build, cls = "paper") => sag(build(0), build(DROP), cls);

    // Posts, each with a shallow pyramid cap, and the leaf's parts.
    const post = (x) => rectPath(x, P_TOP, PW, -P_TOP) + `M${x - 1.5} ${P_TOP}L${x + PW / 2} ${P_TOP - CAP}L${x + PW + 1.5} ${P_TOP}Z`;
    const stiles = join(quad(GX0, TOP, STILE, -TOP - 8), quad(GX1 - STILE, TOP, STILE, -TOP - 8));
    const bottom = join(stiles, quad(GX0, BOT, GW, RAIL));
    const bx = (k) => GX0 + STILE + ((GW - 2 * STILE) * (k + 1)) / (BARS + 1) - BAR / 2;
    const bars = (k0, k1) => { const fs = []; for (let k = k0; k < k1; k++) fs.push(quad(bx(k), TOP + RAIL, BAR, BOT - TOP - RAIL)); return join(...fs); };
    const top = quad(GX0, TOP, GW, RAIL);
    // The brace: from the bottom rail at the hinge end up to the top rail at
    // the latch end, a band the rails' depth across.
    const brace = (s) => `M${P(GX0 + STILE, BOT - 3, s)}L${P(GX0 + STILE, BOT, s)}L${P(GX0 + STILE + 6, BOT, s)}` +
      `L${P(GX1 - STILE, TOP + RAIL + 3, s)}L${P(GX1 - STILE, TOP + RAIL, s)}L${P(GX1 - STILE - 6, TOP + RAIL, s)}Z`;
    // Hinge straps: a strap along each rail from the post, a pin on the post.
    const straps = join(quad(X0 + PW - 1, TOP + 0.8, 26, 2.4), quad(X0 + PW - 1, BOT + 0.8, 26, 2.4));
    const pins = `M${X0 + 2} ${TOP - 1}h4v5h-4ZM${X0 + 2} ${BOT - 1}h4v5h-4Z`;
    // The latch bar on the leaf, over to the hasp; the padlock hangs below.
    const latch = quad(GX1 - 12, HASP - 1, 14, 2.4);
    const PX = X1 - PW / 2, LB = HASP + 7;
    const hasp = `M${PX - 2} ${HASP - 5}h4v9h-4Z`;
    const lock = `M${PX - 6} ${LB}h12v10h-12Z`, shackle = `M${PX - 3.5} ${LB}V${HASP + 1.5}a3.5 3.5 0 0 1 7 0V${LB}`;

    const half = Math.ceil(BARS / 2);
    const leaf = join(bottom, top, quad(GX0, TOP, STILE, -TOP - 8));
    let barsD = ""; for (let k = 0; k < BARS; k++) barsD += quad(bx(k), TOP + RAIL, BAR, BOT - TOP - RAIL)(0);

    const SB0 = X1 + 12, SB1 = X1 + 42; // the scaffold bay on the latch side
    return {
      courses: [
        `<path class="paper" d="${post(X0)}${post(X1 - PW)}"/>`,
        moves(bottom),
        moves(bars(0, half)),
        moves(bars(half, BARS)),
        moves(top),
        moves(brace),
        moves(straps) + `<path class="paper" d="${pins}"/>`,
        moves(latch) + `<path class="paper" d="${hasp}"/>`,
        `<path d="${shackle}"/><path class="paper" d="${lock}"/><path d="M${PX} ${LB + 3.5}v3" opacity="0.6"/>`,
      ],
      outline: `<path d="${post(X0)}${post(X1 - PW)}${leaf(0)}" stroke-dasharray="${SET_OUT}"/>`,
      contents: `<path d="${barsD}${brace(0)}"/>`,
      foot: [X1, 0],
      top: P_TOP - CAP,
      error: "sag",
      string: [[X0 + PW, TOP], [X1 - PW, TOP]],
      revise: [PX - 10, HASP - 8, 20, LB + 10 - HASP + 12],
      tag: [X1 + 20, HASP - 22],
      tick: [X1 + 10, P_TOP - 10],
      access: { kind: "scaffold", at: [SB0, SB1] },
      stations: {
        empty: { pose: "letterer", x: X1 + 24, y: 0 },
        loading: { pose: "carrier", x: SB1 - 8, y: -2.5, ride: true },
        waiting: { pose: "hauler", x: SB1 + 44, y: 0, flip: true },
        idle: { pose: "leaner", x: X0 - 14, y: 0, flip: true },
        success: { pose: "sitter", x: GX0 + 46, y: TOP, flip: true },
        changed: { pose: "letterer", x: X1 + 21, y: 0 },
        error: { pose: "shrugger", x: X1 + 30, y: 0 }, // by the latch post, clear of the padlock
      },
    };
  },
};
