/* ===========================================================================
   The drafting marks, each spent on one meaning. Ported from the prototype;
   the ladder, pegs, string line, gin wheel and dimension wrapper lived
   inline in its subjects and are lifted out here unchanged in shape.

   Every function returns an SVG fragment string. Marks that belong to one
   state carry data-st="<state>" and are shown by styles.css only in it.
   The state words are the product's (empty, loading, idle, success,
   changed, error); the drafting names live in the docs, not the markup.
   =========================================================================== */
import { n, chain, cloudArcs, SET_OUT, esc } from "./svg.js";

/** Signed off: a tick in two strokes, the short one then the long one. (x, y) is the crook. */
export const tickMark = (x, y) =>
  `<g class="mk tick ink" data-st="success"><path class="t1" d="M${n(x - 3.5)} ${n(y - 3.5)}L${n(x)} ${n(y)}"/><path class="t2" d="M${n(x)} ${n(y)}L${n(x + 7)} ${n(y - 8)}"/></g>`;

/**
 * Revised: a revision cloud round [x, y, w, h], walked clockwise, and, when
 * `rev` and `tagAt` are given, the triangle tag at tagAt carrying `rev`.
 */
export function cloudMark([x, y, w, h], tagAt, rev) {
  const arcs = cloudArcs(x, y, w, h).map((d, k) => `<path d="${d}" style="--k:${k}"/>`).join("");
  const tag = rev && tagAt ? revisionTag(tagAt, rev, cloudArcs(x, y, w, h).length * 30 + 160) : "";
  return `<g class="mk ink" data-st="changed"><g class="cloud">${arcs}</g>${tag}</g>`;
}

/**
 * The revision triangle on its own, apex up, its base 6 below (x, y); it
 * widens for a longer version ("2.4.1"). `at` is its entry delay in ms.
 */
export function revisionTag([x, y], rev, at = 700) {
  const t = String(rev);
  const half = Math.max(10, t.length * 2.6 + 6.5);
  const apex = y - 10 - (half - 10) * 1.2;
  return `<g class="tag" style="--tag-at:${at}ms"><path class="paper" d="M${n(x)} ${n(apex)}L${n(x + half)} ${n(y + 6)}H${n(x - half)}Z"/><text class="fig rev-letter" x="${n(x)}" y="${n(y + 4.2)}" text-anchor="middle" style="font-size:8px;letter-spacing:0">${esc(t)}</text></g>`;
}

/**
 * Out of true: a plumb line hung from (bx, by), a cord of `len` and a bob
 * `w` wide and `h` tall. The cord drops, then the bob swings in and settles.
 */
export function plumbMark(bx, by, len, w = 8, h = 19) {
  const half = w / 2, cap = half * 0.42, y0 = len;
  const yCap = y0 + h * 0.14, ySh = y0 + h * 0.3, tip = y0 + h;
  return `<g class="mk ink" data-st="error"><g transform="translate(${n(bx)} ${n(by)})"><g class="swing"><path class="cord" d="M0 0V${n(len)}"/><g class="bob"><path class="paper" d="M${n(-cap)} ${n(y0)}H${n(cap)}V${n(yCap)}L${n(half)} ${n(ySh)}L0 ${n(tip)}L${n(-half)} ${n(ySh)}L${n(-cap)} ${n(yCap)}Z"/><path d="M${n(-cap)} ${n(yCap)}H${n(cap)}M${n(-half)} ${n(ySh)}H${n(half)}" opacity="0.6"/></g></g></g></g>`;
}

/**
 * The bracket the plumb line hangs from: off the top corner (x, top), out
 * `reach` and down 3. Goes in the leaning layer, so it leans with the work.
 */
export const plumbBracket = (x, top, reach = 12) =>
  `<g class="mk ink" data-st="error"><path d="M${x} ${top}H${x + reach}V${top + 3}"/></g>`;

/**
 * Where the plumb line hangs once the work has leaned `deg` about a pivot
 * at height `pivotY`: the bracket's far end, moved by the lean.
 */
export const plumbHang = (x, top, pivotY, deg, reach = 12) => [
  x + reach + (pivotY - top) * Math.tan((deg * Math.PI) / 180),
  top + 3,
];

/** Out of true, for spans: a taut true line with a stop at each end. */
export const trueLine = (x0, x1, y) =>
  `<g class="mk ink" data-st="error"><path class="temp" d="M${x0} ${y}H${x1}M${x0} ${y - 5}V${y + 3}M${x1} ${y - 5}V${y + 3}"/></g>`;

/** Earth: one short stroke every 16 under the ground line, at the faint step. */
export const hatch = (from, to, y = 3) => {
  let d = "";
  for (let x = from; x <= to; x += 16) d += `M${n(x)} ${y}l-6 7`;
  return `<path class="ink faint" d="${d}"/>`;
};

/** The ground line across the whole drawing. */
export const ground = (W, x0 = 0) => `<path class="gnd" d="M${x0} 0H${W}"/>`;

/**
 * Scaffold: standards at `xs` from `base` to `top`, a lift every 14, a brace
 * per bay across the bottom lift only. `liftIndex(j)` gives the course a
 * lift arrives with, so lifts come one ahead of the work.
 */
export function scaffold({ xs, base = 0, top, lifts, liftIndex }) {
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
export const board = (x0, x1) =>
  `<g class="board ink temp" style="transform:translateY(var(--work-y, 0px));opacity:var(--board-on, 1)"><path class="paper" d="M${x0 - 3} -2.5H${x1 + 3}V0H${x0 - 3}Z"/></g>`;

/**
 * A ladder from its foot (x, 0) leaning to (x - lean, -height), stiles 6
 * apart, `rungs` rungs. From the prototype's door frame.
 */
export function ladder(x, height, { lean = 26, rungs = 7, base = 0 } = {}) {
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
export function pegs(xs, { y = 0, h = 7 } = {}) {
  const d = xs.map((x) => `M${n(x)} ${n(y + 2)}V${n(y - h)}M${n(x - 1.5)} ${n(y - h)}H${n(x + 1.5)}`).join("");
  return `<path class="ink" d="${d}"/>`;
}

/** A string line between two points, sagging `sag` at the middle (0 is taut). */
export const stringLine = ([x0, y0], [x1, y1], sag = 0, cls = "") =>
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
export function ginWheel({ x, liftTop, loadTop = -10, restTo = null, out = 15 }) {
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
export function dimension(x1, y1, x2, y2, figure = "", { gapPerChar = 3.4 } = {}) {
  const text = figure === "" || figure == null ? "" : String(figure);
  const gap = text ? text.length * gapPerChar + 6 : 0.01;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const fig = text ? `<text class="fig" x="${n(mx)}" y="${n(my + 3.5)}" text-anchor="middle">${esc(text)}</text>` : "";
  return `<g class="ink dim"><path class="chainline" d="${chain(x1, y1, x2, y2, gap)}" opacity="0.85"/>${fig}</g>`;
}

/** The set-out dash as an attribute, for subjects drawing their own outlines. */
export const dashed = `stroke-dasharray="${SET_OUT}"`;
