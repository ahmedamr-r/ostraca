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
import * as svgKit from "./svg.js";
import * as poseKit from "./poses.js";
import * as markKit from "./marks.js";
import * as letterKit from "./lettering.js";
import { checkParts } from "./figure.js";

const { n, esc, SET_OUT } = svgKit;
const { worker, station, posePoint, POSE_POINTS } = poseKit;
const { tickMark, cloudMark, plumbMark, scaffold, board, ladder, ginWheel, hatch } = markKit;
const { letter } = letterKit;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const cmds = (d) => d.replace(/[^A-Za-z]/g, "");

/** A path that drops from d0 to d1 when out of true. */
export function sag(d0, d1, cls = "") {
  const c = cls ? ` ${cls}` : "";
  if (cmds(d0) === cmds(d1))
    return `<path class="sag${c}" d="${d0}" style="--d0:path('${d0}');--d1:path('${d1}')"/>`;
  // Different shapes cannot tween: cross-fade the two drawings instead.
  return `<path class="sag-a${c}" d="${d0}"/><path class="sag-b${c}" d="${d1}"/>`;
}

/** Svg shown only in the listed product states (space separated). */
export const when = (states, inner) => `<g class="mk" data-st="${states}">${inner}</g>`;

/** A taut string line from a to b, with a stop across each end. */
function stringMark([x0, y0], [x1, y1]) {
  const L = Math.hypot(x1 - x0, y1 - y0) || 1;
  const nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
  const stop = (x, y) => `M${n(x + nx * 5)} ${n(y + ny * 5)}L${n(x - nx * 3)} ${n(y - ny * 3)}`;
  return `<g class="mk ink" data-st="error"><path class="temp true-line" d="M${n(x0)} ${n(y0)}L${n(x1)} ${n(y1)}${stop(x0, y0)}${stop(x1, y1)}"/></g>`;
}

/** The helpers a figure's draw(ctx) gets, plus its opts. */
export function makeCtx(fig, opts) {
  return { ...svgKit, ...poseKit, ...markKit, ...letterKit, sag, when, opts, width: fig.width, height: fig.height, travelled: travelled(fig, opts) };
}

/** How far a travelling figure has gone, 0..1, in whole steps if it has them. */
export function travelled(fig, o) {
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
export function stateVars(fig, p, o) {
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

export function labelFor(fig, o) {
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
export function renderFigure(fig, o) {
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

  // Only the marks of the states this figure draws (p.error is null without error).
  const has = (s) => fig.states.includes(s);
  let marks = (has("success") ? tickMark(...p.tick) : "") + (has("changed") ? cloudMark(p.revise, p.tag, o.rev || "") : "");
  if (p.error === "lean") {
    const bx = fx + p.side * (12 + (fy - p.top) * Math.tan((p.lean * Math.PI) / 180));
    const by = p.top + 3;
    marks += plumbMark(bx, by, Math.max(10, -by - 26));
  } else if (p.error === "sag") marks += stringMark(...p.string);
  if (p.extras) marks += p.extras;

  const { scaf, gin } = has("loading") ? accessLayers(p) : { scaf: "", gin: "" };
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
  // Colours passed as options sit on the drawing itself, over the stylesheet's.
  const inks = [["--ostraca-thing", o.color], ["--ostraca-crew", o.crewColor], ["--ostraca-paper", o.paperColor]]
    .filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join(";");
  return `<svg class="ostraca" data-figure="${fig.name}"${rtl ? ' data-dir="rtl"' : ""}${inks ? ` style="${esc(inks)}"` : ""} viewBox="0 ${-H} ${W} ${H + D}" ${a11y} xmlns="http://www.w3.org/2000/svg">${title}<g transform="translate(0.5 -0.5)">${drawing}${letterG}</g></svg>`;
}

export { SET_OUT };
