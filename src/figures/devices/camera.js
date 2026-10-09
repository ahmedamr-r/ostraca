/* ===========================================================================
   Camera: a camera on a tripod, seen from the side, the lens to the left.
   Photos, video, a media library, camera access, a photo upload.

   Reads by the lens on the box over the three legs. Two legs splay to the
   feet, the third shows between them, fainter, being the far one.
   =========================================================================== */
import { rrect } from "./_parts.js";

// Measured off the tripod's centre column (CX). A worker is 45 tall.
const CX = 140;
const SPREAD = 34, MID = 7;                   // feet: front and back, the far leg
const APEX = -62, KNEE = -30;                 // the legs' top plate, their locks
const HEAD_B = -74, HEAD_T = -80;             // the pan head
const BX0 = CX - 16, BX1 = CX + 16, BT = -110; // the body, sitting on the head
const AXIS = -95;                              // the lens axis
const L1 = 16, L1H = 10, L2 = 15, L2H = 12.5;  // lens barrel: two steps, length and half height
const LADDER = CX + 72;

export default {
  name: "camera",
  title: "Camera",
  shelf: "devices",
  use: "Photos, video, a media library, camera access, a photo upload",
  width: 320,
  height: 142,

  draw({ n, SET_OUT }) {
    // A leg as a narrow tube from (x0, y0) to (x1, y1), w wide.
    const tube = (x0, y0, x1, y1, w) => {
      const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy);
      const ox = (-dy / l) * (w / 2), oy = (dx / l) * (w / 2);
      return `M${n(x0 + ox)} ${n(y0 + oy)}L${n(x1 + ox)} ${n(y1 + oy)}L${n(x1 - ox)} ${n(y1 - oy)}L${n(x0 - ox)} ${n(y0 - oy)}Z`;
    };
    const at = (x0, x1, t) => x0 + (x1 - x0) * t;
    const tKnee = (KNEE - APEX) / -APEX;       // how far down the leg the lock sits
    const legs = [[CX - 5, CX - SPREAD], [CX + 5, CX + SPREAD]];
    const far = [CX, CX + MID];

    // Lower legs and feet first, then the upper legs with their locks.
    const lower = (x0, x1) => tube(at(x0, x1, tKnee), KNEE, x1, 0, 2);
    const upper = (x0, x1) => tube(x0, APEX, at(x0, x1, tKnee + 0.04), KNEE + 1, 3.4);
    const lock = (x0, x1) => rrect(at(x0, x1, tKnee) - 2.4, KNEE - 1.5, 4.8, 4, 1);
    const feet = legs.map(([, x1]) => `M${x1 - 3} 0H${x1 + 3}`).join("");

    // The centre column through the plate, with the spreader to each leg.
    const SPR = -46;
    const spreader = [...legs, far].map(([x0, x1]) => `M${CX} ${SPR}L${n(at(x0, x1, (SPR - APEX) / -APEX))} ${SPR + 6}`).join("");
    const column = rrect(CX - 2, HEAD_B, 4, SPR - HEAD_B + 2, 1);
    const plate = rrect(CX - 8, APEX - 3, 16, 4, 1.5);

    // The pan head, and its handle out the back.
    const head = `M${CX - 9} ${HEAD_B}H${CX + 9}L${CX + 7} ${HEAD_T}H${CX - 7}Z`;
    const handle = tube(CX + 6, HEAD_B - 3, CX + 40, HEAD_B + 10, 2.4) + rrect(CX + 30, HEAD_B + 2.5, 12, 4.4, 2);

    // The body with its eyepiece out the back; the viewfinder hump and the
    // shutter button on top; the lens out the front in two steps.
    const body = rrect(BX0, BT, BX1 - BX0, HEAD_T - BT, 3);
    const eye = rrect(BX1 - 1, BT + 4, 4, 9, 1);
    const hump = `M${BX0 + 4} ${BT}L${BX0 + 7} ${BT - 9}H${BX0 + 19}L${BX0 + 22} ${BT}Z`;
    const shutter = rrect(BX1 - 9, BT - 2.2, 6, 2.4, 0.8);
    const l1 = rrect(BX0 - L1, AXIS - L1H, L1 + 1, 2 * L1H, 1.5);
    const l2 = rrect(BX0 - L1 - L2, AXIS - L2H, L2 + 1, 2 * L2H, 1.5);
    // A grip ring round the barrel, and the front element's rim.
    const rings = `M${BX0 - L1 / 2} ${AXIS - L1H}V${AXIS + L1H}M${BX0 - L1 - L2 + 3.5} ${AXIS - L2H}V${AXIS + L2H}`;

    const P = (d) => `<path class="paper" d="${d}"/>`;
    const courses = [
      `<g opacity="0.55">${P(tube(at(...far, tKnee), KNEE, far[1], 0, 2))}</g>` + legs.map((l) => P(lower(...l))).join("") + `<path d="${feet}"/>`,
      `<g opacity="0.55">${P(tube(far[0], APEX, at(...far, tKnee + 0.04), KNEE + 1, 3.4))}</g>` + legs.map((l) => P(upper(...l)) + P(lock(...l))).join(""),
      `<path d="${spreader}" opacity="0.6"/>` + P(column) + P(plate),
      P(head) + P(handle),
      P(body) + P(eye),
      P(hump) + P(shutter),
      P(l1) + P(l2) + `<path class="faint" d="${rings}"/>`,
    ];

    const outline = `<path d="${legs.map(([x0, x1]) => `M${x0} ${APEX}L${x1} 0`).join("")}M${CX} ${APEX}V${HEAD_B}${head}${body}${hump}${l1}${l2}" stroke-dasharray="${SET_OUT}"/>`;
    const contents = `<path d="M${far[0]} ${APEX}L${far[1]} 0${spreader}M${CX + 6} ${HEAD_B - 3}L${CX + 42} ${HEAD_B + 10}"/>`;

    return {
      courses,
      outline,
      contents,
      foot: [CX + SPREAD, 0],     // tips over the back foot, toward the ladder
      top: BT - 9,
      error: "lean",
      lean: 6,
      revise: [BX0 - L1 - L2 - 3, AXIS - L2H - 3, L1 + L2 + 5, 2 * L2H + 6],
      tag: [BX0 - L1 - L2 - 30, AXIS - 4],       // left of the lens, over the letterer's head
      tick: [BX1 + 12, BT - 12],
      access: { kind: "ladder", at: LADDER, height: -HEAD_T + 10, lean: 24 },
      letter: { at: [6, -126], angle: -2, arrow: true },
      stations: {
        empty: { pose: "letterer", x: CX + SPREAD + 24, y: 0 },     // pen at the back leg's set-out
        loading: { pose: "carrier", x: LADDER - 10, y: -50 },       // on a rung, the body held to the head
        waiting: { pose: "hauler", x: LADDER + 56, y: 0, flip: true },
        idle: { pose: "leaner", x: CX + 58, y: 0 },                 // behind, clear of the back leg
        success: { pose: "leaner", x: CX + 58, y: 0 },
        changed: { pose: "letterer", x: BX0 - L1 - L2 - 14, y: 0, flip: true },
        error: { pose: "shrugger", x: CX + SPREAD + 46, y: 0 },     // beside the plumb line
      },
    };
  },
};
