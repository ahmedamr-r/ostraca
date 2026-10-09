/* Helpers the money shelf shares. The registry skips files starting with
   "_", so this is not a figure. */

const r2 = (v) => Math.round(v * 100) / 100;

/** A real measure as the app gave it: "240 EGP", or the string as passed.
    Empty when there is none, so nothing is drawn. */
export function shown(fig) {
  if (!fig || fig.value == null || fig.value === "") return "";
  return `${fig.value}${fig.unit ? ` ${fig.unit}` : ""}`;
}

/** A whole count from the app (no unit), or null. */
export function countOf(fig) {
  if (!fig || fig.unit || typeof fig.value !== "number" || !Number.isFinite(fig.value)) return null;
  return Math.max(0, Math.floor(fig.value));
}

/** A box with its top corners rounded by r, open to any closing the caller wants. */
export function roundTop(x, y, w, h, r) {
  return `M${r2(x)} ${r2(y + h)}V${r2(y + r)}Q${r2(x)} ${r2(y)} ${r2(x + r)} ${r2(y)}H${r2(x + w - r)}Q${r2(x + w)} ${r2(y)} ${r2(x + w)} ${r2(y + r)}V${r2(y + h)}Z`;
}

/** A box with all four corners rounded by r. */
export function roundBox(x, y, w, h, r) {
  return `M${r2(x + r)} ${r2(y)}H${r2(x + w - r)}Q${r2(x + w)} ${r2(y)} ${r2(x + w)} ${r2(y + r)}V${r2(y + h - r)}Q${r2(x + w)} ${r2(y + h)} ${r2(x + w - r)} ${r2(y + h)}H${r2(x + r)}Q${r2(x)} ${r2(y + h)} ${r2(x)} ${r2(y + h - r)}V${r2(y + r)}Q${r2(x)} ${r2(y)} ${r2(x + r)} ${r2(y)}Z`;
}

/** A circle as path data, for outlines that join one path. */
export function ring(cx, cy, r) {
  return `M${r2(cx - r)} ${r2(cy)}A${r} ${r} 0 1 0 ${r2(cx + r)} ${r2(cy)}A${r} ${r} 0 1 0 ${r2(cx - r)} ${r2(cy)}Z`;
}

/** A dimension chain standing upright, its figure turned to read up it.
    ctx.dimension() keeps its figure level, which only suits a level chain.
    The turn sits on a <g>, so the mirrored drawing's flip of text.fig
    still keeps the figure readable. */
export function upright(ctx, x, y0, y1, figure) {
  const { chain, esc, n } = ctx;
  const text = String(figure);
  const gap = text.length * 3.4 + 6;
  const my = (y0 + y1) / 2;
  return `<g class="ink dim"><path class="chainline" d="${chain(x, y0, x, y1, gap)}" opacity="0.85"/>` +
    `<g transform="translate(${n(x + 3.5)} ${n(my)}) rotate(-90)"><text class="fig" x="0" y="0" text-anchor="middle">${esc(text)}</text></g></g>`;
}
