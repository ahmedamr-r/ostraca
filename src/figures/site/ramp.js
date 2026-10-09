/* Ramp: a dressed stone hauled up a 9 degree ramp on a sledge. Uploads and
   imports: the load moves up in heaves, one for each whole eighth. */
const FOOT = 24, DEG = 9;
const C = Math.cos((DEG * Math.PI) / 180), S = Math.sin((DEG * Math.PI) / 180);
// Along the ramp `d`, `hh` up off it, in drawing units.
const on = (d, hh = 0) => [FOOT + d * C - hh * S, -(d * S + hh * C)];
const along = (d) => [d * C, -d * S];
const SLEDGE = 144, LOAD = { at: 160, w: 100, h: 58, lift: 6 };
const PUSHER = 145, HAULERS = [352, 410, 468], TRAVEL = 120, BOLLARD = 560, W = 600;
const PROW = SLEDGE + 165, PROW_H = 19;

export default {
  name: "ramp",
  title: "Ramp",
  shelf: "site",
  use: "Uploads, imports and anything sent somewhere",
  width: W,
  height: 186,
  depth: 18,
  travel: { by: along(TRAVEL), steps: 8 },
  measures: { what: "The size being sent", unit: "MB", sample: 1.8 },
  draw({ n, SET_OUT, rng, seedFrom, dimension, sag, when, opts, travelled }) {
    const local = (inner) => `<g transform="translate(${FOOT} 0) rotate(${-DEG})">${inner}</g>`;
    const P = (pt) => `${n(pt[0])} ${n(pt[1])}`;
    const top = -(LOAD.lift + LOAD.h);
    const rampLen = (W - FOOT) / C;

    // The ramp: its face, earth under it, and the angle it is set at.
    let earth = "";
    for (let x = 70; x < rampLen - 6; x += 16) earth += `M${x} 3l-6 7`;
    const ground =
      `<path class="ink" d="M${FOOT} 0H${FOOT + 168}" stroke-dasharray="4 5" opacity="0.7"/>` +
      `<path class="ink" d="M${FOOT + 120} 0A120 120 0 0 0 ${P(on(120))}" opacity="0.7"/>` +
      `<text class="fig" x="${FOOT + 137}" y="-7" text-anchor="middle">9°</text>` +
      local(`<path class="ink" d="M0 0H${n(rampLen)}"/><path class="ink faint" d="${earth}"/>`);

    // A block of limestone; its beds run across the face as broken lines,
    // seeded so each size of stone is drawn the same way every time.
    const r = rng(seedFrom(`stone${LOAD.w}x${LOAD.h}`));
    const x0 = LOAD.at + 5, x1 = LOAD.at + LOAD.w - 5;
    let beds = "";
    for (const f of [0.3, 0.55, 0.78]) {
      const y = n(top + LOAD.h * f + (r() - 0.5) * 3);
      let x = x0 + r() * 10;
      while (x < x1 - 6) {
        const len = Math.min(x1 - x, 10 + r() * 26);
        beds += `M${n(x)} ${y}h${n(len)}`;
        x += len + 4 + r() * 9;
      }
    }
    const stone = `<rect class="paper" x="${LOAD.at}" y="${top}" width="${LOAD.w}" height="${LOAD.h}"/><path class="faint" d="${beds}"/>`;
    const sledge = `<path class="paper" d="M${SLEDGE} -1h152c10 0 15 -7 16 -18h-6c-1 8 -6 13 -14 13h-148Z"/>`;

    // The rope. With a gang on it, it runs through their hands and goes
    // slack when they let go; without, it is made fast to a bollard.
    const prow = on(PROW, PROW_H);
    const hands = HAULERS.map((d) => { const [x, y] = on(d); return [x - 9, y - 25]; });
    const last = hands[hands.length - 1], tail = along(16);
    const taut = `M${P(prow)}${hands.map((h) => `L${P(h)}`).join("")}L${n(last[0] + tail[0])} ${n(last[1] + tail[1])}`;
    const lie = on(PROW + 70, 1.5), far = on(PROW + 150, 1.5);
    const slack = `M${P(prow)}Q${n(prow[0] + 30)} ${n(prow[1] + 16)} ${P(lie)}L${P(far)}`;
    const B = on(BOLLARD);
    const [tx, ty] = along(TRAVEL * travelled);
    const tie = [B[0] - tx, B[1] - 9 - ty];
    const mid = [(prow[0] + tie[0]) / 2, (prow[1] + tie[1]) / 2];
    const boll = (droop) => `M${P(prow)}Q${n(mid[0])} ${n(mid[1] + droop)} ${P(tie)}`;
    const rope =
      `<g class="rest-on">${when("empty loading error", sag(taut, slack))}${when("idle success changed", `<path d="${slack}"/>`)}</g>` +
      `<g class="rest-off">${sag(boll(0), boll(14))}</g>`;
    const bollard = `<g class="ink rest-off"><path class="paper" d="M${n(B[0] - 3)} ${n(B[1])}V${n(B[1] - 12)}H${n(B[0] + 3)}V${n(B[1])}Z"/><path d="M${n(B[0] - 4.5)} ${n(B[1] - 12)}H${n(B[0] + 4.5)}M${n(B[0] - 3)} ${n(B[1] - 7)}L${n(B[0] + 3)} ${n(B[1] - 8.5)}M${n(B[0] - 3)} ${n(B[1] - 5)}L${n(B[0] + 3)} ${n(B[1] - 6.5)}"/></g>`;

    // The cloud goes round the stone's beds, what is being sent, inside its face.
    const corners = [[LOAD.at + 12, -top - 12], [LOAD.at + LOAD.w - 12, -top - 12], [LOAD.at + 12, -top - LOAD.h + 12], [LOAD.at + LOAD.w - 12, -top - LOAD.h + 12]].map(([d, h]) => on(d, h));
    const xsC = corners.map((c) => c[0]), ysC = corners.map((c) => c[1]);
    const bx = Math.min(...xsC), by = Math.min(...ysC);

    const fig = opts.figure;
    const size = fig && fig.value != null ? `${fig.value}${fig.unit ? ` ${fig.unit}` : ""}` : "";
    const gang = [{ pose: "pusher", ...xy(on(PUSHER)), flip: true }, ...HAULERS.map((d) => ({ pose: "hauler", ...xy(on(d)), flip: true }))];
    const rest = [{ pose: "sitter", ...xy(on(SLEDGE + 2, 1)), flip: true }, { pose: "leaner", ...xy(on(HAULERS[0] + 6)) }];
    return {
      courses: [local(stone)],
      outline: local(`<rect x="${LOAD.at}" y="${top}" width="${LOAD.w}" height="${LOAD.h}" stroke-dasharray="${SET_OUT}"/>`),
      contents: local(`<path d="${beds}"/>`),
      fixed: local(sledge) + rope,
      ground: ground + bollard,
      foot: on(LOAD.at),
      top: on(LOAD.at, -top)[1],
      error: "sag",
      string: [prow, opts.crew ? hands[0] : tie],
      tick: on(LOAD.at + LOAD.w + 7, -(top + 12)),
      revise: [n(bx), n(by), n(Math.max(...xsC) - bx), n(Math.max(...ysC) - by)],
      letter: { at: on(HAULERS[0] - 40, 96), angle: -DEG, arrow: true },
      extras: size ? local(dimension(LOAD.at, top - 16, LOAD.at + LOAD.w, top - 16, size)) : "",
      stations: {
        empty: gang,
        loading: gang,
        idle: rest,
        success: rest,
        changed: rest,
        error: [{ pose: "shrugger", ...xy(on(HAULERS[0])) }, { pose: "leaner", ...xy(on(HAULERS[1] + 10)), flip: true }],
      },
    };
  },
};

function xy([x, y]) {
  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
}
