/* Door frame: a door frame standing on its own on a step, propped both
   sides, the door ajar. Not found, a page that moved, a way in. */
const CX = 200;
const OX0 = CX - 18, OX1 = CX + 18, OTOP = -62, IX0 = CX - 13, IX1 = CX + 13, ITOP = -57;
const LW = 9, TE = 2.6; // the leaf: a third of its face shows, then its edge

export default {
  name: "door-frame",
  title: "Door frame",
  shelf: "site",
  use: "Not found, a page that moved, a way in",
  width: 320,
  height: 96,
  draw({ SET_OUT }) {
    const step = `<path class="paper" d="M${CX - 24} 0V-3H${CX + 24}V0Z"/>`;
    // Props: a raking shore each side to a stake, part of the frame's course.
    const props = `<path class="temp" d="M${OX0} -30L${OX0 - 22} 0M${OX0 - 24} -1V4M${OX1} -30L${OX1 + 22} 0M${OX1 + 24} -1V4"/>`;
    const jambs = `<path class="paper" fill-rule="evenodd" d="M${OX0} -3V${OTOP + 5}H${OX1}V-3ZM${IX0} -3V${ITOP}H${IX1}V-3Z"/>`;
    const head = `<path class="paper" d="M${OX0 - 3} ${OTOP + 5}V${OTOP}H${OX1 + 3}V${OTOP + 5}Z"/>`;
    // The leaf swung toward us to about 70 degrees: face, edge, then the
    // opening, wider than the leaf so it cannot read as half of a pair.
    const leaf =
      `<path class="paper" d="M${IX0} -3V${ITOP}H${IX0 + LW}V-3Z"/>` +
      `<path class="paper" d="M${IX0 + LW} -3V${ITOP}H${IX0 + LW + TE}V-3Z"/>` +
      `<path d="M${IX0 + 1.8} ${ITOP + 5}H${IX0 + LW - 1.8}V${ITOP + 24}H${IX0 + 1.8}ZM${IX0 + 1.8} ${ITOP + 29}H${IX0 + LW - 1.8}V-9H${IX0 + 1.8}Z" opacity="0.4"/>` +
      `<circle cx="${IX0 + LW - 2}" cy="-30" r="1"/>` +
      `<path d="M${IX0 - 1} ${ITOP + 7}v5M${IX0 - 1} -16v5" style="stroke-width:1.4"/>`;

    return {
      courses: [{ svg: step, still: true }, props + jambs, head, leaf],
      outline: `<path d="M${OX0 - 3} -3V${OTOP}H${OX1 + 3}V-3" stroke-dasharray="${SET_OUT}"/>`,
      contents: `<path d="M${CX - 24} -3H${CX + 24}M${IX0} -3V${ITOP}H${IX1}V-3M${IX0 + LW} -3V${ITOP}"/>`,
      foot: [OX1, -3],
      top: OTOP,
      error: "lean",
      lean: 4,
      revise: [IX0 - 3, ITOP + 1, LW + 7, 52],
      tag: [OX1 + 24, ITOP + 6],
      tick: [OX1 + 9, OTOP - 6],
      access: { kind: "ladder", at: OX1 + 30, height: 62, lean: 26 },
      letter: { at: [36, -40], angle: -2, arrow: true },
      stations: {
        empty: { pose: "letterer", x: OX1 + 38, y: 0 },
        loading: { pose: "carrier", x: OX0 - 44, y: 0, flip: true },
        waiting: { pose: "hauler", x: OX1 + 84, y: 0, flip: true },
        idle: { pose: "leaner", x: OX0 - 40, y: 0 },
        success: { pose: "leaner", x: OX0 - 40, y: 0 },
        changed: { pose: "letterer", x: OX0 - 32, y: 0, flip: true },
        error: { pose: "shrugger", x: OX0 - 42, y: 0 },
      },
    };
  },
};
