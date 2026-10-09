/* ===========================================================================
   The Site shelf: the prototype's six subjects (wall, stair, bridge, tin can
   line, door frame, ramp), ported mechanically. Each returns a subject for
   compose() (the ramp returns its parts; its sheet assembled them by hand).
   The stage 2 state engine will rework these onto the product states.
   =========================================================================== */
import { n, chain, rng, seedFrom, SET_OUT } from "../engine/svg.js";
import { worker, station } from "../engine/poses.js";
import { letter } from "../engine/lettering.js";
import { tickMark, cloudMark, plumbMark, hatch, scaffold } from "../engine/marks.js";

/* WALL: courses of block on a footing. Lists, tables, skeleton rows. */
export function wall({ x0 = 170, cols = 6, rows = 6, bw = 36, bh = 13, foot = 8, rev = "", stations = true, plate = false } = {}) {
  const w = cols * bw, x1 = x0 + w, top = -foot - rows * bh;
  const fx0 = x0 - 8, fx1 = x1 + 8;
  const courseY = (r) => -foot - (r + 1) * bh;
  const joints = (r) => {
    let d = "";
    const off = r % 2 ? bw / 2 : 0;
    for (let x = x0 + off + (off ? 0 : bw); x < x1 - 1; x += bw) d += `M${n(x)} ${n(courseY(r))}v${bh}`;
    return d;
  };
  let inside = "", courses = "";
  for (let r = 0; r < rows; r++) {
    inside += `M${x0} ${courseY(r) + bh}H${x1}` + joints(r);
    courses += `<g class="c" style="--i:${r + 1}"><rect class="paper" x="${x0}" y="${courseY(r)}" width="${w}" height="${bh}"/><path d="${joints(r)}" opacity="0.55"/></g>`;
  }
  const setout = `<path d="M${fx0} 0V${-foot}H${x0}V${top}H${x1}V${-foot}H${fx1}V0" stroke-dasharray="${SET_OUT}"/><path class="faint" d="${inside}"/>`;
  const footing = `<g class="c" style="--i:0"><path class="paper" d="M${fx0} 0V${-foot}H${fx1}V0Z"/></g>`;
  // Scaffold: one bay off the right face, standards 5 out, wide enough that
  // the block held out over the work sits clear of both standards.
  const sx = [x1 + 5, x1 + 40];
  const lifts = Math.ceil((-top + 6) / 14);
  const liftTop = -14 * lifts;
  const scaf = scaffold({ xs: sx, top: liftTop - 8, lifts, liftIndex: (j) => Math.max(0, Math.ceil((14 * j - foot) / bh) - 1) });
  const board = `<g class="board ink temp" style="transform:translateY(var(--work-y, 0px));opacity:var(--board-on, 1)"><path class="paper" d="M${sx[0] - 3} -2.5H${sx[1] + 3}V0H${sx[0] - 3}Z"/></g>`;
  // The gin wheel, for when nobody knows how far it has got.
  const wx = sx[1] + 15, wy = liftTop + 4;
  const ginSpan = -(-liftTop - 22);
  const loadTop = -10;
  const fallLen = loadTop - (wy + 3);
  const gin = `<g class="ink temp"><path d="M${sx[1]} ${liftTop}H${wx + 3}M${wx} ${liftTop}V${wy - 3.5}"/><circle cx="${wx}" cy="${wy}" r="3.5"/></g>
    <g class="ink" style="--gin-span:${ginSpan}px;--gin-scale:${n((fallLen + ginSpan) / fallLen)}">
      <path class="gin-fall temp" d="M${wx - 3.5} ${wy}V${loadTop}"/>
      <g class="gin-load"><path class="paper" d="M${wx - 8} ${loadTop}H${wx + 1}L${wx} ${loadTop + 8}H${wx - 7}Z"/><path d="M${wx - 7.5} ${loadTop}Q${wx - 3.5} ${loadTop - 5} ${wx + 0.5} ${loadTop}" opacity="0.6"/></g>
    </g>
    <path class="ink temp rest-on" d="M${wx + 3.5} ${wy}L${x1 + 91} -25"/>
    <path class="ink temp rest-off" d="M${wx + 3.5} ${wy}V-14M${wx + 0.5} -14H${wx + 6.5}"/>`;
  const leaning = courses + `<g class="mk ink" data-st="out-of-true"><path d="M${x1} ${top}H${x1 + 12}V${top + 3}"/></g>`;
  // Where the bracket's end lands once the courses lean 6 degrees.
  const bx = x1 + 12 + (-top - foot) * Math.tan((6 * Math.PI) / 180), by = top + 3;
  const r2 = courseY(2);
  const marks = tickMark(x1 + 6, top - 7) +
    cloudMark([x1 - 2 * bw - 5, r2 - 5, 2 * bw + 10, bh + 10], [x1 + 18, r2 - 9], rev) +
    plumbMark(bx, by, -by - 26);
  let st = "";
  if (stations) {
    st += station("set-out revised", worker("letterer", x1 + 20.8, 0, { seed: "wall-letterer" }));
    st += station("rising", `<g class="board-rider" style="transform:translateY(var(--work-y, 0px))">${worker("carrier", x1 + 30, -2.5, { seed: "wall-carrier" })}</g>`, "data-known");
    st += station("rising", worker("hauler", x1 + 100, 0, { flip: true, seed: "wall-hauler" }), "data-unknown-only");
    st += station("built signed-off", worker("sitter", x0 + 46, top, { flip: true, seed: "wall-sitter" }));
    st += station("out-of-true", worker("shrugger", x0 - 34, 0, { seed: "wall-shrug" }));
  }
  return {
    id: "wall", n: rows + 1, rows, foot, bh, top, x1,
    under: hatch(fx0 + 8, fx1),
    setout, fixed: footing, leaning,
    lean: { pivot: [x1, -foot], angle: 6 },
    scaffold: scaf + board, gin, marks, stations: st,
  };
}

/* STAIR: a flight of stone steps, one tread per real task. */
export function stair({ cx = 290, steps = 5, g = 24, r = 13, stations = true, sitterOnly = false } = {}) {
  const x0 = n(cx - (steps * g) / 2), xe = x0 + steps * g, H = steps * r;
  let profile = `M${x0} 0`;
  for (let i = 0; i < steps; i++) profile += `V${-(i + 1) * r}H${x0 + (i + 1) * g}`;
  profile += "V0";
  let inside = "", courses = "";
  for (let i = 0; i < steps; i++) {
    const x = x0 + i * g, h = (i + 1) * r;
    let beds = "";
    for (let k = 1; k <= i; k++) beds += `M${x} ${-k * r}H${x + g}`;
    inside += `M${x} 0V${-i * r}` + beds;
    courses += `<g class="c" style="--i:${i}"><rect class="paper" x="${x}" y="${-h}" width="${g}" height="${h}"/>${beds ? `<path d="${beds}" opacity="0.35"/>` : ""}</g>`;
  }
  const setout = `<path d="${profile}" stroke-dasharray="${SET_OUT}"/><path class="faint" d="${inside}"/>`;
  const marks = tickMark(xe + 6, -H - 6);
  let st = "";
  if (stations) {
    if (!sitterOnly) {
      st += station("set-out", worker("carrier", x0 - 28, 0, { flip: true, seed: "stair-carrier-0" }));
      // On the last finished tread, the next one held out over the gap.
      st += station("rising", `<g class="tread-rider" style="transform:translate(var(--tread-x, 0px), var(--tread-y, 0px))">${worker("carrier", x0 - 6, 0, { flip: true, seed: "stair-carrier" })}</g>`);
    }
    st += station("signed-off built", worker("sitter", xe - 7, -H, { seed: "stair-sitter" }));
  }
  return { id: "stair", n: steps, x0, g, r, setout, leaning: courses, marks, stations: st };
}

/* BRIDGE: a truss on two banks. Built from both banks toward the middle. */
export function bridge({ x0 = 140, span = 280, panels = 8, depth = 30, deckY = -6, floor = 26, rev = "" } = {}) {
  const bankL = x0 + 9, bankR = x0 + span - 9;
  const p = span / panels, xs = (i) => x0 + i * p, b = deckY, t = deckY - depth;
  const xc = x0 + span / 2;
  const sagAt = (x, amount) => amount * (1 - ((x - xc) / (span / 2)) ** 2);
  const P = (i, y, sag) => `${n(xs(i))} ${n(y + sagAt(xs(i), sag))}`;
  const panelPath = (i, sag) => {
    let d = `M${P(i, b, sag)}L${P(i + 1, b, sag)}M${P(i, b - 3, sag)}L${P(i + 1, b - 3, sag)}`;
    if (i === 0) d += `M${P(0, b - 3, sag)}L${P(1, t, sag)}L${P(1, b - 3, sag)}`;
    else if (i === panels - 1) d += `M${P(panels, b - 3, sag)}L${P(panels - 1, t, sag)}`;
    else {
      d += `M${P(i, t, sag)}L${P(i + 1, t, sag)}`;
      if (i + 1 < panels - 1 || true) d += `M${P(i + 1, t, sag)}L${P(i + 1, b - 3, sag)}`;
      d += i < panels / 2 ? `M${P(i, t, sag)}L${P(i + 1, b - 3, sag)}` : `M${P(i + 1, t, sag)}L${P(i, b - 3, sag)}`;
    }
    return d;
  };
  const order = [];
  for (let k = 0; k < panels / 2; k++) order.push(k, panels - 1 - k);
  let courses = "", inside = "";
  for (let i = 0; i < panels; i++) {
    const rank = order.indexOf(i);
    courses += `<g class="c" style="--i:${rank}"><path class="sag" data-d0="${panelPath(i, 0)}" data-d1="${panelPath(i, 10)}" d="${panelPath(i, 0)}"/></g>`;
    inside += panelPath(i, 0);
  }
  const outline = `M${xs(0)} ${b}L${xs(1)} ${t}H${xs(panels - 1)}L${xs(panels)} ${b}Z`;
  const setout = `<path d="${outline}" stroke-dasharray="${SET_OUT}"/><path class="faint" d="${inside}"/>`;
  // Bearings and the banks' masonry faces: ground works, always there.
  const fixed = `<path class="paper" d="M${bankL - 18} ${b}H${bankL}V0H${bankL - 18}Z"/><path class="paper" d="M${bankR} ${b}H${bankR + 18}V0H${bankR}Z"/>`;
  const cut = `M0 0H${bankL}L${bankL + 22} ${floor}H${bankR - 22}L${bankR} 0H9999`;
  // Falsework under the middle while it is going up.
  const fw = (xa) => `<path class="std" d="M${xa} ${floor}V${b}M${xa + 20} ${floor}V${b}"/><path class="lift c" style="--i:0;--j:1" d="M${xa - 2} ${floor - 14}H${xa + 22}"/><path class="lift c" style="--i:0;--j:2" d="M${xa - 2} ${floor - 28}H${xa + 22}"/><path class="std" d="M${xa} ${floor}L${xa + 20} ${b}"/>`;
  const scaf = `<g class="ink temp">${fw(xc - 50)}${fw(xc + 30)}</g>`;
  const mid = xs(panels / 2);
  const marks = tickMark(xs(panels) + 6, t - 6) +
    cloudMark([mid - p * 0.75, t - 9, p * 1.5, 16], [mid + p * 0.75 + 15, t - 13], rev) +
    `<g class="mk ink" data-st="out-of-true"><path class="temp" d="M${xs(0) - 6} ${b}H${xs(panels) + 6}M${xs(0) - 6} ${b - 5}V${b + 3}M${xs(panels) + 6} ${b - 5}V${b + 3}"/></g>`;
  const ground = `<path class="gnd" d="${cut}"/>`;
  const under = hatch(bankL - 56, bankL - 8) + hatch(bankL + 34, bankR - 22, floor + 3) + hatch(bankR + 22, bankR + 70);
  return { id: "bridge", n: panels, ground, under, setout, fixed, leaning: courses, scaffold: scaf, marks, stations: "" };
}

/* TIN CAN LINE: two posts, a can on each, a string between. */
export function tincan({ pl = 140, pr = 420, h = 50, crewAt = 22 } = {}) {
  const post = (x, dir) => `<path class="paper" d="M${x} 0V${-h}H${x + 3}V0Z"/><path d="M${x - 1} ${-h}H${x + 4}"/><path d="M${dir > 0 ? x + 3 : x} -44h${dir * 6}v3.5" />`;
  const can = (x) => `<path class="paper" d="M${x} -40H${x + 6}V-35H${x}Z"/><path d="M${x + 1.2} -40V-35" opacity="0.5"/>`;
  const L = [pl + 12, -37.5], Lc = [pl + crewAt + 15, -37.5], R = [pr - 12, -37.5];
  const setout = `<path d="M${pl} 0V${-h}H${pl + 3}V0M${pr - 3} 0V${-h}H${pr}V0" stroke-dasharray="${SET_OUT}"/><path class="faint" d="M${L[0]} -37.5L${R[0]} -37.5"/>`;
  const fixed = `<g class="c" style="--i:0">${post(pl, 1)}</g><g class="c" style="--i:1">${post(pr - 3, -1)}${can(pr - 12)}</g>`;
  const marks = tickMark(pr + 8, -h - 6) + cloudMark([pr - 22, -50, 26, 22], [pr + 12, -58], "") +
    `<g class="mk ink" data-st="out-of-true"><path class="temp true-line" d="M${Lc[0]} -37.5L${R[0]} -37.5"/></g>`;
  const rest = `<g class="rest-off">${can(pl + 6)}</g>`;
  const st = station("set-out rising built signed-off revised out-of-true", worker("caller", pl + crewAt, 0, { flip: true, seed: "tincan-caller" }));
  return { id: "tincan", n: 2, L, Lc, R, setout, fixed, leaning: "", marks, rest, stations: st };
}

/* DOOR FRAME: a door frame on its own, the door ajar. Not found. */
export function doorframe({ cx = 210, rev = "" } = {}) {
  const ox0 = cx - 18, ox1 = cx + 18, otop = -62, ix0 = cx - 13, ix1 = cx + 13, itop = -57;
  const step = `<path class="paper" d="M${cx - 24} 0V-3H${cx + 24}V0Z"/>`;
  const jambs = `<path class="paper" fill-rule="evenodd" d="M${ox0} -3V${otop + 5}H${ox1}V-3ZM${ix0} -3V${itop}H${ix1}V-3Z"/>`;
  const props = `<path class="temp" d="M${ox0} -30L${ox0 - 22} 0M${ox0 - 24} -1V4M${ox1} -30L${ox1 + 22} 0M${ox1 + 24} -1V4"/>`;
  const head = `<path class="paper" d="M${ox0 - 3} ${otop + 5}V${otop}H${ox1 + 3}V${otop + 5}Z"/>`;
  // 26 across, swung toward us to about 70 degrees: a third of the face
  // shows, then the leaf's own edge, then the opening, clearly wider than the
  // leaf so it cannot read as the second half of a pair. Hinges on the jamb.
  const lw = 9, te = 2.6;
  const leaf = `<path class="paper" d="M${ix0} -3V${itop}H${ix0 + lw}V-3Z"/><path class="paper" d="M${ix0 + lw} -3V${itop}H${ix0 + lw + te}V-3Z"/><path d="M${ix0 + 1.8} ${itop + 5}H${ix0 + lw - 1.8}V${itop + 24}H${ix0 + 1.8}ZM${ix0 + 1.8} ${itop + 29}H${ix0 + lw - 1.8}V-9H${ix0 + 1.8}Z" opacity="0.4"/><circle cx="${ix0 + lw - 2}" cy="-30" r="1"/><path d="M${ix0 - 1} ${itop + 7}v5M${ix0 - 1} -16v5" style="stroke-width:1.4"/>`;
  const stepCourse = `<g class="c" style="--i:0">${step}</g>`;
  const courses = `<g class="c" style="--i:1">${props}${jambs}</g><g class="c" style="--i:2">${head}</g><g class="c" style="--i:3">${leaf}</g>`;
  const setout = `<path d="M${ox0 - 3} -3V${otop}H${ox1 + 3}V-3" stroke-dasharray="${SET_OUT}"/><path class="faint" d="M${cx - 24} -3H${cx + 24}M${ix0} -3V${itop}H${ix1}V-3M${ix0 + lw} -3V${itop}"/>`;
  const ladder = `<g class="ink temp"><path class="std" d="M${ox1 + 30} 0L${ox1 + 4} -62M${ox1 + 36} 0L${ox1 + 10} -62"/>${[1, 2, 3, 4, 5, 6, 7].map((k) => { const t = k / 8; return `<path d="M${n(ox1 + 30 - 26 * t)} ${n(-62 * t)}h6"/>`; }).join("")}</g>`;
  const bx = ox1 + 12 + (-otop - 3) * Math.tan((4 * Math.PI) / 180), by = otop + 3;
  const leaning = courses + `<g class="mk ink" data-st="out-of-true"><path d="M${ox1} ${otop}H${ox1 + 12}V${otop + 3}"/></g>`;
  const marks = tickMark(ox1 + 9, otop - 6) + cloudMark([ix0 - 3, itop + 1, lw + 7, 52], [ix0 + lw + 30, itop + 8], rev) + plumbMark(bx, by, -by - 24, 7, 17);
  const guides = `<path class="ink faint" d="M0 0H9999M0 -45H9999" stroke-dasharray="2 5"/>`;
  return { id: "door", n: 4, setout, fixed: stepCourse, leaning, lean: { pivot: [ox1, -3], angle: 4 }, scaffold: ladder, marks, guides, stations: "" };
}

/* ===========================================================================
   RAMP: the /work hero's haul, with a dressed stone where the window was.
   Uploads and imports. The rig moves up the 9 degree ramp in heaves.
   =========================================================================== */
export function rampGeo({ foot = 24, deg = 9 } = {}) {
  const C = Math.cos((deg * Math.PI) / 180), S = Math.sin((deg * Math.PI) / 180);
  return {
    foot, deg,
    on: (d, hh = 0) => [foot + d * C - hh * S, -(d * S + hh * C)],
    along: (d) => [d * C, -d * S],
  };
}
export function ramp({ foot = 24, sledge = 144, load = { at: 160, w: 100, h: 58, lift: 6 }, pusher = 145, haulers = [352, 410, 468], travel = 120, bollard = 560, lettered = "to the server", W = 600, plate = false } = {}) {
  const G = rampGeo({ foot });
  const top = -(load.lift + load.h);
  const prowAlong = sledge + 165, prowH = 19;
  const local = (inner) => `<g transform="translate(${foot} 0) rotate(${-G.deg})">${inner}</g>`;
  const ground = `<path class="ink" d="M${foot} 0H${foot + 168}" stroke-dasharray="4 5" opacity="0.7"/><path class="ink" d="M${foot + 120} 0A120 120 0 0 0 ${n(G.on(120)[0])} ${n(G.on(120)[1])}" opacity="0.7"/><text class="fig" x="${foot + 137}" y="-7" text-anchor="middle">9°</text>`;
  const rampLine = local(`<path class="ink" d="M0 0H1400"/>${(() => { let d = ""; for (let i = 0; i < 88; i++) d += `M${70 + i * 16} 3l-6 7`; return `<path class="ink faint" d="${d}"/>`; })()}`);
  // A block of limestone: its beds run across the face as broken lines, at
  // the faint step, seeded so each size of stone is drawn the same way every
  // time. A margin round the face read as a picture frame.
  const beds = (() => {
    const r = rng(seedFrom(`stone${load.w}x${load.h}`));
    const x0 = load.at + 5, x1 = load.at + load.w - 5;
    let d = "";
    [0.3, 0.55, 0.78].forEach((f) => {
      const y = n(top + load.h * f + (r() - 0.5) * 3);
      let x = x0 + r() * 10;
      while (x < x1 - 6) {
        const len = Math.min(x1 - x, 10 + r() * 26);
        d += `M${n(x)} ${y}h${n(len)}`;
        x += len + 4 + r() * 9;
      }
    });
    return d;
  })();
  const stone = (cls) => `<g class="${cls}"><rect class="paper" x="${load.at}" y="${top}" width="${load.w}" height="${load.h}"/><path class="faint" d="${beds}"/></g>`;
  const sledgePath = `<path class="ink paper" d="M${sledge} -1h152c10 0 15 -7 16 -18h-6c-1 8 -6 13 -14 13h-148Z"/>`;
  const rigLocal = local(`${sledgePath}
    <g class="L-setout ink"><rect x="${load.at}" y="${top}" width="${load.w}" height="${load.h}" stroke-dasharray="${SET_OUT}"/><path class="faint" d="${beds}"/></g>
    <g class="ink load-built xfade">${stone("")}</g>
    <g class="chain-g ink xfade" style="opacity:0"><path class="chainline" d="${chain(load.at, top - 16, load.at + load.w, top - 16, 20)}" opacity="0.85"/><text class="fig size-fig" x="${load.at + load.w / 2}" y="${top - 12.5}" text-anchor="middle"></text></g>
    ${tickMark(load.at + load.w + 7, top + 12)}`);
  const hands = haulers.map((d) => { const [x, y] = G.on(d); return [x - 9, y - 25]; });
  const prow = G.on(prowAlong, prowH);
  const [lx, ly] = hands[hands.length - 1];
  const [ox, oy] = G.along(1400);
  const tautRope = `M${n(prow[0])} ${n(prow[1])}${hands.map(([x, y]) => `L${n(x)} ${n(y)}`).join("")}L${n(lx + ox)} ${n(ly + oy)}`;
  // Slack: off the prow and down onto the ramp, lying there past the gang.
  const lie = G.on(prowAlong + 70, 1.5), far = G.on(1400, 1.5);
  const slackRope = `M${n(prow[0])} ${n(prow[1])}Q${n(prow[0] + 30)} ${n(prow[1] + 16)} ${n(lie[0])} ${n(lie[1])}L${n(far[0])} ${n(far[1])}`;
  const trueLine = `M${n(prow[0])} ${n(prow[1])}L${n(hands[0][0])} ${n(hands[0][1])}`;
  const gang = station("set-out rising", worker("pusher", ...G.on(pusher), { flip: true, seed: "ramp-pusher" }) + haulers.map((d, i) => worker("hauler", ...G.on(d), { flip: true, seed: `ramp-hauler-${i}` })).join("")) +
    station("signed-off built revised", worker("sitter", ...G.on(sledge + 2, 1), { flip: true, seed: "ramp-sitter" }) + worker("leaner", ...G.on(haulers[0] + 6), { seed: "ramp-leaner" })) +
    station("out-of-true", worker("shrugger", ...G.on(haulers[0]), { seed: "ramp-shrug" }) + worker("leaner", ...G.on(haulers[1] + 10), { flip: true, seed: "ramp-leaner-2" }));
  const ropes = `<g class="ink">
      <g class="rest-on"><path class="rope-taut xfade" d="${tautRope}"/><path class="rope-slack xfade" d="${slackRope}" style="opacity:0"/></g>
      <g class="rest-off"><path class="rope-boll heave" d=""/></g>
    </g>
    <g class="mk ink" data-st="out-of-true"><path class="temp" d="${trueLine}"/></g>`;
  const B = G.on(bollard);
  const bollardMark = `<g class="ink rest-off"><path class="paper" d="M${n(B[0] - 3)} ${n(B[1])}V${n(B[1] - 12)}H${n(B[0] + 3)}V${n(B[1])}Z"/><path d="M${n(B[0] - 4.5)} ${n(B[1] - 12)}H${n(B[0] + 4.5)}M${n(B[0] - 3)} ${n(B[1] - 7)}L${n(B[0] + 3)} ${n(B[1] - 8.5)}M${n(B[0] - 3)} ${n(B[1] - 5)}L${n(B[0] + 3)} ${n(B[1] - 6.5)}"/></g>`;
  const note = G.on(haulers[0] - 40, 96);
  const lt = lettered ? letter(lettered, note[0], note[1], { angle: -G.deg, arrowAfter: true, seed: `ramp-${lettered}` }).svg : "";
  return { G, prow, prowAlong, prowH, bollard: B, travel, ground, rampLine, rigLocal, gang, ropes, bollardMark, lt, load, top };
}

