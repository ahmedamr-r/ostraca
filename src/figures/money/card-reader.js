/* ===========================================================================
   Card reader: a payment terminal standing in its dock, front on, a card
   pushed half into the slot at its top. Checkout, a payment going through,
   card added, payment declined, subscriptions.

   Reads by the keypad and the card standing out of the top. Built dock,
   body, keypad rows from the bottom up, screen, then the card. The ladder
   and the crew's working side are on the right; it leans that way.

   opts.figure: the amount as the app formats it, read off the screen
   ({ value: 240, unit: "EGP" } or { value: "EGP 240.00" }). It is part of
   the screen's course, so it inks with the screen and leans with the body.
   =========================================================================== */
import { shown, roundTop, roundBox } from "./_parts.js";

// Measured off the body's middle (CX). A worker is 45 tall.
const CX = 128, BW = 64, BX0 = CX - BW / 2, BX1 = CX + BW / 2;
const DOCK = -12, DW = 76, DX0 = CX - DW / 2;      // the dock's top and width
const BT = -104, R = 8;                            // body top, its corner radius
const SX0 = BX0 + 6, SX1 = BX1 - 6, ST = -95, SB = -75;  // the screen
const KW = 11, KH = 6, KG = 5, KX0 = CX - (3 * KW + 2 * KG) / 2;
const ROWS = [-31, -42, -53, -64];                 // key rows' tops, bottom row first
const CW = 32, CT = -123, CHIP = 7;                // the card: width, top edge
const SLOT = -101;                                 // how deep the card goes in

export default {
  name: "card-reader",
  title: "Card reader",
  shelf: "money",
  use: "Checkout, a payment going through, card added, payment declined, subscriptions",
  width: 300,
  height: 140,
  measures: { what: "The amount being paid", unit: "EGP", sample: 240 },

  draw({ n, SET_OUT, esc, opts }) {
    // The dock: a low block with a cradle lip across its face.
    const dock = roundTop(DX0, DOCK, DW, -DOCK, 3);
    const dockLip = `M${DX0 + 4} ${DOCK + 4}H${DX0 + DW - 4}`;
    // The body, with the slot as a short recess along its top edge.
    const body = roundTop(BX0, BT, BW, DOCK - BT, R);
    const slot = `M${CX - CW / 2 - 3} ${BT}V${BT + 2.5}H${CX + CW / 2 + 3}V${BT}`;
    const keyRow = (y) => [0, 1, 2].map((c) => roundBox(KX0 + c * (KW + KG), y, KW, KH, 1.5)).join("");
    const screen = roundBox(SX0, ST, SX1 - SX0, SB - ST, 2);
    // What is on the screen with no amount: two faint lines of a prompt.
    const prompt = `M${SX0 + 6} ${ST + 8}H${SX1 - 12}M${SX0 + 6} ${ST + 13}H${SX1 - 20}`;
    // The card: half in the slot, a chip on its face, a faint number row.
    const card = `M${CX - CW / 2} ${SLOT}V${CT + 2}Q${CX - CW / 2} ${CT} ${CX - CW / 2 + 2} ${CT}H${CX + CW / 2 - 2}Q${CX + CW / 2} ${CT} ${CX + CW / 2} ${CT + 2}V${SLOT}`;
    const chip = roundBox(CX - CW / 2 + 5, CT + 5, CHIP, 5.5, 1) + `M${CX - CW / 2 + 5} ${CT + 7.75}H${CX - CW / 2 + 5 + CHIP}`;
    const digits = `M${CX - CW / 2 + 5} ${CT + 15}H${CX + 4}`;
    const amount = shown(opts.figure);
    // The reading: one figure on the screen, squeezed to fit when it is long.
    const room = SX1 - SX0 - 6;
    const fit = amount.length * 6 > room ? ` textLength="${room}" lengthAdjust="spacingAndGlyphs"` : "";
    const reading = amount ? `<text class="fig" x="${CX}" y="${n((ST + SB) / 2 + 3.5)}" text-anchor="middle"${fit}>${esc(amount)}</text>` : "";

    const courses = [
      { svg: `<path class="paper" d="${dock}"/><path d="${dockLip}" opacity="0.5"/>`, still: true },
      `<path class="paper" d="${body}"/><path d="${slot}"/>`,
      ...ROWS.map((y) => `<path class="paper" d="${keyRow(y)}"/>`),
      `<path class="paper" d="${screen}"/>` + (amount ? reading : `<path d="${prompt}" class="faint"/>`),
      `<path class="paper" d="${card}Z"/><path d="${chip}" opacity="0.7"/><path d="${digits}" class="faint"/>`,
    ];

    const outline = `<path d="${dock}${body}${card}" stroke-dasharray="${SET_OUT}"/>`;
    const contents = `<path d="${ROWS.map(keyRow).join("")}${screen}"/>`;

    const LADDER = BX1 + 24; // the ladder's foot; its head rests by the body's top corner
    return {
      courses,
      outline,
      contents,
      foot: [BX1, DOCK], // leans off the dock's top, toward the ladder
      top: CT,
      error: "lean",
      lean: 5,
      revise: [CX - CW / 2 - 4, CT - 4, CW + 8, SLOT - CT + 2],
      tag: [BX1 + 30, CT - 2],
      tick: [BX1 + 10, BT - 8],
      access: { kind: "ladder", at: LADDER, height: -BT, lean: 16 },
      stations: {
        empty: { pose: "letterer", x: BX1 + 26, y: 0 },             // pen at the body's set-out
        loading: { pose: "carrier", x: LADDER - 6, y: -82 },        // on the ladder, the card held up
        waiting: { pose: "hauler", x: LADDER + 56, y: 0, flip: true },
        idle: { pose: "leaner", x: DX0 - 7, y: 0, flip: true },     // against the dock's end
        success: { pose: "sitter", x: BX0 - 2, y: DOCK + 3 },           // on the dock's ledge
        changed: { pose: "letterer", x: BX0 - 36, y: 0, flip: true },
        error: { pose: "shrugger", x: BX1 + 52, y: 0 },             // beside the plumb line
      },
    };
  },
};
