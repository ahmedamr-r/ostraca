#!/usr/bin/env node
/* Contact sheets for one Ostraca figure file, through headless Chrome.
   Needs only Node 22 (for its global WebSocket) and Google Chrome or
   Chromium, plus engine.js beside this script.

   Usage:
     node sheet.mjs path/to/figure.js [--out dir] [--theme light|dark]
                    [--port 9222] [--motion]

   Writes <out>/<name>-light.png and <name>-dark.png (out defaults to a
   sheets/ folder beside the figure). Each sheet holds the six states at
   240px with the crew off and then on, and at 720px: loading at 0.5,
   error, loading with no value, changed with a long version and a word
   lettered, and the same mirrored.

   Chrome: $CHROME, else Google Chrome on macOS (under arch -arm64 on Apple
   silicon), else google-chrome or chromium on the PATH. With --port, a
   Chrome already listening there is reused. Otherwise the script starts
   its own headless Chrome on a free port with a throwaway profile, and
   stops only that one when it is done. Motion is emulated as
   reduced unless --motion, so each state is drawn at rest. */
import { writeFileSync, readFileSync, mkdirSync, rmSync, mkdtempSync, existsSync } from "node:fs";
import { spawn, execFileSync } from "node:child_process";
import { cpus, tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { define, render, STATES, STYLES } from "./engine.js";

const args = process.argv.slice(2);
const flag = (k, d) => { const i = args.indexOf(`--${k}`); return i < 0 ? d : args[i + 1]; };
const file = args.find((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--") && args[i - 1] !== "--motion"));
if (!file) { console.error("usage: node sheet.mjs path/to/figure.js [--out dir] [--port 9222]"); process.exit(2); }
if (typeof WebSocket === "undefined") { console.error("sheet: needs Node 22 or later (global WebSocket)"); process.exit(2); }
let port = Number(flag("port", 0)); // 0: start a Chrome of our own on a free port
const out = resolve(flag("out", join(dirname(resolve(file)), "sheets")));
const motion = args.includes("--motion");
const themes = flag("theme") ? [flag("theme")] : ["light", "dark"];
const fig = define((await import(pathToFileURL(resolve(file)).href)).default);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const up = async () => { try { return !!(await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).Browser; } catch { return false; } };

function chromeBin() {
  if (process.env.CHROME) return process.env.CHROME;
  const mac = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (process.platform === "darwin" && existsSync(mac)) return mac;
  for (const b of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
    try { execFileSync("which", [b], { stdio: "ignore" }); return b; } catch {}
  }
  throw new Error("sheet: no Chrome found; set CHROME to its path");
}

let chrome = null, profile = null;
async function startChrome() {
  if (port && (await up())) return; // a Chrome you started, reused and left running
  profile = mkdtempSync(join(tmpdir(), "ostraca-sheet-"));
  const bin = chromeBin();
  const cargs = ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--allow-file-access-from-files", "about:blank"];
  const apple = process.platform === "darwin" && /Apple/.test(cpus()[0]?.model || "") && !process.env.CHROME;
  chrome = apple ? spawn("arch", ["-arm64", bin, ...cargs], { stdio: "ignore" }) : spawn(bin, cargs, { stdio: "ignore" });
  // Chrome picks a free port and writes it to DevToolsActivePort.
  const portFile = join(profile, "DevToolsActivePort");
  for (let i = 0; i < 80; i++) {
    if (existsSync(portFile)) { port = Number(readFileSync(portFile, "utf8").split("\n")[0]); if (await up()) return; }
    await sleep(250);
  }
  throw new Error("sheet: Chrome did not start; set CHROME to its path");
}

async function connect() {
  const { webSocketDebuggerUrl } = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0; const pending = new Map();
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;
  return { send, evaluate, close: () => ws.close() };
}

function page(theme) {
  const sample = fig.measures ? { value: fig.measures.sample, unit: fig.measures.unit } : null;
  const cell = (opts, w, label) => `<figure style="width:${w}px"><div>${render(fig, { figure: sample, ...opts })}</div><figcaption>${label}</figcaption></figure>`;
  const row = (crew) => STATES.map((s) => cell({ state: s, crew, value: s === "loading" ? 0.5 : undefined, rev: s === "changed" ? "B" : "" }, 240, `${s}${crew ? ", crew" : ""}`)).join("");
  return `<!doctype html><html style="color-scheme:${theme}"><head><meta charset="utf-8">
<style>${STYLES}</style>
<style>
body { margin: 0; padding: 24px; background: var(--ostraca-paper); font: 13px/1.4 var(--ostraca-sans); color: var(--ostraca-label); width: max-content; }
h1 { font-size: 15px; font-weight: 500; margin: 0 0 16px; color: var(--ostraca-crew); }
.row { display: flex; gap: 16px; margin-bottom: 20px; align-items: flex-end; }
figure { margin: 0; } figcaption { margin-top: 6px; }
figure > div { outline: 1px solid color-mix(in oklab, var(--ostraca-ground) 50%, transparent); }
</style></head><body>
<h1>${fig.title}, ${fig.shelf} shelf. ${fig.use}.</h1>
<div class="row">${row(false)}</div>
<div class="row">${row(true)}</div>
<div class="row">${cell({ state: "loading", value: 0.5, crew: true }, 720, "loading at 0.5, crew")}${cell({ state: "error", crew: true, value: 0.5 }, 720, "error, crew")}</div>
<div class="row">${cell({ state: "loading", crew: true }, 720, "loading, no value, crew")}${cell({ state: "changed", crew: true, rev: "2.4.1", lettered: "draft" }, 720, "changed, rev 2.4.1, lettered, crew")}</div>
<div class="row">${cell({ state: "changed", crew: true, rev: "2.4.1", dir: "rtl" }, 720, "changed, rev 2.4.1, mirrored, crew")}${cell({ state: "empty", crew: true, dir: "rtl" }, 720, "empty, mirrored, crew")}</div>
</body></html>`;
}

try {
  await startChrome();
  const c = await connect();
  await c.send("Page.enable");
  await c.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: motion ? "no-preference" : "reduce" }] });
  await c.send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1.5, mobile: false });
  mkdirSync(out, { recursive: true });
  for (const theme of themes) {
    const html = join(out, `_${fig.name}-${theme}.html`);
    writeFileSync(html, page(theme));
    await c.send("Page.navigate", { url: pathToFileURL(html).href });
    await sleep(motion ? 3200 : 900);
    const [w, h] = await c.evaluate("[document.body.scrollWidth, document.body.scrollHeight]");
    const shot = await c.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
    const png = join(out, `${fig.name}-${theme}.png`);
    writeFileSync(png, Buffer.from(shot.data, "base64"));
    rmSync(html, { force: true });
    console.log(`sheet: ${png}`);
  }
  c.close();
} finally {
  if (chrome) chrome.kill("SIGKILL");
  if (profile) { await sleep(300); rmSync(profile, { recursive: true, force: true }); }
}
