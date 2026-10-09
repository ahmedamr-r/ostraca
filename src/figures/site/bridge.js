/* Bridge: a truss across a cut, on a bank each side. Sync, linking two
   accounts, anything joining two ends. Built from both banks toward the
   middle on falsework; out of true, the span sags under a string line. */
const X0 = 140, SPAN = 280, PANELS = 8, DEPTH = 30, B = -6, FLOOR = 26, DROP = 10;
const P = SPAN / PANELS, XC = X0 + SPAN / 2, T = B - DEPTH;
const BANK_L = X0 + 9, BANK_R = X0 + SPAN - 9;
const xs = (i) => X0 + i * P;

export default {
  name: "bridge",
  title: "Bridge",
  shelf: "site",
  use: "Sync, linked accounts and anything joining two ends",
  width: 560,
  height: 92,
  depth: 42,
  draw({ n, SET_OUT, sag, hatch, when }) {
    // A panel's members, with the whole span dropped `s` at the middle.
    const dip = (x, s) => s * (1 - ((x - XC) / (SPAN / 2)) ** 2);
    const pt = (i, y, s) => `${n(xs(i))} ${n(y + dip(xs(i), s))}`;
    const panel = (i, s) => {
      let d = `M${pt(i, B, s)}L${pt(i + 1, B, s)}M${pt(i, B - 3, s)}L${pt(i + 1, B - 3, s)}`;
      if (i === 0) d += `M${pt(0, B - 3, s)}L${pt(1, T, s)}L${pt(1, B - 3, s)}`;
      else if (i === PANELS - 1) d += `M${pt(PANELS, B - 3, s)}L${pt(PANELS - 1, T, s)}`;
      else {
        d += `M${pt(i, T, s)}L${pt(i + 1, T, s)}M${pt(i + 1, T, s)}L${pt(i + 1, B - 3, s)}`;
        d += i < PANELS / 2 ? `M${pt(i, T, s)}L${pt(i + 1, B - 3, s)}` : `M${pt(i + 1, T, s)}L${pt(i, B - 3, s)}`;
      }
      return d;
    };
    // Build order: one panel off each bank in turn, meeting in the middle.
    const order = [];
    for (let k = 0; k < PANELS / 2; k++) order.push(k, PANELS - 1 - k);
    const courses = order.map((i) => sag(panel(i, 0), panel(i, DROP)));
    let inside = "";
    for (let i = 0; i < PANELS; i++) inside += panel(i, 0);

    // Bearings on the banks, always there. The cut and its earth.
    const fixed = `<path class="paper" d="M${BANK_L - 18} ${B}H${BANK_L}V0H${BANK_L - 18}Z"/><path class="paper" d="M${BANK_R} ${B}H${BANK_R + 18}V0H${BANK_R}Z"/>`;
    const cut = `M0 0H${BANK_L}L${BANK_L + 22} ${FLOOR}H${BANK_R - 22}L${BANK_R} 0H560`;
    const ground = `<path class="gnd" d="${cut}"/>` + hatch(BANK_L - 56, BANK_L - 8) + hatch(BANK_L + 34, BANK_R - 22, FLOOR + 3) + hatch(BANK_R + 22, BANK_R + 70);

    // Falsework: two trestles under the middle while it goes up.
    const fw = (x) => `<path class="std" d="M${x} ${FLOOR}V${B}M${x + 20} ${FLOOR}V${B}"/><path d="M${x - 2} ${FLOOR - 14}H${x + 22}M${x - 2} ${FLOOR - 28}H${x + 22}"/><path class="std" d="M${x} ${FLOOR}L${x + 20} ${B}"/>`;
    const falsework = when("loading", `<g class="ink temp">${fw(XC - 50)}${fw(XC + 30)}</g>`);

    const mid = xs(PANELS / 2);
    return {
      courses,
      outline: `<path d="M${xs(0)} ${B}L${xs(1)} ${T}H${xs(PANELS - 1)}L${xs(PANELS)} ${B}Z" stroke-dasharray="${SET_OUT}"/>`,
      contents: `<path d="${inside}"/>`,
      fixed: fixed + falsework,
      ground,
      groundLine: false,
      foot: [xs(PANELS), B],
      top: T,
      error: "sag",
      string: [[xs(0) - 6, B], [xs(PANELS) + 6, B]],
      tick: [xs(PANELS) + 6, T - 6],
      revise: [mid - P * 0.75, T - 9, P * 1.5, 16],
      tag: [mid + P * 0.75 + 15, T - 13],
      stations: {
        empty: { pose: "letterer", x: BANK_L - 30, y: 0, flip: true },
        loading: { pose: "carrier", x: xs(1) + 6, y: B - 3, flip: true },
        idle: { pose: "sitter", x: xs(PANELS - 2) + 10, y: T },
        success: { pose: "sitter", x: xs(PANELS - 2) + 10, y: T },
        changed: { pose: "letterer", x: mid + P * 0.75 + 34, y: B - 3 },
        error: { pose: "shrugger", x: BANK_R + 34, y: 0 },
      },
    };
  },
};
