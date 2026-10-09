/* Mailbox: a roadside mailbox on a post, seen from the side. Email,
   newsletters, subscribe forms, a confirmation sent, an address that
   bounced.

   The door faces left. The flag rides on a pivot on the near side,
   toward the back: up when the app passes an unread count above zero,
   lying along the box when not. No number is drawn. */

// Measured off the post's centre line (PX). A worker is 45 tall.
const PX = 178, PW = 7;                 // post centre and width, under the back end
const MOUNT = -54, MOUNT_H = 4;         // the board on the post's head, its depth
const BX0 = PX - 80, BX1 = PX + 8;      // the box's front (door end) and back
const FLOOR = MOUNT - MOUNT_H, FLOOR_H = 3; // box floor plate
const BODY = FLOOR - FLOOR_H;           // where the shell starts
const TOP = -100, R = 10;                // shell top and the radius its ends roll over
const FX = BX1 - 15, FY = -77;          // the flag's pivot
const LADDER = BX1 + 42;                // the ladder's foot, at the back end

export default {
  name: "mailbox",
  title: "Mailbox",
  shelf: "messages",
  use: "Email, newsletters, subscribe forms, a confirmation sent, an address that bounced",
  width: 300,
  height: 118,
  measures: { what: "Unread messages, raising the flag above zero", sample: 2 },

  draw({ n, SET_OUT, rectPath, opts }) {
    const up = Number.isFinite(opts.figure?.value) && opts.figure.value > 0;

    // The post with its foot in the ground (faint below the line), and
    // one short brace from the post up under the front of the board.
    const post = rectPath(PX - PW / 2, MOUNT, PW, -MOUNT);
    const brace = `M${PX - PW / 2} -26L${PX - 34} ${MOUNT}L${PX - 39} ${MOUNT}L${PX - PW / 2} -20Z`;
    const buried = `<path d="M${PX - PW / 2} 0V12H${PX + PW / 2}V0" opacity="0.4" stroke-dasharray="${SET_OUT}"/>`;
    const mount = rectPath(BX0 + 10, MOUNT - MOUNT_H, BX1 - BX0 - 12, MOUNT_H);

    // The box: a floor plate, then the shell with its ends rolled over,
    // two stamped ribs and the line where the round top springs.
    const floor = rectPath(BX0, FLOOR - FLOOR_H, BX1 - BX0, FLOOR_H);
    const shell = `M${BX0} ${BODY}V${TOP + R}Q${BX0} ${TOP} ${BX0 + R} ${TOP}H${BX1 - R}Q${BX1} ${TOP} ${BX1} ${TOP + R}V${BODY}Z`;
    const ribs = `M${BX0 + 7} ${TOP + 0.5}V${BODY}M${BX1 - 7} ${TOP + 0.5}V${BODY}M${BX0 + 1} ${TOP + 13}H${BX1 - 1}`;

    // The door: a slab proud of the front end, rolled like the shell, a
    // hinge at its foot and a pull at its middle.
    const door = `M${BX0 - 2.5} ${BODY + 1}V${TOP + R}Q${BX0 - 2.5} ${TOP - 2.5} ${BX0 + R} ${TOP - 2.5}V${TOP}Q${BX0} ${TOP} ${BX0} ${TOP + R}V${BODY + 1}Z`;
    const pull = `M${BX0 - 2.5} ${-82}h-4v5h4`;

    // The flag on its pivot: arm and plate, standing or lying forward.
    const flag = up
      ? `M${FX - 1.2} ${FY}V${FY - 34}H${FX + 12}V${FY - 25}H${FX + 1.2}V${FY}Z`
      : `M${FX} ${FY - 1.2}H${FX - 34}V${FY + 9}H${FX - 25}V${FY + 1.2}H${FX}Z`;
    const pivot = `<circle class="paper" cx="${FX}" cy="${FY}" r="2"/>`;
    const flagBox = up ? [FX - 4, FY - 38, 20, 42] : [FX - 38, FY - 5, 44, 18];

    const outline = `<path d="${post}${brace}${mount}${floor}${shell}" stroke-dasharray="${SET_OUT}"/>`;

    return {
      courses: [
        `<path class="paper" d="${post}"/>${buried}`,
        `<path class="paper" d="${brace}"/>`,
        `<path class="paper" d="${mount}"/>`,
        `<path class="paper" d="${floor}"/>`,
        `<path class="paper" d="${shell}"/><path d="${ribs}" opacity="0.4"/>`,
        `<path class="paper" d="${door}"/><path d="${pull}"/><circle cx="${BX0 - 1}" cy="${BODY - 1.5}" r="1"/>`,
        `<path class="paper" d="${flag}"/>${pivot}`,
      ],
      outline,
      contents: `<path d="${ribs}M${BX0 - 2.5} ${BODY + 1}V${TOP + R}"/>`,
      foot: [PX + PW / 2, 0], // the post goes over at its foot, the box swinging out past the back
      top: TOP,
      error: "lean",
      lean: 6,
      revise: flagBox.map(n),
      tag: up ? [FX + 40, FY - 10] : [BX1 + 30, TOP + 4],
      tick: [BX1 + 10, TOP - 8],
      access: { kind: "ladder", at: LADDER, height: 70, lean: 40 },
      stations: {
        empty: { pose: "letterer", x: PX + 30, y: 0 },
        loading: { pose: "carrier", x: LADDER - 17, y: -34 },
        waiting: { pose: "hauler", x: LADDER + 56, y: 0, flip: true },
        idle: { pose: "leaner", x: PX + 14, y: 0 },
        success: { pose: "caller", x: PX + 34, y: 0 },
        changed: { pose: "letterer", x: BX1 + 34, y: 0 },
        error: { pose: "shrugger", x: BX1 + 52, y: 0 },
      },
    };
  },
};
