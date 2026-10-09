/* ===========================================================================
   Seats: a row of waiting room chairs fixed along one beam, front on.
   Team members, invites, seats on a plan, attendees, a waiting list.

   Out of true the beam sags between its end legs under a taut string, and
   every chair rides it down by the dip under its own middle. A real count
   (opts.figure) draws one chair per seat on the plan, up to eight: the
   taken ones built, the free ones left as set-out.
   =========================================================================== */

const MAX = 8, DEFAULT = 6;
const PITCH = 24, BACK_W = 18, SEAT_W = 20;     // chair to chair, back panel, seat front
const BEAM = -16, BEAM_H = 4;                   // beam's top face, its depth
const SEAT = -26, SEAT_H = 4;                   // seat's top face, the front edge's depth
const BACK_B = -29, BACK_T = -56, R = 4;        // back panel's foot and head, its corner
const ARM = -36;                                // armrest pad's top
const SPLAY = 9, END = 6;                       // end legs' spread, the beam past the end chairs
const DROP = 5;                                 // the beam's sag at its middle, in error

export default {
  name: "seats",
  title: "Seats",
  shelf: "people",
  use: "Team members, invites, seats on a plan, attendees, a waiting list",
  width: 340,
  height: 100,
  measures: { what: "Seats taken, of the plan's total", unit: "seats", sample: 4 },

  draw({ n, SET_OUT, sag, dimension, opts }) {
    // How many chairs, and how many taken. figure.value is the seats taken;
    // figure.total, when the app passes it, the seats on the plan.
    const f = opts.figure, used = Number.isFinite(+f?.value) ? Math.max(0, Math.floor(+f.value)) : null;
    const total = Number.isFinite(+f?.total) ? Math.max(1, Math.floor(+f.total)) : null;
    const plan = total ?? Math.max(used ?? 0, DEFAULT), chairs = Math.min(MAX, Math.max(1, plan));
    // Past eight the row stands for the plan: taken chairs in proportion,
    // never all of them while a seat is free, and the real figures on a chain.
    let taken = used == null ? chairs : Math.min(used, chairs);
    if (used != null && plan > MAX) taken = Math.max(used > 0 ? 1 : 0, Math.min(used < plan ? MAX - 1 : MAX, Math.round((MAX * used) / plan)));

    const RW = chairs * PITCH, X0 = n(Math.max(44, 136 - RW / 2)), X1 = X0 + RW;   // the row, left of the bay
    const BX0 = X0 - END, BX1 = X1 + END, XM = (BX0 + BX1) / 2, HALF = (BX1 - BX0) / 2;
    const dip = (x, s) => s * (1 - ((x - XM) / HALF) ** 2);
    const cx = (i) => X0 + PITCH * i + PITCH / 2;
    const moves = (build, cls = "") => sag(build(0), build(DROP), cls);

    // The beam: a bar whose faces curve down when it sags.
    const beam = (s) => {
      const q = (y) => n(y + 2 * dip(XM, s));
      return `M${BX0} ${BEAM}Q${XM} ${q(BEAM)} ${BX1} ${BEAM}V${BEAM + BEAM_H}Q${XM} ${q(BEAM + BEAM_H)} ${BX0} ${BEAM + BEAM_H}Z`;
    };
    // End legs: a splayed pair under each end, with a foot bar on the floor.
    const legs = [BX0 + 4, BX1 - 4].map((x) =>
      `M${x - 2} ${BEAM + BEAM_H}L${x - SPLAY} -1.5M${x + 2} ${BEAM + BEAM_H}L${x + SPLAY} -1.5`).join("");
    const feet = [BX0 + 4, BX1 - 4].map((x) => `M${x - SPLAY - 3} -1.5H${x - SPLAY + 3}M${x + SPLAY - 3} -1.5H${x + SPLAY + 3}`).join("");

    // A chair, dropped by the dip under its middle: seat front, back panel
    // with rounded head, the stem down to the beam. Arms stand between.
    const chair = (i) => (s) => {
      const c = cx(i), d = dip(c, s), y = (v) => n(v + d);
      const bx = c - BACK_W / 2, sx = c - SEAT_W / 2;
      return `M${n(bx)} ${y(BACK_B)}V${y(BACK_T + R)}Q${n(bx)} ${y(BACK_T)} ${n(bx + R)} ${y(BACK_T)}H${n(bx + BACK_W - R)}` +
        `Q${n(bx + BACK_W)} ${y(BACK_T)} ${n(bx + BACK_W)} ${y(BACK_T + R)}V${y(BACK_B)}Z` +
        `M${n(sx)} ${y(SEAT)}H${n(sx + SEAT_W)}V${y(SEAT + SEAT_H)}H${n(sx)}Z` +
        `M${n(c - 2)} ${y(SEAT + SEAT_H)}H${n(c + 2)}V${y(BEAM)}H${n(c - 2)}Z`;
    };
    const lining = (i) => (s) => {   // the back's stitched panel, faint
      const c = cx(i), y = (v) => n(v + dip(c, s));
      return `M${n(c - BACK_W / 2 + 3)} ${y(BACK_T + 6)}H${n(c + BACK_W / 2 - 3)}M${n(c - BACK_W / 2 + 3)} ${y(BACK_B - 4)}H${n(c + BACK_W / 2 - 3)}`;
    };
    const arm = (k) => (s) => {     // the arm k sits left of chair k
      const x = X0 + PITCH * k, y = (v) => n(v + dip(x, s));
      return `M${n(x - 0.8)} ${y(BEAM)}V${y(ARM + 2)}H${n(x + 0.8)}V${y(BEAM)}Z` +
        `M${n(x - 3)} ${y(ARM)}H${n(x + 3)}V${y(ARM + 2)}H${n(x - 3)}Z`;
    };

    // Courses: legs, beam, then each chair left to right with the arm on
    // its left (the last carries the end arm too). A free seat is built
    // as its own set-out, so the row shows how many are left.
    const courses = [`<path d="${legs}"/><path d="${feet}" opacity="0.6"/>`, moves(beam, "paper")];
    for (let i = 0; i < chairs; i++) {
      let svg = moves(chair(i), "paper") + moves(arm(i), "paper") + (i === chairs - 1 ? moves(arm(chairs), "paper") : "");
      svg += i < taken ? `<g opacity="0.45">${moves(lining(i))}</g>` : "";
      courses.push(i < taken ? svg : `<g stroke-dasharray="${SET_OUT}">${svg}</g>`);
    }

    let all = "";
    for (let i = 0; i < chairs; i++) all += chair(i)(0) + arm(i)(0);
    const outline = `<path d="${beam(0)}${arm(chairs)(0)}${all}${legs}" stroke-dasharray="${SET_OUT}"/>`;
    let inner = "";
    for (let i = 0; i < chairs; i++) inner += lining(i)(0);

    // The cloud goes round the last taken seat: a member whose role changed.
    const ri = Math.max(0, Math.min(chairs - 1, taken - 1));
    const revise = [n(cx(ri) - SEAT_W / 2 - 3), BACK_T - 4, SEAT_W + 6, SEAT + SEAT_H - BACK_T + 8];

    const sitters = [];
    for (let i = 0; i < taken; i++) sitters.push({ pose: "sitter", x: n(cx(i) + 4), y: SEAT });
    const S0 = X1 + 14, S1 = X1 + 44; // the scaffold bay at the right end
    const fig = plan > MAX && used != null ? (total != null ? `${used}/${total}` : String(used)) : "";
    const extras = fig ? dimension(X0, BACK_T - 9, X0 + 4 * PITCH, BACK_T - 9, fig) : "";
    return {
      courses,
      extras,
      outline,
      contents: `<path d="${inner}"/>`,
      foot: [BX1, BEAM],
      top: BACK_T,
      error: "sag",
      string: [[BX0 - 4, BEAM], [BX1 + 4, BEAM]],
      revise,
      tag: [n(cx(ri)), BACK_T - 18], // over the cloud, clear of the letterer beside it
      tick: [X1 + 6, BACK_T - 8],
      access: { kind: "scaffold", at: [S0, S1] },
      stations: {
        empty: { pose: "letterer", x: BX1 + 22, y: 0 },
        loading: { pose: "carrier", x: S1 - 8, y: -2.5, ride: true },
        waiting: { pose: "hauler", x: S1 + 40, y: 0, flip: true },
        idle: sitters.length ? sitters : null,
        success: sitters.length ? sitters : null,
        changed: ri < chairs - 1   // on the beam beside the seat, else on the ground past the row
          ? { pose: "letterer", x: n(cx(ri) + SEAT_W / 2 + 21), y: BEAM }
          : { pose: "letterer", x: n(cx(ri) + SEAT_W / 2 + 21), y: 0 },
        error: { pose: "shrugger", x: BX1 + 26, y: 0 },
      },
    };
  },
};
