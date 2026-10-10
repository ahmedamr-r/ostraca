#!/usr/bin/env node
/* The catalogue site, static, into dist/. Every drawing on it comes from the
   package's own render(), so the site always shows the real output.

     node scripts/build-site.mjs

   Pages: / , /figures , /figures/<name> , /docs , /docs/<page> , /skill ,
   /llms.txt and a 404. vercel.json serves them with clean URLs. */
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { render, figures, STATES, define } from "../src/index.js";
import { md, esc } from "./md.mjs";
import { STREET } from "../site/street.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = join(ROOT, "dist");
const SITE = "https://ostraca.ahmedamr.com";
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const catalogue = JSON.parse(readFileSync(join(ROOT, "catalogue.json"), "utf8"));

rmSync(OUT, { recursive: true, force: true });
const write = (path, text) => { const f = join(OUT, path); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, text); };

/* ---- Assets ---------------------------------------------------------------- */
cpSync(join(ROOT, "src"), join(OUT, "lib/ostraca"), { recursive: true, filter: (p) => !p.endsWith(".d.ts") });
cpSync(join(ROOT, "skills/ostraca/examples/coffee-cup.js"), join(OUT, "lib/examples/coffee-cup.js"));
mkdirSync(join(OUT, "assets/fonts"), { recursive: true });
for (const f of ["CubitSans-Variable.woff2", "CubitMono-Variable.woff2", "CubitSans-OFL.txt", "CubitMono-OFL.txt"]) {
  cpSync(join(ROOT, "site/fonts", f), join(OUT, "assets/fonts", f));
}
write("assets/site.css", readFileSync(join(ROOT, "src/styles.css"), "utf8") + "\n" + readFileSync(join(ROOT, "site/site.css"), "utf8"));
write("assets/client.js", readFileSync(join(ROOT, "site/client.js"), "utf8"));
write("favicon.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#eee6d6"/><path d="M5 25H27" stroke="#9a8f80" stroke-width="1.5" stroke-linecap="round"/><path d="M9 25V12H23V25" fill="none" stroke="#3b78a8" stroke-width="1.5" stroke-dasharray="3 2.4"/><path d="M11.5 16.5L15 20L22 9" fill="none" stroke="#3b78a8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`);

/* ---- Order and sheet numbers (catalogue order, OS-101 onwards) -------------- */
const byName = new Map(figures.map((f) => [f.name, f]));
const shelves = catalogue.shelves.map((s) => ({ ...s, figures: s.figures.map((f) => byName.get(f.name)).filter(Boolean) }));
const ordered = shelves.flatMap((s) => s.figures);
for (const f of figures) if (!ordered.includes(f)) ordered.push(f);
const sheetNo = new Map(ordered.map((f, k) => [f.name, `OS-${101 + k}`]));
const shelfOf = new Map(shelves.flatMap((s) => s.figures.map((f) => [f.name, s])));

/* The shelf lines, in this site's words. */
const SHELF_LINE = {
  messages: "Inboxes, notifications, mail and comments: where most products first show an empty screen, and where people come back each time they catch up.",
  files: "Keeping, finding, charting and throwing away. Every workspace has an empty folder, a search with no results and a bin.",
  people: "Teams, profiles, invitations and rewards. Anything with accounts has an empty team and a missing photo.",
  money: "Payments, balances, savings and receipts, for banking apps and for any product that takes a card.",
  shopping: "Carts, orders, shop fronts and food on the stove.",
  time: "Calendars, countdowns, reminders and time away.",
  devices: "The laptop and phone an app runs on, the camera it asks to use and the servers behind it.",
  site: "The building site the library started from: lists, onboarding, sync, connections, missing pages and uploads.",
};

const STATE_ROWS = [
  ["empty", "Set out", "Planned, nothing made yet. Empty, first run.", `<rect x="5" y="4" width="24" height="15" stroke-dasharray="4 3"/>`],
  ["loading", "Rising", "In progress. Loading, uploading, syncing.", `<g opacity="0.75"><path d="M7 21V2M17 21V2M27 21V2M5 7H29M5 14H29M7 21L17 14"/></g>`],
  ["idle", "Built", "It exists and nothing is happening to it.", `<rect class="paper" x="5" y="4" width="24" height="15"/>`],
  ["success", "Signed off", "Done and confirmed.", `<path d="M11.5 9.5L15 13L22 5" style="stroke-width:1.4"/>`],
  ["changed", "Revised", "Changed since it was confirmed.", `<path d="M9 7.5a3 3 0 0 1 5.5-1.6a3 3 0 0 1 5.4.2a3 3 0 0 1 4.6 2.4a3 3 0 0 1 .2 5.6a3 3 0 0 1-4.4 2.9a3 3 0 0 1-5.6.4a3 3 0 0 1-5.4-1.5a3 3 0 0 1-.3-5.9a3 3 0 0 1 0-2.5Z"/>`],
  ["error", "Out of true", "Something failed.", `<path d="M8 3H17V5M17 3V13"/><path class="paper" d="M15.3 13H18.7V14.5L21 16.5L17 22L13 16.5L15.3 14.5Z"/>`],
];
const REMARKS = {
  empty: "The lines are down. Everything else is still a rumour.",
  loading: "Coming along. Please don't lean on it.",
  idle: "Nothing to report. We looked twice.",
  success: "Signed and dated. We're not touching it again.",
  changed: "It changed after we signed it, so we drew round the change.",
  error: "It looked straight from the van.",
};

/* ---- The frame of every page ---------------------------------------------- */
const NAV = [["/figures", "Figures"], ["/docs", "Docs"], ["/skill", "Skill"], ["https://github.com/ahmedamr-r/ostraca", "GitHub"]];

function page({ path, title, description, body, arriving = false, wide = false, noindex = false }) {
  const full = path === "/" ? "Ostraca" : `${title} · Ostraca`;
  const nav = NAV.map(([href, label]) => {
    const cur = href !== "/" && (path === href || path.startsWith(href + "/"));
    return `<a href="${href}"${cur ? ' aria-current="page"' : ""}${href.startsWith("http") ? ' rel="noopener"' : ""}>${label}</a>`;
  }).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${SITE}${path}">`}
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}${path}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary">
<meta name="twitter:creator" content="@ahmedamrr_r">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/CubitSans-Variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css">
<script>try{var t=localStorage.getItem("ostraca-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}${arriving ? `if(!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.classList.add("arriving");setTimeout(function(){document.documentElement.classList.remove("arriving","inking")},6000)}` : ""}</script>
<script type="module" src="/assets/client.js"></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="bar">
  <a class="mark" href="/">Ostraca</a>
  <nav class="nav" aria-label="Site">${nav}</nav>
  <div class="seg theme" role="group" aria-label="Theme"><span>Theme</span><button type="button" data-theme-set="light" aria-pressed="false">Light</button><button type="button" data-theme-set="dark" aria-pressed="false">Dark</button><button type="button" data-theme-set="system" aria-pressed="true">System</button></div>
</header>
<main id="main" class="page${wide ? " wide" : ""}">
${body}
<footer class="colophon">
  <p>Ostraca ${pkg.version}, MIT licensed. Made by <a href="https://ahmedamr.com">Ahmed Amr</a> in Cairo.</p>
  <p><a href="https://github.com/ahmedamr-r/ostraca">Source</a> · <a href="https://x.com/ahmedamrr_r">X</a> · <a href="/llms.txt">llms.txt</a></p>
</footer>
</main>
</body>
</html>
`;
}

/* A drawing the client will adopt with mount(). */
function art(name, opts = {}, attrs = "") {
  return `<div data-art="${name}" data-opts="${esc(JSON.stringify(opts))}"${attrs}>${render(name, opts)}</div>`;
}

/* ---- / ---------------------------------------------------------------------- */
const CROPS = existsSync(join(ROOT, "site/street.json")) ? JSON.parse(readFileSync(join(ROOT, "site/street.json"), "utf8")) : {};
function streetRow() {
  const PAD = 16;
  return STREET.map(([name, o]) => {
    const svg = render(name, { ...o, crew: true });
    const [, top, w, h] = svg.match(/viewBox="([^"]+)"/)[1].split(" ").map(Number);
    const depth = h + top;
    const [c0, c1] = CROPS[name] || [0, w];
    const x0 = Math.max(0, c0 - PAD), x1 = Math.min(w, c1 + PAD), span = x1 - x0;
    const pct = (v) => `${+(v / span * 100).toFixed(3)}%`;
    return `<div style="--w:${span};--mb:${pct(22 - depth)}"><div style="width:${pct(w)};margin-left:${pct(-x0)}">${art(name, { ...o, crew: true })}</div></div>`;
  }).join("");
}

write("index.html", page({
  path: "/", title: "Ostraca", arriving: true,
  description: "Line illustrations for the empty, loading, done and broken screens of everyday products. Each one is a small building elevation that shows six states. MIT, no dependencies.",
  body: `
<section class="hero">
  <h1>Ostraca</h1>
  <p class="lede">Illustrations for every state your product is in.</p>
  <p class="sub">${figures.length} everyday things, from an inbox to a stove, each drawn as a small building elevation that can be set out, rising, built, signed off, revised or out of true. Your app passes the state and its real values, and the drawing follows.</p>
  <div class="install"><code>npm i ostraca</code><button type="button" class="btn" data-copy="npm i ostraca">Copy</button></div>
  <ul class="links"><li><a href="/figures">Figures</a></li><li><a href="/docs">Docs</a></li><li><a href="/skill">Skill</a></li></ul>
</section>
<figure class="street">
  <div class="street-scroll"><div class="street-row">${streetRow()}</div></div>
  <figcaption>Street elevation: a mailbox, a noticeboard going up, a row of seats, coins, a trolley signed off, a revised calendar, a laptop and a stove out of true, with the crew on site.</figcaption>
</figure>
<section class="home-notes" aria-label="How it works">
  <div><h2>One subject, six states</h2><p>Pass <code>state</code> and the drawing moves there: a dashed set-out for empty, scaffolding for loading, a tick for done, a revision cloud for changed and a plumb line for an error.</p></div>
  <div><h2>Real values only</h2><p>A count, an amount or a version on a drawing comes from your app through <code>figure</code> and <code>rev</code>. With nothing passed, nothing is written.</p></div>
  <div><h2>Plain SVG</h2><p><code>render()</code> returns a string on the server or in the browser, with no runtime dependencies. React gets a component; anything else gets <code>mount()</code>.</p></div>
</section>`,
}));

/* ---- /figures --------------------------------------------------------------- */
const stateSeg = STATES.map((s) => `<button type="button" data-state-set="${s}" aria-pressed="${s === "idle"}">${s}</button>`).join("");
write("figures.html", page({
  path: "/figures", title: "Figures",
  description: `All ${figures.length} Ostraca figures on their shelves, in any of the six states, with or without the crew.`,
  body: `
<section class="hero">
  <h1>Figures</h1>
  <p class="lede">${figures.length} drawings on ${shelves.length} shelves.</p>
  <p class="sub">Pick a state to see every figure in it. Each name opens the figure's sheet, where you can try the options and copy the SVG.</p>
</section>
<div class="switch" data-switch>
  <div class="seg" role="group" aria-label="State for every figure"><span>State</span>${stateSeg}</div>
  <label class="check"><input type="checkbox" data-workers> Workers on site</label>
</div>
${shelves.map((s) => `
<section class="shelf" id="${s.key}" aria-labelledby="shelf-${s.key}">
  <div class="shelf-head"><h2 id="shelf-${s.key}">${esc(s.title)}</h2><p>${esc(SHELF_LINE[s.key] || "")}</p></div>
  ${s.figures.map((f) => `
  <a class="row" href="/figures/${f.name}">
    <span class="row-words"><span class="row-no">${sheetNo.get(f.name)}</span><span class="row-name">${esc(f.title)}</span><span class="row-use">${esc(f.use)}</span></span>
    <span class="row-cell">${art(f.name, { decorative: true })}</span>
  </a>`).join("")}
</section>`).join("")}`,
}));

/* ---- /figures/<name> -------------------------------------------------------- */
ordered.forEach((f, k) => {
  const prev = ordered[k - 1], next = ordered[k + 1];
  const shelf = shelfOf.get(f.name);
  const m = f.measures;
  const revs = STATE_ROWS.map(([s, label, means, icon]) => `
      <label class="rev"><input type="radio" name="state" value="${s}"${s === "idle" ? " checked" : ""}>
        <svg viewBox="0 0 34 22" aria-hidden="true"><g class="ink">${icon}</g></svg>
        <b>${label}<code>${s}</code></b><i>${means}</i></label>`).join("");
  const measureField = m ? `<label class="field">${esc(m.what)}${m.unit ? ` <span class="faint-unit">(${esc(m.unit)})</span>` : ""}<input type="text" data-measure inputmode="${typeof m.sample === "number" ? "decimal" : "text"}" autocomplete="off" aria-describedby="fig-note"></label>` : "";
  write(`figures/${f.name}.html`, page({
    path: `/figures/${f.name}`, title: f.title,
    description: `${f.title}, an Ostraca figure for ${f.use.charAt(0).toLowerCase() + f.use.slice(1)}. Six states, MIT licensed.`,
    body: `
<nav class="crumbs" aria-label="Breadcrumb"><a href="/figures">Figures</a><span aria-hidden="true">/</span><a href="/figures#${shelf?.key}">${esc(shelf?.title || f.shelf)}</a></nav>
<h1 class="sheet-title">${esc(f.title)}</h1>
<article class="sheet" data-sheet data-remarks="${esc(JSON.stringify(REMARKS))}"${m?.unit ? ` data-unit="${esc(m.unit)}"` : ""}${Array.isArray(m?.sample) ? " data-series" : ""}>
  <div class="sheet-body">
    <div class="drawing">
      <div class="drawing-art">${art(f.name)}</div>
      <div class="controls">
        <label class="check"><input type="checkbox" data-workers> Workers on site</label>
        <span data-loading-only hidden class="how"><label class="check"><input type="checkbox" data-progress-known checked> Progress known</label> <input type="range" min="0" max="100" step="5" value="50" data-how aria-label="Progress"> <output data-how-out>50%</output></span>
        <label class="field">Version <input type="text" data-rev autocomplete="off" spellcheck="false"></label>
        ${measureField}
        <div class="actions">
          <button type="button" class="btn" data-copy-svg>Copy SVG</button>
          <button type="button" class="btn" data-download-svg>Download SVG</button>
          <p class="controls-note" id="fig-note">A standalone SVG of what you see: this state, this theme, with or without the workers.</p>
        </div>
      </div>
      <div class="notes">
        <h2>General notes</h2>
        <ol>
          <li>React: <code data-react>&lt;Ostraca name="${f.name}" state="idle" /&gt;</code></li>
          <li>HTML: <code data-html>mount(el, "${f.name}", { state: "idle" })</code></li>
          ${m ? `<li>${esc(m.what)} goes in <code>figure</code>${m.unit ? `, as <code>{ value, unit: "${esc(m.unit)}" }</code>` : ""}. With nothing passed, nothing is written on the drawing.</li>` : ""}
        </ol>
      </div>
    </div>
    <div class="side">
      <fieldset class="revs"><legend>Revisions</legend>${revs}</fieldset>
    </div>
  </div>
  <dl class="titleblock">
    <div><dt>Drawing</dt><dd class="drawing-name">${esc(f.title)}</dd></div>
    <div><dt>Use</dt><dd>${esc(f.use)}</dd></div>
    <div><dt>Scale</dt><dd>Not to scale</dd></div>
    <div><dt>Rev</dt><dd data-rev-cell>A</dd></div>
    <div><dt>Sheet</dt><dd>${sheetNo.get(f.name)}</dd></div>
    <div class="wide"><dt>Remarks</dt><dd class="remark" data-remark>${REMARKS.idle}</dd></div>
  </dl>
</article>
<nav class="pager" aria-label="Other sheets">
  ${prev ? `<a href="/figures/${prev.name}">${sheetNo.get(prev.name)} <b>${esc(prev.title)}</b></a>` : "<span></span>"}
  ${next ? `<a href="/figures/${next.name}"><b>${esc(next.title)}</b> ${sheetNo.get(next.name)}</a>` : "<span></span>"}
</nav>`,
  }));
});

/* ---- /docs ------------------------------------------------------------------ */
const DOCS = ["index", "usage", "states", "options", "theming", "workers", "accessibility", "skill"];
const docMeta = DOCS.map((d) => {
  const src = readFileSync(join(ROOT, "docs", `${d}.md`), "utf8");
  const route = d === "index" ? "/docs" : `/docs/${d}`;
  return { d, src, route, title: d === "index" ? "Start" : md(src).title };
});
const routeOf = Object.fromEntries(docMeta.map((x) => [`${x.d}.md`, x.route]));
const docLink = (href) => {
  if (/^(https?:|mailto:|#)/.test(href)) return href;
  const [file, hash] = href.split("#");
  const base = file.replace(/^\.\//, "").replace(/^docs\//, "");
  if (routeOf[base]) return routeOf[base] + (hash ? `#${hash}` : "");
  if (/^\.\.\//.test(file) || /^(skills|src|LICENSE)/.test(file)) return `https://github.com/ahmedamr-r/ostraca/blob/main/${file.replace(/^\.\.\//, "")}${hash ? `#${hash}` : ""}`;
  return href;
};
for (const x of docMeta) {
  const { html, title } = md(x.src, { link: docLink });
  const side = docMeta.map((y) => `<li><a href="${y.route}"${y === x ? ' aria-current="page"' : ""}>${esc(y.title)}</a></li>`).join("");
  const first = x.src.split("\n").find((l) => l.trim() && !l.startsWith("#")) || "";
  write(x.d === "index" ? "docs.html" : `docs/${x.d}.html`, page({
    path: x.route, title: x.d === "index" ? "Docs" : title,
    description: first.replace(/[`*[\]]/g, "").replace(/\(([^)]*)\)/g, "").slice(0, 200),
    body: `<div class="docs"><nav class="docs-nav" aria-label="Docs"><h2>Docs</h2><ul>${side}</ul></nav><article class="prose">${html}</article></div>`,
  }));
}

/* ---- /skill ----------------------------------------------------------------- */
const cup = (await import(join(ROOT, "skills/ostraca/examples/coffee-cup.js"))).default;
define(cup);
const cupOpts = { state: "loading", value: 0.5, crew: true };
write("skill.html", page({
  path: "/skill", title: "Skill",
  description: "The Ostraca skill teaches a coding agent to draw a new figure in the library's hand, check it and show you the sheets.",
  body: `
<section class="hero">
  <h1>Skill</h1>
  <p class="lede">For the object the library does not have yet.</p>
  <p class="sub">The Ostraca skill teaches a coding agent to draw a new figure in the same hand: one description file that the engine turns into all six states. The agent checks it against the rules, draws contact sheets, looks at them and fixes what it sees before handing it over.</p>
</section>
<div class="docs" style="grid-template-columns:minmax(0,1fr)">
<article class="prose">
<h2 id="install">Install</h2>
<pre class="code"><code>npx skills add ahmedamr-r/ostraca</code></pre>
<p>It works in any agent that reads <code>SKILL.md</code> skills, such as Claude Code. The checks and sheets need Node 22 and Google Chrome or Chromium; there is nothing else to install.</p>
<h2 id="call">Call it</h2>
<pre class="code"><code>/ostraca coffee cup</code></pre>
<p>Name an object and the agent draws it. Name a moment instead, such as <code>/ostraca something for a fitness app</code>, and it offers two or three objects to pick from.</p>
<h2 id="steps">Steps</h2>
<ol class="steps">
  <li><div><b>Pin the subject</b><p>The object, the product moments it serves, how it builds from the bottom, which part changes, and whether it leans or sags when something goes wrong.</p></div></li>
  <li><div><b>Write the description file</b><p>Geometry only: the pieces in build order, the dashed set-out, where the tick and the cloud land, where the workers stand. No state code.</p></div></li>
  <li><div><b>Check, draw the sheet, look</b><p>Every state with the workers on and off, mirrored, at no value and at 0 and 1. A broken rule fails the check. Then light and dark sheets, and a list of questions asked of the pixels.</p></div></li>
  <li><div><b>Hand it over</b><p>The file, the sheets, the choices you might want changed, and what it did not verify.</p></div></li>
  <li><div><b>Revise on request</b><p>Changes go back through the check and the sheets before they come back to you.</p></div></li>
</ol>
<h2 id="example">The figure it made</h2>
<p>Following the skill from outside the repo, an agent drew this coffee cup on its saucer, on a cafe table. It is kept in the skill as a worked example.</p>
<figure class="example">
  <div class="example-art"><div>${`<div data-art="coffee-cup" data-module="/lib/examples/coffee-cup.js" data-opts="${esc(JSON.stringify(cupOpts))}">${render("coffee-cup", cupOpts)}</div>`}</div></div>
  <div class="controls" data-example><div class="seg" role="group" aria-label="State of the coffee cup"><span>State</span>${STATES.map((s) => `<button type="button" data-example-state="${s}" aria-pressed="${s === "loading"}">${s}</button>`).join("")}</div></div>
  <figcaption>The coffee cup from the skill's examples. Use it with <code>define(cup)</code>, then like any library figure.</figcaption>
</figure>
<pre class="code"><code>import { define, render } from "ostraca";
import cup from "./coffee-cup.js";

define(cup);
el.innerHTML = render("coffee-cup", { state: "loading", value: 0.4 });</code></pre>
<h2 id="source">Source</h2>
<p>Read the instructions the agent follows in <a href="https://github.com/ahmedamr-r/ostraca/blob/main/skills/ostraca/SKILL.md">SKILL.md</a>, and the rest of the folder, with the figure contract, the marks and the examples, <a href="https://github.com/ahmedamr-r/ostraca/tree/main/skills/ostraca">on GitHub</a>. <a href="/docs/skill">The skill page in the docs</a> lists what it will not draw.</p>
</article>
</div>`,
}));

/* ---- 404 -------------------------------------------------------------------- */
write("404.html", page({
  path: "/404", title: "Not found", noindex: true,
  description: "There is nothing at this address.",
  body: `
<section class="hero">
  <h1>Not found</h1>
  <p class="lede">There is nothing at this address. It may have moved.</p>
  <ul class="links"><li><a href="/">Home</a></li><li><a href="/figures">Figures</a></li><li><a href="/docs">Docs</a></li></ul>
</section>
<figure class="street" style="max-width:560px">${art("door-frame", { state: "empty", crew: true, title: "A door frame, set out" })}</figure>`,
}));

/* ---- /llms.txt -------------------------------------------------------------- */
const api = readFileSync(join(ROOT, "src/index.js"), "utf8").match(/\/\* =+\n([\s\S]*?)=+ \*\//)[1].split("\n").map((l) => l.replace(/^\s{3}/, "")).join("\n").trim();
write("llms.txt", `# Ostraca

> Line illustrations for the empty, loading, done and broken screens of everyday products. Each figure is a small building elevation that draws six states. MIT licensed, no runtime dependencies, works with or without React. By Ahmed Amr (${"https://ahmedamr.com"}).

Install: npm i ostraca
Source: https://github.com/ahmedamr-r/ostraca

## Pages

- [Home](${SITE}/): what it is and how to install it
- [Figures](${SITE}/figures): every figure on its shelf
${docMeta.map((x) => `- [${x.title}](${SITE}${x.route})`).join("\n")}
- [Skill](${SITE}/skill): the agent skill that draws new figures

## API

\`\`\`js
import { render, mount, figures, STATES, define } from "ostraca";
import { Ostraca } from "ostraca/react";   // <Ostraca name="inbox" state="empty" />
import "ostraca/styles.css";               // needed on every page that shows a drawing
\`\`\`

${api}

## States

${STATE_ROWS.map(([s, label, means]) => `- ${s}: ${label.toLowerCase()}. ${means}`).join("\n")}

## Figures

${shelves.map((s) => `### ${s.title}\n\n${s.figures.map((f) => `- ${f.name} (${sheetNo.get(f.name)}): ${f.use}${f.measures ? `. figure: ${f.measures.what}${f.measures.unit ? `, unit "${f.measures.unit}"` : ""}` : ""}. ${SITE}/figures/${f.name}`).join("\n")}`).join("\n\n")}
`);

/* ---- vercel.json lives at the repo root; this only reports. ------------------ */
const count = readdirSync(join(OUT, "figures")).length;
console.log(`site: ${count} figure sheets, ${docMeta.length} docs pages -> dist/`);
