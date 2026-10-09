/* Bell: a bell hung in a timber A frame, front on. Notifications, all
   caught up, alerts muted, a reminder going out.

   The frame's legs splay wide enough to clear the bell's lip; a cross bar
   ties them under it, a headstock caps the apex, and a pull cord falls
   from a short lever on the headstock past the right leg. */

// Measured off the frame's centre line (CX). A worker is 45 tall.
const CX = 120;
const LEG_X = 52, LEG_T = 5, LEG_W = 3.4; // leg foot from the centre, top from the centre, thickness
const HEAD = -101, HEAD_B = -95;          // headstock top and underside
const BAR = -26;                          // cross bar's top face
const CROWN = -88, SHOULDER = -80, LIP = -54; // bell: crown, shoulder, lip
const LEVER = 50;                         // the cord's lever reaches this far right, past the leg
const CORD_END = -24;                     // the cord's knot
const LADDER = CX + 66;                   // the ladder's foot; it leans on the right leg

export default {
  name: "bell",
  title: "Bell",
  shelf: "messages",
  use: "Notifications, all caught up, alerts muted, a reminder going out",
  width: 300,
  height: 118,
  measures: { what: "Unread notifications", sample: 3 },

  draw({ n, SET_OUT, rectPath, dimension, opts }) {
    // A leg as a closed parallelogram from its foot to the headstock.
    const legAt = (y, s) => CX + s * (LEG_X - ((LEG_X - LEG_T) * -y) / -HEAD_B); // centre line of a leg at y
    const leg = (s) => {
      const fx = CX + s * LEG_X, tx = CX + s * LEG_T, w = (s * LEG_W) / 2;
      return `M${n(fx - w)} -3L${n(tx - w)} ${HEAD_B}L${n(tx + w)} ${HEAD_B}L${n(fx + w)} -3Z`;
    };
    const feet = rectPath(CX - LEG_X - 6, -3, 12, 3) + rectPath(CX + LEG_X - 6, -3, 12, 3);
    const legs = leg(-1) + leg(1);
    // The cross bar runs leg to leg, a little proud of each.
    const bx0 = legAt(BAR, -1) - 3, bx1 = legAt(BAR, 1) + 3;
    const bar = rectPath(n(bx0), BAR, n(bx1 - bx0), 4);
    const headstock = rectPath(CX - 16, HEAD, 32, HEAD_B - HEAD) + `M${CX + 16} ${HEAD + 1.5}L${CX + LEVER} ${HEAD + 3}V${HEAD + 5}L${CX + 16} ${HEAD + 4.5}`;

    // The bell: a canon loop on the crown, shoulders, a waist drawn in, and
    // the lip flaring out. Symmetric about CX, written as one closed path.
    const bellD =
      `M${CX - 22} ${LIP}C${CX - 15} ${LIP - 2} ${CX - 13} ${LIP - 10} ${CX - 13} ${SHOULDER + 6}` +
      `C${CX - 13} ${SHOULDER - 4} ${CX - 10} ${CROWN} ${CX} ${CROWN}C${CX + 10} ${CROWN} ${CX + 13} ${SHOULDER - 4} ${CX + 13} ${SHOULDER + 6}` +
      `C${CX + 13} ${LIP - 10} ${CX + 15} ${LIP - 2} ${CX + 22} ${LIP}Z`;
    const canon = `M${CX - 3} ${CROWN}V${HEAD_B + 2}Q${CX} ${HEAD_B - 1} ${CX + 3} ${HEAD_B + 2}V${CROWN}`;
    const bell = `<path class="paper" d="${bellD}"/><path d="${canon}"/>` +
      `<path d="M${CX - 18.5} ${LIP - 2.5}H${CX + 18.5}M${CX - 13} ${SHOULDER + 3}H${CX + 13}" opacity="0.45"/>`;
    // The clapper's ball just shows under the lip.
    const clapper = `<path d="M${CX} ${LIP - 6}V${LIP + 1.6}" opacity="0.6"/><circle class="paper" cx="${CX}" cy="${LIP + 4}" r="2.4"/>`;
    // The cord: off the lever's end, past the leg, a knot at the bottom.
    const cord = `<path d="M${CX + LEVER - 1} ${HEAD + 5}V${CORD_END}M${CX + LEVER - 2.2} ${CORD_END - 3}h2.4" opacity="0.7"/>` +
      `<circle class="paper" cx="${CX + LEVER - 1}" cy="${CORD_END + 1.4}" r="1.4"/>`;

    // A real count of unread notifications on a short chain under the bell,
    // left off at zero.
    const count = Number.isFinite(opts.figure?.value) ? Math.max(0, Math.floor(opts.figure.value)) : null;
    const extras = count ? dimension(CX - 20, BAR - 12, CX + 20, BAR - 12, String(count)) : "";

    const outline =
      `<path d="${feet}${legs}${bar}${rectPath(CX - 16, HEAD, 32, HEAD_B - HEAD)}${bellD}" stroke-dasharray="${SET_OUT}"/>`;

    return {
      courses: [
        { svg: `<path class="paper" d="${feet}"/>`, still: true },
        `<path class="paper" d="${legs}"/>`,
        `<path class="paper" d="${bar}"/>`,
        `<path class="paper" d="${headstock}"/>`,
        bell,
        clapper,
        cord,
      ],
      outline,
      contents: `<path d="${canon}M${CX} ${LIP - 6}V${LIP + 4}M${CX + LEVER - 1} ${HEAD + 5}V${CORD_END}"/>`,
      foot: [CX + LEG_X + 6, -3], // leans off the right foot, toward the ladder side
      top: HEAD,
      error: "lean",
      lean: 5,
      revise: [CX - 25, CROWN - 4, 50, LIP - CROWN + 10],
      tag: [CX + 78, CROWN + 2],
      tick: [CX + 26, HEAD - 7],
      access: { kind: "ladder", at: LADDER, height: 66, lean: 40 },
      extras,
      stations: {
        empty: { pose: "letterer", x: CX + LEG_X + 26, y: 0 },
        loading: { pose: "carrier", x: LADDER - 19, y: -34 },
        waiting: { pose: "hauler", x: LADDER + 56, y: 0, flip: true },
        idle: { pose: "leaner", x: CX - LEG_X - 14, y: 0 },
        success: { pose: "rope", x: CX + LEVER + 13, y: 0, flip: true },
        changed: { pose: "letterer", x: CX - LEG_X - 20, y: 0, flip: true },
        error: { pose: "shrugger", x: CX + LEG_X + 44, y: 0 },
      },
    };
  },
};
