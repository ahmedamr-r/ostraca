#!/usr/bin/env node
/* Link previews for the figure sheets: one card per figure, drawn as a
   sheet like the README cover, with the figure signed off and its crew
   on site, its name, what it is for and its sheet number. 1200 by 630 at
   1.5x, so X, LinkedIn, Slack and the rest show it large.

     node scripts/og.mjs [--port 9491]   writes site/og/<name>.png

   The site build copies them to dist/og/, beside the README cover, which
   every other page uses. Chrome as in cover.mjs. Motion is emulated as
   reduced, so each drawing is shot at rest. */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { cpus } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { render, figures } from "../src/index.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const i = process.argv.indexOf("--port");
const port = i > 0 ? Number(process.argv[i + 1]) : 9491;
const W = 1200, H = 630;

// Sheet numbers in catalogue order, OS-101 onwards, as on the site.
const catalogue = JSON.parse(readFileSync(join(ROOT, "catalogue.json"), "utf8"));
const byName = new Map(figures.map((f) => [f.name, f]));
const shelfOf = new Map();
const ordered = catalogue.shelves.flatMap((s) => s.figures.map((f) => byName.get(f.name)).filter(Boolean).map((f) => (shelfOf.set(f.name, s.title), f)));
for (const f of figures) if (!ordered.includes(f)) ordered.push(f);

// The card, in CSS pixels. The figure stands on GROUND inside AREA, and what
// shows of it (not its whole frame, which leaves room for access and crew
// the state may not use) is made as big as fits.
const FRAME = 18, STRIP = 74, GROUND = 500, AREA = { x0: 560, w: 590, top: 64 };

// Runs in the card: measures every line that shows, in drawing units, and
// places the drawing so that much of it fills AREA with its ground on GROUND.
// A long low figure (the bridge, the ramp) may instead run the whole width
// under the words, if that draws it bigger.
const fit = `(() => {
  const art = document.querySelector(".art"), svg = art.querySelector("svg");
  const [, vy, vw] = svg.getAttribute("viewBox").split(" ").map(Number);
  art.style.width = vw + "px";
  const s0 = svg.getBoundingClientRect();
  const shown = (el) => { let o = 1; for (let e = el; e && e !== art; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === "none" || s.visibility === "hidden") return 0; o *= Number(s.opacity); } return o; };
  let x0 = Infinity, x1 = -Infinity, y0 = 0;
  for (const el of svg.querySelectorAll("path, line, rect, circle, ellipse, polyline, polygon")) {
    if (shown(el) < 0.01) continue;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    x0 = Math.min(x0, r.left - s0.left); x1 = Math.max(x1, r.right - s0.left); y0 = Math.min(y0, r.top - s0.top + vy);
  }
  const right = Math.min(${AREA.w} / (x1 - x0), ${GROUND - AREA.top} / -y0);
  const under = Math.min(${AREA.x0 + AREA.w - 58} / (x1 - x0), (${GROUND} - document.querySelector(".head").getBoundingClientRect().bottom - 32) / -y0);
  const K = Math.max(right, under), mid = under > right ? ${(58 + AREA.x0 + AREA.w) / 2} : ${AREA.x0 + AREA.w / 2};
  art.style.width = vw * K + "px";
  art.style.left = mid - ((x0 + x1) / 2) * K + "px";
  art.style.top = ${GROUND} + vy * K + "px";
})()`;

function page(f, k) {
  const svg = render(f.name, { state: "success", crew: true, decorative: true });
  const font = (file) => pathToFileURL(join(ROOT, "site/fonts", file)).href;
  const css = pathToFileURL(join(ROOT, "src/styles.css")).href;
  const strip = [["Drawing", f.title], ["State", "signed off"], ["Sheet", `OS-${101 + k}`], ["Online", `ostraca.ahmedamr.com/figures/${f.name}`]];
  return `<!doctype html><html style="color-scheme:light"><head><meta charset="utf-8"><link rel="stylesheet" href="${css}">
<style>
@font-face { font-family: "Cubit Sans"; src: url("${font("CubitSans-Variable.woff2")}") format("woff2"); font-weight: 100 900; }
@font-face { font-family: "Cubit Mono"; src: url("${font("CubitMono-Variable.woff2")}") format("woff2"); font-weight: 100 900; }
:root {
  --ink: oklch(28% 0.02 72); --muted: oklch(44% 0.021 72); --notes: oklch(52% 0.09 243);
  --rule: oklch(57% 0.09 243 / 0.32); --rule-strong: oklch(57% 0.09 243 / 0.7);
}
* { box-sizing: border-box; }
body { margin: 0; width: ${W}px; height: ${H}px; position: relative; overflow: hidden; background: var(--ostraca-paper); color: var(--ink); font-family: var(--ostraca-sans); -webkit-font-smoothing: antialiased; }
.frame { position: absolute; inset: ${FRAME}px; border: 1px solid var(--rule-strong); }
.head { position: absolute; left: 58px; top: 54px; width: 470px; }
.kicker { font: 500 15px/1 var(--ostraca-mono); letter-spacing: 0.09em; text-transform: uppercase; color: var(--notes); }
h1 { margin: 18px 0 0; font-weight: 500; font-size: 78px; line-height: 1; letter-spacing: -0.035em; }
.use { margin: 20px 0 0; font-size: 24px; line-height: 1.35; color: var(--muted); display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.art { position: absolute; left: 0; top: 0; }
.art .gnd { display: none; }
.ground { position: absolute; left: ${FRAME}px; right: ${FRAME}px; top: ${GROUND - 1}px; height: 1px; background: var(--ostraca-ground); }
.strip { position: absolute; z-index: 1; background: var(--ostraca-paper); left: ${FRAME}px; right: ${FRAME}px; bottom: ${FRAME}px; height: ${STRIP}px; border-top: 1px solid var(--rule-strong); display: grid; grid-template-columns: 1.15fr 0.9fr 0.75fr 2.4fr; }
.strip > div { padding: 14px 18px 0; border-left: 1px solid var(--rule); min-width: 0; }
.strip > div:first-child { border-left: 0; padding-left: 40px; }
.strip span { display: block; font: 500 12px/1 var(--ostraca-mono); letter-spacing: 0.09em; text-transform: uppercase; color: var(--notes); }
.strip b { display: block; margin-top: 10px; font-weight: 400; font-size: 21px; line-height: 1; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.strip > div:last-child b { font-family: var(--ostraca-mono); font-size: 17px; letter-spacing: 0; padding-top: 3px; }
</style></head><body>
<div class="frame"></div>
<div class="head"><div class="kicker">Ostraca · OS-${101 + k} · ${shelfOf.get(f.name) || f.shelf}</div><h1>${f.title}</h1><p class="use">${f.use}.</p></div>
<div class="ground"></div>
<div class="art">${svg}</div>
<div class="strip">${strip.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join("")}</div>
<script>${fit}</script>
</body></html>`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const up = async () => { try { return (await fetch(`http://127.0.0.1:${port}/json/version`)).ok; } catch { return false; } };

let chrome = null;
try {
  if (!(await up())) {
    const dir = join(ROOT, ".tmp", `chrome-og-${port}`);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const mac = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    const bin = process.env.CHROME || (process.platform === "darwin" ? mac : "google-chrome");
    const cargs = ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--allow-file-access-from-files", "about:blank"];
    const apple = process.platform === "darwin" && /Apple/.test(cpus()[0]?.model || "");
    chrome = apple && !process.env.CHROME ? spawn("arch", ["-arm64", bin, ...cargs], { stdio: "ignore" }) : spawn(bin, cargs, { stdio: "ignore" });
    for (let k = 0; k < 60 && !(await up()); k++) await sleep(250);
  }
  const target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0; const pending = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise((res) => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });

  await send("Page.enable");
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1.5, mobile: false });
  mkdirSync(join(ROOT, "site/og"), { recursive: true });
  mkdirSync(join(ROOT, ".tmp"), { recursive: true });
  const html = join(ROOT, ".tmp", "og.html");
  for (const [k, f] of ordered.entries()) {
    writeFileSync(html, page(f, k));
    await send("Page.navigate", { url: pathToFileURL(html).href });
    await sleep(300);
    await send("Runtime.evaluate", { expression: "document.fonts.ready", awaitPromise: true });
    await sleep(200);
    const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: W, height: H, scale: 1 } });
    writeFileSync(join(ROOT, "site/og", `${f.name}.png`), Buffer.from(shot.data, "base64"));
  }
  rmSync(html, { force: true });
  console.log(`og: ${ordered.length} cards -> site/og/`);
  ws.close();
} finally {
  if (chrome) chrome.kill("SIGKILL");
}
