#!/usr/bin/env node
/* Contact sheets for one Ostraca figure file, through headless Chrome.
   Needs only Node 22 (for its global WebSocket) and Google Chrome or
   Chromium, plus engine.js beside this script.

   Usage:
     node sheet.mjs path/to/figure.js [--out dir] [--theme light|dark]
                    [--port 9222] [--motion]
     node sheet.mjs path/to/figure.js --svg [state] [--theme light|dark]
                    [--crew] [--value 0.5] [--rev 2.4] [--paper]
                    [--color c] [--crew-color c] [--paper-color c] [--out dir]

   Writes <out>/<name>-light.png and <name>-dark.png (out defaults to a
   sheets/ folder beside the figure). Each sheet holds the states the
   figure draws at 240px with the crew off and then on, and at 720px:
   loading at 0.5, error, loading with no value, changed with a long
   version and a word lettered, and the same mirrored, as far as the
   figure draws those states.

   With --svg it writes one standalone picture instead: the figure in that
   state (the state can be left out when the figure draws only one), as
   <out>/<name>-<state>-<theme>.svg beside the figure, every line with its
   colour written on it, so it needs no stylesheet. Both themes unless
   --theme. --paper puts the paper colour behind it; without it the file is
   transparent. A PNG of each file, drawn from the file alone, goes in
   sheets/ to look at.

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
const BOOL = new Set(["--motion", "--crew", "--paper", "--svg"]);
const flag = (k, d) => { const i = args.indexOf(`--${k}`); const v = args[i + 1]; return i < 0 || v == null || v.startsWith("--") ? d : v; };
const file = args.find((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--") && !BOOL.has(args[i - 1])));
if (!file) { console.error("usage: node sheet.mjs path/to/figure.js [--out dir] [--port 9222] [--svg state]"); process.exit(2); }
if (typeof WebSocket === "undefined") { console.error("sheet: needs Node 22 or later (global WebSocket)"); process.exit(2); }
let port = Number(flag("port", 0)); // 0: start a Chrome of our own on a free port
const out = resolve(flag("out", join(dirname(resolve(file)), "sheets")));
const motion = args.includes("--motion");
const themes = flag("theme") ? [flag("theme")] : ["light", "dark"];
const fig = define((await import(pathToFileURL(resolve(file)).href)).default);
// --svg's state is whatever follows it unless that is the figure's own path.
const svgAt = args.indexOf("--svg");
const svgState = svgAt < 0 ? null : args[svgAt + 1] && !args[svgAt + 1].startsWith("--") && args[svgAt + 1] !== file ? args[svgAt + 1] : fig.states.length === 1 ? fig.states[0] : "";
if (svgState === "") { console.error(`sheet: --svg needs a state; ${fig.name} draws ${fig.states.join(", ")}`); process.exit(2); }
if (svgState && !fig.states.includes(svgState)) { console.error(`sheet: ${fig.name} draws ${fig.states.join(", ")}, not "${svgState}"`); process.exit(2); }

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
  const row = (crew) => fig.states.map((s) => cell({ state: s, crew, value: s === "loading" ? 0.5 : undefined, rev: s === "changed" ? "B" : "" }, 240, `${s}${crew ? ", crew" : ""}`)).join("");
  // The close-ups, for the states the figure draws. A figure that draws fewer
  // than six gets one for each of its states, lettered, and one mirrored.
  const big = [
    [{ state: "loading", value: 0.5, crew: true }, "loading at 0.5, crew"],
    [{ state: "error", crew: true, value: 0.5 }, "error, crew"],
    [{ state: "loading", crew: true }, "loading, no value, crew"],
    [{ state: "changed", crew: true, rev: "2.4.1", lettered: "draft" }, "changed, rev 2.4.1, lettered, crew"],
    [{ state: "changed", crew: true, rev: "2.4.1", dir: "rtl" }, "changed, rev 2.4.1, mirrored, crew"],
    [{ state: "empty", crew: true, dir: "rtl" }, "empty, mirrored, crew"],
  ].filter(([o]) => fig.states.includes(o.state));
  if (fig.states.length < STATES.length) {
    for (const s of fig.states) if (!big.some(([o]) => o.state === s && !o.dir)) big.push([{ state: s, crew: true, lettered: "draft" }, `${s}, lettered, crew`]);
    if (!big.some(([o]) => o.dir)) big.push([{ state: fig.states[0], crew: true, dir: "rtl" }, `${fig.states[0]}, mirrored, crew`]);
  }
  const bigRows = [];
  for (let i = 0; i < big.length; i += 2) bigRows.push(`<div class="row">${big.slice(i, i + 2).map(([o, label]) => cell(o, 720, label)).join("")}</div>`);
  return `<!doctype html><html style="color-scheme:${theme}"><head><meta charset="utf-8">
<style>${STYLES}</style>
<style>
body { margin: 0; padding: 24px; background: var(--ostraca-paper); font: 13px/1.4 var(--ostraca-sans); color: var(--ostraca-label); width: max-content; }
h1 { font-size: 15px; font-weight: 500; margin: 0 0 16px; color: var(--ostraca-crew); }
.row { display: flex; gap: 16px; margin-bottom: 20px; align-items: flex-end; }
figure { margin: 0; } figcaption { margin-top: 6px; }
figure > div { outline: 1px solid color-mix(in oklab, var(--ostraca-ground) 50%, transparent); }
</style></head><body>
<h1>${fig.title}, ${fig.shelf} shelf. ${fig.use}.${fig.states.length < STATES.length ? ` Draws ${fig.states.join(", ")} only.` : ""}</h1>
<div class="row">${row(false)}</div>
<div class="row">${row(true)}</div>
${bigRows.join("\n")}
</body></html>`;
}

/* --svg: one drawing on a page of its own, at rest, to be flattened. */
const svgOpts = () => ({
  state: svgState, crew: args.includes("--crew"),
  value: flag("value") != null ? Number(flag("value")) : undefined, rev: flag("rev", ""),
  color: flag("color"), crewColor: flag("crew-color"), paperColor: flag("paper-color"),
});
const one = (theme) => `<!doctype html><html style="color-scheme:${theme}"><head><meta charset="utf-8"><style>${STYLES}</style>
<style>body { margin: 0; padding: 24px; } #art { width: 720px; } #paper { background: var(--ostraca-paper); }</style></head>
<body><div id="art">${render(fig, svgOpts())}</div><div id="paper"></div></body></html>`;

/* The flatten() from the library's docs (docs/usage.md, Static SVG): every
   line that shows, with its colour, opacity and place written on it. With
   paper, the paper colour goes behind it as one rectangle. */
const FLATTEN = `(paper) => {
  const svg = document.querySelector("#art svg");
  const root = svg.getCTM().inverse();
  const px = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const paint = (c) => {
    if (!c || c === "none") return ["none", 1];
    px.clearRect(0, 0, 1, 1); px.fillStyle = c; px.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = px.getImageData(0, 0, 1, 1).data;
    return a ? ["rgb(" + r + "," + g + "," + b + ")", +(a / 255).toFixed(3)] : ["none", 1];
  };
  const shown = (el) => {
    let o = 1;
    for (let e = el; e && e !== svg.parentNode; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === "none" || s.visibility === "hidden") return 0;
      o *= Number(s.opacity);
    }
    return o;
  };
  const out = [];
  if (paper) {
    const [x, y, w, h] = svg.getAttribute("viewBox").split(" ");
    out.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + paint(getComputedStyle(document.querySelector("#paper")).backgroundColor)[0] + '"/>');
  }
  for (const el of svg.querySelectorAll("path, line, rect, circle, ellipse, polyline, polygon, text")) {
    if (el.closest("title, desc")) continue;
    const o = shown(el);
    if (o < 0.01) continue;
    const s = getComputedStyle(el), m = root.multiply(el.getCTM());
    const copy = el.cloneNode(true);
    copy.removeAttribute("class"); copy.removeAttribute("style");
    if (el.tagName === "path" && s.d && s.d.startsWith("path(")) copy.setAttribute("d", s.d.slice(6, -2));
    copy.setAttribute("transform", "matrix(" + [m.a, m.b, m.c, m.d, m.e, m.f].map((v) => +v.toFixed(3)) + ")");
    const [fill, fa] = paint(s.fill), [stroke, sa] = paint(s.stroke);
    copy.setAttribute("fill", fill);
    copy.setAttribute("stroke", stroke);
    if (fa < 1) copy.setAttribute("fill-opacity", fa);
    if (sa < 1) copy.setAttribute("stroke-opacity", sa);
    copy.setAttribute("stroke-width", parseFloat(s.strokeWidth) || 1);
    copy.setAttribute("stroke-linecap", s.strokeLinecap);
    copy.setAttribute("stroke-linejoin", s.strokeLinejoin);
    if (s.strokeDasharray !== "none") copy.setAttribute("stroke-dasharray", s.strokeDasharray.replace(/px/g, ""));
    if (o < 1) copy.setAttribute("opacity", +o.toFixed(3));
    if (el.tagName === "text") {
      copy.setAttribute("font-family", s.fontFamily);
      copy.setAttribute("font-size", s.fontSize);
      copy.setAttribute("letter-spacing", s.letterSpacing);
    }
    out.push(copy.outerHTML);
  }
  const label = svg.getAttribute("aria-label");
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + svg.getAttribute("viewBox") + '"' + (label ? ' role="img" aria-label="' + label.replace(/"/g, "&quot;") + '"' : "") + ">" + out.join("") + "</svg>";
}`;

async function writeSvgs(c) {
  const dir = resolve(flag("out", dirname(resolve(file))));
  mkdirSync(dir, { recursive: true });
  mkdirSync(out, { recursive: true });
  for (const theme of themes) {
    const html = join(out, `_${fig.name}-${svgState}-${theme}.html`);
    writeFileSync(html, one(theme));
    await c.send("Page.navigate", { url: pathToFileURL(html).href });
    await sleep(motion ? 3200 : 900);
    const svg = await c.evaluate(`(${FLATTEN})(${args.includes("--paper")})`);
    const path = join(dir, `${fig.name}-${svgState}-${theme}.svg`);
    writeFileSync(path, svg);
    // Look at the file as a reader would get it: on its own, with no stylesheet.
    writeFileSync(html, `<!doctype html><html><body style="margin:0;padding:24px;background:${theme === "dark" ? "#1f3b5c" : "#eee6d6"};width:max-content"><img src="${pathToFileURL(path).href}" style="width:720px;display:block"></body></html>`);
    await c.send("Page.navigate", { url: pathToFileURL(html).href });
    await sleep(500);
    const [w, h] = await c.evaluate("[document.body.scrollWidth, document.body.scrollHeight]");
    const shot = await c.send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
    const png = join(out, `${fig.name}-${svgState}-${theme}.png`);
    writeFileSync(png, Buffer.from(shot.data, "base64"));
    rmSync(html, { force: true });
    console.log(`sheet: ${path} (looked at in ${png})`);
  }
}

try {
  await startChrome();
  const c = await connect();
  await c.send("Page.enable");
  await c.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: motion ? "no-preference" : "reduce" }] });
  await c.send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1.5, mobile: false });
  mkdirSync(out, { recursive: true });
  if (svgState) await writeSvgs(c);
  else for (const theme of themes) {
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
