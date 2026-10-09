#!/usr/bin/env node
/* Measures how far the visible drawing reaches left and right in each
   street figure on the home page, so the street can be laid tight on one
   ground line. Writes site/street.json, which build-site.mjs reads.
   Run it after changing STREET in build-site.mjs or a street figure.

     node scripts/measure-street.mjs [--port 9480] */
import { spawn } from "node:child_process";
import { writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "../src/index.js";
import { STREET } from "../site/street.mjs";

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
const html = `<style>${css} *{transition:none!important;animation:none!important}</style>` +
  STREET.map(([name, o]) => `<div style="width:600px">${render(name, { ...o, crew: true })}</div>`).join("");
await send("Runtime.evaluate", { expression: `document.body.innerHTML = ${JSON.stringify(html)}` });
await sleep(300);
const r = await send("Runtime.evaluate", { returnByValue: true, expression: `[...document.querySelectorAll("svg.ostraca")].map((svg) => {
  const inv = svg.getScreenCTM().inverse();
  let x0 = Infinity, x1 = -Infinity;
  for (const el of svg.querySelectorAll("path, line, rect, circle, ellipse, polygon, text")) {
    if (el.closest('[data-slot="ground"], title')) continue;
    let o = 1;
    for (let e = el; e && e !== svg; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === "none") { o = 0; break; } o *= +s.opacity; }
    if (o < 0.05) continue;
    const b = el.getBoundingClientRect();
    if (!b.width && !b.height) continue;
    const p = new DOMPoint(b.left, b.top).matrixTransform(inv), q = new DOMPoint(b.right, b.bottom).matrixTransform(inv);
    x0 = Math.min(x0, p.x, q.x); x1 = Math.max(x1, p.x, q.x);
  }
  return [svg.dataset.figure, Math.floor(x0), Math.ceil(x1)];
})` });
const out = Object.fromEntries(r.result.value.map(([n, a, b]) => [n, [a, b]]));
writeFileSync(join(ROOT, "site/street.json"), JSON.stringify(out, null, 2) + "\n");
console.log(out);
ws.close();
try { process.kill(-chrome.pid); } catch { chrome.kill(); }
