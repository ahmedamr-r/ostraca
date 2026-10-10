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
       states?,         the states this figure draws (default all six). A figure
                        made for one screen can draw only that one, and then
                        only needs the parts that state uses (see NEEDS)
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
                parts drop under a taut string line). Error only.
     lean?      degrees for "lean" (default 6).
     string?    [[x0, y0], [x1, y1]] the taut line for "sag".
     revise     [x, y, w, h] the part the revision cloud goes round. Changed only.
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
import { POSE_NAMES } from "./poses.js";

export const STATES = ["idle", "empty", "loading", "success", "changed", "error"];
const STATION_KEYS = [...STATES, "waiting"];

/** The parts each state draws with, beyond courses. A figure that leaves a
    state out does not need that state's parts. */
export const NEEDS = {
  idle: [],
  empty: ["outline"],
  loading: ["outline", "access"],
  success: ["tick, or foot and top"],
  changed: ["revise"],
  error: ["outline", "error", "foot and top (lean)", "string (sag)"],
};

const fail = (name, msg) => {
  throw new Error(`ostraca: figure "${name}": ${msg}`);
};
const isPt = (p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);

/** Check a description's own fields (not the drawing) and fill defaults. */
export function defineFigure(d) {
  if (!d || typeof d !== "object") throw new Error("ostraca: a figure description must be an object");
  const name = d.name;
  if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) fail(name, "name must be kebab-case");
  for (const k of ["title", "shelf", "use"]) if (typeof d[k] !== "string" || !d[k]) fail(name, `${k} is required`);
  if (!(d.width > 0) || !(d.height > 0)) fail(name, "width and height must be positive");
  if (typeof d.draw !== "function") fail(name, "draw(ctx) is required");
  if (d.travel && !isPt(d.travel.by)) fail(name, "travel.by must be [dx, dy]");
  let states = STATES;
  if (d.states != null) {
    if (!Array.isArray(d.states) || !d.states.length) fail(name, "states must be a list of one or more states");
    for (const s of d.states) if (!STATES.includes(s)) fail(name, `states: "${s}" is not one of ${STATES.join(", ")}`);
    states = STATES.filter((s) => d.states.includes(s));
  }
  return Object.freeze({ depth: 22, ...d, states: Object.freeze(states) });
}

/** Check what draw() returned and fill its defaults. */
export function checkParts(fig, p) {
  const name = fig.name;
  if (!p || !Array.isArray(p.courses) || !p.courses.length) fail(name, "draw() must return courses");
  const courses = p.courses.map((c, i) => {
    const o = typeof c === "string" ? { svg: c, still: false } : c;
    if (!o || typeof o.svg !== "string") fail(name, `course ${i} is not svg`);
    return { svg: o.svg, still: !!o.still };
  });
  // Each state's parts are required only when the figure draws that state.
  const has = (s) => fig.states.includes(s);
  if (p.foot != null && !isPt(p.foot)) fail(name, "foot must be [x, y]");
  if (has("error")) {
    if (p.error !== "lean" && p.error !== "sag") fail(name, 'error must be "lean" or "sag"');
    if (p.error === "lean" && !isPt(p.foot)) fail(name, "foot must be [x, y]");
    if (p.error === "lean" && !Number.isFinite(p.top)) fail(name, "top must be a number");
    if (p.error === "sag" && !(Array.isArray(p.string) && p.string.every(isPt))) fail(name, "sag needs string [[x0, y0], [x1, y1]]");
  }
  if (has("success") && p.tick == null && (p.foot == null || p.top == null)) fail(name, "success needs tick, or foot and top");
  if (p.tick != null && !isPt(p.tick)) fail(name, "tick must be [x, y]");
  const rv = p.revise;
  if ((has("changed") || rv != null) && !(Array.isArray(rv) && rv.length === 4 && rv.every(Number.isFinite))) fail(name, "revise must be [x, y, w, h]");
  const stations = {};
  for (const k of STATION_KEYS) {
    // A worker for a state the figure does not draw is never seen: dropped.
    if (!has(k === "waiting" ? "loading" : k)) { stations[k] = []; continue; }
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
  if (a && has("loading") && a.kind === "scaffold" && !(isPt(p.foot) && Number.isFinite(p.top))) fail(name, "a scaffold needs foot and top");
  if (a && has("loading") && a.kind === "ladder" && !Number.isFinite(a.height ?? p.top)) fail(name, "a ladder needs height, or top");
  const [fx] = p.foot ?? [fig.width / 2, 0];
  return {
    ...p,
    courses,
    stations,
    error: has("error") ? p.error : null,
    lean: p.lean ?? 6,
    side: fx >= fig.width / 2 ? 1 : -1,
    tick: p.tick ?? (Number.isFinite(p.top) ? [fx + 6 * (fx >= fig.width / 2 ? 1 : -1), p.top - 7] : null),
    tag: p.tag ?? (rv ? [rv[0] + rv[2] + 18, rv[1] - 4] : null),
    letter: p.letter ?? { at: [Math.min(fx, 24), -fig.height + 18], angle: -2 },
  };
}
