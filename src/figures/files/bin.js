/* ===========================================================================
   Bin: a wheelie bin seen from the side. Trash, deleted items, an empty
   bin, restore, deleted for good.

   It faces left: the lid's lip overhangs the front, the hinge, the handle
   and the wheel are at the back. A bin tips back on its wheel, so the lean,
   the ladder and the crew are all on the right.
   =========================================================================== */

// Measured off the body's front top corner (X0). A worker is 45 tall.
const X0 = 116, TW = 64, XT = X0 + TW;   // front and back at the rim
const BOTTOM = -6, IN = 6;                // the body's floor, how far it tapers in at the foot
const XF = X0 + IN, XB = XT - IN;         // front and back at the floor
const RIM_B = -95, RIM = -99, LID = -104; // rim's lower and upper edge, lid's top at the hinge
const WR = 9, WX = XB - 4, WY = -WR;      // the wheel
const ARCH = -21;                         // top of the wheel arch
const BANDS = [BOTTOM, -36, -66, RIM_B];  // the body's three bands

export default {
  name: "bin",
  title: "Bin",
  shelf: "files",
  use: "Trash, deleted items, an empty bin, restore, deleted for good",
  width: 300,
  height: 136,
  measures: { what: "Days until the bin empties itself", unit: "days", sample: 30 },

  draw({ n, SET_OUT, rectPath, dimension, opts }) {
    // The body's front and back edge at height y, following the taper.
    const ex = (y, x0, x1) => x0 + ((x1 - x0) * (y - BOTTOM)) / (RIM_B - BOTTOM);
    const front = (y) => n(ex(y, XF, X0)), back = (y) => n(ex(y, XB, XT));

    // A band of the body, y0 below y1: filled with paper, its front and back
    // edges stroked. The lowest band has the floor and the wheel arch cut in.
    const band = (i) => {
      const y0 = BANDS[i], y1 = BANDS[i + 1];
      const lowest = i === 0;
      const shape = lowest
        ? `M${front(y0)} ${y0}H${WX - WR - 3}V${ARCH}H${back(ARCH)}L${back(y1)} ${y1}H${front(y1)}Z`
        : `M${front(y0)} ${y0}H${back(y0)}L${back(y1)} ${y1}H${front(y1)}Z`;
      const edges = lowest
        ? `M${front(y1)} ${y1}L${front(y0)} ${y0}H${WX - WR - 3}V${ARCH}H${back(ARCH)}L${back(y1)} ${y1}`
        : `M${front(y1)} ${y1}L${front(y0)} ${y0}M${back(y1)} ${y1}L${back(y0)} ${y0}`;
      // Two ribs down the side, a third of the way in from each edge.
      const rib = (f) => `M${n(front(y0) + (back(y0) - front(y0)) * f)} ${lowest ? y0 - 3 : y0}L${n(front(y1) + (back(y1) - front(y1)) * f)} ${y1}`;
      return `<path class="paper" stroke="none" d="${shape}"/><path d="${edges}"/><path d="${rib(0.3) + rib(0.62)}" opacity="0.4"/>`;
    };

    // The wheel with its hub, and the short front foot.
    const wheel = `<circle class="paper" cx="${WX}" cy="${WY}" r="${WR}"/><circle cx="${WX}" cy="${WY}" r="2.5" opacity="0.6"/>`;
    const foot = `<path class="paper" d="${rectPath(XF + 4, BOTTOM, 9, -BOTTOM)}"/>`;
    // The rim, proud of the body all round.
    const rim = `<path class="paper" d="M${X0 - 1.5} ${RIM_B}V${RIM}H${XT + 1.5}V${RIM_B}Z"/>`;
    // The lid: a top that falls a little to the front, its lip hanging over
    // the rim, the hinge pin at the back.
    const lidD = `M${XT + 2} ${RIM}V${LID}L${X0 - 3} ${LID - 1.5}V${RIM + 6}H${X0}V${RIM}Z`;
    const lid = `<path class="paper" d="${lidD}"/><circle class="paper" cx="${XT + 2}" cy="${RIM - 1}" r="1.6"/>`;
    // The handle bar behind the hinge: two arms out to a bar seen end on.
    const handle = `<path d="M${XT} ${RIM_B + 4}L${XT + 9} ${RIM - 2}M${XT + 3} ${RIM}L${XT + 9} ${RIM - 2}"/><circle class="paper" cx="${XT + 9}" cy="${RIM - 2}" r="2.6"/>`;

    const courses = [wheel + foot, band(0), band(1), band(2), rim, lid, handle];

    const outline =
      `<path d="M${XF} 0V${BOTTOM}L${X0} ${RIM_B}V${RIM}H${XT + 2}V${LID}L${X0 - 3} ${LID - 1.5}V${RIM + 6}` +
      `M${XT + 1.5} ${RIM}V${RIM_B}L${back(ARCH)} ${ARCH}H${WX - WR - 3}V${BOTTOM}H${XF}` +
      `M${WX - WR} ${WY}a${WR} ${WR} 0 1 0 ${2 * WR} 0a${WR} ${WR} 0 1 0 ${-2 * WR} 0" stroke-dasharray="${SET_OUT}"/>`;
    const contents = `<path d="M${front(BANDS[1])} ${BANDS[1]}H${back(BANDS[1])}M${front(BANDS[2])} ${BANDS[2]}H${back(BANDS[2])}"/>`;

    // The app's real retention, on a chain across the body.
    const fig = opts.figure;
    // The mono figures run about 6.3 wide each; the unit is dropped when
    // the whole label would not fit between the chain's arrows.
    const CY = -52, x0 = front(CY) + 1, x1 = back(CY) - 1, PER = 6.4;
    const fits = (t) => t.length * PER + 6 + 18 <= x1 - x0;
    const value = fig && fig.value != null && fig.value !== "" ? String(fig.value) : "";
    const full = value && fig.unit ? `${value} ${fig.unit}` : value;
    const label = fits(full) ? full : value;
    const extras = label ? dimension(x0, CY, x1, CY, label, { gapPerChar: PER }) : "";

    const LADDER = XT + 40;
    return {
      courses,
      outline,
      contents,
      foot: [XT + 10, 0],    // tips back over the wheel; pivot past the handle so the plumb line clears it
      top: LID - 1.5,
      error: "lean",
      lean: 5,
      revise: [X0 - 7, LID - 7, TW + 14, RIM + 8 - LID + 7],
      tag: [X0 - 24, LID + 2],
      tick: [XT + 14, LID - 6],
      access: { kind: "ladder", at: LADDER, height: -RIM, lean: 22 },
      extras,
      stations: {
        empty: { pose: "letterer", x: XT + 26, y: 0 },
        loading: { pose: "carrier", x: LADDER - 9, y: -44 },
        waiting: { pose: "hauler", x: LADDER + 56, y: 0, flip: true },
        idle: { pose: "pusher", x: XB + 18, y: 0 },
        success: { pose: "sitter", x: X0 + 30, y: LID - 1 },
        changed: { pose: "letterer", x: X0 - 30, y: 0, flip: true },
        error: { pose: "shrugger", x: XT + 50, y: 0 },
      },
    };
  },
};
