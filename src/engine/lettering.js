/* ===========================================================================
   Lettering. The library carries its own single stroke capitals: one line,
   drawn on a cap height of 10, each letter nudged by a seed so no two words
   are lettered alike. Every word a drawing carries goes through letter();
   a hidden <text> twin keeps it readable to assistive tech and search.
   =========================================================================== */
import { n, arrow, rng, seedFrom, esc } from "./svg.js";

/** Glyph name -> [advance width, path data on a cap height of 10, baseline y 0]. */
export const GLYPHS = {
  A: [7, "M0 0L3.5 -10L7 0M1.4 -4H5.6"],
  B: [6.2, "M0 0V-10H3.4Q5.8 -10 5.8 -7.6Q5.8 -5.3 3.3 -5.3H0M3.3 -5.3Q6.2 -5.3 6.2 -2.6Q6.2 0 3.4 0H0"],
  C: [6.4, "M6.3 -8.3Q5.4 -10 3.5 -10Q0 -10 0 -5Q0 0 3.5 0Q5.4 0 6.3 -1.7"],
  D: [6.6, "M0 0V-10H2.6Q6.6 -10 6.6 -5Q6.6 0 2.6 0Z"],
  E: [5.6, "M5.6 -10H0V0H5.6M0 -5.3H4.3"],
  F: [5.4, "M5.4 -10H0V0M0 -5.3H4.2"],
  G: [6.6, "M6.3 -8.3Q5.4 -10 3.5 -10Q0 -10 0 -5Q0 0 3.5 0Q6.6 0 6.6 -3.4V-4.6H3.9"],
  H: [6.4, "M0 0V-10M6.4 0V-10M0 -5.3H6.4"],
  I: [0, "M0 0V-10"],
  J: [5, "M5 -10V-3.2Q5 0 2.5 0Q0 0 0 -2.8"],
  K: [6.2, "M0 0V-10M6 -10L0 -3.8M2.2 -6L6.2 0"],
  L: [5.2, "M0 -10V0H5.2"],
  M: [7.8, "M0 0V-10L3.9 -3.2L7.8 -10V0"],
  N: [6.4, "M0 0V-10L6.4 0V-10"],
  O: [7.4, "M3.7 -10Q0 -10 0 -5Q0 0 3.7 0Q7.4 0 7.4 -5Q7.4 -10 3.7 -10Z"],
  P: [6, "M0 0V-10H3.4Q6 -10 6 -7.4Q6 -4.8 3.4 -4.8H0"],
  Q: [7.6, "M3.7 -10Q0 -10 0 -5Q0 0 3.7 0Q7.4 0 7.4 -5Q7.4 -10 3.7 -10ZM4.4 -2.8L7.6 0.6"],
  R: [6.2, "M0 0V-10H3.4Q6 -10 6 -7.5Q6 -5 3.4 -5H0M3 -5L6.2 0"],
  S: [6, "M5.8 -8.5Q5 -10 3.1 -10Q0.3 -10 0.3 -7.6Q0.3 -5.6 3.1 -5.2Q6 -4.8 6 -2.5Q6 0 3 0Q0.9 0 0 -1.6"],
  T: [6.6, "M0 -10H6.6M3.3 -10V0"],
  U: [6.4, "M0 -10V-3.4Q0 0 3.2 0Q6.4 0 6.4 -3.4V-10"],
  V: [6.8, "M0 -10L3.4 0L6.8 -10"],
  W: [9.2, "M0 -10L2.3 0L4.6 -7.4L6.9 0L9.2 -10"],
  X: [6.4, "M0 -10L6.4 0M6.4 -10L0 0"],
  Y: [6.6, "M0 -10L3.3 -5L6.6 -10M3.3 -5V0"],
  Z: [6.2, "M0 -10H6.2L0 0H6.2"],
  ".": [0.4, "M0.2 -0.2h.01"],
};

/** The characters letter() can draw. Anything else is skipped. */
export const LETTERABLE = Object.keys(GLYPHS).join("") + " ";

/**
 * Letter `text` with its baseline's left end at (x, y). Returns the markup
 * and the lettered width in drawing units.
 *   size        cap height in drawing units is about size * 0.7
 *   angle       the whole word's rotation, degrees
 *   seed        what the wobble is seeded from (defaults to the text)
 *   arrowAfter  a leader arrow after the word
 *   underline   two rules under it
 */
export function letter(text, x, y, { size = 15, angle = -2, seed = text, arrowAfter = false, underline = false } = {}) {
  const s = (size * 0.7) / 10;
  const r = rng(seedFrom(seed));
  let cx = 0, out = "";
  for (const word of text.toUpperCase().split(" ")) {
    [...word].forEach((ch, i) => {
      const g = GLYPHS[ch];
      if (!g) return;
      const k = (i === 0 ? 1.17 : 1) * (1 + (r() - 0.5) * 0.07);
      const dy = (r() - 0.5) * 0.9;
      const rot = (r() - 0.5) * 5;
      out += `<path transform="translate(${n(cx)} ${n(dy)}) rotate(${n(rot)}) scale(${n(k)})" d="${g[1]}"/>`;
      cx += g[0] * k + 2.7;
    });
    cx += 4.6;
  }
  const w = (cx - 7.3) * s;
  let extra = "";
  const mid = -size * 0.34;
  if (arrowAfter) extra += `<path d="M${n(w + 8)} ${n(mid)}H${n(w + 40)}${arrow(w + 40, mid, 1, 0)}" style="stroke-width:1.25"/>`;
  if (underline) extra += `<path d="M-2 5H${n(w + 2)}M-2 8H${n(w + 2)}"/>`;
  return {
    w,
    svg: `<g class="lt" transform="translate(${n(x)} ${n(y)}) rotate(${angle})"><g class="ink lt-pen" transform="scale(${n(s)})">${out}</g><text class="lt-font" x="0" y="0" font-size="${n(size * 1.02)}" textLength="${n(w)}" lengthAdjust="spacingAndGlyphs">${esc(text.toUpperCase())}</text>${extra ? `<g class="ink">${extra}</g>` : ""}</g>`,
  };
}
