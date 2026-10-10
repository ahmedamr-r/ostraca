/* ===========================================================================
   Ostraca. Illustrations for every state a product is in.

     render(name, opts)       -> an <svg> string; no DOM needed (SSR, email, files)
     mount(el, name, opts)    -> { update(opts), destroy() }; updates animate
     figures                  -> [{ name, title, shelf, use, states? }]
     STATES                   -> ["idle", "empty", "loading", "success", "changed", "error"]
     define(description)      -> add a figure of your own

   opts:
     state       one of STATES (default "idle")
     value       0..1 for loading; leave it out when nobody knows how far
     rev         the app's real version, carried by changed ("2.4", "B")
     figure      { value, unit } a real measure, for figures that draw one
     crew        true puts the workers on site (default false)
     lettered    a short word lettered on the drawing in the drawn pen (A to Z)
     title       the accessible name (default: the figure's title and state)
     decorative  true hides it from assistive tech
     dir         "rtl" mirrors the drawing, not its lettering or figures
     color       any CSS colour for the drawing's lines (default: --ostraca-thing)
     crewColor   any CSS colour for the workers (default: --ostraca-crew)
     paperColor  any CSS colour for the paper under the drawing (default: --ostraca-paper)
   =========================================================================== */
import { defineFigure, STATES } from "./engine/figure.js";
import { renderFigure, stateVars, makeCtx } from "./engine/compose.js";
import { checkParts } from "./engine/figure.js";
import * as registry from "./figures/index.js";

export * from "./engine/svg.js";
export * from "./engine/poses.js";
export * from "./engine/lettering.js";
export * from "./engine/marks.js";
export { sag, when } from "./engine/compose.js";
export { STATES };

const table = new Map();
for (const d of Object.values(registry)) table.set(d.name, defineFigure(d));

/** Every figure in the library (and any you defined), for menus and docs. */
const listed = ({ name, title, shelf, use, measures, states }) => ({ name, title, shelf, use, ...(measures ? { measures } : {}), ...(states.length < STATES.length ? { states } : {}) });
export const figures = [...table.values()].map(listed);

/** Add a figure of your own. Returns the checked description. */
export function define(description) {
  const fig = defineFigure(description);
  if (!table.has(fig.name)) figures.push(listed(fig));
  table.set(fig.name, fig);
  return fig;
}

function resolve(f) {
  if (typeof f === "string") {
    const fig = table.get(f);
    if (!fig) throw new Error(`ostraca: no figure "${f}". Figures: ${[...table.keys()].join(", ")}`);
    return fig;
  }
  return table.get(f?.name) === f ? f : defineFigure(f);
}

/* A colour is written into a style attribute, so it may not carry a ; or markup. */
function colour(v, key) {
  if (v == null || v === "") return "";
  const s = String(v).trim();
  if (/[;{}<>"'\\]/.test(s)) throw new Error(`ostraca: ${key} "${s}" is not a colour`);
  return s;
}

function normalize(o = {}, fig) {
  // fig.states keeps the order of STATES, so this is idle whenever it draws idle.
  const state = o.state ?? fig.states[0];
  if (!STATES.includes(state)) throw new Error(`ostraca: state "${state}" is not one of ${STATES.join(", ")}`);
  if (!fig.states.includes(state)) throw new Error(`ostraca: figure "${fig.name}" draws only ${fig.states.join(", ")}, not "${state}"`);
  return {
    state,
    value: typeof o.value === "number" && Number.isFinite(o.value) ? o.value : undefined,
    rev: o.rev == null ? "" : String(o.rev),
    figure: o.figure ?? null,
    crew: !!o.crew,
    lettered: o.lettered ? String(o.lettered) : "",
    title: o.title ?? "",
    decorative: !!o.decorative,
    dir: o.dir === "rtl" ? "rtl" : "ltr",
    color: colour(o.color, "color"),
    crewColor: colour(o.crewColor, "crewColor"),
    paperColor: colour(o.paperColor, "paperColor"),
  };
}

/** The figure as an <svg> string. */
export function render(f, opts) {
  const fig = resolve(f);
  return renderFigure(fig, normalize(opts, fig));
}

const supportsD = () => typeof CSS !== "undefined" && CSS.supports?.("d", 'path("M0 0")');

/**
 * Draw into `el` and keep it: update(opts) merges new opts and moves the
 * drawing to them by attributes, so the change animates. If `el` already
 * holds this figure's markup (from render() on the server), it is adopted.
 */
export function mount(el, f, opts) {
  const fig = resolve(f);
  let cur = normalize(opts, fig);
  const own = () => el.querySelector(`svg.ostraca[data-figure="${fig.name}"]`);
  if (!own()) el.innerHTML = renderFigure(fig, cur);
  const tpl = el.ownerDocument.createElement("template");

  function settleSag() {
    if (supportsD()) return;
    const err = cur.state === "error";
    el.querySelectorAll(".sag").forEach((p) => {
      const m = p.getAttribute("style")?.match(err ? /--d1:path\('([^']*)'\)/ : /--d0:path\('([^']*)'\)/);
      if (m) p.setAttribute("d", m[1]);
    });
  }

  function update(next = {}) {
    const prev = cur;
    cur = normalize({ ...prev, ...next }, fig);
    tpl.innerHTML = renderFigure(fig, cur);
    const fresh = tpl.content.firstElementChild;
    const old = own();
    if (!old || prev.dir !== cur.dir) { el.replaceChildren(fresh); settleSag(); return; }
    for (const a of ["role", "aria-label", "aria-hidden", "focusable", "style"]) {
      fresh.hasAttribute(a) ? old.setAttribute(a, fresh.getAttribute(a)) : old.removeAttribute(a);
    }
    const t0 = old.querySelector(":scope > title"), t1 = fresh.querySelector(":scope > title");
    if (t1 && t0) t0.textContent = t1.textContent;
    else if (t1) old.prepend(t1.cloneNode(true));
    else t0?.remove();
    // The sub: attributes copied over, and a duration that fits the distance.
    const a = old.querySelector(".ostraca-sub"), b = fresh.querySelector(".ostraca-sub");
    const from = parseFloat(a.style.getPropertyValue("--ostraca-built")) || 0;
    const to = parseFloat(b.style.getPropertyValue("--ostraca-built")) || 0;
    const N = parseFloat(b.style.getPropertyValue("--n")) || 1;
    b.style.setProperty("--ostraca-t", `${Math.round(Math.max(240, Math.abs(to - from) * N * 240))}ms`);
    for (const { name } of [...a.attributes]) if (!b.hasAttribute(name)) a.removeAttribute(name);
    for (const { name, value } of [...b.attributes]) if (a.getAttribute(name) !== value) a.setAttribute(name, value);
    // Layers: only those whose markup changed are replaced.
    fresh.querySelectorAll("[data-slot]").forEach((s) => {
      const o = old.querySelector(`[data-slot="${s.dataset.slot}"]`);
      if (o && o.innerHTML !== s.innerHTML) o.innerHTML = s.innerHTML;
    });
    settleSag();
  }

  settleSag();
  return {
    update,
    destroy() { el.replaceChildren(); },
    get opts() { return { ...cur }; },
  };
}

/** For tools: the checked parts a figure draws, in the given opts. */
export function inspect(f, opts) {
  const fig = resolve(f);
  const o = normalize(opts, fig);
  const parts = checkParts(fig, fig.draw(makeCtx(fig, o)));
  return { figure: fig, parts, vars: stateVars(fig, parts, o) };
}
