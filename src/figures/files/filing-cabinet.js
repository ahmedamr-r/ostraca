/* ===========================================================================
   Filing cabinet: a four drawer cabinet seen from the side on a low plinth,
   the top drawer pulled out on its runner with hanging folders standing in
   it. Documents, folders, records, no files yet, a file that failed to save.

   The fronts face left. The open drawer reaches out over the floor on the
   left, so the scaffold, the plumb line and the crew work at the back.
   =========================================================================== */

// Measured off the cabinet's front face (CF). A worker is 45 tall.
const CF = 122, D = 56, CB = CF + D;  // front face, depth, back
const PLINTH = -6, DH = 23, N = 4;     // plinth top, drawer height, drawers
const BODY = PLINTH - N * DH;          // top of the carcass
const TOP = BODY - 3;                  // top of the cap
const PULL = 50, OF = CF - PULL;       // the top drawer, pulled out
const MAX = 8;                         // folders drawn before the count goes on a chain

export default {
  name: "filing-cabinet",
  title: "Filing cabinet",
  shelf: "files",
  use: "Documents, folders, records, no files yet, a file that failed to save",
  width: 320,
  height: 136,
  measures: { what: "Files in the folder", sample: 6 },

  draw({ n, SET_OUT, rectPath, rng, seedFrom, dimension, opts }) {
    const count = Number.isFinite(opts.figure?.value) ? Math.max(0, Math.floor(opts.figure.value)) : null;
    const total = count == null ? 5 : Math.min(count, MAX);
    const band = (k) => [PLINTH - (k + 1) * DH, PLINTH - k * DH]; // top, bottom of drawer k

    // A drawer front from the side: a thin plate standing proud of the face,
    // with a pull handle sticking out of its upper third.
    const front = (x, k) => {
      const [t, b] = band(k), hy = t + 7;
      return `<path class="paper" d="${rectPath(x - 4, t + 1, 4, DH - 2)}"/>` +
        `<path d="M${x - 4} ${hy - 3}L${x - 9} ${hy - 2}V${hy + 2}L${x - 4} ${hy + 3}"/>`;
    };
    // The carcass in bands, one per drawer: the side panel's front and back
    // edges, filled with paper, so the bands read as one panel.
    const side = (k) => {
      const [t, b] = band(k);
      return `<path class="paper" stroke="none" d="${rectPath(CF, t, D, DH)}"/>` +
        `<path d="M${CF} ${b}V${t}M${CB} ${b}V${t}"/><path d="M${CB - 4} ${b}V${t}" opacity="0.4"/>`;
    };

    // The plinth, set back under the front: a toe space.
    const plinth = `<path class="paper" d="M${CF + 4} 0V${PLINTH}H${CB}V0Z"/>`;
    const cap = `<path class="paper" d="${rectPath(CF - 2, TOP, D + 3, 3)}"/>`;

    // The open drawer: its side wall (open topped, lower than the front),
    // the runner it slides on, and its front out at OF.
    const [ot, ob] = band(N - 1);
    const WALL = ot + 9;
    const runner = `<path class="paper" d="${rectPath(OF + 8, ob - 3, CF - OF - 8, 2)}"/>`;
    const wall = `<path class="paper" d="M${OF} ${ob - 3}V${WALL}H${CF}V${ob - 3}Z"/>`;
    const openFront = front(OF, N - 1) + `<path d="M${CF} ${ot}V${ob}" opacity="0.4"/>`;

    // Hanging folders, seen edge on: each a sheet rising out of the drawer
    // past its wall, its tab at the top, front and back by turns.
    const r = rng(seedFrom(`cabinet-${total}`));
    let folders = "", last = null;
    const span = CF - OF - 12;
    for (let j = 0; j < total; j++) {
      const x = OF + 6 + (span * (j + 0.5)) / Math.max(total, 1);
      // Hung on the rail at the wall's top: a hook, the sheet, and a tab
      // standing up at one of three places along it.
      const h = 10 + r() * 2, top = WALL - h, tx = x + [-1, 1.5, -2.5][j % 3];
      folders += `M${n(x)} ${WALL + 2}V${n(top)}M${n(x - 2.5)} ${n(top)}H${n(x + 2.5)}` +
        `M${n(tx)} ${n(top)}V${n(top - 4)}H${n(tx + 3.5)}V${n(top)}`;
      last = x;
    }

    const courses = [{ svg: plinth, still: true }];
    for (let k = 0; k < N - 1; k++) courses.push(side(k) + front(CF, k));
    courses.push(side(N - 1) + cap);
    courses.push(runner + (folders ? `<path d="${folders}"/>` : "") + wall + openFront);

    const outline =
      `<path d="M${CF + 4} 0V${PLINTH}H${CF}V${TOP}H${CB + 1}V0` +
      `M${CF} ${WALL}H${OF}V${ob - 1}H${CF}" stroke-dasharray="${SET_OUT}"/>`;
    let inside = "";
    for (let k = 1; k < N; k++) inside += `M${CF - 3} ${band(k)[1]}H${CF}`;
    const contents = `<path d="${inside}M${OF + 6} ${WALL - 6}H${CF - 6}"/>`;

    const revise = [OF + 2, WALL - 18, CF - OF - 6, 19];
    const extras = count != null && count > MAX ? dimension(OF, TOP - 16, CF - 4, TOP - 16, String(count), { gapPerChar: 6.4 }) : "";

    const SC = [CB + 6, CB + 40];
    return {
      courses,
      outline,
      contents,
      foot: [CB, PLINTH],   // leans back off the plinth's back corner
      top: TOP,
      error: "lean",
      lean: 5,
      revise,
      tag: [CF + 16, TOP - 12],
      tick: [CB + 26, TOP + 6], // past the sitter's feet
      access: { kind: "scaffold", at: SC },
      extras,
      stations: {
        empty: { pose: "letterer", x: CB + 22, y: 0 },
        loading: { pose: "carrier", x: SC[0] + 22, y: -2.5, ride: true },
        waiting: { pose: "hauler", x: SC[1] + 52, y: 0, flip: true },
        idle: { pose: "sitter", x: CB - 2, y: TOP + 3, flip: true },
        success: { pose: "sitter", x: CB - 2, y: TOP + 3, flip: true },
        changed: { pose: "letterer", x: OF - 22, y: 0, flip: true },
        error: { pose: "pusher", x: CF - 20, y: 0, flip: true },
      },
    };
  },
};
