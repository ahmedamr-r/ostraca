#!/usr/bin/env node
/* The README demo: three figures on one ground line going through the
   states together, from empty to error, as a looping GIF per theme.

     node scripts/demo.mjs [--port 9492]   writes .github/demo-light.gif and demo-dark.gif,
                                           and .tmp/launch/demo-<theme>.mp4 for posts

   It serves the repo on a free port so the page can import src/index.js,
   steps Chrome's clock 50 ms at a time and shoots every step, so the motion
   is the library's own, frame for frame. ffmpeg turns the frames into the
   GIF and the MP4. Chrome as in cover.mjs. */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import { spawn, execFileSync } from "node:child_process";
import { cpus } from "node:os";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const i = process.argv.indexOf("--port");
const port = i > 0 ? Number(process.argv[i + 1]) : 9492;
const W = 960, H = 210, STEP = 50, FIGURES = ["inbox", "laptop", "coins"];

// The states in order: what the app passes, how long it stays, what the caption says.
const SEQUENCE = [
  [{ state: "empty" }, 1600, "empty", "nothing here yet"],
  [{ state: "loading", value: 0 }, 500, "loading", "working on it, 0%"],
  [{ state: "loading", value: 0.25 }, 500, "loading", "working on it, 25%"],
  [{ state: "loading", value: 0.5 }, 500, "loading", "working on it, 50%"],
  [{ state: "loading", value: 0.75 }, 500, "loading", "working on it, 75%"],
  [{ state: "loading", value: 1 }, 600, "loading", "working on it, 100%"],
  [{ state: "success" }, 2000, "success", "done"],
  [{ state: "changed", rev: "2.4" }, 2000, "changed", "something new: version 2.4"],
  [{ state: "error" }, 2800, "error", "something went wrong"],
];
const TOTAL = SEQUENCE.reduce((t, [, ms]) => t + ms, 0);

function page(theme) {
  return `<!doctype html><html style="color-scheme:${theme}"><head><meta charset="utf-8">
<link rel="stylesheet" href="/src/styles.css">
<style>
@font-face { font-family: "Cubit Mono"; src: url("/site/fonts/CubitMono-Variable.woff2") format("woff2"); font-weight: 100 900; }
body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: var(--ostraca-paper); }
.row { position: absolute; left: 24px; right: 24px; top: 14px; display: flex; align-items: flex-end; }
.row > div { flex: var(--w) 1 0; min-width: 0; }
.cap { position: absolute; left: 0; right: 0; bottom: 20px; margin: 0; text-align: center; font: 400 17px/1 var(--ostraca-mono); color: var(--ostraca-label); }
.cap b { font-weight: 500; color: var(--ostraca-thing); margin-right: 12px; }
</style></head><body>
<div class="row">${FIGURES.map((f) => `<div data-f="${f}"></div>`).join("")}</div>
<p class="cap"><b></b><span></span></p>
<script type="module">
import { mount, render } from "/src/index.js";
const SEQUENCE = ${JSON.stringify(SEQUENCE)};
const arts = [...document.querySelectorAll("[data-f]")].map((el) => {
  el.style.setProperty("--w", render(el.dataset.f).match(/viewBox="[^ ]+ [^ ]+ ([^ ]+)/)[1]);
  return mount(el, el.dataset.f, { state: "empty", crew: true, decorative: true });
});
const cap = document.querySelector(".cap");
let t = 0;
for (const [opts, ms, word, means] of SEQUENCE) {
  setTimeout(() => {
    arts.forEach((a) => a.update({ value: undefined, rev: "", ...opts }));
    cap.querySelector("b").textContent = word;
    cap.querySelector("span").textContent = means;
  }, t);
  t += ms;
}
</script></body></html>`;
}

// A static server for the repo, and the two pages.
const TYPES = { ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2" };
const server = createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/demo.html") { res.writeHead(200, { "Content-Type": "text/html" }); return res.end(page(url.searchParams.get("theme"))); }
  const f = join(ROOT, normalize(url.pathname).replace(/^(\.\.[/\\])+/, ""));
  if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[extname(f)] || "application/octet-stream" });
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const up = async () => { try { return (await fetch(`http://127.0.0.1:${port}/json/version`)).ok; } catch { return false; } };

let chrome = null;
try {
  if (!(await up())) {
    const dir = join(ROOT, ".tmp", `chrome-demo-${port}`);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const mac = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    const bin = process.env.CHROME || (process.platform === "darwin" ? mac : "google-chrome");
    const cargs = ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "about:blank"];
    const apple = process.platform === "darwin" && /Apple/.test(cpus()[0]?.model || "");
    chrome = apple && !process.env.CHROME ? spawn("arch", ["-arm64", bin, ...cargs], { stdio: "ignore" }) : spawn(bin, cargs, { stdio: "ignore" });
    for (let k = 0; k < 60 && !(await up()); k++) await sleep(250);
  }
  const launch = join(ROOT, ".tmp", "launch");
  mkdirSync(launch, { recursive: true });
  for (const theme of ["light", "dark"]) {
    // A fresh tab for each theme: a paused clock carries over to the next page load and stalls it.
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener("open", r, { once: true }));
    let id = 0; const pending = new Map(), waiting = new Map();
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      if (pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
      else if (waiting.has(m.method)) { waiting.get(m.method)(); waiting.delete(m.method); }
    });
    const send = (method, params = {}) => new Promise((res) => { const n = ++id; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
    const event = (method) => new Promise((res) => waiting.set(method, res));
    // The clock moves only when told to, so every frame is the library's motion at that instant.
    const advance = async (ms) => { const done = event("Emulation.virtualTimeBudgetExpired"); await send("Emulation.setVirtualTimePolicy", { policy: "advance", budget: ms }); await done; };
    await send("Page.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: false });

    const frames = join(ROOT, ".tmp", `demo-frames-${theme}`);
    rmSync(frames, { recursive: true, force: true });
    mkdirSync(frames, { recursive: true });
    await send("Emulation.setVirtualTimePolicy", { policy: "pause" });
    await send("Page.navigate", { url: `${origin}/demo.html?theme=${theme}` });
    await advance(1500); // modules, fonts and the first state, before the first frame
    for (let f = 0, t = 0; t < TOTAL; f++, t += STEP) {
      await advance(STEP);
      const shot = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync(join(frames, `${String(f).padStart(4, "0")}.png`), Buffer.from(shot.data, "base64"));
    }
    const fps = String(1000 / STEP), input = ["-framerate", fps, "-i", join(frames, "%04d.png")];
    const gif = join(ROOT, ".github", `demo-${theme}.gif`);
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...input, "-filter_complex",
      "scale=1200:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle", "-loop", "0", gif]);
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...input, "-vf", "scale=1920:-2:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-crf", "18", "-movflags", "+faststart", join(launch, `demo-${theme}.mp4`)]);
    rmSync(frames, { recursive: true, force: true });
    ws.close();
    await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
    console.log(`demo: ${gif}`);
  }
} finally {
  if (chrome) chrome.kill("SIGKILL");
  server.close();
}
