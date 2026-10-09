#!/usr/bin/env node
/* Contact sheets through headless Chrome. For each figure, one PNG per
   theme: the six states with the crew off and on at 240px, then loading
   (value 0.5) and error at 720px.

   Usage:
     node scripts/sheet.mjs [--figure wall] [--shelf site] [--theme light|dark]
                            [--port 9470] [--out .tmp/sheets] [--motion]

   Chrome: $CHROME, else Google Chrome on macOS (under arch -arm64 on Apple
   silicon), else google-chrome on the PATH. If nothing answers on --port,
   the script starts its own Chrome with its own profile and stops it after.
   Motion is emulated as reduced unless --motion, so sheets are stable. */
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { cpus } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { render, figures, STATES } from "../src/index.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const flag = (k, d) => { const i = args.indexOf(`--${k}`); return i < 0 ? d : args[i + 1]; };
const port = Number(flag("port", 9470));
const out = join(ROOT, flag("out", ".tmp/sheets"));
const only = flag("figure"), shelf = flag("shelf"), themeArg = flag("theme");
const motion = args.includes("--motion");
const themes = themeArg ? [themeArg] : ["light", "dark"];
const list = figures.filter((f) => (!only || f.name === only) && (!shelf || f.shelf === shelf));
if (!list.length) { console.error(`sheet: no figure matches ${only || shelf}`); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const up = async () => { try { return (await fetch(`http://127.0.0.1:${port}/json/version`)).ok; } catch { return false; } };

let chrome = null;
async function startChrome() {
  if (await up()) return;
  const dir = join(ROOT, ".tmp", `chrome-sheet-${port}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const mac = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const bin = process.env.CHROME || (process.platform === "darwin" ? mac : "google-chrome");
  const cargs = ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--allow-file-access-from-files", "about:blank"];
  const apple = process.platform === "darwin" && /Apple/.test(cpus()[0]?.model || "");
  chrome = apple && !process.env.CHROME ? spawn("arch", ["-arm64", bin, ...cargs], { stdio: "ignore" }) : spawn(bin, cargs, { stdio: "ignore" });
  for (let i = 0; i < 60; i++) { if (await up()) return; await sleep(250); }
  throw new Error(`sheet: Chrome did not answer on port ${port}`);
}

async function connect() {
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = list.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
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

function page(f, theme) {
  const cell = (opts, w, label) => `<figure style="width:${w}px"><div>${render(f.name, { figure: f.measures ? { value: f.measures.sample, unit: f.measures.unit } : null, ...opts })}</div><figcaption>${label}</figcaption></figure>`;
  const row = (crew) => STATES.map((s) => cell({ state: s, crew, value: s === "loading" ? 0.5 : undefined, rev: s === "changed" ? "B" : "" }, 240, `${s}${crew ? ", crew" : ""}`)).join("");
  const css = pathToFileURL(join(ROOT, "src/styles.css")).href;
  return `<!doctype html><html style="color-scheme:${theme}"><head><meta charset="utf-8"><link rel="stylesheet" href="${css}">
<style>
body { margin: 0; padding: 24px; background: var(--ostraca-paper); font: 13px/1.4 var(--ostraca-sans); color: var(--ostraca-label); width: max-content; }
h1 { font-size: 15px; font-weight: 500; margin: 0 0 16px; color: var(--ostraca-crew); }
.row { display: flex; gap: 16px; margin-bottom: 20px; align-items: flex-end; }
figure { margin: 0; } figcaption { margin-top: 6px; }
figure > div { outline: 1px solid color-mix(in oklab, var(--ostraca-ground) 50%, transparent); }
</style></head><body>
<h1>${f.title}, ${f.shelf} shelf. ${f.use}.</h1>
<div class="row">${row(false)}</div>
<div class="row">${row(true)}</div>
<div class="row">${cell({ state: "loading", value: 0.5, crew: true }, 720, "loading at 0.5, crew")}${cell({ state: "error", crew: true, value: 0.5 }, 720, "error, crew")}</div>
<div class="row">${cell({ state: "loading", crew: true }, 720, "loading, no value, crew")}${cell({ state: "changed", crew: false, rev: "2.4", lettered: "draft" }, 720, "changed, rev 2.4, lettered")}</div>
</body></html>`;
}

try {
  await startChrome();
  const c = await connect();
  await c.send("Page.enable");
  await c.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: motion ? "no-preference" : "reduce" }] });
  await c.send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1.5, mobile: false });
  for (const f of list) {
    for (const theme of themes) {
      const dir = join(out, f.shelf);
      mkdirSync(dir, { recursive: true });
      const html = join(out, `_${f.name}-${theme}.html`);
      writeFileSync(html, page(f, theme));
      await c.send("Page.navigate", { url: pathToFileURL(html).href });
      await sleep(motion ? 3200 : 900);
      const [w, h] = await c.evaluate("[document.body.scrollWidth, document.body.scrollHeight]");
      const shot = await c.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
      const file = join(dir, `${f.name}-${theme}.png`);
      writeFileSync(file, Buffer.from(shot.data, "base64"));
      console.log(`sheet: ${file}`);
    }
  }
  c.close();
} finally {
  if (chrome) chrome.kill("SIGKILL");
}
