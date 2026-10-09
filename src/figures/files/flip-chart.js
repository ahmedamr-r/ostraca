/* ===========================================================================
   Flip chart: a pad on a tripod easel, front on, the top sheet carrying a
   bar chart. Analytics, reports, dashboards and charts with no data yet.

   The bars take the app's own series when it passes one; without it they
   are drawn faint, a chart waiting for its data, and no figures appear.
   The ladder, the plumb line and the crew are on the right.
   =========================================================================== */

// Measured off the easel's centre line (CX). A worker is 45 tall.
const CX = 142;
const SPLAY = 42, HEAD = -100, HEAD_W = 14;   // legs: half spread at the floor; their heads, hidden behind the board
const LEDGE = -38;                             // the ledge's top
const BX = 38, BTOP = -110;                    // board: half width, top
const PX = 36, PTOP = -106, PBOT = -44;        // pad: half width, top, foot
const CLAMP = -108;                            // the clamp bar's centre line
const BASE = -51, AXIS = CX - 27, TALL = 38; // the chart on the top sheet
const SHAPE = [0.45, 0.7, 0.55, 0.9, 0.75];   // the faint chart's bar heights, a drawing, not data

export default {
  name: "flip-chart",
  title: "Flip chart",
  shelf: "files",
  use: "Analytics, reports, dashboards and charts with no data yet",
  width: 300,
  height: 132,
  measures: { what: "The series to chart, one value per bar", sample: [12, 19, 15, 26, 22] },

  draw({ n, SET_OUT, rectPath, poly, esc, opts }) {
    // The series: the app's own numbers, up to six bars, or none.
    const raw = opts.figure?.value;
    const series = Array.isArray(raw) ? raw.filter(Number.isFinite).slice(0, 6) : null;
    const data = series && series.length ? series : null;
    const max = data ? Math.max(...data, 0) : 1;
    const hs = data ? data.map((v) => (max > 0 ? (Math.max(v, 0) / max) * TALL : 0)) : SHAPE.map((f) => f * TALL);
    // Bars share the sheet's width, however many there are.
    const per = (CX + PX - 5 - (AXIS + 4)) / hs.length, BAR = n(Math.min(per * 0.66, 9));
    const bx = (i) => n(AXIS + 4 + i * per + (per - BAR) / 2);

    // A front leg from the head to the floor; the ledge and board paint over it.
    const legX = (side, y) => CX + side * (HEAD_W + ((SPLAY - HEAD_W) * (y - HEAD)) / -HEAD);
    const leg = (side) => `M${n(legX(side, HEAD))} ${HEAD}L${CX + side * SPLAY} 0`;
    const legs = `<path d="M${CX} ${BTOP + 8}V0" opacity="0.45"/>` + // the back leg, between the front two
      `<path d="${leg(-1) + leg(1)}"/>`;
    const ledge = `<path class="paper" d="M${n(legX(-1, LEDGE)) - 4} ${LEDGE}H${n(legX(1, LEDGE)) + 4}V${LEDGE + 4}H${n(legX(-1, LEDGE)) - 4}Z"/>` +
      `<path d="M${n(legX(-1, LEDGE)) - 4} ${LEDGE}v-3M${n(legX(1, LEDGE)) + 4} ${LEDGE}v-3"/>`;
    const board = `<path class="paper" d="${rectPath(CX - BX, BTOP, 2 * BX, LEDGE - BTOP)}"/>`;
    // The pad, with the edges of the sheets behind showing at its foot.
    // The top sheet's foot corner lifts, the way a pad's top sheet curls.
    const ex = CX + PX, DOG = 6;
    const pad = `<path class="paper" d="M${CX - PX} ${PTOP}H${ex}V${PBOT - DOG}L${ex - DOG} ${PBOT}H${CX - PX}Z"/>` +
      `<path class="paper" d="M${ex} ${PBOT - DOG}L${ex - DOG + 1} ${PBOT - DOG + 1}L${ex - DOG} ${PBOT}"/>` +
      `<path d="M${CX - PX + 1} ${PBOT + 1.5}H${CX + PX - 1}M${CX - PX + 2} ${PBOT + 3}H${CX + PX - 2}" opacity="0.45"/>`;
    // The clamp bar over the pad's head, a knob at each end.
    let rings = "";
    for (let x = CX - PX + 6; x < CX + PX - 3; x += 8) rings += `M${x} ${CLAMP + 3}v3.5`;
    const clamp = `<path d="${rings}" opacity="0.6"/><path class="paper" d="${rectPath(CX - BX - 2, CLAMP - 3, 2 * BX + 4, 6)}"/>` +
      `<circle class="paper" cx="${CX - BX + 3}" cy="${CLAMP}" r="1.6"/><circle class="paper" cx="${CX + BX - 3}" cy="${CLAMP}" r="1.6"/>`;
    // The chart's base line and axis, then each bar as its own course.
    const axes = `<path d="M${AXIS} ${BASE - TALL - 4}V${BASE}H${CX + PX - 6}" opacity="${data ? 1 : 0.45}"/>` +
      (data ? `<path d="M${AXIS - 2} ${BASE - TALL}h2"/><text class="fig" x="${AXIS}" y="${BASE - TALL - 6}" text-anchor="middle">${esc(String(max))}</text>` : "");
    const bars = hs.map((h, i) => {
      const d = rectPath(bx(i), n(BASE - h), BAR, n(h));
      return data ? `<path class="paper" d="${d}"/>` : `<path d="${d}" opacity="0.4"/>`;
    });

    const courses = [legs, ledge, board, pad + clamp + axes, ...bars];

    const outline =
      `<path d="${leg(-1) + leg(1)}${rectPath(CX - BX, BTOP, 2 * BX, LEDGE - BTOP)}${rectPath(CX - BX - 2, CLAMP - 3, 2 * BX + 4, 6)}` +
      `M${n(legX(-1, LEDGE)) - 4} ${LEDGE + 4}H${n(legX(1, LEDGE)) + 4}" stroke-dasharray="${SET_OUT}"/>`;
    const contents = `<path d="${rectPath(CX - PX, PTOP, 2 * PX, PBOT - PTOP)}M${AXIS} ${BASE - TALL - 4}V${BASE}H${CX + PX - 6}"/>`;

    // The revised figure: the second bar from the end.
    const k = Math.max(0, hs.length - 2);
    const revise = [bx(k) - 4, n(BASE - hs[k] - 5), BAR + 8, n(hs[k] + 8)];

    const LADDER = CX + SPLAY + 30;
    return {
      courses,
      outline,
      contents,
      foot: [CX + SPLAY, 0],
      top: CLAMP - 3,
      error: "lean",
      lean: 4,
      revise,
      tag: [CX + BX + 20, BTOP + 4],
      tick: [CX + BX + 8, CLAMP - 6],
      access: { kind: "ladder", at: LADDER, height: -CLAMP, lean: 26 },
      stations: {
        empty: { pose: "letterer", x: CX + SPLAY + 22, y: 0 },
        loading: { pose: "carrier", x: LADDER - 10, y: -46 },
        waiting: { pose: "hauler", x: LADDER + 56, y: 0, flip: true },
        idle: { pose: "leaner", x: CX - SPLAY - 12, y: 0 },
        success: { pose: "letterer", x: CX - SPLAY - 6, y: 0, flip: true },
        changed: { pose: "letterer", x: CX - SPLAY - 6, y: 0, flip: true },
        error: { pose: "shrugger", x: CX + SPLAY + 44, y: 0 },
      },
    };
  },
};
