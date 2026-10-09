/* ===========================================================================
   Magnifier: a large magnifying glass standing upright on its handle in a
   heavy round foot, front on. Search, no results, filters that matched
   nothing, explore.

   The ring on a stick is the shape every search icon uses, so the figure
   keeps it plain: two circles for the ring, one faint arc for the glass.
   The ladder, the plumb line and the crew work on the right.
   =========================================================================== */

// Measured off the handle's centre line (CX). A worker is 45 tall.
const CX = 132;                         // right of the middle, so the lean tips right (the engine reads the side off foot x)
const FOOT_W = 40, FOOT_H = 10;        // the round foot, a low dome on a base
const HW = 7, COLLAR = -55, CH = 7;    // handle width, collar's lower edge, collar height
const R = 26, RI = 22.5;               // the ring's outer and inner radius
const CY = COLLAR - CH - R + 1.5;       // the ring's centre; it sits down in the collar
const TOP = CY - R;

export default {
  name: "magnifier",
  title: "Magnifier",
  shelf: "files",
  use: "Search, no results, filters that matched nothing, explore",
  width: 300,
  height: 142,
  measures: { what: "Results", sample: 0 },

  draw({ n, SET_OUT, rectPath, dimension, opts }) {
    const count = Number.isFinite(opts.figure?.value) ? Math.max(0, Math.floor(opts.figure.value)) : null;

    // Half the ring as one closed band: the outer arc one way, the inner
    // arc back. `low` picks the lower half.
    const half = (low) => {
      const s = low ? 0 : 1, t = low ? 1 : 0;
      return `M${CX - R} ${n(CY)}A${R} ${R} 0 0 ${s} ${CX + R} ${n(CY)}H${CX + RI}` +
        `A${RI} ${RI} 0 0 ${t} ${CX - RI} ${n(CY)}Z`;
    };
    // The foot: a base plate with a dome rising to the handle's socket.
    const fx0 = CX - FOOT_W / 2, fx1 = CX + FOOT_W / 2;
    const foot = `M${fx0} 0V-3H${fx0 + 4}Q${CX} ${-FOOT_H * 1.9} ${fx1 - 4} -3H${fx1}V0Z`;
    const socket = rectPath(CX - HW / 2 - 2, -FOOT_H - 2, HW + 4, 4);
    const handle = rectPath(CX - HW / 2, COLLAR, HW, -FOOT_H - 2 - COLLAR);
    // Faint grip rings on the handle.
    let grip = "";
    for (let y = -FOOT_H - 8; y > COLLAR + 6; y -= 6) grip += `M${CX - HW / 2} ${y}H${CX + HW / 2}`;
    const collar = rectPath(CX - HW / 2 - 2.5, COLLAR - CH, HW + 5, CH);
    // The glass: one faint arc up in the lens's top left, where light sits.
    const a0 = (205 * Math.PI) / 180, a1 = (250 * Math.PI) / 180, gr = RI - 5;
    const glass = `M${n(CX + gr * Math.cos(a0))} ${n(CY + gr * Math.sin(a0))}A${gr} ${gr} 0 0 1 ${n(CX + gr * Math.cos(a1))} ${n(CY + gr * Math.sin(a1))}`;

    const courses = [
      { svg: `<path class="paper" d="${foot}"/>`, still: true },
      `<path class="paper" d="${socket}"/><path class="paper" d="${handle}"/><path d="${grip}" opacity="0.4"/>`,
      `<path class="paper" d="${collar}"/>`,
      `<path class="paper" d="${half(true)}"/>`,
      `<path class="paper" d="${half(false)}"/>`,
      `<path d="${glass}" opacity="0.5"/>`,
    ];

    const outline =
      `<path d="${foot}${handle}${collar}M${CX - R} ${n(CY)}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0" stroke-dasharray="${SET_OUT}"/>`;
    const contents = `<path d="M${CX - RI} ${n(CY)}a${RI} ${RI} 0 1 0 ${2 * RI} 0a${RI} ${RI} 0 1 0 ${-2 * RI} 0"/>`;

    // The real number of results across the lens, 0 included.
    const reach = count != null && String(count).length > 3 ? R + 8 : RI - 1; // a long number runs the chain past the ring
    const extras = count != null ? dimension(CX - reach, n(CY + 4), CX + reach, n(CY + 4), String(count), { gapPerChar: 6.4 }) : "";

    const LADDER = CX + R + 34;
    return {
      courses,
      outline,
      contents,
      foot: [CX + R, -FOOT_H - 2], // tips right, off past the ring's edge
      top: TOP,
      error: "lean",
      lean: 5,
      revise: [CX - R - 3, n(TOP - 3), 2 * R + 6, 2 * R + 6],
      tag: [CX + R + 24, n(TOP + 8)],
      tick: [CX + R + 8, n(TOP - 2)],
      access: { kind: "ladder", at: LADDER, height: -TOP, lean: 22 },
      extras,
      stations: {
        empty: { pose: "letterer", x: CX + R + 24, y: 0 },
        loading: { pose: "carrier", x: LADDER - 9, y: -44 },
        waiting: { pose: "hauler", x: LADDER + 56, y: 0, flip: true },
        idle: { pose: "leaner", x: CX + 34, y: 0 },
        success: { pose: "sitter", x: CX + 4, y: n(TOP + 0.5) },
        changed: { pose: "letterer", x: CX - R - 26, y: 0, flip: true },
        error: { pose: "shrugger", x: CX + R + 50, y: 0 },
      },
    };
  },
};
