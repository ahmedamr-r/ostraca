/* ===========================================================================
   Stove: a cooking range with a lidded pot on the hob, front on.
   Food orders being cooked, recipes, meal plans, a kitchen closed for the
   night.

   The oven body on short feet, its door with a window and a bar handle,
   a row of knobs above the door, the hob, and on the hob a pot with a
   handle each side and a lid. Steam rises off the lid in three faint
   wisps. The time left, when the app passes one, goes on a chain over it.
   =========================================================================== */
import { ring, shown } from "./_parts.js";

// Measured off the oven body's left side (X0). A worker is 45 tall.
const X0 = 84, W = 96, X1 = X0 + W, XM = X0 + W / 2;
const FEET = -4, BODY = -62, HOB = -66;     // feet top, body top, hob top
const DOOR = [-10, -46], WIN = [-17, -38];   // door and window: foot, head
const KNOBS = -54;                           // the knobs' centres
const POT_W = 54, POT_H = 26, LID = 7;       // pot body, lid rise
const PX0 = XM - POT_W / 2, PX1 = XM + POT_W / 2, PTOP = HOB - POT_H;

export default {
  name: "stove",
  title: "Stove",
  shelf: "shopping",
  use: "Food orders being cooked, recipes, meal plans, a kitchen closed for the night",
  width: 300,
  height: 140,
  measures: { what: "Time left", unit: "min", sample: 12 },

  draw({ n, SET_OUT, dimension, opts }) {
    const left = shown(opts.figure);

    const feet = `<path class="paper" d="M${X0 + 5} 0V${FEET}H${X0 + 13}V0ZM${X1 - 13} 0V${FEET}H${X1 - 5}V0Z"/>`;
    const body = `<path class="paper" d="M${X0} ${FEET}V${BODY}H${X1}V${FEET}Z"/><path d="M${X0} ${DOOR[1] - 3}H${X1}" opacity="0.5"/>`;

    // The door: a panel with a window, a faint shelf seen through it, and a
    // bar handle on two stand offs across its head.
    const door = `<path class="paper" d="M${X0 + 6} ${DOOR[0]}V${DOOR[1]}H${X1 - 6}V${DOOR[0]}Z"/>` +
      `<path class="paper" d="M${X0 + 16} ${WIN[0]}V${WIN[1]}H${X1 - 16}V${WIN[0]}Z"/>` +
      `<path d="M${X0 + 18} ${WIN[0] - 7}H${X1 - 18}" opacity="0.4"/>` +
      `<path d="M${X0 + 18} ${DOOR[1] + 2}V${DOOR[1] + 4}M${X1 - 18} ${DOOR[1] + 2}V${DOOR[1] + 4}"/>` +
      `<path class="paper" d="M${X0 + 14} ${DOOR[1] + 4}H${X1 - 14}V${DOOR[1] + 6.5}H${X0 + 14}Z"/>`;

    // The knobs: five in a row, each with its pointer.
    let knobRings = "", pointers = "";
    for (let k = 0; k < 5; k++) {
      const cx = X0 + 16 + k * ((W - 32) / 4);
      knobRings += ring(cx, KNOBS, 3.2);
      const a = (-90 + (k - 2) * 35) * (Math.PI / 180);
      pointers += `M${n(cx)} ${KNOBS}L${n(cx + 2.6 * Math.cos(a))} ${n(KNOBS + 2.6 * Math.sin(a))}`;
    }
    const knobs = `<path class="paper" d="${knobRings}"/><path d="${pointers}" opacity="0.6"/>`;

    // The hob: a slab over the body, the pan supports showing as two low
    // bars under the pot.
    const hob = `<path class="paper" d="M${X0 - 2} ${BODY}V${HOB}H${X1 + 2}V${BODY}Z"/>` +
      `<path d="M${PX0 + 6} ${HOB}V${HOB - 2}H${PX1 - 6}V${HOB}" opacity="0.6"/>`;

    // The pot: a body a little wider at its rim, a loop handle each side.
    const pot = `<path class="paper" d="M${PX0 + 2} ${HOB - 2}L${PX0} ${PTOP}H${PX1}L${PX1 - 2} ${HOB - 2}Z"/>` +
      `<path d="M${PX0} ${PTOP + 5}H${PX0 - 6}V${PTOP + 10}H${PX0 + 1}M${PX1} ${PTOP + 5}H${PX1 + 6}V${PTOP + 10}H${PX1 - 1}"/>` +
      `<path d="M${PX0 + 1} ${PTOP + 3}H${PX1 - 1}" opacity="0.45"/>`;
    // The lid: a shallow dome with a knob.
    const lid = `<path class="paper" d="M${PX0 - 2} ${PTOP}Q${XM} ${PTOP - 2 * LID} ${PX1 + 2} ${PTOP}Z"/>` +
      `<path class="paper" d="M${XM - 3} ${PTOP - LID + 0.5}V${PTOP - LID - 3}H${XM + 3}V${PTOP - LID + 0.5}Z"/>`;
    // Steam: three faint wisps off the lid.
    const wisp = (x, h) => `M${x} ${PTOP - LID - 5}c-4 -4 4 -${h / 3} 0 -${h / 2}s4 -${h / 4} 0 -${h / 2}`;
    const steam = `<path d="${wisp(XM - 13, 14)}${wisp(XM, 17)}${wisp(XM + 13, 14)}" opacity="0.5"/>`;

    const outline = `<path d="M${X0 + 5} 0V${FEET}M${X0 + 13} ${FEET}V0M${X1 - 13} 0V${FEET}M${X1 - 5} ${FEET}V0` +
      `M${X0} ${FEET}V${BODY}H${X1}V${FEET}ZM${X0 - 2} ${BODY}V${HOB}H${X1 + 2}V${BODY}` +
      `M${PX0 + 2} ${HOB - 2}L${PX0} ${PTOP}H${PX1}L${PX1 - 2} ${HOB - 2}ZM${PX0 - 2} ${PTOP}Q${XM} ${PTOP - 2 * LID} ${PX1 + 2} ${PTOP}" stroke-dasharray="${SET_OUT}"/>`;
    const contents = `<path d="M${X0 + 6} ${DOOR[0]}V${DOOR[1]}H${X1 - 6}V${DOOR[0]}M${X0 + 16} ${WIN[0]}V${WIN[1]}H${X1 - 16}V${WIN[0]}Z${knobRings}"/>`;

    // The time left, as the app estimates it, over the steam.
    // The chain runs wide of the pot: a unit ("12 min") needs a long gap.
    const extras = left ? dimension(PX0 - 24, PTOP - 38, PX1 + 24, PTOP - 38, left) : "";
    const LADDER = X1 + 24;

    return {
      courses: [feet, body, door, knobs, hob, pot, lid, steam],
      outline,
      contents,
      foot: [X1, 0],
      top: PTOP - LID - 3,
      error: "lean",
      lean: 5,
      revise: [PX0 - 9, PTOP - LID - 5, POT_W + 18, POT_H + LID + 5],
      tag: [PX1 + 34, PTOP - 14],
      tick: [X1 + 12, PTOP - 12],
      access: { kind: "ladder", at: LADDER, height: -HOB, lean: 21 },
      extras,
      stations: {
        empty: { pose: "letterer", x: X0 - 26, y: 0, flip: true },
        loading: { pose: "carrier", x: LADDER - 9, y: -48 },
        waiting: { pose: "hauler", x: LADDER + 56, y: 0, flip: true },
        idle: { pose: "leaner", x: X1 + 2, y: 0 },
        success: { pose: "sitter", x: X1 + 22, y: 0 },              // on the ground, not on the hob
        changed: { pose: "letterer", x: X0 - 24, y: 0, flip: true },  // on the floor, pen up at the pot
        error: { pose: "shrugger", x: X1 + 46, y: 0 },
      },
    };
  },
};
