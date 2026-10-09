/* Stair: a flight of stone steps, one tread per task. Onboarding, setup
   and anything done in steps. Each step is a block from the ground up to
   its tread, laid from the bottom of the flight to the top. */
const STEPS = 5, G = 24, R = 13, CX = 160;
const X0 = CX - (STEPS * G) / 2, XE = X0 + STEPS * G, H = STEPS * R;

export default {
  name: "stair",
  title: "Stair",
  shelf: "site",
  use: "Onboarding, setup and anything done in steps",
  width: 320,
  height: 104,
  draw({ SET_OUT, opts }) {
    let profile = `M${X0} 0`;
    for (let i = 0; i < STEPS; i++) profile += `V${-(i + 1) * R}H${X0 + (i + 1) * G}`;
    profile += "V0";

    // Each step: a block to its tread, its beds (the treads below it,
    // carried through) at a low opacity so the flight reads as stone.
    const courses = [];
    let inside = "";
    for (let i = 0; i < STEPS; i++) {
      const x = X0 + i * G, h = (i + 1) * R;
      let beds = "";
      for (let k = 1; k <= i; k++) beds += `M${x} ${-k * R}H${x + G}`;
      inside += `M${x} 0V${-i * R}` + beds;
      courses.push(`<rect class="paper" x="${x}" y="${-h}" width="${G}" height="${h}"/>${beds ? `<path d="${beds}" opacity="0.35"/>` : ""}`);
    }

    // The carrier climbs with the work: on the top tread laid so far, the
    // next block held out over the gap. A course shows once it is a
    // quarter in (styles.css), so count the same way. No value: the first.
    const v = Number.isFinite(opts.value) ? Math.max(0, Math.min(1, opts.value)) : null;
    const laid = v == null ? 1 : Math.ceil(v * STEPS - 0.25);
    const done = Math.max(0, Math.min(STEPS - 1, laid));
    const tread = done ? { x: X0 + done * G - 8, y: -done * R } : { x: X0 - 8, y: 0 };

    return {
      courses,
      outline: `<path d="${profile}" stroke-dasharray="${SET_OUT}"/>`,
      contents: `<path d="${inside}"/>`,
      foot: [XE, 0],
      top: -H,
      error: "lean",
      lean: 5,
      revise: [XE - G - 5, -H - 5, G + 10, R + 10],
      tag: [XE + 22, -H - 6],
      tick: [XE + 7, -H - 7],
      stations: {
        empty: { pose: "carrier", x: X0 - 28, y: 0, flip: true },
        loading: { pose: "carrier", ...tread, flip: true },
        idle: { pose: "sitter", x: XE - 7, y: -H },
        success: { pose: "sitter", x: XE - 7, y: -H },
        changed: { pose: "letterer", x: X0 + 3 * G - 2, y: -3 * R, flip: true },
        error: { pose: "shrugger", x: X0 - 30, y: 0 },
      },
    };
  },
};
