/* The catalogue's one script. Every drawing on the page is the package's own
   render() output from the build; this adopts it with mount() so the state
   switches animate with the package's own transitions. */
import { mount, render } from "../lib/ostraca/index.js";

const root = document.documentElement;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
};

/* ---- Theme: light, dark or the system's ---------------------------------- */
function setTheme(t) {
  if (t === "light" || t === "dark") root.dataset.theme = t; else delete root.dataset.theme;
  store.set("ostraca-theme", t === "system" ? null : t);
  document.querySelectorAll("[data-theme-set]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeSet === (root.dataset.theme || "system"))));
}
/* A switch the eye can see wipes the new theme down over the old one (the
   theme wipe in site.css). Rapid clicks skip the running wipe and start
   another, so only the latest one clears the attribute. While one runs, every
   switch goes through a transition too: a running wipe may not have applied
   its theme yet, and a switch made at once would land before it and lose.
   Without view transitions, or with reduced motion, the theme changes at once. */
const shown = (t) => (t === "light" || t === "dark" ? t : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
let wipeId = 0;
function switchTheme(t) {
  const wiping = "themeWipe" in root.dataset;
  if (!wiping && (shown(t) === shown(root.dataset.theme) || typeof document.startViewTransition !== "function" || matchMedia("(prefers-reduced-motion: reduce)").matches)) return setTheme(t);
  const id = ++wipeId;
  root.dataset.themeWipe = ""; // before the old picture is taken: the stylesheet keys off it
  document.startViewTransition(() => setTheme(t)).finished.catch(() => {}).finally(() => { if (id === wipeId) delete root.dataset.themeWipe; });
}
document.querySelectorAll("[data-theme-set]").forEach((b) => b.addEventListener("click", () => switchTheme(b.dataset.themeSet)));
setTheme(root.dataset.theme || "system");

/* ---- Copy buttons --------------------------------------------------------- */
async function copyText(text, btn, done = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const t = document.createElement("textarea");
    t.value = text; t.style.position = "fixed"; t.style.opacity = "0";
    document.body.append(t); t.select();
    try { document.execCommand("copy"); } catch {}
    t.remove();
  }
  if (!btn) return;
  clearTimeout(btn._t);
  btn.dataset.done = "";
  if (btn.classList.contains("copy-icon")) {
    // An icon button keeps its markup: data-done swaps the icon for the check
    // in the stylesheet, and the live region says what happened. Emptied
    // first, so a second copy is announced again.
    const said = document.querySelector("[data-copy-said]");
    if (said) { said.textContent = ""; setTimeout(() => { said.textContent = done; }, 50); }
    btn._t = setTimeout(() => { delete btn.dataset.done; if (said) said.textContent = ""; }, 1600);
    return;
  }
  const label = btn.dataset.label || btn.textContent;
  btn.dataset.label = label;
  btn.textContent = done;
  btn._t = setTimeout(() => { btn.textContent = label; delete btn.dataset.done; }, 1600);
}
document.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", () => copyText(b.dataset.copy, b)));
document.querySelectorAll("pre.code").forEach((pre) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "btn copy"; b.textContent = "Copy";
  b.addEventListener("click", () => copyText(pre.querySelector("code").textContent, b));
  pre.append(b);
});

/* ---- Arrival: plan first, then ink (home) --------------------------------
   The street sits below the hero sheet, so it waits as its plan until it is
   in view. data-street tells the page's fallback (which inks it after 6s if
   this script never runs) that the street is in hand. */
if (root.classList.contains("arriving")) {
  const street = [...document.querySelectorAll(".street [data-art]")];
  street.forEach((el, k) => el.style.setProperty("--arrive-at", `${k * 170}ms`));
  const inked = (street.length - 1) * 170 + 1500;
  const seen = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    seen.disconnect();
    setTimeout(() => {
      root.classList.add("inking");
      root.classList.remove("arriving");
      setTimeout(() => root.classList.remove("inking"), inked);
    }, 450);
  }, { threshold: 0.4 });
  root.dataset.street = "";
  seen.observe(document.querySelector(".street"));
}

/* ---- Figures: adopt the server markup ------------------------------------ */
const arts = new Map();
const extra = new Map();
async function figureFor(el) {
  if (!el.dataset.module) return el.dataset.art;
  if (!extra.has(el.dataset.module)) extra.set(el.dataset.module, import(el.dataset.module).then((m) => m.default));
  return extra.get(el.dataset.module);
}
await Promise.all([...document.querySelectorAll("[data-art]")].map(async (el) => {
  const opts = JSON.parse(el.dataset.opts || "{}");
  arts.set(el, mount(el, await figureFor(el), opts));
}));

/* ---- The hero sheet (home) ------------------------------------------------
   The figure on the stage goes through the states as an app would pass them:
   set out, rising as the value climbs, built, signed off, revised, out of
   true. Then the sheet goes to the next figure, set out again. A state picked
   in the title block holds there until Play. The run waits while the sheet is
   off screen or the tab is hidden, and starts paused under reduced motion. */
const hero = document.querySelector("[data-hero]");
if (hero) {
  const { cast, remarks } = JSON.parse(hero.dataset.hero);
  const stage = hero.querySelector("[data-hero-stage]");
  const picks = [...hero.querySelectorAll("[data-hero-state]")];
  const play = hero.querySelector("[data-hero-play]");
  const nameLink = hero.querySelector("[data-hero-name]");
  const codeOut = hero.querySelector("[data-hero-code]");
  const remarkOut = hero.querySelector("[data-hero-remark]");
  const RISE = 10; // loading climbs in tenths
  const RUN = [
    [{ state: "empty" }, 1900],
    ...Array.from({ length: RISE + 1 }, (_, k) => [{ state: "loading", value: k / RISE }, k === RISE ? 700 : 280]),
    [{ state: "idle" }, 1700],
    [{ state: "success" }, 2300],
    [{ state: "changed", rev: "2.4" }, 2700],
    [{ state: "error" }, 3400],
  ];
  // Where a picked state lands, and where Play goes on from.
  const PICK = Object.fromEntries(picks.map(({ dataset: { heroState: s } }) => [s, RUN.findIndex(([o]) => o.state === s && (s !== "loading" || o.value === 0.6))]));

  let who = 0, at = 0, timer = 0;
  let layer = stage.querySelector(".hs-layer");
  let art = arts.get(layer.querySelector("[data-art]"));
  let paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let onScreen = true;

  const code = (name, o) => {
    const attr = (k, v) => ` <i>${k}</i>=<b>${v}</b>`;
    return `&lt;Ostraca${attr("name", `"${name}"`)}${attr("state", `"${o.state}"`)}${o.value != null ? attr("value", `{${o.value}}`) : ""}${o.rev ? attr("rev", `"${o.rev}"`) : ""} <i>crew</i> /&gt;`;
  };
  const show = ([o]) => {
    art.update({ value: undefined, rev: "", ...o });
    picks.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.heroState === o.state)));
    codeOut.innerHTML = code(cast[who].name, o);
    remarkOut.textContent = remarks[o.state];
  };
  // The next figure comes on set out over the last one, which fades.
  const nextFigure = () => {
    who = (who + 1) % cast.length;
    const f = cast[who];
    const el = document.createElement("div");
    el.className = "hs-layer";
    el.style.cssText = f.style;
    el.dataset.entering = "";
    const mounted = mount(el, f.name, { state: "empty", crew: true });
    stage.append(el);
    const old = layer;
    old.dataset.leaving = "";
    setTimeout(() => old.remove(), 600);
    requestAnimationFrame(() => requestAnimationFrame(() => delete el.dataset.entering));
    layer = el; art = mounted;
    nameLink.href = f.href;
    nameLink.querySelector("b").textContent = f.title;
    nameLink.querySelector("span").textContent = f.no;
  };
  const step = () => {
    clearTimeout(timer);
    if (paused || !onScreen || document.hidden) return;
    show(RUN[at]);
    timer = setTimeout(() => {
      at = (at + 1) % RUN.length;
      if (at === 0) nextFigure();
      step();
    }, RUN[at][1]);
  };
  const setPaused = (p) => {
    paused = p;
    play.toggleAttribute("data-paused", p);
    play.querySelector("span").textContent = p ? "Play" : "Pause";
    p ? clearTimeout(timer) : step();
  };

  play.addEventListener("click", () => setPaused(!paused));
  picks.forEach((b) => b.addEventListener("click", () => {
    at = PICK[b.dataset.heroState];
    setPaused(true);
    show(RUN[at]);
  }));
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; onScreen ? step() : clearTimeout(timer); }).observe(stage);
  document.addEventListener("visibilitychange", () => (document.hidden ? clearTimeout(timer) : step()));
  setPaused(paused);
}

/* ---- The page-wide switch (figures index) -------------------------------- */
const sw = document.querySelector("[data-switch]");
if (sw) {
  const LOAD = 0.6;
  let state = store.get("ostraca-state") || "idle";
  let crew = store.get("ostraca-crew") === "on";
  const apply = () => {
    sw.querySelectorAll("[data-state-set]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.stateSet === state)));
    sw.querySelector("[data-workers]").checked = crew;
    for (const art of arts.values()) art.update({ state, crew, value: state === "loading" ? LOAD : undefined });
  };
  sw.querySelectorAll("[data-state-set]").forEach((b) => b.addEventListener("click", () => {
    state = b.dataset.stateSet; store.set("ostraca-state", state); apply();
    const seg = b.parentElement;
    if (seg.scrollWidth > seg.clientWidth) seg.scrollTo({ left: b.offsetLeft - seg.clientWidth / 2 + b.offsetWidth / 2, behavior: "smooth" });
  }));
  sw.querySelector("[data-workers]").addEventListener("change", (e) => { crew = e.target.checked; store.set("ostraca-crew", crew ? "on" : "off"); apply(); });
  if (state !== "idle" || crew) apply();
}

/* ---- The skill's example ------------------------------------------------- */
const ex = document.querySelector("[data-example]");
if (ex) {
  const art = arts.get(ex.closest("figure").querySelector("[data-art]"));
  ex.querySelectorAll("[data-example-state]").forEach((b) => b.addEventListener("click", () => {
    const state = b.dataset.exampleState;
    ex.querySelectorAll("[data-example-state]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    art.update({ state, value: state === "loading" ? 0.5 : undefined });
  }));
}

/* ---- A figure's sheet ---------------------------------------------------- */
const sheet = document.querySelector("[data-sheet]");
if (sheet) {
  const el = sheet.querySelector("[data-art]");
  const art = arts.get(el);
  const name = el.dataset.art;
  const remarks = JSON.parse(sheet.dataset.remarks);
  const q = (s) => sheet.querySelector(s);
  const crewBox = q("[data-workers]"), revIn = q("[data-rev]"), figIn = q("[data-measure]");
  const known = q("[data-progress-known]"), how = q("[data-how]"), howOut = q("[data-how-out]");
  const unit = sheet.dataset.unit || undefined;

  const opts = () => {
    const state = q('input[name="state"]:checked')?.value || "idle";
    const o = { state, crew: crewBox.checked };
    if (state === "loading" && known.checked) o.value = Number(how.value) / 100;
    if (revIn?.value.trim()) o.rev = revIn.value.trim();
    if (figIn?.value.trim()) {
      const v = figIn.value.trim();
      const num = (x) => (/^-?\d+(\.\d+)?$/.test(x) ? Number(x) : x);
      const value = sheet.dataset.series != null ? v.split(/[\s,]+/).filter(Boolean).map(Number).filter(Number.isFinite) : num(v);
      o.figure = { value, ...(unit ? { unit } : {}) };
    } else o.figure = null;
    return o;
  };
  const sync = () => {
    const o = opts();
    art.update({ ...o, value: o.value, rev: o.rev, figure: o.figure });
    q("[data-remark]").textContent = remarks[o.state];
    q("[data-rev-cell]").textContent = o.rev || "A";
    q("[data-loading-only]").hidden = o.state !== "loading";
    how.disabled = !known.checked;
    howOut.textContent = known.checked ? `${how.value}%` : "Not known";
    const props = [`state="${o.state}"`];
    const args = [`state: "${o.state}"`];
    if (o.value != null) { props.push(`value={${o.value}}`); args.push(`value: ${o.value}`); }
    if (o.rev) { props.push(`rev="${o.rev}"`); args.push(`rev: "${o.rev}"`); }
    if (o.crew) { props.push("crew"); args.push("crew: true"); }
    q("[data-react]").textContent = `<Ostraca name="${name}" ${props.join(" ")} />`;
    q("[data-html]").textContent = `mount(el, "${name}", { ${args.join(", ")} })`;
  };
  sheet.addEventListener("input", sync);
  sheet.addEventListener("change", sync);
  // A state can come in on the hash: /figures/inbox#error
  const h = location.hash.slice(1);
  const radio = h && q(`input[name="state"][value="${CSS.escape(h)}"]`);
  if (radio) radio.checked = true;
  sync();

  /* Copy and download: drawn fresh with the same options, with transitions
     off, then flattened so it stands alone without the stylesheet. */
  const flat = () => {
    const stage = document.createElement("div");
    stage.className = "flat-stage";
    stage.style.cssText = "position:fixed;left:-10000px;top:0;width:760px;opacity:0;pointer-events:none";
    stage.innerHTML = render(name, opts());
    document.body.append(stage);
    const svg = stage.querySelector("svg");
    const out = flatten(svg);
    stage.remove();
    return out;
  };
  const theme = () => (root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  q("[data-copy-svg]").addEventListener("click", (e) => copyText(flat(), e.currentTarget, "Copied SVG"));
  q("[data-download-svg]").addEventListener("click", () => {
    const o = opts();
    const blob = new Blob([flat()], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ostraca-${name}-${o.state}${o.crew ? "-crew" : ""}-${theme()}.svg`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
}

/* The flatten() from docs/usage.md, plus the paper behind it. */
function flatten(svg) {
  const root = svg.getCTM().inverse();
  const px = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  // Colours come back as rgb plus a separate opacity, which every SVG reader takes.
  const paint = (c) => {
    if (!c || c === "none") return ["none", 1];
    px.clearRect(0, 0, 1, 1); px.fillStyle = c; px.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = px.getImageData(0, 0, 1, 1).data;
    return a ? [`rgb(${r},${g},${b})`, +(a / 255).toFixed(3)] : ["none", 1];
  };
  const rgb = (c) => paint(c)[0];
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
  for (const el of svg.querySelectorAll("path, line, rect, circle, ellipse, polyline, polygon, text")) {
    if (el.closest("title, desc")) continue;
    const o = shown(el);
    if (o < 0.01) continue;
    const s = getComputedStyle(el), m = root.multiply(el.getCTM());
    const copy = el.cloneNode(true);
    copy.removeAttribute("class"); copy.removeAttribute("style");
    if (el.tagName === "path" && s.d && s.d.startsWith("path(")) copy.setAttribute("d", s.d.slice(6, -2));
    copy.setAttribute("transform", `matrix(${[m.a, m.b, m.c, m.d, m.e, m.f].map((v) => +v.toFixed(3))})`);
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
  const vb = svg.getAttribute("viewBox");
  const [x, y, w, h] = vb.split(/\s+/).map(Number);
  const paper = rgb(getComputedStyle(document.body).backgroundColor);
  const label = svg.getAttribute("aria-label");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w * 2}" height="${h * 2}"${label ? ` role="img" aria-label="${label.replace(/"/g, "&quot;")}"` : ""}><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${paper}"/>${out.join("")}</svg>`;
}
