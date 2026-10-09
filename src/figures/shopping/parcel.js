/* ===========================================================================
   Parcel: taped boxes stacked on a sack barrow, seen from the side.
   Orders, shipping, delivery tracking, returns, a delivery that failed.

   The barrow stands upright: a toe plate on the ground to the left, the
   frame rising behind the boxes, one big wheel behind on a short axle,
   the grips curling back at the top. The ladder stands on the far side.
   =========================================================================== */
import { countOf, ring, box } from "./_parts.js";

// Measured off the frame's front face (XF). A worker is 45 tall.
const XF = 136;
const TOE = 44, PLATE = 3;            // toe plate: reach in front of the frame, thickness
const FRAME_H = 112, RAIL = 4;        // frame: height, rail depth
const WR = 13, WX = XF + RAIL + 9;    // the wheel: radius, centre x
const WY = -WR;                       // ...centre y, on the ground
const SIZES = [[50, 34], [44, 29], [36, 25]]; // parcels, bottom up: width, height
const MAX = 3;

export default {
  name: "parcel",
  title: "Parcel",
  shelf: "shopping",
  use: "Orders, shipping, delivery tracking, returns, a delivery that failed",
  width: 300,
  height: 140,
  measures: { what: "Parcels in the order", sample: 3 },

  draw({ n, SET_OUT, opts }) {
    const count = countOf(opts.figure);
    const total = count == null ? MAX : Math.min(count, MAX);
    const XT = XF - TOE, TOP = -FRAME_H;

    // The wheel, its hub and a few faint spokes, on an axle bracket that
    // runs back from the frame.
    let spokes = "";
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      spokes += `M${n(WX + 3 * Math.cos(a))} ${n(WY + 3 * Math.sin(a))}L${n(WX + (WR - 2.5) * Math.cos(a))} ${n(WY + (WR - 2.5) * Math.sin(a))}`;
    }
    const wheel = `<path class="paper" d="${ring(WX, WY, WR)}"/><path d="${ring(WX, WY, WR - 2.5)}${spokes}" opacity="0.45"/>` +
      `<path d="M${XF + RAIL} ${WY - 9}L${WX} ${WY}M${XF + RAIL} ${WY + 4}L${WX} ${WY}"/><path class="paper" d="${ring(WX, WY, 2.5)}"/>`;

    // The toe plate: a flat blade on the ground, turned up a little at its
    // nose, welded to the frame's foot.
    const plate = `<path class="paper" d="M${XT} 0V${-PLATE}H${XF}V0Z"/><path d="M${XT + 3} ${-PLATE}V${-PLATE - 2}" opacity="0.6"/>`;

    // The frame: the near rail as a tube, with the cross bars that hold
    // the two rails apart showing as short faint stubs on its face.
    let bars = "";
    for (let y = -24; y > TOP + 10; y -= 18) bars += `M${XF} ${y}h${RAIL}`;
    const frame = `<path class="paper" d="M${XF} ${-PLATE}V${TOP}H${XF + RAIL}V${-PLATE}Z"/><path d="${bars}" opacity="0.5"/>`;

    // The grips: the rail bends back over the top into a handle that
    // climbs away behind, a grip on its end; the far rail's grip shows
    // behind it, fainter.
    const GX = XF + 16, GY = TOP - 14;
    const arm = (dx, dy) => `M${XF + 2 + dx} ${TOP + dy}Q${XF + 2 + dx} ${TOP - 6 + dy} ${GX + dx} ${GY + dy}`;
    const gripAt = (dx, dy, cls) => `<g transform="translate(${GX + dx} ${GY + dy}) rotate(-40)"><path class="${cls}" d="M-1 -2.2H9Q11.2 -2.2 11.2 0Q11.2 2.2 9 2.2H-1Z"/></g>`;
    const handles = `<g opacity="0.45"><path d="${arm(4, 3)}"/>${gripAt(4, 3, "")}</g><path d="${arm(0, 0)}"/>${gripAt(0, 0, "paper")}`;

    // The parcels, bottom up, each against the frame and on the one below.
    const parcels = [];
    let y = -PLATE;
    for (let k = 0; k < total; k++) {
      const [w, h] = SIZES[k];
      y -= h;
      parcels.push({ svg: box(XF - w - 0.5, y, w, h), x: XF - w - 0.5, y, w, h });
    }

    const outline = `<path d="${ring(WX, WY, WR)}M${XT} 0V${-PLATE}H${XF}V0M${XF} ${-PLATE}V${TOP}H${XF + RAIL}V${-PLATE}${arm(0, 0)}` +
      SIZES.reduce((acc, [w, h]) => { acc.y -= h; acc.d += `M${XF - w - 0.5} ${acc.y}h${w}v${h}h${-w}Z`; return acc; }, { y: -PLATE, d: "" }).d +
      `" stroke-dasharray="${SET_OUT}"/>`;
    const contents = `<path d="${spokes}${bars}"/>`;

    const top = parcels[parcels.length - 1];
    const revise = top ? [n(top.x - 5), n(top.y - 5), top.w + 9, top.h + 9] : [XT, -PLATE - 30, TOE, 28];
    const LADDER = XF + 58;

    return {
      courses: [wheel, plate, frame, handles, ...parcels.map((p) => p.svg)],
      outline,
      contents,
      foot: [XT, 0], // tips forward over the toe plate, the parcels about to slide off
      top: top ? top.y : TOP, // the plumb hangs off the front of the stack
      error: "lean",
      lean: 5,
      revise,
      tag: [revise[0] - 22, revise[1] + 2],
      tick: [GX + 20, GY + 2],
      access: { kind: "ladder", at: LADDER, height: FRAME_H - 14, lean: 20 },
      stations: {
        empty: { pose: "letterer", x: XT - 26, y: 0, flip: true },
        loading: { pose: "carrier", x: LADDER - 10, y: -50 },
        waiting: { pose: "hauler", x: LADDER + 60, y: 0, flip: true },
        idle: total ? { pose: "leaner", x: XF - SIZES[0][0] - 1.5, y: 0, flip: true } // against the bottom box
          : { pose: "leaner", x: XF - 2, y: -PLATE, flip: true },                // on the bare plate, against the frame
        success: { pose: "pusher", x: XF + 30, y: 0 },
        changed: { pose: "letterer", x: XT - 28, y: 0, flip: true },
        error: { pose: "shrugger", x: XT - 52, y: 0 },
      },
    };
  },
};
