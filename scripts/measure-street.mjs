#!/usr/bin/env node
/* Measures how far the visible drawing reaches left and right in each
   street figure on the home page, so the street can be laid tight on one
   ground line. Writes site/street.json, which build-site.mjs reads.
   Run it after changing STREET in site/street.mjs or a street figure.

   It measures the hero sheet's figures too (HERO in site/street.mjs), in
   every state they go through there, and writes how far each reaches left,
   right and up in any of them to site/hero.json, so the stage can crop to
   the drawing and give every figure the same scale.

     node scripts/measure-street.mjs [--port 9480] */
import { spawn } from "node:child_process";
import { writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { render, figures, STATES } from "../src/index.js";
import { STREET, HERO } from "../site/street.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const i = process.argv.indexOf("--port");
const PORT = i > 0 ? Number(process.argv[i + 1]) : 9480;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = join(ROOT, `.tmp/chrome-measure-${PORT}`);
rmSync(dir, { recursive: true, force: true });
const chrome = spawn("arch", ["-arm64", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, "--no-first-run", "about:blank"], { stdio: "ignore", detached: true });
const up = async () => { try { return (await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok; } catch { return false; } };
for (let k = 0; k < 80 && !(await up()); k++) await sleep(250);
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(list.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((res) => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });

const css = readFileSync(join(ROOT, "src/styles.css"), "utf8");
// The hero's states as client.js runs them, and the loading values the crew climbs through.
const heroOpts = (name) => {
  const draws = figures.find((f) => f.name === name).states || STATES;
  return draws.flatMap((state) => state === "loading" ? [0, 0.5, 1, undefined].map((value) => ({ state, value })) : [{ state, rev: state === "changed" ? "2.4" : undefined }]);
};
const drawn = [
  ...STREET.map(([name, o]) => ["street", name, { ...o, crew: true }]),
  ...HERO.flatMap((name) => heroOpts(name).map((o) => ["hero", name, { ...o, crew: true }])),
];
const html = `<style>${css} *{transition:none!important;animation:none!important}</style>` +
  drawn.map(([set, name, o]) => `<div data-set="${set}" style="width:600px">${render(name, o)}</div>`).join("");
await send("Runtime.evaluate", { expression: `document.body.innerHTML = ${JSON.stringify(html)}` });
await sleep(300);
const r = await send("Runtime.evaluate", { returnByValue: true, expression: `[...document.querySelectorAll("svg.ostraca")].map((svg) => {
  const inv = svg.getScreenCTM().inverse();
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
  for (const el of svg.querySelectorAll("path, line, rect, circle, ellipse, polygon, text")) {
    if (el.closest('[data-slot="ground"], title')) continue;
    let o = 1;
    for (let e = el; e && e !== svg; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === "none") { o = 0; break; } o *= +s.opacity; }
    if (o < 0.05) continue;
    const b = el.getBoundingClientRect();
    if (!b.width && !b.height) continue;
    const p = new DOMPoint(b.left, b.top).matrixTransform(inv), q = new DOMPoint(b.right, b.bottom).matrixTransform(inv);
    x0 = Math.min(x0, p.x, q.x); x1 = Math.max(x1, p.x, q.x); y0 = Math.min(y0, p.y, q.y);
  }
  return [svg.parentElement.dataset.set, svg.dataset.figure, Math.floor(x0), Math.ceil(x1), Math.floor(y0)];
})` });
const street = {}, hero = {};
for (const [set, n, a, b, top] of r.result.value) {
  if (set === "street") { street[n] = [a, b]; continue; }
  const h = hero[n] || [Infinity, -Infinity, Infinity];
  hero[n] = [Math.min(h[0], a), Math.max(h[1], b), Math.min(h[2], top)];
}
writeFileSync(join(ROOT, "site/street.json"), JSON.stringify(street, null, 2) + "\n");
writeFileSync(join(ROOT, "site/hero.json"), JSON.stringify(hero, null, 2) + "\n");
console.log({ street, hero });
ws.close();
try { process.kill(-chrome.pid); } catch { chrome.kill(); }
