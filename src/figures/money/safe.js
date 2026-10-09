/* ===========================================================================
   Safe: a strongbox on short feet, front on. Savings goals, vaults, secure
   storage, backups, encrypted or private data.

   Reads by the dial and the hinges: a thick door set inside the body's
   frame, two hinge knuckles down its left side, a round dial with ticks
   round its rim and a pointer above it, a spoked handle beside the dial.
   Built feet, body, door, hinges, dial, handle; the scaffold is on the
   right, and it leans that way.

   opts.figure: a saved amount or a goal, on an upright chain up the door
   ({ value: 25000, unit: "EGP" }).
   =========================================================================== */
import { shown, upright, roundBox, ring } from "./_parts.js";

// Measured off the body's left side (X0). A worker is 45 tall.
const X0 = 60, W = 95, X1 = X0 + W;
const FOOT = -6, BT = -100;                     // body bottom (on its feet), body top
const FR = 7;                                   // the frame round the door
const DX0 = X0 + FR, DX1 = X1 - FR, DT = BT + FR, DB = FOOT - FR;
const DIAL = [DX0 + 31, -58], DR = 13;          // dial centre and radius
const HANDLE = [DX1 - 19, -58], HR = 10;         // handle hub and spoke length
const HINGES = [DT + 12, DB - 24];              // knuckles' tops

export default {
  name: "safe",
  title: "Safe",
  shelf: "money",
  use: "Savings goals, vaults, secure storage, backups, encrypted or private data",
  width: 300,
  height: 132,
  measures: { what: "A saved amount or a goal", unit: "EGP", sample: 25000 },

  draw(ctx) {
    const { n, SET_OUT, opts } = ctx;
    const [cx, cy] = DIAL, [hx, hy] = HANDLE;
    const feet = `M${X0 + 5} 0V${FOOT}H${X0 + 17}V0ZM${X1 - 17} 0V${FOOT}H${X1 - 5}V0Z`;
    const body = roundBox(X0, BT, W, FOOT - BT, 3);
    // The door: its face, and a faint line inset round it for its thickness.
    const door = roundBox(DX0, DT, DX1 - DX0, DB - DT, 2);
    const bevel = roundBox(DX0 + 3, DT + 3, DX1 - DX0 - 6, DB - DT - 6, 1.5);
    const hinges = HINGES.map((y) => roundBox(DX0 - 3, y, 6, 13, 2.5)).join("");
    // The dial: a rim with ticks, a knob, and the pointer above it.
    let ticks = "";
    for (let a = 0; a < 360; a += 15) {
      const t = (a * Math.PI) / 180, r0 = a % 45 ? DR - 3 : DR - 4.5;
      ticks += `M${n(cx + Math.cos(t) * r0)} ${n(cy + Math.sin(t) * r0)}L${n(cx + Math.cos(t) * (DR - 1))} ${n(cy + Math.sin(t) * (DR - 1))}`;
    }
    const pointer = `M${cx - 2.5} ${cy - DR - 6}H${cx + 2.5}L${cx} ${cy - DR - 2}Z`;
    // The handle: a hub and four spokes set at a slant, a knob at each end.
    let spokes = "", knobs = "";
    for (const a of [-45, 45, 135, 225]) {
      const t = (a * Math.PI) / 180, ex = hx + Math.cos(t) * HR, ey = hy + Math.sin(t) * HR;
      spokes += `M${n(hx + Math.cos(t) * 3.5)} ${n(hy + Math.sin(t) * 3.5)}L${n(ex)} ${n(ey)}`;
      knobs += ring(ex, ey, 2.2);
    }

    const courses = [
      { svg: `<path class="paper" d="${feet}"/>`, still: true },
      `<path class="paper" d="${body}"/>`,
      `<path class="paper" d="${door}"/><path d="${bevel}" opacity="0.45"/>`,
      `<path class="paper" d="${hinges}"/>`,
      `<path class="paper" d="${ring(cx, cy, DR)}"/><path d="${ticks}" opacity="0.6"/><path class="paper" d="${ring(cx, cy, 4.5)}"/><path d="${pointer}"/>`,
      `<path d="${spokes}"/><path class="paper" d="${ring(hx, hy, 3.5)}${knobs}"/>`,
    ];

    const outline = `<path d="${feet}${body}" stroke-dasharray="${SET_OUT}"/>`;
    const contents = `<path d="${door}${ring(cx, cy, DR)}${ring(hx, hy, HR)}"/>`;

    const amount = shown(opts.figure);
    const CHAIN = X0 - 46; // out past where the changed letterer stands
    const extras = amount
      ? `<g class="ink dim"><path d="M${CHAIN - 3} ${DT}H${X0 - 3}M${CHAIN - 3} ${DB}H${X0 - 3}" opacity="0.5"/></g>` + upright(ctx, CHAIN, DB, DT, amount)
      : "";

    return {
      courses,
      outline,
      contents,
      foot: [X1, FOOT], // leans off its right foot, toward the scaffold
      top: BT,
      error: "lean",
      lean: 5,
      revise: [cx - DR - 5, cy - DR - 9, 2 * DR + 10, 2 * DR + 14],
      tag: [X1 + 24, BT + 4],
      tick: [X1 + 18, BT - 18],
      letter: { at: [X1 + 16, -22], angle: -2, arrow: false }, // right of the box, nothing to point at
      access: { kind: "scaffold", at: [X1 + 8, X1 + 42] },
      extras,
      stations: {
        empty: { pose: "letterer", x: X1 + 20.8, y: 0 },               // pen at the box's set-out
        loading: { pose: "carrier", x: X1 + 30, y: -2.5, ride: true },  // on the board, the door panel held up
        waiting: { pose: "hauler", x: X1 + 100, y: 0, flip: true },
        idle: { pose: "sitter", x: X1 - 1.5, y: BT + 3, flip: true },       // on top, legs over the edge
        success: { pose: "sitter", x: X1 - 1.5, y: BT + 3, flip: true },
        changed: { pose: "letterer", x: X0 - 24, y: 0, flip: true },     // pointing up at the dial's cloud
        error: { pose: "shrugger", x: X1 + 50, y: 0 },                  // beside the plumb line
      },
    };
  },
};
