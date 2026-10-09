/* Noticeboard: a framed board on two legs, front on, cards pinned to it
   at slight angles in loose rows. Comments, feedback, announcements, notes
   and idea boards with nothing pinned yet.

   A real count of comments draws one card each up to nine, bottom row
   first; past nine, the real total goes on a chain under the board. */

// Measured off the left leg's outer edge (LX). A worker is 45 tall.
const LX = 66, LEG = 4, CAP = -91;         // left leg, leg width, the legs' tops
const FX0 = LX + LEG, FX1 = FX0 + 124;     // frame outside, left and right
const FT = -87, FB = -27, RIM = 4;         // frame top, bottom, its width
const BX0 = FX0 + RIM, BX1 = FX1 - RIM, BT = FT + RIM, BB = FB - RIM; // the board inside
const COLS = 3, ROWS = 3, MAX = 9;
const CW = 25, CH = 14;                    // a card, give or take
const RX = FX1 + LEG;                      // right leg's outer edge

export default {
  name: "noticeboard",
  title: "Noticeboard",
  shelf: "messages",
  use: "Comments, feedback, announcements, notes and idea boards with nothing pinned yet",
  width: 320,
  height: 114,
  measures: { what: "Comments", sample: 14 },

  draw({ n, SET_OUT, rng, seedFrom, rectPath, dimension, opts }) {
    const count = Number.isFinite(opts.figure?.value) ? Math.max(0, Math.floor(opts.figure.value)) : null;
    const total = count == null ? 7 : Math.min(count, MAX);

    // Feet, then the legs standing in them up past the frame.
    const feet = rectPath(LX - 9, -3, LEG + 18, 3) + rectPath(FX1 - 9, -3, LEG + 18, 3);
    const legs = rectPath(LX, CAP, LEG, CAP * -1 - 3) + rectPath(FX1, CAP, LEG, CAP * -1 - 3);
    const frame = `M${FX0} ${FB}V${FT}H${FX1}V${FB}ZM${BX0} ${BB}V${BT}H${BX1}V${BB}Z`;
    const board = rectPath(BX0, BT, BX1 - BX0, BB - BT);

    // A card: a small sheet turned a few degrees about its pin, two or
    // three faint lines on it, and the pin's round head at its top edge.
    const r = rng(seedFrom("noticeboard"));
    const cellW = (BX1 - BX0) / COLS, cellH = (BB - BT) / ROWS;
    const card = (k) => {
      const row = Math.floor(k / COLS), col = k % COLS;
      const px = BX0 + cellW * (col + 0.5) + (r() - 0.5) * 9;
      const py = BB - cellH * (row + 1) + 3.5 + (r() - 0.5) * 3;
      const a = ((r() - 0.5) * 16 * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
      const w = CW + (r() - 0.5) * 6, h = CH + (r() - 0.5) * 3;
      const P = (x, y) => `${n(px + x * c - y * s)} ${n(py + x * s + y * c)}`;
      const sheet = `M${P(-w / 2, -2)}L${P(w / 2, -2)}L${P(w / 2, h - 2)}L${P(-w / 2, h - 2)}Z`;
      const lines = [0.8, 0.55, k % 2 ? 0.7 : 0].filter(Boolean)
        .map((f, i) => `M${P(-w / 2 + 4, 3 + i * 3.2)}L${P(-w / 2 + 4 + (w - 8) * f, 3 + i * 3.2)}`).join("");
      return { svg: `<path class="paper" d="${sheet}"/><path d="${lines}" opacity="0.45"/><circle class="paper" cx="${n(px)}" cy="${n(py)}" r="1.6"/>`, px, py, w, h };
    };
    const cards = Array.from({ length: total }, (_, k) => card(k));
    const rows = [];
    cards.forEach((cd, k) => { rows[Math.floor(k / COLS)] = (rows[Math.floor(k / COLS)] || "") + cd.svg; });

    // Nothing pinned yet: the spare pins wait in the board's top corner.
    const spare = total ? "" : [[8, 7], [13, 9], [10, 13]]
      .map(([x, y]) => `<circle class="paper" cx="${BX0 + x}" cy="${BT + y}" r="1.6"/>`).join("");

    const courses = [
      { svg: `<path class="paper" d="${feet}"/>`, still: true },
      `<path class="paper" d="${legs}"/>`,
      `<path class="paper" fill-rule="evenodd" d="${frame}"/>`,
      `<path d="${board}" opacity="0.5"/>${spare}`,
      ...rows,
    ];

    // The set-out: feet, legs and frame; where the rows of cards will go, faint.
    const outline = `<path d="${feet}${legs}${rectPath(FX0, FT, FX1 - FX0, FB - FT)}" stroke-dasharray="${SET_OUT}"/>`;
    const contents = `<path d="${board}${[1, 2].map((i) => `M${BX0 + 3} ${n(BB - cellH * i)}H${BX1 - 3}`).join("")}"/>`;

    // The cloud goes round the last card pinned, the comment that was edited.
    const last = cards[cards.length - 1];
    const revise = last ? [n(last.px - last.w / 2 - 4), n(last.py - 6), n(last.w + 8), n(last.h + 8)] : [BX0 + 4, BT + 4, BX1 - BX0 - 8, BB - BT - 8];
    const extras = count != null && count > MAX ? dimension(FX0, FB + 14, FX1, FB + 14, String(count)) : "";

    return {
      courses,
      outline,
      contents,
      foot: [FX1 + 13, -3], // the board goes over on its right foot, toward the scaffold
      top: CAP,
      error: "lean",
      lean: 5,
      revise,
      tag: [RX + 30, -64], // above the letterer, inside the frame with a long version
      tick: [RX + 10, FT - 6],
      access: { kind: "scaffold", at: [RX + 6, RX + 40] },
      extras,
      stations: {
        empty: { pose: "letterer", x: RX + 21, y: 0 },
        loading: { pose: "carrier", x: RX + 32, y: -2.5, ride: true },
        waiting: { pose: "hauler", x: RX + 96, y: 0, flip: true },
        idle: { pose: "leaner", x: LX - 12, y: 0 },
        success: { pose: "sitter", x: FX1 - 12, y: FT + 3, flip: true },
        changed: { pose: "letterer", x: RX + 28, y: 0 },
        error: { pose: "shrugger", x: RX + 50, y: 0 },
      },
    };
  },
};
