/* Pyramid: a step pyramid in six tiers, seen from the side. Drawn for the
   README cover (scripts/cover.mjs), not the library: a job that has been
   loading since 2670 BC with one block to go.

   It draws every state but error. A pyramid has no plumb edge to hang a
   line off, and a lean pivots its base into the ground. */

// Everything is measured off the centre line (CX). Each tier is a block
// whose faces batter in a little, set back on the one below by a terrace.
const TIERS = 6, R = 18, BATTER = 4, TERRACE = 10, HALF = 100, CX = 120;
const STEP = BATTER + TERRACE, H = TIERS * R, XR = CX + HALF;
const bed = (i) => HALF - i * STEP;   // a tier's half width at its bed
const crown = (i) => bed(i) - BATTER; // and at its top
const LADDER = XR + 11, LEAN = 55, REACH = 4 * R + 4; // laid up the flank on the tier corners

export default {
  name: "pyramid",
  title: "Pyramid",
  shelf: "site",
  use: "Long builds, big launches and anything that is nearly done",
  width: 310,
  height: 146,
  states: ["idle", "empty", "loading", "success", "changed"],

  draw({ n, SET_OUT, opts }) {
    // One tier: a closed trapezoid in the paper, and its stones faint. A
    // bed joint halves it; the perpends stagger by half a stone each row.
    const tier = (i) => {
      const y0 = -i * R, y1 = y0 - R, ym = y0 - R / 2;
      const face = `M${CX - bed(i)} ${y0}L${CX - crown(i)} ${y1}H${CX + crown(i)}L${CX + bed(i)} ${y0}Z`;
      let joints = `M${n(CX - bed(i) + BATTER / 2)} ${n(ym)}H${n(CX + bed(i) - BATTER / 2)}`;
      [[y0, ym, 0], [ym, y1, 13]].forEach(([lo, hi, off]) => {
        for (let x = CX - bed(i) + 18 + off + (i % 2) * 6; x < CX + crown(i) - 6; x += 26) joints += `M${n(x)} ${n(lo)}V${n(hi)}`;
      });
      return `<path class="paper" d="${face}"/><path class="faint" d="${joints}"/>`;
    };
    const courses = Array.from({ length: TIERS }, (_, i) => tier(i));

    // The set-out: the stepped profile, and each tier's bed across it.
    let up = `M${CX - bed(0)} 0`, beds = "";
    for (let i = 0; i < TIERS; i++) up += `L${CX - crown(i)} ${-(i + 1) * R}` + (i < TIERS - 1 ? `H${CX - bed(i + 1)}` : "");
    for (let i = TIERS - 1; i >= 0; i--) up += `H${CX + crown(i)}L${CX + bed(i)} ${-i * R}`;
    for (let i = 1; i < TIERS; i++) beds += `M${CX - bed(i)} ${-i * R}H${CX + bed(i)}`;

    // The carrier climbs with the work, like the stair's: on the top tier
    // laid so far, the next block held out over where it goes. A course
    // shows once it is a quarter in, so count the same way.
    const v = Number.isFinite(opts.value) ? Math.max(0, Math.min(1, opts.value)) : null;
    const laid = v == null ? 1 : Math.ceil(v * TIERS - 0.25);
    const done = Math.max(0, Math.min(TIERS - 1, laid));
    const on = done ? { x: n(CX + crown(done - 1) - 9), y: -done * R } : { x: XR + 30, y: 0 };

    const top = crown(TIERS - 1);
    return {
      courses,
      outline: `<path d="${up}" stroke-dasharray="${SET_OUT}"/>`,
      contents: `<path d="${beds}"/>`,
      foot: [XR, 0],
      top: -H,
      revise: [CX - bed(TIERS - 1) - 5, -H - 5, 2 * bed(TIERS - 1) + 10, R + 10], // round the top tier
      tag: [CX + bed(TIERS - 1) + 30, -H - 6],
      tick: [CX - top + 4, -H - 9], // the left end of the top, away from the sitter
      access: { kind: "ladder", at: LADDER, height: REACH, lean: LEAN },
      stations: {
        empty: { pose: "letterer", x: XR + 8, y: 0 },                        // pen at the set-out's flank
        loading: { pose: "carrier", ...on },
        waiting: { pose: "hauler", x: LADDER + 52, y: 0, flip: true },       // at the gin wheel's fall
        idle: { pose: "sitter", x: CX + top - 1.5, y: -H + 3, flip: true },  // on the top, feet over the edge
        success: { pose: "sitter", x: CX + top - 1.5, y: -H + 3, flip: true },
        changed: { pose: "letterer", x: CX - crown(3) + 9, y: -4 * R, flip: true }, // up on a terrace, pen at the cloud
      },
    };
  },
};
