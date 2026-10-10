#!/usr/bin/env node
/* The README cover: a drawing sheet with the step pyramid from
   scripts/cover/pyramid.js stuck in loading, one block to go, a deck chair
   beside it for whoever is waiting, and a title strip that says how long. One PNG per theme, 1280 by 640 at 2x, so
   it also serves as the repo's social preview.

     node scripts/cover.mjs [--port 9490]   writes .github/cover-light.png and cover-dark.png

   Chrome as in sheet.mjs: $CHROME, else Google Chrome on macOS, else
   google-chrome on the PATH. Motion is emulated as reduced, so the
   drawing is shot at rest. */
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { cpus } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { define, render } from "../src/index.js";
import pyramid from "./cover/pyramid.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const i = process.argv.indexOf("--port");
const port = i > 0 ? Number(process.argv[i + 1]) : 9490;
const W = 1280, H = 640;
define(pyramid);

// The sheet, in CSS pixels. K is pixels per drawing unit. Each figure in
// SCENE stands on GROUND with drawing x `at` placed at pixel `px`.
const FRAME = 20, STRIP = 78, GROUND = 498, K = 2.25;
const SCENE = [
  ["pyramid", { state: "loading", value: 0.85 }, 120, 575],  // its centre line
  ["deck-chair", { state: "idle" }, 50, 868],                // the sitter's feet
];
const BLOCK = [
  ["Project", "Step pyramid"],
  ["State", "loading"],
  ["Started", "2670 BC"],
  ["To go", "one block"],
  ["ETA", "any minute now"],
  ["Supervisor", "you, on a break"],
];

function page(theme) {
  const art = SCENE.map(([name, opts, at, px]) => {
    const svg = render(name, { ...opts, crew: true, decorative: true });
    const [, top, w, h] = svg.match(/viewBox="([^"]+)"/)[1].split(" ").map(Number);
    return `<div class="art" style="left:${px - at * K}px;top:${GROUND + top * K}px;width:${w * K}px;height:${h * K}px">${svg}</div>`;
  }).join("");
  const font = (f) => pathToFileURL(join(ROOT, "site/fonts", f)).href;
  const css = pathToFileURL(join(ROOT, "src/styles.css")).href;
  return `<!doctype html><html style="color-scheme:${theme}"><head><meta charset="utf-8"><link rel="stylesheet" href="${css}">
<style>
@font-face { font-family: "Cubit Sans"; src: url("${font("CubitSans-Variable.woff2")}") format("woff2"); font-weight: 100 900; }
@font-face { font-family: "Cubit Mono"; src: url("${font("CubitMono-Variable.woff2")}") format("woff2"); font-weight: 100 900; }
:root {
  --ink: light-dark(oklch(28% 0.02 72), oklch(93% 0.004 307));
  --notes: light-dark(oklch(52% 0.09 243), oklch(80% 0.075 243));
  --rule: light-dark(oklch(57% 0.09 243 / 0.32), oklch(100% 0 0 / 0.2));
  --rule-strong: light-dark(oklch(57% 0.09 243 / 0.7), oklch(100% 0 0 / 0.42));
}
* { box-sizing: border-box; }
body { margin: 0; width: ${W}px; height: ${H}px; position: relative; overflow: hidden; background: var(--ostraca-paper); color: var(--ink); font-family: var(--ostraca-sans); -webkit-font-smoothing: antialiased; }
.frame { position: absolute; inset: ${FRAME}px; border: 1px solid var(--rule-strong); }
.head { position: absolute; left: 64px; top: 52px; }
h1 { margin: 0; font-weight: 500; font-size: 104px; line-height: 1; letter-spacing: -0.035em; }
.lede { margin: 18px 0 0; font-size: 27px; line-height: 1.3; max-width: 470px; letter-spacing: -0.01em; }
.art { position: absolute; }
.art .gnd { display: none; }
.ground { position: absolute; left: ${FRAME}px; right: ${FRAME}px; top: ${GROUND - 1}px; height: 1px; background: var(--ostraca-ground); }
.strip { position: absolute; left: ${FRAME}px; right: ${FRAME}px; bottom: ${FRAME}px; height: ${STRIP}px; border-top: 1px solid var(--rule-strong); display: grid; grid-template-columns: 1.1fr 0.85fr 0.9fr 0.9fr 1.15fr 1.15fr; }
.strip > div { padding: 15px 18px 0; border-left: 1px solid var(--rule); }
.strip > div:first-child { border-left: 0; padding-left: 44px; }
.strip span { display: block; font: 500 13px/1 var(--ostraca-mono); letter-spacing: 0.09em; text-transform: uppercase; color: var(--notes); }
.strip b { display: block; margin-top: 10px; font-weight: 400; font-size: 23px; line-height: 1; letter-spacing: -0.01em; white-space: nowrap; }
</style></head><body>
<div class="frame"></div>
<div class="head"><h1>Ostraca</h1><p class="lede">Illustrations for every state your product is in, drawn by your agent.</p></div>
<div class="ground"></div>
${art}
<div class="strip">${BLOCK.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("")}</div>
</body></html>`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const up = async () => { try { return (await fetch(`http://127.0.0.1:${port}/json/version`)).ok; } catch { return false; } };

let chrome = null;
try {
  if (!(await up())) {
    const dir = join(ROOT, ".tmp", `chrome-cover-${port}`);
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
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: false });
  mkdirSync(join(ROOT, ".github"), { recursive: true });
  mkdirSync(join(ROOT, ".tmp"), { recursive: true });
  for (const theme of ["light", "dark"]) {
    const html = join(ROOT, ".tmp", `cover-${theme}.html`);
    writeFileSync(html, page(theme));
    await send("Page.navigate", { url: pathToFileURL(html).href });
    await sleep(600);
    await send("Runtime.evaluate", { expression: "document.fonts.ready", awaitPromise: true });
    await sleep(600);
    const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: W, height: H, scale: 1 } });
    const file = join(ROOT, ".github", `cover-${theme}.png`);
    writeFileSync(file, Buffer.from(shot.data, "base64"));
    console.log(`cover: ${file}`);
  }
  ws.close();
} finally {
  if (chrome) chrome.kill("SIGKILL");
}
