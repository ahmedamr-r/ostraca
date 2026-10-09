/* ===========================================================================
   Trolley: a supermarket trolley seen from the side, its front to the left.
   Shopping cart, wishlist, saved for later, checkout, an item out of stock.

   A wire basket wider at its top than at its floor, the front leaning out,
   on a chassis with a lower tray and two castors. The handle sits at the
   back top, end on, so it shows as a small round bar.
   =========================================================================== */
import { countOf, ring, shape, box } from "./_parts.js";

// Measured off the basket's front top corner (X0). A worker is 45 tall.
const X0 = 62;
const WHEEL = 5.5, AXLE = -WHEEL;                 // castor radius, axle height
const FRONT_C = X0 + 26, BACK_C = X0 + 104;       // castor pivots
const CHASSIS = -17, TRAY = -23;                  // chassis bar, lower tray's top
const FLOOR = -50, RIM = -94;                     // basket floor and top rim
const FB = X0 + 22, BB = X0 + 108;                // basket floor: front, back
const FT = X0, BT = X0 + 114;                     // basket rim: front, back
const HX = X0 + 126, HY = -103;                   // the handle bar, end on
const MAX = 6;                                    // boxes drawn before the count goes on a chain

export default {
  name: "trolley",
  title: "Trolley",
  shelf: "shopping",
  use: "Shopping cart, wishlist, saved for later, checkout, an item out of stock",
  width: 320,
  height: 132,
  measures: { what: "Items in the cart", sample: 9 },

  draw({ n, SET_OUT, dimension, opts }) {
    const count = countOf(opts.figure);
    const total = count == null ? 3 : Math.min(count, MAX);

    // The front edge leans out: x along it at height y.
    const frontAt = (y) => FB + ((FT - FB) * (y - FLOOR)) / (RIM - FLOOR);
    const backAt = (y) => BB + ((BT - BB) * (y - FLOOR)) / (RIM - FLOOR);

    // Castors: a wheel each on a short fork, the wheel trailing its pivot.
    const castor = (x) => `<path class="paper" d="${ring(x + 2.5, AXLE, WHEEL)}"/>` +
      `<path d="M${x} ${CHASSIS}V${CHASSIS + 4}L${x + 2.5} ${AXLE}"/><path d="${ring(x + 2.5, AXLE, 1.2)}" opacity="0.6"/>`;

    // The chassis: a bar from castor to castor, the lower tray on it, and
    // the back leg rising from the back castor to the basket and handle.
    const chassis = `<path class="paper" d="M${FRONT_C - 6} ${CHASSIS}H${BACK_C + 2}V${CHASSIS + 2.5}H${FRONT_C - 6}Z"/>` +
      `<path class="paper" d="M${FRONT_C} ${TRAY}H${BACK_C - 10}V${CHASSIS}H${FRONT_C}Z"/>` +
      `<path d="${Array.from({ length: 9 }, (_, i) => `M${n(FRONT_C + 6 + i * 7)} ${TRAY}V${CHASSIS}`).join("")}" opacity="0.4"/>`;
    const leg = `<path d="M${BACK_C} ${CHASSIS}L${BB + 2} ${FLOOR}M${FB + 8} ${FLOOR}L${FRONT_C + 4} ${CHASSIS}"/>`;

    // The basket: its floor, then its frame (a paper side so the scaffold
    // behind is knocked out), then the wires as faint uprights and rails.
    const floor = `<path class="paper" d="M${FB} ${FLOOR}H${BB}V${FLOOR + 2.5}H${FB}Z"/>`;
    const side = shape([[FB, FLOOR], [BB, FLOOR], [BT, RIM], [FT, RIM]]);
    let wires = "";
    for (let i = 1; i < 12; i++) {
      const t = i / 12;
      wires += `M${n(FB + (BB - FB) * t)} ${FLOOR}L${n(FT + (BT - FT) * t)} ${RIM}`;
    }
    for (const y of [-65, -80]) wires += `M${n(frontAt(y))} ${y}H${n(backAt(y))}`;
    const frame = `<path class="paper" d="${side}"/><path d="M${n(FT - 2)} ${RIM}H${n(BT + 2)}" />`;
    const wireSvg = `<path d="${wires}" opacity="0.38"/>`;

    // The handle: arms from the back of the rim up and back to the bar.
    const handle = `<path d="M${BT} ${RIM}L${HX} ${HY}M${n(backAt(-80))} -80L${HX - 2} ${HY + 2}"/>` +
      `<path class="paper" d="${ring(HX, HY, 3.2)}"/>`;

    // The items: one box each up to MAX, a row on the floor, the rest on
    // top. Seen through the wires, so the wires are drawn over them again.
    const sizes = [[20, 18], [15, 24], [22, 14], [17, 20], [16, 12], [14, 15]];
    const placed = [];
    let items = "", x = FB + 5;
    for (let k = 0; k < total; k++) {
      const [w, h] = sizes[k];
      let bx, by;
      if (k < 4) { bx = x; by = FLOOR - h; x += w + 1.5; }
      else { const under = placed[k === 4 ? 1 : 3]; bx = under.x + (under.w - w) / 2 + 2; by = under.y - h; }
      items += box(bx, by, w, h);
      placed.push({ x: bx, y: by, w, h });
    }
    const right = Math.max(0, ...placed.map((b) => b.x + b.w)), high = Math.min(0, ...placed.map((b) => b.y));
    const itemsSvg = items ? items + wireSvg.replace("0.38", "0.3") : "";

    const outline = `<path d="${ring(FRONT_C + 2.5, AXLE, WHEEL)}${ring(BACK_C + 2.5, AXLE, WHEEL)}` +
      `M${FRONT_C - 6} ${CHASSIS}H${BACK_C + 2}M${FRONT_C} ${TRAY}H${BACK_C - 10}V${CHASSIS}` +
      `M${BACK_C} ${CHASSIS}L${BB + 2} ${FLOOR}${side}M${BT} ${RIM}L${HX} ${HY}${ring(HX, HY, 3.2)}" stroke-dasharray="${SET_OUT}"/>`;
    const contents = `<path d="${wires}"/>`;

    const revise = total ? [FB + 2, high - 4, right - FB + 1, FLOOR - high + 5] : [FB, FLOOR - 24, BB - FB, 26];
    const extras = count != null && count > MAX ? dimension(FT + 14, RIM - 9, BT - 14, RIM - 9, String(count)) : "";
    const SC = [BT + 22, BT + 52];

    return {
      courses: [
        castor(FRONT_C) + castor(BACK_C),
        chassis + leg,
        floor,
        frame,
        wireSvg,
        handle,
        itemsSvg,
      ].filter(Boolean),
      outline,
      contents,
      foot: [BACK_C + 2.5 + WHEEL, 0],
      top: HY - 3,
      error: "lean",
      lean: 5,
      revise: revise.map(n),
      tag: [FT - 22, FLOOR - 40],
      tick: [HX + 6, HY - 8],
      access: { kind: "scaffold", at: SC },
      extras,
      stations: {
        empty: { pose: "letterer", x: FT - 18, y: 0, flip: true },
        loading: { pose: "carrier", x: SC[1] - 6, y: -2.5, ride: true },
        waiting: { pose: "hauler", x: SC[1] + 52, y: 0, flip: true },
        idle: { pose: "pusher", x: BACK_C + 18, y: 0 },
        success: { pose: "pusher", x: BACK_C + 18, y: 0 },
        changed: { pose: "letterer", x: FT - 22, y: 0, flip: true },
        error: { pose: "shrugger", x: SC[1] + 14, y: 0 },
      },
    };
  },
};
