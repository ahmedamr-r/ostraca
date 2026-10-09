/* ===========================================================================
   Geometry. Small pure helpers that return SVG path data or numbers, lifted
   unchanged from the prototype (prototype/src.html), which retyped them from
   the drawing kit on ahmedamr.com.

   Coordinates: y grows down, the ground line is y = 0, so anything standing
   on the ground has negative y.
   =========================================================================== */

/** Round to two places, the precision every path in the library is written at. */
export const n = (v) => Math.round(v * 100) / 100;

/** A straight segment as path data: `M x1 y1 L x2 y2`. */
export const line = (x1, y1, x2, y2) => `M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}`;

export const ARROW_LONG = 7;
export const ARROW_WIDE = 3;
export const DIM_TICK = 5;

/** An open arrowhead at (x, y) pointing along the unit vector (dx, dy). */
export function arrow(x, y, dx, dy) {
  const bx = x - dx * ARROW_LONG, by = y - dy * ARROW_LONG;
  const nx = -dy * ARROW_WIDE, ny = dx * ARROW_WIDE;
  return `${line(x, y, bx + nx, by + ny)}${line(x, y, bx - nx, by - ny)}`;
}

/**
 * A dimension chain from (x1, y1) to (x2, y2): a tick across each end, an
 * arrow at each end, and a gap of `gap` either side of the middle for the
 * figure. Path data only; see marks.dimension() for the figure too.
 */
export function chain(x1, y1, x2, y2, gap = 16) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const dx = (x2 - x1) / length, dy = (y2 - y1) / length;
  const nx = -dy * DIM_TICK, ny = dx * DIM_TICK;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  return [
    line(x1 - nx, y1 - ny, x1 + nx, y1 + ny),
    line(x2 - nx, y2 - ny, x2 + nx, y2 + ny),
    line(x1, y1, mx - dx * gap, my - dy * gap),
    line(mx + dx * gap, my + dy * gap, x2, y2),
    arrow(x1, y1, -dx, -dy),
    arrow(x2, y2, dx, dy),
  ].join("");
}

/** The set-out dash: lines that are planned, not yet made. */
export const SET_OUT = "4 3";

/** FNV-1a hash of a string, for seeding. */
export function seedFrom(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32: a seeded generator returning numbers in [0, 1). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One step of a damped spring. Mutates `s` ({ value, velocity }). */
export const stepSpring = (s, to, omega, zeta, dt) => {
  s.velocity += (omega * omega * (to - s.value) - 2 * zeta * omega * s.velocity) * dt;
  s.value += s.velocity * dt;
};

/** A spring sampled into CSS linear(), so the browser plays it with no loop. */
export function springEasing(omega, zeta, seconds, samples = 56) {
  const s = { value: 0, velocity: 0 };
  const dt = 1 / 600, out = [];
  let t = 0, next = 0;
  while (out.length < samples) {
    if (t >= next - 1e-9) { out.push(s.value); next += seconds / (samples - 1); }
    stepSpring(s, 1, omega, zeta, dt);
    t += dt;
  }
  out[out.length - 1] = 1;
  return `linear(${out.map((v) => Math.round(v * 1000) / 1000).join(", ")})`;
}

/**
 * The springs styles.css ships baked, kept here so they can be regenerated:
 * node -e "import('./src/engine/svg.js').then(m => console.log(m.SPRINGS))"
 */
export const SPRINGS = {
  lean: [5.2, 0.42, 1.6],
  // The hero plumb line's spring: omega 3.3 at a 220 cord, by the root of
  // 220 over this cord's length (about 60), damped harder than the hero's.
  bob: [3.3 * Math.sqrt(220 / 60), 0.22, 2.2],
  sag: [6, 0.3, 1.5],
};

/**
 * The revision cloud, each scallop its own path so the cloud can be walked
 * round clockwise. Returns an array of path data strings.
 */
export function cloudArcs(x, y, w, h, bump = 9) {
  const points = [];
  const edge = (x0, y0, x1, y1) => {
    const steps = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / bump));
    for (let i = 0; i < steps; i++) points.push([x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps]);
  };
  edge(x, y, x + w, y); edge(x + w, y, x + w, y + h); edge(x + w, y + h, x, y + h); edge(x, y + h, x, y);
  const arcs = [];
  for (let i = 1; i <= points.length; i++) {
    const [px, py] = points[i % points.length];
    const [qx, qy] = points[i - 1];
    const r = n(Math.hypot(px - qx, py - qy) * 0.6);
    arcs.push(`M${n(qx)} ${n(qy)}A${r} ${r} 0 0 1 ${n(px)} ${n(py)}`);
  }
  return arcs;
}

/* ---------------------------------------------------------------------------
   Small path helpers the subjects repeat inline in the prototype.
   --------------------------------------------------------------------------- */

/** A closed rectangle as path data (for .paper fills that need a path). */
export const rectPath = (x, y, w, h) => `M${n(x)} ${n(y)}H${n(x + w)}V${n(y + h)}H${n(x)}Z`;

/** A polyline through points [[x, y], ...]. `close` adds Z. */
export const poly = (pts, close = false) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${n(x)} ${n(y)}`).join("") + (close ? "Z" : "");

/** A quadratic sag between two points, dropping `sag` at the middle. */
export const sagPath = ([x0, y0], [x1, y1], sag = 0) =>
  `M${n(x0)} ${n(y0)}Q${n((x0 + x1) / 2)} ${n((y0 + y1) / 2 + sag * 2)} ${n(x1)} ${n(y1)}`;

/** Escape text for SVG/HTML content and attributes. */
export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
