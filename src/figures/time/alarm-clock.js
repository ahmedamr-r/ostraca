/* ===========================================================================
   Alarm clock: a twin bell alarm clock, front on, twice a worker's height.
   A round body on two splayed legs, two bells on top with the hammer
   between them, a carrying handle arching over, a face ring with twelve
   ticks and no numerals.
   Reminders, alarms, due soon, snooze, deadlines.

   With a real time (opts.figure.value, "7:30") the two hands point at it.
   With none, the hands are left off: a clock showing a time nobody set
   would be an invented number.
   =========================================================================== */
import { ring, timeOf } from "./_parts.js";

// Measured off the body's centre (CX, CY). A worker is 45 tall.
const CX = 118, R = 36, LEG = 12, CY = -LEG - R; // centre, body radius, leg height
const FACE = R - 5;                              // the face ring's radius
const BELL = 13, TILT = 38;                      // bell radius, its axis off the vertical
const HANDLE = -116;                             // the handle's crown
const XR = CX + R;

export default {
  name: "alarm-clock",
  title: "Alarm clock",
  shelf: "time",
  use: "Reminders, alarms, due soon, snooze, deadlines",
  width: 300,
  height: 148,
  measures: { what: "Time", sample: "7:30" },

  draw({ n, SET_OUT, rectPath, opts }) {
    const rad = (deg) => (deg * Math.PI) / 180;
    const at = (deg, r) => [CX + r * Math.sin(rad(deg)), CY - r * Math.cos(rad(deg))]; // 0 is twelve

    // Legs: splayed struts from the body's underside, a pad under each.
    const leg = (s) => {
      const [x, y] = at(180 - s * 32, R - 2);
      const fx = CX + s * 30;
      return `M${n(x - 1.5)} ${n(y)}L${n(fx - 1.8)} -2.5H${n(fx + 1.8)}L${n(x + 1.5)} ${n(y)}Z`;
    };
    const pads = rectPath(CX - 36, -2.5, 10, 2.5) + rectPath(CX + 26, -2.5, 10, 2.5);

    // The body in two halves, filled whole but stroked only round the rim,
    // so the seam between the courses never draws.
    const half = (top) => {
      const s = top ? 1 : 0;
      return `<path class="paper" stroke="none" d="M${CX - R} ${CY}A${R} ${R} 0 0 ${s} ${CX + R} ${CY}Z"/>` +
        `<path d="M${CX - R} ${CY}A${R} ${R} 0 0 ${s} ${CX + R} ${CY}"/>`;
    };

    // The face: a ring, and twelve ticks, the quarters longer.
    let ticks = "";
    for (let h = 0; h < 12; h++) {
      const [x0, y0] = at(h * 30, FACE - 2), [x1, y1] = at(h * 30, FACE - (h % 3 ? 5 : 8));
      ticks += `M${n(x0)} ${n(y0)}L${n(x1)} ${n(y1)}`;
    }
    const face = `<path d="${ring(CX, CY, FACE)}"/><path d="${ticks}" opacity="0.7"/>`;

    // A bell in its own frame: a dome over a rim, a knob on its crown, on a
    // short stem down to the body. Turned out by TILT each side.
    const bellAt = (s) => {
      const d = `M${-BELL} 0A${BELL} ${BELL} 0 0 1 ${BELL} 0Z`;
      const g = (inner) => `<g transform="translate(${CX} ${CY}) rotate(${s * TILT}) translate(0 ${-(R + 5)})">${inner}</g>`;
      return g(`<path class="paper" d="M-1.5 5V0H1.5V5Z"/><path class="paper" d="${d}"/><path d="M${-BELL - 1.5} 0H${BELL + 1.5}"/><path class="paper" d="${ring(0, -BELL - 1.6, 1.6)}"/>`);
    };
    const bellSet = (s) => `<g transform="translate(${CX} ${CY}) rotate(${s * TILT}) translate(0 ${-(R + 5)})"><path d="M-1.5 5V0H1.5V5M${-BELL} 0A${BELL} ${BELL} 0 0 1 ${BELL} 0Z" stroke-dasharray="${SET_OUT}"/></g>`;

    // The hammer: a post up from the body's crown, a ball between the bells.
    const hammer = `<path class="paper" d="${rectPath(CX - 1, CY - R - 9, 2, 9)}"/><path class="paper" d="${ring(CX, CY - R - 11.5, 2.5)}"/>`;
    // The handle: a strap from one bell's stem to the other, arching over
    // the crown. Painted before the bells, so they cover its ends.
    const [hx, hy] = at(TILT, R + 2), C = HANDLE - 12, W = 4;
    const handle = `<path d="M${n(2 * CX - hx)} ${n(hy)}C${n(2 * CX - hx - W)} ${C} ${n(hx + W)} ${C} ${n(hx)} ${n(hy)}"/>` +
      `<path d="M${n(2 * CX - hx + 3.5)} ${n(hy)}C${n(2 * CX - hx - W + 3.5)} ${C + 6} ${n(hx + W - 3.5)} ${C + 6} ${n(hx - 3.5)} ${n(hy)}" opacity="0.5"/>`;
    const crown = n(hy / 4 + (3 * C) / 4); // where the sitter sits

    // The hands, from a real time only.
    const t = timeOf(opts.figure);
    let hands = "";
    if (t) {
      const [mx, my] = at(t.minute * 6, FACE - 8), [hx2, hy2] = at(t.hour * 30 + t.minute / 2, FACE - 15);
      hands = `<path d="M${CX} ${CY}L${n(mx)} ${n(my)}M${CX} ${CY}L${n(hx2)} ${n(hy2)}"/><path class="paper" d="${ring(CX, CY, 1.6)}"/>`;
    }

    const courses = [
      { svg: `<path class="paper" d="${pads}"/>`, still: true },
      `<path class="paper" d="${leg(-1)}${leg(1)}"/>`,
      half(false),
      half(true),
      face,
      handle,
      bellAt(-1) + bellAt(1),
      hammer,
      hands,
    ].filter(Boolean);

    const outline = `<path d="${pads}${leg(-1)}${leg(1)}${ring(CX, CY, R)}" stroke-dasharray="${SET_OUT}"/>` + bellSet(-1) + bellSet(1);
    const SC = XR + 26; // the scaffold bay's near standard
    return {
      courses,
      outline,
      contents: `${face}`,
      foot: [CX + 36, -2.5],
      top: crown,
      error: "lean",
      lean: 5,
      revise: [CX - 22, CY - 22, 44, 44],
      tag: [XR + 30, CY - 24],
      tick: [XR + 4, HANDLE - 2],
      access: { kind: "scaffold", at: [SC, SC + 34] },
      stations: {
        empty: { pose: "letterer", x: CX - R - 22, y: 0, flip: true },  // pen at the body's set-out
        loading: { pose: "carrier", x: SC + 24, y: -2.5, ride: true },  // a bell held up on the board
        waiting: { pose: "hauler", x: SC + 92, y: 0, flip: true },
        idle: { pose: "leaner", x: CX + 30, y: 0 },                      // a hand on the body, by the right leg
        success: { pose: "sitter", x: CX + 4, y: crown },                // on the handle's crown
        changed: { pose: "letterer", x: CX + 52, y: 0 },                 // pen at the rim, clear of the leg
        error: { pose: "shrugger", x: SC + 30, y: 0 },
      },
    };
  },
};
