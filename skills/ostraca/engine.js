/* Ostraca engine, bundled for the agent skill. Do not edit: this file is
   built by scripts/bundle-skill.mjs in the Ostraca repo from src/engine/,
   src/index.js and src/styles.css. MIT licence, Ahmed Amr.

   It holds the whole public API (render, mount, define, inspect, the
   helpers) and none of the library's figures: define() your own. */
const __defs = {}, __done = {};
function __req(id) {
  if (__done[id]) return __done[id];
  const x = (__done[id] = {}), star = [];
  __defs[id](x, star);
  for (const s of star) for (const k of Object.keys(s)) if (!(k in x)) x[k] = s[k];
  return x;
}

__defs.svg = (__x, __star) => {
/* ===========================================================================
   Geometry. Small pure helpers that return SVG path data or numbers, lifted
   unchanged from the prototype (prototype/src.html), which retyped them from
   the drawing kit on ahmedamr.com.

   Coordinates: y grows down, the ground line is y = 0, so anything standing
   on the ground has negative y.
   =========================================================================== */

/** Round to two places, the precision every path in the library is written at. */
const n = (v) => Math.round(v * 100) / 100;

/** A straight segment as path data: `M x1 y1 L x2 y2`. */
const line = (x1, y1, x2, y2) => `M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}`;

const ARROW_LONG = 7;
const ARROW_WIDE = 3;
const DIM_TICK = 5;

/** An open arrowhead at (x, y) pointing along the unit vector (dx, dy). */
function arrow(x, y, dx, dy) {
  const bx = x - dx * ARROW_LONG, by = y - dy * ARROW_LONG;
  const nx = -dy * ARROW_WIDE, ny = dx * ARROW_WIDE;
  return `${line(x, y, bx + nx, by + ny)}${line(x, y, bx - nx, by - ny)}`;
}

/**
 * A dimension chain from (x1, y1) to (x2, y2): a tick across each end, an
 * arrow at each end, and a gap of `gap` either side of the middle for the
 * figure. Path data only; see marks.dimension() for the figure too.
 */
function chain(x1, y1, x2, y2, gap = 16) {
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
const SET_OUT = "4 3";

/** FNV-1a hash of a string, for seeding. */
function seedFrom(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32: a seeded generator returning numbers in [0, 1). */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One step of a damped spring. Mutates `s` ({ value, velocity }). */
const stepSpring = (s, to, omega, zeta, dt) => {
  s.velocity += (omega * omega * (to - s.value) - 2 * zeta * omega * s.velocity) * dt;
  s.value += s.velocity * dt;
};

/** A spring sampled into CSS linear(), so the browser plays it with no loop. */
function springEasing(omega, zeta, seconds, samples = 56) {
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
const SPRINGS = {
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
function cloudArcs(x, y, w, h, bump = 9) {
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
const rectPath = (x, y, w, h) => `M${n(x)} ${n(y)}H${n(x + w)}V${n(y + h)}H${n(x)}Z`;

/** A polyline through points [[x, y], ...]. `close` adds Z. */
const poly = (pts, close = false) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${n(x)} ${n(y)}`).join("") + (close ? "Z" : "");

/** A quadratic sag between two points, dropping `sag` at the middle. */
const sagPath = ([x0, y0], [x1, y1], sag = 0) =>
  `M${n(x0)} ${n(y0)}Q${n((x0 + x1) / 2)} ${n((y0 + y1) / 2 + sag * 2)} ${n(x1)} ${n(y1)}`;

/** Escape text for SVG/HTML content and attributes. */
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

__x.n = n;
__x.line = line;
__x.ARROW_LONG = ARROW_LONG;
__x.ARROW_WIDE = ARROW_WIDE;
__x.DIM_TICK = DIM_TICK;
__x.arrow = arrow;
__x.chain = chain;
__x.SET_OUT = SET_OUT;
__x.seedFrom = seedFrom;
__x.rng = rng;
__x.stepSpring = stepSpring;
__x.springEasing = springEasing;
__x.SPRINGS = SPRINGS;
__x.cloudArcs = cloudArcs;
__x.rectPath = rectPath;
__x.poly = poly;
__x.sagPath = sagPath;
__x.esc = esc;
};

__defs.poses = (__x, __star) => {
/* ===========================================================================
   The crew. Path for path from the prototype (retyped from the drawing kit
   on ahmedamr.com). Feet at y = 0, facing left, two complete drawings each
   (a and b); styles.css plays them on a 3.4s beat.

   Two weights: .crew-key for the figure, .crew-hair for what it holds and
   the far arm. Both draw in currentColor, the text ink.
   =========================================================================== */
const { n, rng, seedFrom } = __req("svg");

const K = (d) => `<path class="crew-key" d="${d}"/>`;
const Hd = (cx, cy) => `<circle class="crew-key" cx="${cx}" cy="${cy}" r="4"/>`;
const Hr = (d) => `<path class="crew-hair" d="${d}"/>`;

const POSES = {
  sitter: [
    Hd(-1, -25) + K("M0 -21 L2 -3 L-10 -9 L-13 0 M0 -16 L-9 -10") + Hr("M2 -3 L-6 -7 L-8 0"),
    Hd(-2, -25) + K("M-1 -21 L2 -3 L-10 -9 L-13 0 M0 -16 L-8 -15 L-11 -22") + Hr("M2 -3 L-6 -7 L-8 0"),
  ],
  leaner: [
    Hd(3, -40) + K("M3 -36 L1 -19 M2 -31 L-7 -25 L-1 -21 M1 -19 L-5 0 M1 -19 L6 0") + Hr("M2 -31 L9 -24 L7 -17"),
    Hd(1, -41) + K("M1 -37 L1 -19 M1 -32 L-8 -27 L-4 -34 M1 -19 L5 0 M1 -19 L-3 0") + Hr("M1 -32 L8 -25 L6 -18"),
  ],
  carrier: [
    Hd(0, -41) + K("M0 -37 L0 -20 M0 -32 L-9 -26 M0 -20 L-7 0 M0 -20 L8 -2") + Hr("M-22 -34 H-8 V-16 H-22 Z"),
    Hd(-1, -41) + K("M-1 -37 L0 -20 M0 -32 L-9 -31 M0 -20 L-6 0 M0 -20 L7 0") + Hr("M-22 -40 H-8 V-22 H-22 Z"),
  ],
  shrugger: [
    Hd(0, -41) + K("M0 -37 L0 -20 M0 -32 L-9 -25 M0 -32 L9 -25 M0 -20 L-6 0 M0 -20 L6 0"),
    Hd(0, -40) + K("M0 -36 L0 -20 M0 -33 L-8 -30 L-13 -38 M0 -33 L8 -30 L13 -38 M0 -20 L-6 0 M0 -20 L6 0"),
  ],
  rope: [
    Hd(0, -41) + K("M0 -37 L0 -20 M0 -32 L14 -30 M0 -20 L-6 0 M0 -20 L6 0") + Hr("M0 -32 L-7 -25 L-5 -18"),
    Hd(-3, -40) + K("M-3 -36 L0 -20 M-2 -31 L14 -30 M0 -20 L-8 0 M0 -20 L5 0") + Hr("M-2 -31 L-11 -33 L-14 -40"),
  ],
  hauler: [
    Hd(-7, -37) + K("M-5 -33 L2 -19 M-3 -29 L9 -25 M2 -19 L-7 0 M2 -19 L11 -1"),
    Hd(-6, -38) + K("M-4 -34 L2 -19 M-2 -30 L9 -25 M2 -19 L-1 0 M2 -19 L6 0"),
  ],
  pusher: [
    Hd(-8, -36) + K("M-6 -32 L2 -19 M-4 -29 L-13 -27 M2 -19 L-5 0 M2 -19 L11 -1"),
    Hd(-7, -37) + K("M-5 -33 L2 -19 M-3 -30 L-13 -27 M2 -19 L0 0 M2 -19 L6 0"),
  ],
  letterer: [
    Hd(0, -41) + K("M0 -37 L0 -20 M0 -32 L-9 -30 L-16 -34.5 M0 -20 L-6 0 M0 -20 L6 0") + Hr("M-16 -34.5 L-20.8 -35.4 M0 -32 L6 -25 L4 -19"),
    Hd(-1, -41) + K("M-1 -37 L0 -20 M0 -32 L-8 -27 L-15 -30 M0 -20 L-6 0 M0 -20 L6 0") + Hr("M-15 -30 L-19.5 -31.5 M0 -32 L6 -25 L4 -19"),
  ],
  caller: [
    Hd(0, -41) + K("M0 -37 L0 -20 M0 -32 L-7 -29 L-9 -37 M0 -20 L-6 0 M0 -20 L6 0") + Hr("M-15 -40 H-9 V-35 H-15 Z M0 -32 L7 -25 L5 -18"),
    Hd(-1, -41.5) + K("M-1 -37.5 L0 -20 M0 -32 L-7 -29 L-9 -37 M0 -32 L8 -36 L11 -44 M0 -20 L-7 0 M0 -20 L5 0") + Hr("M-15 -40 H-9 V-35 H-15 Z"),
  ],
};

const POSE_NAMES = /** @type {const} */ (Object.keys(POSES));

/* ---------------------------------------------------------------------------
   Where each pose's tool meets the figure, in the pose's own frame (feet at
   y 0, facing left, before flip and scale). Read off the paths above; the
   subjects use them to hang ropes, boards and pens off the right point.
   Where the two drawings differ, a is the rest drawing and b the beat.

   sitter    seat (2, -3) is the hip on the edge it sits on; feet (-13, 0)
             hang below it. Hand a (-9, -10) rests; hand b (-11, -22) waves.
             Placed with y at the top of what it sits on when the feet
             rest on it too; at the top plus 3 when they hang off an edge.
   leaner    feet (-5, 0) and (6, 0). Hand a (-1, -21) on the hip; hand b
             (-4, -34) up at the head. Leans on nothing; stands at ease.
   carrier   holds a block out in front: block a x -22..-8, y -34..-16,
             block b x -22..-8, y -40..-22 (lifted). Hand a (-9, -26),
             hand b (-9, -31). Rear foot a (8, -2) is mid stride.
   shrugger  hands a (-9, -25) and (9, -25); hands b (-13, -38) and
             (13, -38), thrown up.
   rope      pulling hand (14, -30) in both drawings, the rope running off
             behind (to the right). Free arm a (-5, -18), b (-14, -40).
   hauler    rope over the shoulder, hand (9, -25) in both; leans forward
             into the haul, so the rope leaves behind and low.
   pusher    both hands (-13, -27) in both, against the load in front.
   letterer  pen tip a (-20.8, -35.4), b (-19.5, -31.5); pen hand a
             (-16, -34.5), b (-15, -30). Letters on a board at about
             x -21, y -30..-40.
   caller    holds a tin can to the mouth: can x -15..-9, y -40..-35 in both,
             the string leaving from (-15, -37.5) (the can's far end).
             Free arm b raised to (11, -44).
   --------------------------------------------------------------------------- */
const POSE_POINTS = {
  sitter: { seat: [2, -3], feet: [[-13, 0]], hand: [[-9, -10], [-11, -22]] },
  leaner: { feet: [[-5, 0], [6, 0]], hand: [[-1, -21], [-4, -34]] },
  carrier: { feet: [[-7, 0], [8, -2]], hand: [[-9, -26], [-9, -31]], load: [[-22, -34, 14, 18], [-22, -40, 14, 18]] },
  shrugger: { feet: [[-6, 0], [6, 0]], hand: [[-9, -25], [-13, -38]], otherHand: [[9, -25], [13, -38]] },
  rope: { feet: [[-6, 0], [6, 0]], hand: [[14, -30], [14, -30]] },
  hauler: { feet: [[-7, 0], [11, -1]], hand: [[9, -25], [9, -25]] },
  pusher: { feet: [[-5, 0], [11, -1]], hand: [[-13, -27], [-13, -27]] },
  letterer: { feet: [[-6, 0], [6, 0]], hand: [[-16, -34.5], [-15, -30]], pen: [[-20.8, -35.4], [-19.5, -31.5]] },
  caller: { feet: [[-6, 0], [6, 0]], hand: [[-9, -37], [-9, -37]], can: [-15, -40, 6, 5], string: [-15, -37.5] },
};

/**
 * Map a point from a pose's frame into the drawing, for a worker placed with
 * worker(pose, x, y, { flip, scale }).
 */
const posePoint = ([px, py], x, y, { flip = false, scale = 1 } = {}) => [
  n(x + (flip ? -px : px) * scale),
  n(y + py * scale),
];

/**
 * A worker at a station: a place and a facing, nothing else. Draws both
 * drawings; the beat's phase is seeded from the pose and the place (or
 * `seed`) so a crew never moves in step.
 */
function worker(pose, x, y, { flip = false, scale = 1, seed = "" } = {}) {
  const r = rng(seedFrom(seed || `${pose}${x}${y}`));
  const delay = -(r() * 3.4).toFixed(2);
  const sx = (flip ? -1 : 1) * scale;
  return `<g class="crew-g" transform="translate(${n(x)} ${n(y)}) scale(${sx} ${scale})" style="--crew-delay:${delay}s"><g data-pose="a">${POSES[pose][0]}</g><g data-pose="b">${POSES[pose][1]}</g></g>`;
}

/**
 * A station: a group shown only in the states listed (space separated),
 * so each state can put its own worker on site.
 */
const station = (states, inner, extra = "") => `<g class="st" data-st="${states}" ${extra}>${inner}</g>`;

__x.POSES = POSES;
__x.POSE_NAMES = POSE_NAMES;
__x.POSE_POINTS = POSE_POINTS;
__x.posePoint = posePoint;
__x.worker = worker;
__x.station = station;
};

__defs.lettering = (__x, __star) => {
/* ===========================================================================
   Lettering. The library carries its own single stroke capitals: one line,
   drawn on a cap height of 10, each letter nudged by a seed so no two words
   are lettered alike. Every word a drawing carries goes through letter();
   a hidden <text> twin keeps it readable to assistive tech and search.
   =========================================================================== */
const { n, arrow, rng, seedFrom, esc } = __req("svg");

/** Glyph name -> [advance width, path data on a cap height of 10, baseline y 0]. */
const GLYPHS = {
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
const LETTERABLE = Object.keys(GLYPHS).join("") + " ";

/**
 * Letter `text` with its baseline's left end at (x, y). Returns the markup
 * and the lettered width in drawing units.
 *   size        cap height in drawing units is about size * 0.7
 *   angle       the whole word's rotation, degrees
 *   seed        what the wobble is seeded from (defaults to the text)
 *   arrowAfter  a leader arrow after the word
 *   underline   two rules under it
 */
function letter(text, x, y, { size = 15, angle = -2, seed = text, arrowAfter = false, underline = false } = {}) {
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

__x.GLYPHS = GLYPHS;
__x.LETTERABLE = LETTERABLE;
__x.letter = letter;
};

__defs.marks = (__x, __star) => {
/* ===========================================================================
   The drafting marks, each spent on one meaning. Ported from the prototype;
   the ladder, pegs, string line, gin wheel and dimension wrapper lived
   inline in its subjects and are lifted out here unchanged in shape.

   Every function returns an SVG fragment string. Marks that belong to one
   state carry data-st="<state>" and are shown by styles.css only in it.
   The state words are the product's (empty, loading, idle, success,
   changed, error); the drafting names live in the docs, not the markup.
   =========================================================================== */
const { n, chain, cloudArcs, SET_OUT, esc } = __req("svg");

/** Signed off: a tick in two strokes, the short one then the long one. (x, y) is the crook. */
const tickMark = (x, y) =>
  `<g class="mk tick ink" data-st="success"><path class="t1" d="M${n(x - 3.5)} ${n(y - 3.5)}L${n(x)} ${n(y)}"/><path class="t2" d="M${n(x)} ${n(y)}L${n(x + 7)} ${n(y - 8)}"/></g>`;

/**
 * Revised: a revision cloud round [x, y, w, h], walked clockwise, and, when
 * `rev` and `tagAt` are given, the triangle tag at tagAt carrying `rev`.
 */
function cloudMark([x, y, w, h], tagAt, rev) {
  const arcs = cloudArcs(x, y, w, h).map((d, k) => `<path d="${d}" style="--k:${k}"/>`).join("");
  const tag = rev && tagAt ? revisionTag(tagAt, rev, cloudArcs(x, y, w, h).length * 30 + 160) : "";
  return `<g class="mk ink" data-st="changed"><g class="cloud">${arcs}</g>${tag}</g>`;
}

/**
 * The revision triangle on its own, apex up, its base 6 below (x, y); it
 * widens for a longer version ("2.4.1"). `at` is its entry delay in ms.
 */
function revisionTag([x, y], rev, at = 700) {
  const t = String(rev);
  const half = Math.max(10, t.length * 2.6 + 6.5);
  const apex = y - 10 - (half - 10) * 1.2;
  return `<g class="tag" style="--tag-at:${at}ms"><path class="paper" d="M${n(x)} ${n(apex)}L${n(x + half)} ${n(y + 6)}H${n(x - half)}Z"/><text class="fig rev-letter" x="${n(x)}" y="${n(y + 4.2)}" text-anchor="middle" style="font-size:8px;letter-spacing:0">${esc(t)}</text></g>`;
}

/**
 * Out of true: a plumb line hung from (bx, by), a cord of `len` and a bob
 * `w` wide and `h` tall. The cord drops, then the bob swings in and settles.
 */
function plumbMark(bx, by, len, w = 8, h = 19) {
  const half = w / 2, cap = half * 0.42, y0 = len;
  const yCap = y0 + h * 0.14, ySh = y0 + h * 0.3, tip = y0 + h;
  return `<g class="mk ink" data-st="error"><g transform="translate(${n(bx)} ${n(by)})"><g class="swing"><path class="cord" d="M0 0V${n(len)}"/><g class="bob"><path class="paper" d="M${n(-cap)} ${n(y0)}H${n(cap)}V${n(yCap)}L${n(half)} ${n(ySh)}L0 ${n(tip)}L${n(-half)} ${n(ySh)}L${n(-cap)} ${n(yCap)}Z"/><path d="M${n(-cap)} ${n(yCap)}H${n(cap)}M${n(-half)} ${n(ySh)}H${n(half)}" opacity="0.6"/></g></g></g></g>`;
}

/**
 * The bracket the plumb line hangs from: off the top corner (x, top), out
 * `reach` and down 3. Goes in the leaning layer, so it leans with the work.
 */
const plumbBracket = (x, top, reach = 12) =>
  `<g class="mk ink" data-st="error"><path d="M${x} ${top}H${x + reach}V${top + 3}"/></g>`;

/**
 * Where the plumb line hangs once the work has leaned `deg` about a pivot
 * at height `pivotY`: the bracket's far end, moved by the lean.
 */
const plumbHang = (x, top, pivotY, deg, reach = 12) => [
  x + reach + (pivotY - top) * Math.tan((deg * Math.PI) / 180),
  top + 3,
];

/** Out of true, for spans: a taut true line with a stop at each end. */
const trueLine = (x0, x1, y) =>
  `<g class="mk ink" data-st="error"><path class="temp" d="M${x0} ${y}H${x1}M${x0} ${y - 5}V${y + 3}M${x1} ${y - 5}V${y + 3}"/></g>`;

/** Earth: one short stroke every 16 under the ground line, at the faint step. */
const hatch = (from, to, y = 3) => {
  let d = "";
  for (let x = from; x <= to; x += 16) d += `M${n(x)} ${y}l-6 7`;
  return `<path class="ink faint" d="${d}"/>`;
};

/** The ground line across the whole drawing. */
const ground = (W, x0 = 0) => `<path class="gnd" d="M${x0} 0H${W}"/>`;

/**
 * Scaffold: standards at `xs` from `base` to `top`, a lift every 14, a brace
 * per bay across the bottom lift only. `liftIndex(j)` gives the course a
 * lift arrives with, so lifts come one ahead of the work.
 */
function scaffold({ xs, base = 0, top, lifts, liftIndex }) {
  let std = "", lift = "";
  xs.forEach((x) => { std += `<path class="std" d="M${x} ${base}V${top}"/>`; });
  for (let j = 1; j <= lifts; j++) {
    const y = base - 14 * j;
    const i = liftIndex(j);
    lift += `<path class="lift c" style="--i:${i};--j:${j}" d="M${xs[0] - 2} ${y}H${xs[xs.length - 1] + 2}"/>`;
  }
  let brace = "";
  for (let b = 0; b < xs.length - 1; b++) brace += `M${xs[b]} ${base}L${xs[b + 1]} ${base - 14}`;
  return `<g class="ink temp">${std}${lift}<g style="opacity:var(--board-on, 1);transition:opacity 200ms ease"><path class="std" d="${brace}"/></g></g>`;
}

/**
 * The working board between two standards; it rides --work-y (px) and
 * shows with --board-on.
 */
const board = (x0, x1) =>
  `<g class="board ink temp" style="transform:translateY(var(--work-y, 0px));opacity:var(--board-on, 1)"><path class="paper" d="M${x0 - 3} -2.5H${x1 + 3}V0H${x0 - 3}Z"/></g>`;

/**
 * A ladder from its foot (x, 0) leaning to (x - lean, -height), stiles 6
 * apart, `rungs` rungs. From the prototype's door frame.
 */
function ladder(x, height, { lean = 26, rungs = 7, base = 0 } = {}) {
  const top = base - height;
  let r = "";
  for (let k = 1; k <= rungs; k++) {
    const t = k / (rungs + 1);
    r += `<path d="M${n(x - lean * t)} ${n(base - height * t)}h6"/>`;
  }
  return `<g class="ink temp"><path class="std" d="M${x} ${base}L${x - lean} ${top}M${x + 6} ${base}L${x + 6 - lean} ${top}"/>${r}</g>`;
}

/**
 * Set-out pegs: a short peg driven at each x on the ground, a little head
 * on each. Lines strung between them go through stringLine().
 */
function pegs(xs, { y = 0, h = 7 } = {}) {
  const d = xs.map((x) => `M${n(x)} ${n(y + 2)}V${n(y - h)}M${n(x - 1.5)} ${n(y - h)}H${n(x + 1.5)}`).join("");
  return `<path class="ink" d="${d}"/>`;
}

/** A string line between two points, sagging `sag` at the middle (0 is taut). */
const stringLine = ([x0, y0], [x1, y1], sag = 0, cls = "") =>
  `<path class="ink${cls ? ` ${cls}` : ""}" d="M${n(x0)} ${n(y0)}Q${n((x0 + x1) / 2)} ${n((y0 + y1) / 2 + sag * 2)} ${n(x1)} ${n(y1)}"/>`;

/**
 * The gin wheel, for loading with no known progress: a wheel hung off a
 * putlog at `liftTop`, a bucket going up and down its fall (the only loop).
 * From the prototype's wall.
 *   x         the standard it hangs off
 *   liftTop   the top lift's y
 *   loadTop   the bucket's resting top (near the ground)
 *   restTo    where the fall is tied off while a hauler holds it, [x, y];
 *             without crew the fall is tied to a cleat on the standard.
 */
function ginWheel({ x, liftTop, loadTop = -10, restTo = null, out = 15 }) {
  const wx = x + out, wy = liftTop + 4;
  const ginSpan = -(-liftTop - 22);
  const fallLen = loadTop - (wy + 3);
  const tail = restTo
    ? `<path class="ink temp rest-on" d="M${wx + 3.5} ${wy}L${n(restTo[0])} ${n(restTo[1])}"/>`
    : "";
  return `<g class="ink temp"><path d="M${x} ${liftTop}H${wx + 3}M${wx} ${liftTop}V${wy - 3.5}"/><circle cx="${wx}" cy="${wy}" r="3.5"/></g>
    <g class="ink" style="--gin-span:${ginSpan}px;--gin-scale:${n((fallLen + ginSpan) / fallLen)}">
      <path class="gin-fall temp" d="M${wx - 3.5} ${wy}V${loadTop}"/>
      <g class="gin-load"><path class="paper" d="M${wx - 8} ${loadTop}H${wx + 1}L${wx} ${loadTop + 8}H${wx - 7}Z"/><path d="M${wx - 7.5} ${loadTop}Q${wx - 3.5} ${loadTop - 5} ${wx + 0.5} ${loadTop}" opacity="0.6"/></g>
    </g>
    ${tail}
    <path class="ink temp rest-off" d="M${wx + 3.5} ${wy}V-14M${wx + 0.5} -14H${wx + 6.5}"/>`;
}

/**
 * A dimension: the chain from (x1, y1) to (x2, y2) with its figure set in
 * the gap, in the mono face. The figure must be a real value passed in;
 * with no figure the chain closes up.
 */
function dimension(x1, y1, x2, y2, figure = "", { gapPerChar = 3.4 } = {}) {
  const text = figure === "" || figure == null ? "" : String(figure);
  const gap = text ? text.length * gapPerChar + 6 : 0.01;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const fig = text ? `<text class="fig" x="${n(mx)}" y="${n(my + 3.5)}" text-anchor="middle">${esc(text)}</text>` : "";
  return `<g class="ink dim"><path class="chainline" d="${chain(x1, y1, x2, y2, gap)}" opacity="0.85"/>${fig}</g>`;
}

/** The set-out dash as an attribute, for subjects drawing their own outlines. */
const dashed = `stroke-dasharray="${SET_OUT}"`;

__x.tickMark = tickMark;
__x.cloudMark = cloudMark;
__x.revisionTag = revisionTag;
__x.plumbMark = plumbMark;
__x.plumbBracket = plumbBracket;
__x.plumbHang = plumbHang;
__x.trueLine = trueLine;
__x.hatch = hatch;
__x.ground = ground;
__x.scaffold = scaffold;
__x.board = board;
__x.ladder = ladder;
__x.pegs = pegs;
__x.stringLine = stringLine;
__x.ginWheel = ginWheel;
__x.dimension = dimension;
__x.dashed = dashed;
};

__defs.figure = (__x, __star) => {
/* ===========================================================================
   A figure description, checked and given its defaults.

   A figure file default-exports:

     {
       name,            kebab-case id, written to data-figure
       title,           sentence case, what a reader calls it ("Wall")
       shelf,           "site", "messages", "files", ...
       use,             what it is for, one short line ("Lists and tables")
       width, height,   the drawing above the ground: x 0..width, y -height..0
       depth?,          room under the ground line for hatching (default 22)
       travel?,         { by: [dx, dy], steps? }: the work moves instead of
                        rising, by value * by (in whole steps if set); idle,
                        success and changed stand at the end of it
       measures?,       { what, unit?, sample }: what opts.figure carries for this
                        figure (inbox: unread messages); sheets draw the sample
       draw(ctx),       returns the parts below; ctx carries the helpers and opts
     }

   draw(ctx) returns:

     courses    [svg | { svg, still: true }] in build order. Loading inks
                them in this order. A still course never leans (a footing).
     outline?   the set-out, drawn dashed in empty and under error.
                Default: the courses again, dashed, unfilled.
     contents?  inside lines, drawn faint with the outline.
     fixed?     always drawn solid, not part of the build (a sledge, a bank).
     ground?    drawn on the ground layer and never travels (a ramp, a cut).
                The default ground is a line across the width.
     groundLine? false drops that line (a figure drawing its own cut).
     hatch?     [x0, x1] earth hatching under the footprint (default none).
     foot       [x, y] the corner the work stands on, on its plumb side
                (needed for "lean").
     top        the y of that side's top; the plumb bracket hangs off it
                (needed for "lean").
     error      "lean" (leans about foot off a plumb line) or "sag" (sag
                parts drop under a taut string line).
     lean?      degrees for "lean" (default 6).
     string?    [[x0, y0], [x1, y1]] the taut line for "sag".
     revise     [x, y, w, h] the part the revision cloud goes round.
     tag?       [x, y] where the revision triangle sits (default: right of the cloud).
     tick?      [x, y] where the tick's crook lands (default: above the top corner).
     stations   { empty, loading, waiting?, idle, success, changed, error }, each
                a station { pose, x, y, flip?, ride? } or an array of them, or
                null. waiting is loading with no value (default: loading).
                ride: true puts the worker on the working board.
     access?    { kind: "scaffold", at: [x0, x1] } or { kind: "ladder", at: x, height, lean? }.
                Either one gets the gin wheel for loading with no value: off
                the top lift, or off a jib at the ladder's head.
     letter?    { at: [x, y], angle? } where lettering goes (default top left).
     extras?    svg drawn with the marks, for real values (a dimension chain).
   =========================================================================== */
const { POSE_NAMES } = __req("poses");

const STATES = ["idle", "empty", "loading", "success", "changed", "error"];
const STATION_KEYS = [...STATES, "waiting"];

const fail = (name, msg) => {
  throw new Error(`ostraca: figure "${name}": ${msg}`);
};
const isPt = (p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);

/** Check a description's own fields (not the drawing) and fill defaults. */
function defineFigure(d) {
  if (!d || typeof d !== "object") throw new Error("ostraca: a figure description must be an object");
  const name = d.name;
  if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) fail(name, "name must be kebab-case");
  for (const k of ["title", "shelf", "use"]) if (typeof d[k] !== "string" || !d[k]) fail(name, `${k} is required`);
  if (!(d.width > 0) || !(d.height > 0)) fail(name, "width and height must be positive");
  if (typeof d.draw !== "function") fail(name, "draw(ctx) is required");
  if (d.travel && !isPt(d.travel.by)) fail(name, "travel.by must be [dx, dy]");
  return Object.freeze({ depth: 22, ...d });
}

/** Check what draw() returned and fill its defaults. */
function checkParts(fig, p) {
  const name = fig.name;
  if (!p || !Array.isArray(p.courses) || !p.courses.length) fail(name, "draw() must return courses");
  const courses = p.courses.map((c, i) => {
    const o = typeof c === "string" ? { svg: c, still: false } : c;
    if (!o || typeof o.svg !== "string") fail(name, `course ${i} is not svg`);
    return { svg: o.svg, still: !!o.still };
  });
  if (p.error !== "lean" && p.error !== "sag") fail(name, 'error must be "lean" or "sag"');
  if (p.error === "lean" && !isPt(p.foot)) fail(name, "foot must be [x, y]");
  if (p.error === "lean" && !Number.isFinite(p.top)) fail(name, "top must be a number");
  if (p.foot != null && !isPt(p.foot)) fail(name, "foot must be [x, y]");
  if (p.error === "sag" && p.tick == null && (p.foot == null || p.top == null)) fail(name, "a sag figure needs tick, or foot and top");
  if (p.error === "sag" && !(Array.isArray(p.string) && p.string.every(isPt))) fail(name, "sag needs string [[x0, y0], [x1, y1]]");
  const rv = p.revise;
  if (!(Array.isArray(rv) && rv.length === 4 && rv.every(Number.isFinite))) fail(name, "revise must be [x, y, w, h]");
  const stations = {};
  for (const k of STATION_KEYS) {
    const v = p.stations?.[k];
    const list = v == null ? [] : Array.isArray(v) ? v : [v];
    for (const s of list) {
      if (!POSE_NAMES.includes(s.pose)) fail(name, `station ${k}: unknown pose "${s.pose}"`);
      if (!Number.isFinite(s.x) || !Number.isFinite(s.y)) fail(name, `station ${k}: x and y must be numbers`);
    }
    stations[k] = list;
  }
  if (!p.stations?.waiting) stations.waiting = stations.loading;
  const a = p.access;
  if (a && !(a.kind === "scaffold" && Array.isArray(a.at)) && !(a.kind === "ladder" && Number.isFinite(a.at))) fail(name, "access is { kind: 'scaffold', at: [x0, x1] } or { kind: 'ladder', at: x, height }");
  const [fx] = p.foot ?? [fig.width / 2, 0];
  return {
    ...p,
    courses,
    stations,
    lean: p.lean ?? 6,
    side: fx >= fig.width / 2 ? 1 : -1,
    tick: p.tick ?? [fx + 6 * (fx >= fig.width / 2 ? 1 : -1), p.top - 7],
    tag: p.tag ?? [rv[0] + rv[2] + 18, rv[1] - 4],
    letter: p.letter ?? { at: [Math.min(fx, 24), -fig.height + 18], angle: -2 },
  };
}

__x.STATES = STATES;
__x.defineFigure = defineFigure;
__x.checkParts = checkParts;
};

__defs.compose = (__x, __star) => {
/* ===========================================================================
   The state engine. A figure supplies geometry (see figure.js); this file
   supplies all six states, with no state code in any figure:

     idle      built: drawn solid, nothing happening
     empty     set out: dashed outline, contents faint
     loading   rising: courses ink from the ground up as value goes 0..1,
               under scaffold or a ladder; no value, the gin wheel loops
     success   signed off: access struck, a tick in two strokes
     changed   revised: a cloud round one part, the version in a triangle
     error     out of true: leans off a plumb line, or sags under a string

   Every state is in the markup at once; data-state on .ostraca-sub picks
   which shows, and styles.css moves between them. So a mounted drawing
   animates by changing attributes and custom properties, never markup.
   =========================================================================== */
const svgKit = __req("svg");
const poseKit = __req("poses");
const markKit = __req("marks");
const letterKit = __req("lettering");
const { checkParts } = __req("figure");

const { n, esc, SET_OUT } = svgKit;
const { worker, station, posePoint, POSE_POINTS } = poseKit;
const { tickMark, cloudMark, plumbMark, scaffold, board, ladder, ginWheel, hatch } = markKit;
const { letter } = letterKit;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const cmds = (d) => d.replace(/[^A-Za-z]/g, "");

/** A path that drops from d0 to d1 when out of true. */
function sag(d0, d1, cls = "") {
  const c = cls ? ` ${cls}` : "";
  if (cmds(d0) === cmds(d1))
    return `<path class="sag${c}" d="${d0}" style="--d0:path('${d0}');--d1:path('${d1}')"/>`;
  // Different shapes cannot tween: cross-fade the two drawings instead.
  return `<path class="sag-a${c}" d="${d0}"/><path class="sag-b${c}" d="${d1}"/>`;
}

/** Svg shown only in the listed product states (space separated). */
const when = (states, inner) => `<g class="mk" data-st="${states}">${inner}</g>`;

/** A taut string line from a to b, with a stop across each end. */
function stringMark([x0, y0], [x1, y1]) {
  const L = Math.hypot(x1 - x0, y1 - y0) || 1;
  const nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
  const stop = (x, y) => `M${n(x + nx * 5)} ${n(y + ny * 5)}L${n(x - nx * 3)} ${n(y - ny * 3)}`;
  return `<g class="mk ink" data-st="error"><path class="temp true-line" d="M${n(x0)} ${n(y0)}L${n(x1)} ${n(y1)}${stop(x0, y0)}${stop(x1, y1)}"/></g>`;
}

/** The helpers a figure's draw(ctx) gets, plus its opts. */
function makeCtx(fig, opts) {
  return { ...svgKit, ...poseKit, ...markKit, ...letterKit, sag, when, opts, width: fig.width, height: fig.height, travelled: travelled(fig, opts) };
}

/** How far a travelling figure has gone, 0..1, in whole steps if it has them. */
function travelled(fig, o) {
  if (!fig.travel) return 0;
  const known = o.value != null && Number.isFinite(o.value);
  const steps = fig.travel.steps;
  const q = (x) => (steps ? Math.floor(clamp01(x) * steps) / steps : clamp01(x));
  if (o.state === "empty") return 0;
  if (o.state === "loading") return known ? q(o.value) : 0;
  if (o.state === "error") return known ? q(o.value) : 0.5;
  return 1;
}

/** The numbers a state draws with; mount() writes the same ones on update. */
function stateVars(fig, p, o) {
  const N = p.courses.length;
  const known = o.value != null && Number.isFinite(o.value);
  const v = known ? clamp01(o.value) : null;
  const travel = !!fig.travel;
  let built = 1;
  if (o.state === "empty") built = 0;
  else if (o.state === "loading" && !travel) built = known ? v : 1 / N;
  const tv = travel ? travelled(fig, o) : 1;
  // The working lift: the board, and whoever rides it, sit at the top course.
  let lift = 0;
  if (p.access?.kind === "scaffold" && o.state === "loading" && known && !travel) {
    const [, fy] = p.foot;
    const reach = -fy + (fy - p.top) * v - 20;
    if (reach > 0) lift = -14 * Math.round(reach / 14);
  }
  return {
    "--n": N,
    "--ostraca-built": n(built),
    "--ostraca-travel": n(tv),
    "--work-y": `${lift || 2.5}px`,
    "--board-on": lift ? 1 : 0,
  };
}

const STATE_LABEL = {
  idle: "",
  empty: "empty",
  loading: "loading",
  success: "done",
  changed: "changed",
  error: "something went wrong",
};

function labelFor(fig, o) {
  if (o.title) return o.title;
  let s = fig.title;
  const word = STATE_LABEL[o.state];
  if (word) s += `, ${word}`;
  if (o.state === "loading" && o.value != null && Number.isFinite(o.value)) s += `, ${Math.round(clamp01(o.value) * 100)} percent`;
  if (o.state === "changed" && o.rev) s += `, now ${o.rev}`;
  return s;
}

/* Workers, one group per distinct place, listing every state it serves. */
function crewLayer(fig, p) {
  const groups = new Map();
  const add = (key, s, state, extra) => {
    const k = `${key}|${extra}`;
    if (!groups.has(k)) groups.set(k, { s, states: [], extra });
    const g = groups.get(k);
    if (!g.states.includes(state)) g.states.push(state);
  };
  const ownWaiting = p.stations.waiting !== p.stations.loading;
  for (const [st, list] of Object.entries(p.stations)) {
    const state = st === "waiting" ? "loading" : st;
    const extra = st === "waiting" ? (ownWaiting ? 'data-unknown-only=""' : "") : st === "loading" && ownWaiting ? 'data-known=""' : "";
    if (st === "waiting" && !ownWaiting) continue;
    for (const s of list) add(JSON.stringify([s.pose, s.x, s.y, !!s.flip, !!s.ride]), s, state, extra);
  }
  let out = "";
  for (const { s, states, extra } of groups.values()) {
    let w = worker(s.pose, s.x, s.y, { flip: !!s.flip, seed: `${fig.name}-${s.pose}-${s.x}-${s.y}` });
    if (s.ride) w = `<g class="board-rider" style="transform:translateY(var(--work-y, 0px))">${w}</g>`;
    out += station(states.join(" "), w, extra);
  }
  return out;
}

/* Scaffold or ladder, and the gin wheel, from the access description. */
function accessLayers(p) {
  const a = p.access;
  if (!a) return { scaf: "", gin: "" };
  // Whoever holds the fall while nobody knows how far it has got.
  const w = p.stations.waiting.find((s) => s.pose === "hauler" || s.pose === "rope");
  const pt = w && (w.pose === "hauler" ? POSE_POINTS.hauler.hand[0] : POSE_POINTS.rope.hand[0]);
  const restTo = w ? posePoint(pt, w.x, w.y, { flip: !!w.flip }) : null;
  if (a.kind === "ladder") {
    // The wheel hangs off a short jib at the ladder's head, far enough out
    // that the fall drops clear of the stiles all the way down.
    const height = a.height ?? -p.top, lean = a.lean ?? 26;
    const head = a.at + 6 - lean;
    const gin = ginWheel({ x: head, liftTop: -height, restTo, out: lean + 12 });
    return { scaf: ladder(a.at, height, { lean }), gin };
  }
  const xs = a.at, [, fy] = p.foot;
  const lifts = Math.ceil((-p.top + 6) / 14);
  const liftTop = -14 * lifts;
  const rising = p.courses.filter((c) => !c.still).length || 1;
  const h = (fy - p.top) / rising;
  // A lift arrives with the course below its height, so it is one ahead.
  const liftIndex = (j) => Math.max(0, Math.ceil((14 * j + fy) / h) - 1);
  const scaf = scaffold({ xs, top: liftTop - 8, lifts, liftIndex }) + board(xs[0], xs[xs.length - 1]);
  return { scaf, gin: ginWheel({ x: xs[xs.length - 1], liftTop, restTo }) };
}

/** Render a checked figure in one state. Returns the <svg> string. */
function renderFigure(fig, o) {
  const p = checkParts(fig, fig.draw(makeCtx(fig, o)));
  const { width: W, height: H, depth: D } = fig;
  const [fx, fy] = p.foot ?? [W / 2, 0];
  const rtl = o.dir === "rtl";

  // Courses: still ones stand outside the lean, the rest lean about the foot.
  let still = "", leaning = "";
  p.courses.forEach((c, i) => {
    const g = `<g class="c" style="--i:${i}">${c.svg}</g>`;
    if (c.still || p.error !== "lean") still += g;
    else leaning += g;
  });
  const reach = 12 * p.side;
  if (p.error === "lean") {
    leaning += `<g class="mk ink" data-st="error"><path d="M${n(fx)} ${n(p.top)}H${n(fx + reach)}V${n(p.top + 3)}"/></g>`;
    const deg = p.lean * p.side;
    leaning = `<g transform="translate(${n(fx)} ${n(fy)})"><g class="lean" style="--lean:${-deg}deg"><g transform="translate(${n(-fx)} ${n(-fy)})">${leaning}</g></g></g>`;
  }
  const outline = p.outline ?? `<g class="dash">${p.courses.map((c) => c.svg).join("")}</g>`;
  const setout = outline + (p.contents ? `<g class="faint">${p.contents}</g>` : "");

  let marks = tickMark(...p.tick) + cloudMark(p.revise, p.tag, o.rev || "");
  if (p.error === "lean") {
    const bx = fx + p.side * (12 + (fy - p.top) * Math.tan((p.lean * Math.PI) / 180));
    const by = p.top + 3;
    marks += plumbMark(bx, by, Math.max(10, -by - 26));
  } else marks += stringMark(...p.string);
  if (p.extras) marks += p.extras;

  const { scaf, gin } = accessLayers(p);
  const crew = crewLayer(fig, p);

  let lettering = "";
  if (o.lettered) {
    const [lx, ly] = p.letter.at, ang = p.letter.angle ?? -2;
    const probe = letter(o.lettered, 0, 0, { angle: ang, seed: `${fig.name}-${o.lettered}` });
    // Mirrored, the word's far end becomes its start: same height, other side.
    const rad = (ang * Math.PI) / 180;
    lettering = rtl
      ? letter(o.lettered, W - lx - probe.w * Math.cos(rad), ly + probe.w * Math.sin(rad), { angle: -ang, seed: `${fig.name}-${o.lettered}` }).svg
      : letter(o.lettered, lx, ly, { angle: ang, seed: `${fig.name}-${o.lettered}`, arrowAfter: !!p.letter.arrow }).svg;
  }

  const vars = stateVars(fig, p, o);
  if (fig.travel) { vars["--tx"] = `${n(fig.travel.by[0])}px`; vars["--ty"] = `${n(fig.travel.by[1])}px`; }
  const style = Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";");
  const known = o.value != null && Number.isFinite(o.value);
  const flags = `${!known && o.state === "loading" ? " data-unknown=\"\"" : ""}${o.state === "loading" ? " data-busy=\"\"" : ""}${fig.travel ? " data-travel=\"\"" : ""}`;
  const tr = fig.travel ? " tr" : "";

  const groundLine = p.groundLine === false ? "" : `<path class="gnd" d="M0 0H${W}"/>`;
  const ground = `<g data-slot="ground">${groundLine}${p.hatch ? hatch(p.hatch[0], p.hatch[1]) : ""}${p.ground || ""}</g>`;
  const sub = `<g class="ostraca-sub" data-state="${o.state}" data-crew="${o.crew ? "on" : "off"}"${flags} style="${style}">
${ground}
<g class="L-setout ink${tr}" data-slot="setout">${setout}</g>
<g class="L-built ink${tr}" data-slot="built">${p.fixed || ""}${still}${leaning}</g>
<g class="L-scaffold" data-slot="scaffold">${scaf}</g>
<g class="L-gin" data-slot="gin">${gin}</g>
<g class="L-crew${tr}" data-slot="crew">${crew}</g>
<g class="L-marks${tr}" data-slot="marks">${marks}</g>
</g>`;
  const drawing = rtl ? `<g transform="translate(${W} 0) scale(-1 1)">${sub}</g>` : sub;
  const letterG = `<g class="letter" data-slot="letter">${lettering}</g>`;

  const label = labelFor(fig, o);
  const a11y = o.decorative ? `aria-hidden="true" focusable="false"` : `role="img" aria-label="${esc(label)}"`;
  const title = o.decorative ? "" : `<title>${esc(label)}</title>`;
  return `<svg class="ostraca" data-figure="${fig.name}"${rtl ? ' data-dir="rtl"' : ""} viewBox="0 ${-H} ${W} ${H + D}" ${a11y} xmlns="http://www.w3.org/2000/svg">${title}<g transform="translate(0.5 -0.5)">${drawing}${letterG}</g></svg>`;
}



__x.SET_OUT = SET_OUT;
__x.sag = sag;
__x.when = when;
__x.makeCtx = makeCtx;
__x.travelled = travelled;
__x.stateVars = stateVars;
__x.labelFor = labelFor;
__x.renderFigure = renderFigure;
};

__defs.index = (__x, __star) => {
/* ===========================================================================
   Ostraca. Illustrations for every state a product is in.

     render(name, opts)       -> an <svg> string; no DOM needed (SSR, email, files)
     mount(el, name, opts)    -> { update(opts), destroy() }; updates animate
     figures                  -> [{ name, title, shelf, use }]
     STATES                   -> ["idle", "empty", "loading", "success", "changed", "error"]
     define(description)      -> add a figure of your own

   opts:
     state       one of STATES (default "idle")
     value       0..1 for loading; leave it out when nobody knows how far
     rev         the app's real version, carried by changed ("2.4", "B")
     figure      { value, unit } a real measure, for figures that draw one
     crew        true puts the workers on site (default false)
     lettered    a short word lettered on the drawing in the drawn pen (A to Z)
     title       the accessible name (default: the figure's title and state)
     decorative  true hides it from assistive tech
     dir         "rtl" mirrors the drawing, not its lettering or figures
   =========================================================================== */
const { defineFigure, STATES } = __req("figure");
const { renderFigure, stateVars, makeCtx } = __req("compose");
const { checkParts } = __req("figure");
const registry = {};

__star.push(__req("svg"));
__star.push(__req("poses"));
__star.push(__req("lettering"));
__star.push(__req("marks"));
__x.sag = __req("compose").sag;
__x.when = __req("compose").when;


const table = new Map();
for (const d of Object.values(registry)) table.set(d.name, defineFigure(d));

/** Every figure in the library (and any you defined), for menus and docs. */
const figures = [...table.values()].map(({ name, title, shelf, use, measures }) => ({ name, title, shelf, use, ...(measures ? { measures } : {}) }));

/** Add a figure of your own. Returns the checked description. */
function define(description) {
  const fig = defineFigure(description);
  if (!table.has(fig.name)) figures.push({ name: fig.name, title: fig.title, shelf: fig.shelf, use: fig.use });
  table.set(fig.name, fig);
  return fig;
}

function resolve(f) {
  if (typeof f === "string") {
    const fig = table.get(f);
    if (!fig) throw new Error(`ostraca: no figure "${f}". Figures: ${[...table.keys()].join(", ")}`);
    return fig;
  }
  return table.get(f?.name) === f ? f : defineFigure(f);
}

function normalize(o = {}) {
  const state = o.state ?? "idle";
  if (!STATES.includes(state)) throw new Error(`ostraca: state "${state}" is not one of ${STATES.join(", ")}`);
  return {
    state,
    value: typeof o.value === "number" && Number.isFinite(o.value) ? o.value : undefined,
    rev: o.rev == null ? "" : String(o.rev),
    figure: o.figure ?? null,
    crew: !!o.crew,
    lettered: o.lettered ? String(o.lettered) : "",
    title: o.title ?? "",
    decorative: !!o.decorative,
    dir: o.dir === "rtl" ? "rtl" : "ltr",
  };
}

/** The figure as an <svg> string. */
function render(f, opts) {
  return renderFigure(resolve(f), normalize(opts));
}

const supportsD = () => typeof CSS !== "undefined" && CSS.supports?.("d", 'path("M0 0")');

/**
 * Draw into `el` and keep it: update(opts) merges new opts and moves the
 * drawing to them by attributes, so the change animates. If `el` already
 * holds this figure's markup (from render() on the server), it is adopted.
 */
function mount(el, f, opts) {
  const fig = resolve(f);
  let cur = normalize(opts);
  const own = () => el.querySelector(`svg.ostraca[data-figure="${fig.name}"]`);
  if (!own()) el.innerHTML = renderFigure(fig, cur);
  const tpl = el.ownerDocument.createElement("template");

  function settleSag() {
    if (supportsD()) return;
    const err = cur.state === "error";
    el.querySelectorAll(".sag").forEach((p) => {
      const m = p.getAttribute("style")?.match(err ? /--d1:path\('([^']*)'\)/ : /--d0:path\('([^']*)'\)/);
      if (m) p.setAttribute("d", m[1]);
    });
  }

  function update(next = {}) {
    const prev = cur;
    cur = normalize({ ...prev, ...next });
    tpl.innerHTML = renderFigure(fig, cur);
    const fresh = tpl.content.firstElementChild;
    const old = own();
    if (!old || prev.dir !== cur.dir) { el.replaceChildren(fresh); settleSag(); return; }
    for (const a of ["role", "aria-label", "aria-hidden", "focusable"]) {
      fresh.hasAttribute(a) ? old.setAttribute(a, fresh.getAttribute(a)) : old.removeAttribute(a);
    }
    const t0 = old.querySelector(":scope > title"), t1 = fresh.querySelector(":scope > title");
    if (t1 && t0) t0.textContent = t1.textContent;
    else if (t1) old.prepend(t1.cloneNode(true));
    else t0?.remove();
    // The sub: attributes copied over, and a duration that fits the distance.
    const a = old.querySelector(".ostraca-sub"), b = fresh.querySelector(".ostraca-sub");
    const from = parseFloat(a.style.getPropertyValue("--ostraca-built")) || 0;
    const to = parseFloat(b.style.getPropertyValue("--ostraca-built")) || 0;
    const N = parseFloat(b.style.getPropertyValue("--n")) || 1;
    b.style.setProperty("--ostraca-t", `${Math.round(Math.max(240, Math.abs(to - from) * N * 240))}ms`);
    for (const { name } of [...a.attributes]) if (!b.hasAttribute(name)) a.removeAttribute(name);
    for (const { name, value } of [...b.attributes]) if (a.getAttribute(name) !== value) a.setAttribute(name, value);
    // Layers: only those whose markup changed are replaced.
    fresh.querySelectorAll("[data-slot]").forEach((s) => {
      const o = old.querySelector(`[data-slot="${s.dataset.slot}"]`);
      if (o && o.innerHTML !== s.innerHTML) o.innerHTML = s.innerHTML;
    });
    settleSag();
  }

  settleSag();
  return {
    update,
    destroy() { el.replaceChildren(); },
    get opts() { return { ...cur }; },
  };
}

/** For tools: the checked parts a figure draws, in the given opts. */
function inspect(f, opts) {
  const fig = resolve(f);
  const o = normalize(opts);
  const parts = checkParts(fig, fig.draw(makeCtx(fig, o)));
  return { figure: fig, parts, vars: stateVars(fig, parts, o) };
}

__x.STATES = STATES;
__x.figures = figures;
__x.define = define;
__x.render = render;
__x.mount = mount;
__x.inspect = inspect;
};

const __api = __req("index");
export const { ARROW_LONG, ARROW_WIDE, DIM_TICK, GLYPHS, LETTERABLE, POSES, POSE_NAMES, POSE_POINTS, SET_OUT, SPRINGS, STATES, arrow, board, chain, cloudArcs, cloudMark, dashed, define, dimension, esc, figures, ginWheel, ground, hatch, inspect, ladder, letter, line, mount, n, pegs, plumbBracket, plumbHang, plumbMark, poly, posePoint, rectPath, render, revisionTag, rng, sag, sagPath, scaffold, seedFrom, springEasing, station, stepSpring, stringLine, tickMark, trueLine, when, worker } = __api;
/** The figure styles (src/styles.css), for pages that draw figures. */
export const STYLES = "/* ===========================================================================\n   Ostraca figure styles. Everything a drawing needs and nothing a page does.\n\n   Theming: every colour and step is a --ostraca-* custom property. The\n   defaults are light-dark() pairs, so they follow the page's color-scheme\n   (set `color-scheme: light dark` on your root, or `light` / `dark`).\n   Override any of them on :root or on a wrapper to retheme:\n\n     .my-card { --ostraca-thing: #0a5; --ostraca-paper: white; }\n\n   Motion: transitions and the crew's beat are off under\n   prefers-reduced-motion: reduce; the drawing still lands on its state.\n   =========================================================================== */\n\n:where(:root) {\n  /* Things are drawn in blueprint blue, people in the text ink. */\n  --ostraca-thing: light-dark(oklch(57% 0.09 243), oklch(80% 0.075 243));\n  --ostraca-crew: light-dark(oklch(28% 0.02 72), oklch(93% 0.004 307));\n  --ostraca-ground: light-dark(oklch(74% 0.016 80), oklch(100% 0 0 / 0.34));\n  --ostraca-label: light-dark(oklch(44% 0.021 72), oklch(83% 0.02 250));\n  /* The only fill: the paper the drawing sits on (cream pad / blueprint). */\n  --ostraca-paper: light-dark(#eee6d6, #1f3b5c);\n  /* Secondary detail is lower opacity, never a second weight. */\n  --ostraca-temp: 0.6;\n  --ostraca-faint: 0.35;\n  --ostraca-sans: \"Cubit Sans\", ui-sans-serif, system-ui, sans-serif;\n  --ostraca-mono: \"Cubit Mono\", ui-monospace, SFMono-Regular, Menlo, monospace;\n\n  /* Springs sampled into linear() (src/engine/svg.js SPRINGS). */\n  --ostraca-spring-lean: linear(0, 0.012, 0.043, 0.093, 0.154, 0.23, 0.308, 0.397, 0.484, 0.576, 0.661, 0.744, 0.826, 0.898, 0.968, 1.026, 1.08, 1.123, 1.161, 1.188, 1.21, 1.224, 1.231, 1.233, 1.229, 1.221, 1.21, 1.194, 1.177, 1.158, 1.138, 1.116, 1.096, 1.076, 1.056, 1.038, 1.021, 1.006, 0.992, 0.98, 0.97, 0.962, 0.955, 0.951, 0.948, 0.946, 0.946, 0.947, 0.949, 0.952, 0.955, 0.96, 0.964, 0.969, 0.973, 1);\n  --ostraca-spring-bob: linear(0, 0.032, 0.119, 0.25, 0.412, 0.593, 0.779, 0.959, 1.122, 1.261, 1.369, 1.444, 1.484, 1.491, 1.467, 1.418, 1.349, 1.266, 1.175, 1.084, 0.997, 0.92, 0.856, 0.807, 0.775, 0.759, 0.76, 0.776, 0.803, 0.839, 0.881, 0.926, 0.971, 1.012, 1.049, 1.078, 1.1, 1.114, 1.119, 1.116, 1.107, 1.092, 1.074, 1.052, 1.03, 1.009, 0.989, 0.972, 0.958, 0.948, 0.943, 0.941, 0.944, 0.949, 0.957, 1);\n  --ostraca-spring-sag: linear(0, 0.015, 0.052, 0.113, 0.188, 0.276, 0.379, 0.483, 0.59, 0.704, 0.808, 0.908, 1.006, 1.09, 1.168, 1.23, 1.281, 1.322, 1.35, 1.366, 1.372, 1.367, 1.354, 1.332, 1.305, 1.271, 1.235, 1.197, 1.155, 1.115, 1.076, 1.036, 1.002, 0.97, 0.941, 0.917, 0.896, 0.882, 0.871, 0.864, 0.862, 0.863, 0.868, 0.875, 0.885, 0.898, 0.911, 0.926, 0.941, 0.956, 0.971, 0.985, 0.998, 1.011, 1.021, 1);\n}\n\n@property --ostraca-built { syntax: \"<number>\"; inherits: true; initial-value: 1; }\n@property --ostraca-travel { syntax: \"<number>\"; inherits: true; initial-value: 1; }\n\n.ostraca { display: block; width: 100%; height: auto; overflow: visible; color: var(--ostraca-crew); }\n.ostraca :is(path, rect, circle, line) { vector-effect: non-scaling-stroke; }\n.ostraca .ink { fill: none; stroke: var(--ostraca-thing); stroke-width: 1; stroke-linecap: round; stroke-linejoin: round; }\n.ostraca .paper { fill: var(--ostraca-paper); }\n.ostraca .gnd { fill: none; stroke: var(--ostraca-ground); stroke-width: 1; stroke-linecap: round; }\n.ostraca .temp { opacity: var(--ostraca-temp); }\n.ostraca .faint { opacity: var(--ostraca-faint); }\n/* Dimension figures: the one place the mono face is drawn. */\n.ostraca .fig {\n  font-family: var(--ostraca-mono); font-size: 10px; fill: var(--ostraca-thing); stroke: none;\n  font-feature-settings: \"tnum\" 1; letter-spacing: 0.04em;\n}\n.ostraca .lbl { font-family: var(--ostraca-sans); font-size: 12px; fill: var(--ostraca-label); stroke: none; }\n/* Lettering is the one line that scales with the drawing, as a font would:\n   a marker's weight, about an eighth of the cap height, at any size. (The\n   pen group carries .ink, whose 1px would otherwise win by inheritance.)\n   The <text> twin is there for assistive tech and search, never shown. */\n.ostraca .lt .lt-pen { stroke-width: 1.3; }\n.ostraca .lt .lt-pen path { vector-effect: none; }\n.ostraca .lt-font { display: none; }\n\n/* The crew: two weights of line, in the ink of the text. */\n.ostraca .crew-g { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }\n.ostraca .crew-key { stroke-width: 1.6; opacity: 0.82; }\n.ostraca .crew-hair { stroke-width: 1; opacity: 0.45; }\n.ostraca .crew-g [data-pose=\"b\"] { opacity: 0; }\n\n/* ONE NUMBER: every course is drawn twice, set out and built, and the built\n   copy shows when --ostraca-built has passed its place in the order. */\n.ostraca-sub {\n  --ostraca-built: 1;\n  transition:\n    --ostraca-built var(--ostraca-t, 900ms) var(--ostraca-ease, cubic-bezier(0.2, 0.7, 0.3, 1)),\n    --ostraca-travel 240ms cubic-bezier(0.16, 0.84, 0.44, 1);\n}\n.ostraca .c { opacity: clamp(0, calc((var(--ostraca-built) * var(--n) - var(--i)) * 4), 1); }\n\n/* What each state shows. Delays on entry only. */\n.ostraca .L-setout { transition: opacity 260ms ease; }\n.ostraca-sub:is([data-state=\"idle\"], [data-state=\"success\"], [data-state=\"changed\"]) .L-setout { opacity: 0; }\n.ostraca .st, .ostraca .mk { opacity: 0; transition: opacity 160ms ease; }\n.ostraca .L-scaffold { opacity: 0; transition: opacity 200ms ease; }\n.ostraca-sub[data-state=\"loading\"] .L-scaffold { opacity: 1; transition: opacity 240ms ease; }\n.ostraca .L-gin { display: none; }\n.ostraca-sub[data-state=\"loading\"][data-unknown] .L-gin { display: inline; }\n.ostraca-sub[data-crew=\"off\"] .L-crew,\n.ostraca-sub[data-crew=\"off\"] .rest-on,\n.ostraca-sub[data-crew=\"on\"] .rest-off { display: none; }\n\n/* Stations and marks show in the states they list. */\n.ostraca-sub[data-state=\"empty\"] :is(.st, .mk)[data-st~=\"empty\"],\n.ostraca-sub[data-state=\"loading\"] :is(.st, .mk)[data-st~=\"loading\"],\n.ostraca-sub[data-state=\"idle\"] :is(.st, .mk)[data-st~=\"idle\"],\n.ostraca-sub[data-state=\"success\"] :is(.st, .mk)[data-st~=\"success\"],\n.ostraca-sub[data-state=\"changed\"] :is(.st, .mk)[data-st~=\"changed\"],\n.ostraca-sub[data-state=\"error\"] :is(.st, .mk)[data-st~=\"error\"] {\n  opacity: 1; transition: opacity 280ms ease 180ms;\n}\n.ostraca-sub[data-unknown] .st[data-known],\n.ostraca-sub:not([data-unknown]) .st[data-unknown-only] { opacity: 0 !important; }\n\n/* Standards grow up from the ground; lifts come one ahead of the work. */\n.ostraca .std { transform-box: fill-box; transform-origin: 50% 100%; transform: scaleY(0); transition: transform 300ms ease-out; }\n.ostraca-sub[data-state=\"loading\"] .std { transform: scaleY(1); }\n.ostraca .lift { transition: opacity 200ms ease, translate 200ms ease; }\n.ostraca-sub:not([data-state=\"loading\"]) .lift { opacity: 0; translate: 0 2px; transition-delay: calc((12 - var(--j, 0)) * 90ms); }\n.ostraca .board { transition: transform 240ms cubic-bezier(0.16, 0.84, 0.44, 1); }\n\n/* The tick: two strokes, the short one then the long one, each drawn from\n   its start by a scale rather than a dash offset. */\n.ostraca .tick path { stroke-width: 1.4; transform-box: fill-box; transform: scale(0); transition: transform 0ms; }\n.ostraca .tick .t1 { transform-origin: 0% 0%; }\n.ostraca .tick .t2 { transform-origin: 0% 100%; }\n.ostraca-sub[data-state=\"success\"] .tick path { transform: scale(1); transition: transform 160ms ease-out 260ms; }\n.ostraca-sub[data-state=\"success\"] .tick .t2 { transition-delay: 420ms; }\n\n/* The cloud: its scallops in clockwise order, then the tag. */\n.ostraca .cloud path { opacity: 0; transition: opacity 120ms ease; }\n.ostraca-sub[data-state=\"changed\"] .cloud path { opacity: 1; transition-delay: calc(var(--k) * 30ms + 120ms); }\n.ostraca .tag { opacity: 0; translate: 0 -4px; transition: opacity 160ms ease, translate 160ms ease; }\n.ostraca-sub[data-state=\"changed\"] .tag { opacity: 1; translate: 0 0; transition-delay: var(--tag-at, 700ms); }\n\n/* The true line: the work leans, the plumb line drops from its bracket and\n   the bob swings in and settles on a spring. */\n.ostraca .lean { transition: transform 1.6s var(--ostraca-spring-lean, ease-out); }\n.ostraca-sub[data-state=\"error\"] .lean { transform: skewX(var(--lean)); }\n.ostraca .cord { transform-box: fill-box; transform-origin: 50% 0%; transform: scaleY(0); transition: transform 0ms; }\n.ostraca-sub[data-state=\"error\"] .cord { transform: scaleY(1); transition: transform 380ms cubic-bezier(0.2, 0.8, 0.3, 1) 260ms; }\n.ostraca .bob { opacity: 0; }\n.ostraca-sub[data-state=\"error\"] .bob { opacity: 1; transition: opacity 120ms ease 560ms; }\n.ostraca-sub[data-state=\"error\"] .swing { animation: ostraca-swing 2.2s var(--ostraca-spring-bob, ease-out) 560ms both; }\n@keyframes ostraca-swing { from { transform: rotate(9deg); } to { transform: rotate(0deg); } }\n.ostraca .sag { transition: d 1.5s var(--ostraca-spring-sag, ease-out); }\n.ostraca-sub[data-state=\"error\"] .sag { d: var(--d1); }\n/* Sag drawings whose shapes cannot tween cross-fade instead. */\n.ostraca .sag-a, .ostraca .sag-b { transition: opacity 220ms ease; }\n.ostraca .sag-b, .ostraca-sub[data-state=\"error\"] .sag-a { opacity: 0; }\n.ostraca-sub[data-state=\"error\"] .sag-b { opacity: 1; }\n\n/* The default set-out: the courses again, dashed and unfilled. */\n.ostraca .dash :is(path, rect, circle, line) { stroke-dasharray: 4 3; }\n.ostraca .dash .paper { fill: none; }\n\n/* Travel: work that moves instead of rising (a load up a ramp). */\n.ostraca-sub[data-travel] .tr {\n  transform: translate(calc(var(--ostraca-travel) * var(--tx, 0px)), calc(var(--ostraca-travel) * var(--ty, 0px)));\n}\n\n/* Right to left: the drawing is mirrored, its figures read the right way. */\n.ostraca[data-dir=\"rtl\"] text.fig { transform-box: fill-box; transform-origin: 50% 50%; transform: scaleX(-1); }\n\n.ostraca .heave { transition: transform 240ms cubic-bezier(0.16, 0.84, 0.44, 1), d 240ms cubic-bezier(0.16, 0.84, 0.44, 1); }\n.ostraca .chainline { transition: d 280ms cubic-bezier(0.2, 0.8, 0.3, 1); }\n.ostraca .xfade { transition: opacity 220ms ease; }\n\n/* The gin wheel's load: the only loop, because there, work is going on. */\n.ostraca .gin-load { animation: ostraca-gin 1.6s ease-in-out infinite alternate; }\n.ostraca .gin-fall { transform-box: fill-box; transform-origin: 50% 0%; animation: ostraca-gin-fall 1.6s ease-in-out infinite alternate; }\n@keyframes ostraca-gin { from { transform: translateY(0); } to { transform: translateY(var(--gin-span)); } }\n@keyframes ostraca-gin-fall { from { transform: scaleY(1); } to { transform: scaleY(var(--gin-scale)); } }\n\n/* The worker's beat: two drawings, 3.4s, 64/36, a 2% smear. Busy halves it. */\n@media (prefers-reduced-motion: no-preference) {\n  .ostraca .crew-g [data-pose=\"a\"] { animation: ostraca-pose-a 3.4s steps(1) var(--crew-delay, 0s) infinite; }\n  .ostraca .crew-g [data-pose=\"b\"] { animation: ostraca-pose-b 3.4s steps(1) var(--crew-delay, 0s) infinite; }\n  .ostraca-sub[data-busy] .crew-g [data-pose=\"a\"] { animation: ostraca-pose-a 0.62s steps(1) 0s infinite; }\n  .ostraca-sub[data-busy] .crew-g [data-pose=\"b\"] { animation: ostraca-pose-b 0.62s steps(1) 0s infinite; }\n}\n@keyframes ostraca-pose-a { 0% { opacity: 0.62; } 2% { opacity: 1; } 62% { opacity: 0.42; } 64% { opacity: 0; } }\n@keyframes ostraca-pose-b { 0% { opacity: 0.42; } 2% { opacity: 0; } 62% { opacity: 0.62; } 64% { opacity: 1; } }\n\n/* Arrival: the drawing opens as its plan on two faint guides and inks in\n   the order it would be built. */\n.ostraca .guides { opacity: 0; transition: opacity 400ms ease; }\n.ostraca-sub[data-plan] .guides { opacity: 1; transition: none; }\n.ostraca-sub[data-plan] .L-setout { opacity: 1 !important; transition: none; }\n.ostraca-sub[data-plan] :is(.L-marks, .L-crew, .letter) { opacity: 0; transition: none; }\n.ostraca .letter { transition: opacity 300ms ease var(--letter-at, 0ms); }\n\n@media (prefers-reduced-motion: reduce) {\n  .ostraca-sub, .ostraca *, .ostraca *::before { transition-duration: 0ms !important; transition-delay: 0ms !important; }\n  .ostraca .swing, .ostraca .gin-load, .ostraca .gin-fall { animation: none !important; }\n  .ostraca .gin-load { transform: translateY(var(--gin-span)); }\n  .ostraca .gin-fall { transform: scaleY(var(--gin-scale)); }\n}\n";
/** A hash of the sources this file was built from. */
export const ENGINE_HASH = "32179322895d6e41";
