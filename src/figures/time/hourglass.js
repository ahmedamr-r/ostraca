/* ===========================================================================
   Hourglass: a sand glass in its frame, front on. Two plates wider than
   the glass, a turned post at each side, the glass as two bulbs meeting
   at a narrow neck, and the sand.
   Waiting, a trial ending, a session timing out, rate limited, try again later.

   The sand follows opts.value, the share of the time gone (half, with
   none). opts.figure is the time left as the app writes it ("4 min"),
   set on a chain beside the lower bulb.
   =========================================================================== */
import { shown, turned, upright } from "./_parts.js";

// Measured off the glass's centre line (CX). A worker is 45 tall.
const CX = 120, PLATE = 38, PT = 6;          // centre, plate half width, plate thickness
const FOOT_H = 4;                            // bun feet under the bottom plate
const BOT = -FOOT_H - PT, TOP = -118;        // bottom plate's top, top plate's top
const YT = TOP + PT, YB = BOT;               // the glass runs between the plates
const YN = (YT + YB) / 2;                    // the neck
const POST = 31;                             // posts' centres off CX
const MAXW = 23, NECK = 1.6, COLLAR = 11;    // bulb's widest, neck, collar half widths

// A turned post's profile, foot to head: a block, beads, a long shaft.
const TURN = [[0, 3.6], [0.05, 3.6], [0.06, 1.8], [0.1, 2.8], [0.14, 1.6], [0.44, 1.6], [0.47, 2.8], [0.5, 1.8],
  [0.53, 2.8], [0.56, 1.6], [0.86, 1.6], [0.9, 2.8], [0.94, 1.8], [0.95, 3.6], [1, 3.6]];

export default {
  name: "hourglass",
  title: "Hourglass",
  shelf: "time",
  use: "Waiting, a trial ending, a session timing out, rate limited, try again later",
  width: 300,
  height: 150,
  measures: { what: "Time left", sample: "4 min" },

  draw(ctx) {
    const { n, SET_OUT, rectPath, opts } = ctx;
    const gone = Number.isFinite(opts.value) ? Math.max(0, Math.min(1, opts.value)) : 0.5;

    // A bulb's half width at u (0 at its plate, 1 at the neck).
    const half = (u) => NECK + (MAXW - NECK) * Math.sin(Math.PI * (0.16 + 0.84 * u)) ** 0.85 * (u < 0.06 ? 0.9 + u : 1);
    const widthAt = (y) => half(y < YN ? (y - YT) / (YN - YT) : (YB - y) / (YB - YN));
    const side = (y0, y1, s) => {
      const pts = [];
      for (let i = 0; i <= 18; i++) { const y = y0 + ((y1 - y0) * i) / 18; pts.push(`${n(CX + s * widthAt(y))} ${n(y)}`); }
      return pts;
    };
    // A bulb from its plate to the neck, closed across the plate's face.
    const bulb = (y0) => { const r = side(y0, YN, 1), l = side(YN, y0, -1); return `M${r.join("L")}L${l.join("L")}Z`; };
    const collar = (y, dir) => rectPath(CX - COLLAR - 1, dir < 0 ? y - 3 : y, 2 * COLLAR + 2, 3);

    const plate = (y) => rectPath(CX - PLATE, y, 2 * PLATE, PT);
    const feet = rectPath(CX - PLATE + 4, -FOOT_H, 10, FOOT_H) + rectPath(CX + PLATE - 14, -FOOT_H, 10, FOOT_H);
    const posts = turned(CX - POST, YB, YT, TURN) + turned(CX + POST, YB, YT, TURN);

    // The sand: a level in the upper bulb with a small dip over the neck,
    // a heap in the lower one, and the thread between while it runs.
    const upY = YT + 8 + gone * (YN - 3 - YT - 8);
    const baseY = YB - 2 - gone * 16, peakY = baseY - 4 - gone * 9;
    let sand = "";
    if (gone < 1) {
      const w = widthAt(upY) - 1;
      sand += `M${n(CX - w)} ${n(upY)}H${n(CX - 3)}L${CX} ${n(upY + 2)}L${n(CX + 3)} ${n(upY)}H${n(CX + w)}`;
    }
    if (gone > 0) {
      const w = widthAt(baseY) - 1;
      sand += `M${n(CX - w)} ${n(baseY)}Q${CX} ${n(2 * peakY - baseY)} ${n(CX + w)} ${n(baseY)}`;
      if (gone < 1) sand += `M${CX} ${n(YN + 1)}V${n(peakY - 0.5)}`;
    }
    // Faint grains under each surface, so the sand reads as a body.
    let grains = "";
    for (let y = upY + 4; y < YN - 4; y += 4) { const w = widthAt(y) - 4; if (w > 2) grains += `M${n(CX - w)} ${n(y)}H${n(CX + w)}`; }
    for (let y = peakY + 5; y < YB - 1; y += 4) { const w = Math.min(widthAt(y) - 3, (y - peakY) * 2.4); if (w > 2) grains += `M${n(CX - w)} ${n(y)}H${n(CX + w)}`; }

    const courses = [
      { svg: `<path class="paper" d="${feet}${plate(BOT)}"/>`, still: true },
      `<path class="paper" d="${posts}"/>`,
      `<path class="paper" d="${bulb(YB)}${collar(YB, -1)}"/>`,
      `<path class="paper" d="${rectPath(CX - 3.5, YN - 1.5, 7, 3)}"/>`, // the neck's band
      `<path class="paper" d="${bulb(YT)}${collar(YT, 1)}"/>`,
      `<path class="paper" d="${plate(TOP)}"/><path d="M${CX - PLATE + 4} ${TOP + 2}H${CX + PLATE - 4}" opacity="0.4"/>`,
      `<path d="${sand}"/><path d="${grains}" opacity="0.3"/>`,
    ];

    const outline = `<path d="${feet}${plate(BOT)}${plate(TOP)}${posts}${bulb(YB)}${bulb(YT)}" stroke-dasharray="${SET_OUT}"/>`;
    const left = shown(opts.figure);
    const XR = CX + PLATE, LADDER = XR + 52;
    return {
      courses,
      outline,
      contents: `<path d="${sand}"/>`,
      foot: [XR, BOT],
      top: TOP,
      error: "lean",
      lean: 4,
      revise: [CX - MAXW - 2, YT + 1, 2 * MAXW + 4, YN - YT - 4],
      tag: [XR + 24, YT + 4],
      tick: [XR + 10, TOP - 8],
      access: { kind: "ladder", at: LADDER, height: -TOP, lean: 20 },
      extras: left ? upright(ctx, CX - PLATE - 9, Math.min(YN + 4, YB - left.length * 6.4 - 18), YB, left) : "", // left, clear of the crew; longer for a long figure
      stations: {
        empty: { pose: "letterer", x: XR + 21, y: 0 },              // pen at the bottom plate's set-out
        loading: { pose: "carrier", x: LADDER - 9, y: -70 },        // high on the ladder, the top plate held up
        waiting: { pose: "hauler", x: LADDER + 50, y: 0, flip: true },
        idle: { pose: "sitter", x: CX + 16, y: TOP, flip: true },    // on the top plate
        success: { pose: "sitter", x: CX + 16, y: TOP, flip: true },
        changed: { pose: "letterer", x: XR + 14, y: 0 },             // pointing up at the upper bulb's cloud
        error: { pose: "shrugger", x: XR + 52, y: 0 },
      },
    };
  },
};
