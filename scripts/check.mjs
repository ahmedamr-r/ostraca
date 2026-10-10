#!/usr/bin/env node
/* Renders every figure in every state, crew off and on, and checks what
   comes out against the library's rules. Exit 1 on any failure.

   Usage: node scripts/check.mjs [--figure wall] [--quiet] */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { render, inspect, figures, STATES, POSE_NAMES } from "../src/index.js";
import { engineHash, bundledHash, staleExamples } from "./bundle-skill.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const FIG_DIR = join(ROOT, "src/figures");
const args = process.argv.slice(2);
const only = args.includes("--figure") ? args[args.indexOf("--figure") + 1] : null;
const MAX_LINES = 180;
const BANNED = ["drum", "truck", "weighbridge", "jerrycan", "tank", "oil"];
const failures = [];
const fail = (where, msg) => failures.push(`${where}: ${msg}`);

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
    const el = { name: m[2], attrs, parent: stack[stack.length - 1] ?? null, text: "" };
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
      if (k === "fill" && v !== "none") fail(where, `<${el.name}> fill="${v}": the paper class is the only fill`);
      if (k === "style") {
        const f = v.match(/(?:^|;)\s*fill\s*:\s*([^;]+)/);
        if (f && !/^(none|var\(--ostraca-paper\))$/.test(f[1].trim())) fail(where, `<${el.name}> style fill "${f[1]}"`);
      }
      if (["fill", "stroke", "color", "style", "stop-color"].includes(k) && COLOUR.test(v.replace(/var\(--[\w-]+\)/g, "").replace(/currentColor/g, "")))
        fail(where, `<${el.name} ${k}="${v.slice(0, 60)}"> names a colour; use the --ostraca-* tokens or currentColor`);
    }
    if (el.name === "text" && !classes(el).some((c) => c === "fig" || c === "lt-font"))
      fail(where, "<text> outside a dimension figure or the lettering's reader copy; letter words with letter()");
    if (["linearGradient", "radialGradient", "filter", "image", "foreignObject", "script"].includes(el.name)) fail(where, `<${el.name}> is not allowed`);
  }
  const lower = svg.toLowerCase().replace(/<path[^>]*>/g, "");
  for (const w of BANNED) if (new RegExp(`\\b${w}\\b`).test(lower)) fail(where, `the banned word "${w}" is in the markup`);
}

function checkParts(where, fig, parts) {
  if (!parts.outline) fail(where, "no outline: library figures draw their own set-out");
  if (!parts.foot) fail(where, "no foot");
  if (!parts.revise) fail(where, "no revise box");
  else {
    const [x, y, w, h] = parts.revise;
    if (x < 0 || y < -fig.height || x + w > fig.width || y + h > fig.depth) fail(where, `revise box [${parts.revise}] runs outside the viewBox`);
  }
  for (const [st, list] of Object.entries(parts.stations))
    for (const s of list) if (!POSE_NAMES.includes(s.pose)) fail(where, `station ${st} uses "${s.pose}", not one of ${POSE_NAMES.join(", ")}`);
}

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : f.endsWith(".js") && f !== "index.js" && !f.startsWith("_") ? [p] : [];
  });
}

// Figure files: length, banned words, copy.
for (const file of walk(FIG_DIR)) {
  const rel = relative(ROOT, file);
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n").length;
  if (lines > MAX_LINES) fail(rel, `${lines} lines, over ${MAX_LINES}`);
  for (const w of BANNED) if (new RegExp(`\\b${w}\\b`, "i").test(src)) fail(rel, `the banned word "${w}"`);
  if (/[–—]/.test(src)) fail(rel, "an en or em dash");
}

const list = figures.filter((f) => !only || f.name === only);
if (only && !list.length) { console.error(`check: no figure "${only}"`); process.exit(1); }
let renders = 0;
for (const { name } of list) {
  for (const crew of [false, true]) {
    for (const state of STATES) {
      const opts = { state, crew, value: state === "loading" ? 0.5 : undefined, rev: "2.4", figure: { value: 3, unit: "files" }, lettered: "sent" };
      const where = `${name} ${state}${crew ? " crew" : ""}`;
      try {
        const { figure, parts } = inspect(name, opts);
        if (/^[a-z]/.test(figure.title) || /[–—]/.test(figure.title + figure.use)) fail(name, "title in sentence case, no dashes in title or use");
        if (figure.states.length < STATES.length) fail(name, `draws only ${figure.states.join(", ")}: library figures draw all six states`);
        checkParts(where, figure, parts);
        checkSvg(where, figure, render(name, opts));
        checkSvg(`${where} rtl`, figure, render(name, { ...opts, dir: "rtl" }));
        checkSvg(`${where} no value`, figure, render(name, { ...opts, value: undefined, decorative: true }));
        renders += 3;
      } catch (e) {
        fail(where, `threw: ${e.message}`);
      }
    }
  }
}

// The skill's bundled engine must be built from the sources as they are now.
const built = bundledHash(), want = engineHash();
if (built !== want) fail("skills/ostraca/engine.js", built ? `stale (built from ${built}, sources are ${want}); run node scripts/bundle-skill.mjs` : "missing; run node scripts/bundle-skill.mjs");
for (const f of staleExamples()) fail(`skills/ostraca/examples/${f}`, "differs from the library's file; run node scripts/bundle-skill.mjs");

const unique = [...new Set(failures)];
if (unique.length) {
  console.error(unique.map((f) => `  x ${f}`).join("\n"));
  console.error(`check: ${unique.length} failure${unique.length === 1 ? "" : "s"} in ${list.length} figure${list.length === 1 ? "" : "s"}`);
  process.exit(1);
}
console.log(`check: ${list.length} figure${list.length === 1 ? "" : "s"}, ${renders} renders, all good`);
