#!/usr/bin/env node
/* Checks one Ostraca figure file against the library's rules. Needs only
   Node 18 or later and engine.js beside this script.

   Usage: node check.mjs path/to/figure.js [--quiet]

   It renders the figure in all six states, crew off and on, mirrored and
   with no loading value, and fails (exit 1) on anything that breaks a rule:
   invalid SVG, a colour or fill, a gradient or filter, <text> outside a
   dimension figure, a part missing, a revise box outside the frame, an
   unknown pose, state code, a dash in the copy, a file over 180 lines.
   Warnings (exit 0) point at things to look for on the sheet. */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { define, render, inspect, STATES, POSE_NAMES } from "./engine.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const quiet = args.includes("--quiet");
if (!file) { console.error("usage: node check.mjs path/to/figure.js"); process.exit(2); }

const MAX_LINES = 180;
const BANNED = ["drum", "truck", "weighbridge", "jerrycan", "tank", "oil"];
const failures = [], warnings = [];
const fail = (where, msg) => failures.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

/* A small XML reader: enough to prove the markup is well formed and to
   hand back every element with its attributes. */
function parseXml(src) {
  const els = [], stack = [];
  const re = /<!--[\s\S]*?-->|<\/([A-Za-z][\w:-]*)\s*>|<([A-Za-z][\w:-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>|<|&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g;
  let m, root = null;
  while ((m = re.exec(src))) {
    if (m[0].startsWith("<!--")) continue;
    if (m[0] === "<") throw new Error(`stray "<" at ${m.index}: ${src.slice(m.index, m.index + 40)}`);
    if (m[0] === "&") throw new Error(`bare "&" at ${m.index}`);
    if (m[1]) {
      const open = stack.pop();
      if (!open || open.name !== m[1]) throw new Error(`</${m[1]}> closes <${open?.name ?? "nothing"}>`);
      continue;
    }
    const attrs = {};
    for (const a of m[3].matchAll(/([\w:-]+)="([^"]*)"/g)) {
      if (a[1] in attrs) throw new Error(`<${m[2]}> repeats ${a[1]}`);
      attrs[a[1]] = a[2];
    }
    const el = { name: m[2], attrs };
    els.push(el);
    if (!root) root = el;
    else if (!stack.length) throw new Error("more than one root element");
    if (!m[4]) stack.push(el);
  }
  if (stack.length) throw new Error(`<${stack[stack.length - 1].name}> is never closed`);
  if (!root || root.name !== "svg") throw new Error("the root element is not <svg>");
  return els;
}

const classes = (el) => (el.attrs.class || "").split(/\s+/);
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color)\(|\b(?:black|white|red|blue|green|gray|grey)\b/;

function checkSvg(where, fig, svg) {
  let els;
  try { els = parseXml(svg); } catch (e) { fail(where, `invalid SVG: ${e.message}`); return; }
  const vb = `0 ${-fig.height} ${fig.width} ${fig.height + fig.depth}`;
  if (els[0].attrs.viewBox !== vb) fail(where, `viewBox is "${els[0].attrs.viewBox}", expected "${vb}"`);
  for (const el of els) {
    for (const [k, v] of Object.entries(el.attrs)) {
      if (/\bNaN\b|\bundefined\b|\bnull\b|Infinity/.test(v)) fail(where, `<${el.name} ${k}="${v.slice(0, 60)}"> carries NaN, undefined, null or Infinity`);
      if (k === "fill" && v !== "none") fail(where, `<${el.name}> fill="${v}": class="paper" is the only fill`);
      if (k === "stroke-width") fail(where, `<${el.name}> stroke-width: one line weight; use opacity for secondary detail`);
      if (k === "style") {
        const f = v.match(/(?:^|;)\s*fill\s*:\s*([^;]+)/);
        if (f && !/^(none|var\(--ostraca-paper\))$/.test(f[1].trim())) fail(where, `<${el.name}> style fill "${f[1]}"`);
      }
      if (["fill", "stroke", "color", "style", "stop-color"].includes(k) && COLOUR.test(v.replace(/var\(--[\w-]+\)/g, "").replace(/currentColor/g, "")))
        fail(where, `<${el.name} ${k}="${v.slice(0, 60)}"> names a colour; the layers set the inks`);
    }
    if (el.name === "text" && !classes(el).some((c) => c === "fig" || c === "lt-font"))
      fail(where, "<text> outside a dimension figure; letter words with letter()");
    if (["linearGradient", "radialGradient", "pattern", "filter", "image", "foreignObject", "script", "mask"].includes(el.name)) fail(where, `<${el.name}> is not allowed`);
  }
  const lower = svg.toLowerCase().replace(/<path[^>]*>/g, "");
  for (const w of BANNED) if (new RegExp(`\\b${w}\\b`).test(lower)) fail(where, `the word "${w}" is in the markup`);
}

const inside = (fig, [x, y], padX = 0) => x - padX >= 0 && x + padX <= fig.width && y >= -fig.height && y <= fig.depth;

function checkParts(where, fig, p) {
  if (!p.outline) fail(where, "no outline: draw the set-out yourself, dashed with SET_OUT, still courses included");
  if (!p.foot) fail(where, "no foot");
  const [x, y, w, h] = p.revise;
  if (x < 0 || y < -fig.height || x + w > fig.width || y + h > fig.depth) fail(where, `revise box [${p.revise}] runs outside the viewBox`);
  if (!inside(fig, p.tick)) fail(where, `tick [${p.tick}] lands outside the viewBox`);
  if (!inside(fig, p.tag, 12)) warn(fig.name, `tag [${p.tag}] is within 12 of the frame; a long version will be cut`);
  for (const [st, list] of Object.entries(p.stations))
    for (const s of list) {
      if (!POSE_NAMES.includes(s.pose)) fail(where, `station ${st} uses "${s.pose}", not one of ${POSE_NAMES.join(", ")}`);
      if (s.x < 0 || s.x > fig.width) fail(where, `station ${st} stands at x ${s.x}, outside the frame`);
      if (s.y - 45 < -fig.height && s.pose !== "sitter") warn(fig.name, `station ${st}: a ${s.pose} at y ${s.y} is 45 tall and its head leaves the frame`);
    }
  // In empty nothing is built, still courses included, so nobody can stand on
  // the work. Ground and fixed parts are always drawn, so they can carry a worker.
  if (!p.ground && !p.fixed)
    for (const s of p.stations.empty) if (s.y < 0) warn(fig.name, `the empty ${s.pose} stands at y ${s.y}; in empty nothing is built, so stand it on the ground`);
  for (const st of ["empty", "loading", "idle", "success", "changed", "error"])
    if (!p.stations[st]?.length) warn(fig.name, `no ${st} station; with crew on, that state has nobody`);
}

// The file itself: length, words, copy, state code, imports.
const path = resolve(file);
if (basename(path).startsWith("_")) { console.log(`check: ${basename(path)} is a helper file, not a figure; skipped`); process.exit(0); }
const src = readFileSync(path, "utf8");
const rel = basename(path);
const lines = src.split("\n").length;
if (lines > MAX_LINES) fail(rel, `${lines} lines, over ${MAX_LINES}`);
for (const w of BANNED) if (new RegExp(`\\b${w}\\b`, "i").test(src)) fail(rel, `the word "${w}"`);
if (/[\u2013\u2014]/.test(src)) fail(rel, "an en or em dash");
if (/opts\.state|\bstate\s*===?\s*["']/.test(src)) fail(rel, "state code: never branch on the state; the engine draws all six from your parts");
if (/<text\b(?![^>]*class="fig")/.test(src)) fail(rel, "<text> in the figure: letter words with letter(), numbers with dimension()");
for (const m of src.matchAll(/^import .* from "([^"]+)"/gm))
  if (!m[1].startsWith("./_")) fail(rel, `imports "${m[1]}"; take every helper from draw(ctx), or a ./_parts.js beside it`);
const desc = (await import(pathToFileURL(path).href)).default;
let fig;
try { fig = define(desc); } catch (e) { fail(rel, e.message); }
if (fig) {
  if (!/^[A-Z]/.test(fig.title) || /[A-Z]/.test(fig.title.slice(1)) && fig.title !== fig.title[0] + fig.title.slice(1).toLowerCase())
    warn(rel, `title "${fig.title}" should be sentence case`);
  if (/[\u2013\u2014]|\s-\s/.test(fig.title + fig.use)) fail(rel, "a dash in the title or use");
  if (/\.$/.test(fig.use)) fail(rel, "use ends with a full stop");
  if (basename(path, ".js") !== fig.name) warn(rel, `the file is not named after the figure ("${fig.name}.js")`);
}

let renders = 0;
if (fig) {
  const samples = fig.measures ? [null, 0, 1, fig.measures.sample] : [null];
  for (const sample of samples)
    for (const crew of [false, true])
      for (const state of STATES) {
        const figure = sample == null ? { value: 3, unit: "items" } : { value: sample, unit: fig.measures.unit };
        const opts = { state, crew, value: state === "loading" ? 0.5 : undefined, rev: "2.4.1", figure, lettered: "sent" };
        const where = `${fig.name} ${state}${crew ? " crew" : ""}${sample == null ? "" : ` figure ${sample}`}`;
        try {
          const { parts } = inspect(fig, opts);
          checkParts(where, fig, parts);
          checkSvg(where, fig, render(fig, opts));
          checkSvg(`${where} rtl`, fig, render(fig, { ...opts, dir: "rtl" }));
          checkSvg(`${where} no value`, fig, render(fig, { ...opts, value: undefined, decorative: true }));
          for (const v of [0, 1]) checkSvg(`${where} value ${v}`, fig, render(fig, { ...opts, value: v }));
          renders += 5;
        } catch (e) {
          fail(where, `threw: ${e.message}`);
        }
      }
}

// Inside the Ostraca repo, say when engine.js is older than the sources.
const bundler = join(HERE, "../../scripts/bundle-skill.mjs");
if (existsSync(bundler)) {
  const { engineHash, bundledHash } = await import(pathToFileURL(bundler).href);
  if (engineHash() !== bundledHash()) fail("engine.js", "stale; run node scripts/bundle-skill.mjs in the repo");
}

const uniq = (a) => [...new Set(a)];
if (!quiet && warnings.length) console.warn(uniq(warnings).map((w) => `  ! ${w}`).join("\n"));
if (failures.length) {
  console.error(uniq(failures).map((f) => `  x ${f}`).join("\n"));
  console.error(`check: ${uniq(failures).length} failure${uniq(failures).length === 1 ? "" : "s"} in ${rel}`);
  process.exit(1);
}
console.log(`check: ${rel}, ${renders} renders, all good${warnings.length ? `, ${uniq(warnings).length} warning${uniq(warnings).length === 1 ? "" : "s"}` : ""}`);
