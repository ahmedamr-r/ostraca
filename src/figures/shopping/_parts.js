/* Helpers the shopping shelf shares. The registry skips files starting
   with "_", so this is not a figure. */

const r2 = (v) => Math.round(v * 100) / 100;

/** A whole count from the app (no unit), or null when none was passed. */
export function countOf(fig) {
  if (!fig || fig.unit || typeof fig.value !== "number" || !Number.isFinite(fig.value)) return null;
  return Math.max(0, Math.floor(fig.value));
}

/** A real measure as the app gave it ("12 min"), or "" when there is none. */
export function shown(fig) {
  if (!fig || fig.value == null || fig.value === "") return "";
  return `${fig.value}${fig.unit ? ` ${fig.unit}` : ""}`;
}

/** A circle as path data, so it can join one path or one outline. */
export function ring(cx, cy, r) {
  return `M${r2(cx - r)} ${r2(cy)}A${r} ${r} 0 1 0 ${r2(cx + r)} ${r2(cy)}A${r} ${r} 0 1 0 ${r2(cx - r)} ${r2(cy)}Z`;
}

/** A closed polygon through the points, as path data. */
export const shape = (pts) => `M${pts.map(([x, y]) => `${r2(x)} ${r2(y)}`).join("L")}Z`;

/** A taped box seen from the side or front: the box, a seam along its
    top and a strip of tape down its face (the strip as two faint edges). */
export function box(x, y, w, h, { tape = true } = {}) {
  const body = `<path class="paper" d="M${r2(x)} ${r2(y)}H${r2(x + w)}V${r2(y + h)}H${r2(x)}Z"/>`;
  if (!tape) return body;
  const mx = x + w / 2, t = Math.min(3, w / 6);
  const seam = `M${r2(x)} ${r2(y + 2)}H${r2(x + w)}`;
  const strip = `M${r2(mx - t / 2)} ${r2(y)}V${r2(y + Math.min(h, h * 0.55))}M${r2(mx + t / 2)} ${r2(y)}V${r2(y + Math.min(h, h * 0.55))}`;
  return body + `<path d="${seam}${strip}" opacity="0.5"/>`;
}
