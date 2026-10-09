#!/usr/bin/env node
/* Builds skills/ostraca/engine.js: the engine (src/engine/*.js), the public
   API (src/index.js, without the library's own figures) and the styles, in
   one ESM file with no imports. The skill folder uses it to check and draw a
   single figure file outside this repo, with only Node and Chrome.

   The file carries ENGINE_HASH, a hash of the sources it was built from.
   scripts/check.mjs recomputes it and fails when the bundle is stale, so
   run this after any change under src/engine/, src/index.js or
   src/styles.css. It also copies the two worked examples (inbox, laptop)
   into skills/ostraca/examples/, and check fails when those copies drift.

   Usage: node scripts/bundle-skill.mjs */
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const BUNDLE = join(ROOT, "skills/ostraca/engine.js");

// Module id -> source path. The ids are what the rewritten imports ask for.
const MODULES = {
  svg: "src/engine/svg.js",
  poses: "src/engine/poses.js",
  lettering: "src/engine/lettering.js",
  marks: "src/engine/marks.js",
  figure: "src/engine/figure.js",
  compose: "src/engine/compose.js",
  index: "src/index.js",
};
const STYLES = "src/styles.css";
// The worked examples the skill points at, copied in beside the engine.
export const EXAMPLES = { "inbox.js": "src/figures/messages/inbox.js", "laptop.js": "src/figures/devices/laptop.js" };

/** Example copies in the skill that differ from the library's files. */
export function staleExamples() {
  return Object.entries(EXAMPLES).filter(([to, from]) => {
    try { return readFileSync(join(ROOT, "skills/ostraca/examples", to), "utf8") !== readFileSync(join(ROOT, from), "utf8"); } catch { return true; }
  }).map(([to]) => to);
}

/** The hash of every source the bundle is built from, in a fixed order. */
export function engineHash() {
  const h = createHash("sha256");
  for (const p of [...Object.values(MODULES), STYLES]) h.update(`${p}\n`).update(readFileSync(join(ROOT, p)));
  return h.digest("hex").slice(0, 16);
}

/** The hash written into the bundle on disk, or null. */
export function bundledHash() {
  try {
    return readFileSync(BUNDLE, "utf8").match(/export const ENGINE_HASH = "([0-9a-f]+)"/)?.[1] ?? null;
  } catch {
    return null;
  }
}

const idOf = (spec) => {
  const base = spec.replace(/^.*\//, "").replace(/\.js$/, "");
  if (spec.includes("figures/")) return null; // the library's figures stay out
  if (!(base in MODULES)) throw new Error(`bundle: unknown import "${spec}"`);
  return base;
};
const names = (list) => list.split(",").map((s) => s.trim()).filter(Boolean).map((s) => s.split(/\s+as\s+/));

/* Rewrites one ESM module into the body of a function that fills `__x`
   with its exports. Only the import and export forms the engine uses are
   handled; anything else throws, so a new form is caught at build time. */
function rewrite(id, src) {
  const exported = [];
  let out = src
    .replace(/^import \* as (\w+) from "([^"]+)";/gm, (_, k, p) => {
      const m = idOf(p);
      return m ? `const ${k} = __req("${m}");` : `const ${k} = {};`;
    })
    .replace(/^import \{([^}]+)\} from "([^"]+)";/gm, (_, list, p) =>
      `const { ${names(list).map(([a, b]) => (b ? `${a}: ${b}` : a)).join(", ")} } = __req("${idOf(p)}");`)
    .replace(/^export \* from "([^"]+)";/gm, (_, p) => `__star.push(__req("${idOf(p)}"));`)
    .replace(/^export \{([^}]+)\} from "([^"]+)";/gm, (_, list, p) =>
      names(list).map(([a, b]) => `__x.${b ?? a} = __req("${idOf(p)}").${a};`).join("\n"))
    .replace(/^export \{([^}]+)\};/gm, (_, list) => {
      for (const [a, b] of names(list)) exported.push([a, b ?? a]);
      return "";
    })
    .replace(/^export (const|let|function\*?|async function|class) (\w+)/gm, (_, kw, name) => {
      exported.push([name, name]);
      return `${kw} ${name}`;
    });
  if (/^\s*(import|export)\b/m.test(out)) throw new Error(`bundle: ${id} has an import or export form the bundler does not handle`);
  out += `\n${exported.map(([a, b]) => `__x.${b} = ${a};`).join("\n")}`;
  return `__defs.${id} = (__x, __star) => {\n${out.trim()}\n};`;
}

async function build() {
  const hash = engineHash();
  const api = Object.keys(await import(pathToFileURL(join(ROOT, MODULES.index)).href)).sort();
  const css = readFileSync(join(ROOT, STYLES), "utf8");
  const bodies = Object.entries(MODULES).map(([id, p]) => rewrite(id, readFileSync(join(ROOT, p), "utf8")));
  const file = `/* Ostraca engine, bundled for the agent skill. Do not edit: this file is
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

${bodies.join("\n\n")}

const __api = __req("index");
export const { ${api.join(", ")} } = __api;
/** The figure styles (src/styles.css), for pages that draw figures. */
export const STYLES = ${JSON.stringify(css)};
/** A hash of the sources this file was built from. */
export const ENGINE_HASH = "${hash}";
`;
  writeFileSync(BUNDLE, file);
  for (const [to, from] of Object.entries(EXAMPLES)) copyFileSync(join(ROOT, from), join(ROOT, "skills/ostraca/examples", to));
  // Prove the bundle loads and exposes the same API.
  const b = await import(`${pathToFileURL(BUNDLE).href}?${hash}`);
  const missing = api.filter((k) => !(k in b));
  if (missing.length) throw new Error(`bundle: missing ${missing.join(", ")}`);
  console.log(`bundle: skills/ostraca/engine.js, ${api.length} exports, hash ${hash}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await build();
