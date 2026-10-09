# Usage

Ostraca has two calls and one stylesheet.

- `render(name, options)` returns the drawing as an `<svg>` string. It needs no DOM, so it runs on a server, in a build script or in a test.
- `mount(element, name, options)` draws into an element and hands back `update()` and `destroy()`. Updates animate.
- `ostraca/styles.css` holds the colours, the states and the motion. Every drawing needs it on the page.

Figures are named by their kebab-case name: `"inbox"`, `"laptop"`, `"door-frame"`. The list is in [options](options.md#figures), or in code:

```js
import { figures } from "ostraca";

figures.map((f) => f.name);
// ["bell", "bin", "bridge", "bust", ...]
```

## HTML and plain JavaScript

### Render to a string

```js
import { render } from "ostraca";

const svg = render("inbox", { state: "empty" });
document.querySelector("#inbox-art").innerHTML = svg;
```

The string is a complete `<svg class="ostraca">` with a `viewBox`, a `<title>` and an `aria-label`. It scales to the width of its box, so size it with CSS on the wrapper:

```css
#inbox-art { width: 280px; }
```

### Mount and update

When the state will change while the page is open, mount it instead:

```js
import { mount } from "ostraca";

const art = mount(document.querySelector("#upload-art"), "ramp", { state: "empty" });

input.addEventListener("change", () => art.update({ state: "loading", value: 0 }));
xhr.upload.addEventListener("progress", (e) => {
  if (e.lengthComputable) art.update({ value: e.loaded / e.total });
});
xhr.addEventListener("load", () => art.update({ state: "success" }));
xhr.addEventListener("error", () => art.update({ state: "error" }));
```

- `update(options)` merges into the options it already has. `art.update({ value: 0.6 })` keeps the state, and `art.update({ state: "success" })` keeps the value.
- To go back to unknown progress, clear the value: `art.update({ value: undefined })`.
- `art.opts` reads the current options back.
- `destroy()` empties the element.

### Without a bundler

The package is plain ES modules, so an import map is enough:

```html
<link rel="stylesheet" href="/node_modules/ostraca/src/styles.css">
<script type="importmap">
  { "imports": { "ostraca": "/node_modules/ostraca/src/index.js" } }
</script>

<div id="inbox-art"></div>

<script type="module">
  import { mount } from "ostraca";
  mount(document.querySelector("#inbox-art"), "inbox", { state: "empty" });
</script>
```

## React

```jsx
import { Ostraca } from "ostraca/react";
import "ostraca/styles.css";

<Ostraca name="ramp" state="loading" value={0.4} figure={{ value: 1.8, unit: "MB" }} />
```

Every [option](options.md) is a prop. Three more:

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `name` | `string` or a figure description | required | Which figure |
| `as` | element type | `"div"` | The wrapper element |
| `className`, `style` | | | Go on the wrapper, which also carries `ostraca-host` |

Changing `state`, `value`, `rev`, `figure`, `crew`, `lettered`, `title`, `decorative` or `dir` goes through `update()`, so it animates. React renders the markup once and leaves it alone after that. Changing `name` draws the new figure from scratch.

Updates merge, as `update()` does. A prop that disappears keeps its last value, so to clear one, pass it as `undefined` (or `null` for `figure`) instead of leaving it out. The example below does that for `value` and `figure`.

```jsx
function UploadArt({ upload }) {
  const state = upload.failed ? "error" : upload.done ? "success" : upload.started ? "loading" : "empty";
  return (
    <Ostraca
      name="ramp"
      state={state}
      value={upload.total ? upload.sent / upload.total : undefined}
      figure={upload.total ? { value: (upload.total / 1e6).toFixed(1), unit: "MB" } : null}
    />
  );
}
```

### Server rendering

The component is marked `"use client"`, and it still renders on the server. The server sends the full drawing in the HTML, so it shows before any JavaScript runs. In the browser, `mount()` adopts the markup that is already there.

In the Next.js App Router, import it from a server component like any other client component. Outside a framework, `renderToString` gives the same markup.

## Server rendering without React

`render()` on the server, `mount()` in the browser. If the element already holds the same figure, `mount()` adopts it:

```js
// server
import { render } from "ostraca";
const html = `<div id="sync-art">${render("bridge", { state: "loading" })}</div>`;
```

```js
// browser
import { mount } from "ostraca";
const art = mount(document.querySelector("#sync-art"), "bridge", { state: "loading" });
art.update({ state: "success" });
```

Pass the same options on both sides. `mount()` keeps the server's markup and starts from the options you give it.

## Static SVG

`render()` output depends on `ostraca/styles.css`: the colours, the dashes and which state shows are all CSS. In an `<img>`, an email or a file opened on its own, the stylesheet is not there and the drawing comes out wrong.

To get a standalone file, mount the drawing in a browser in the state you want, let it settle, then write every visible line out with its colour and place on it:

```js
// Turn a mounted Ostraca drawing into one standalone SVG: every line that
// shows, with its colour, opacity and place written on it. Run it in a browser.
export function flatten(svg) {
  const root = svg.getCTM().inverse();
  const px = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  // A colour as rgb plus its own opacity, which every SVG reader takes.
  // The dark theme's ground line is see-through, so the alpha matters.
  const paint = (c) => {
    if (!c || c === "none") return ["none", 1];
    px.clearRect(0, 0, 1, 1); px.fillStyle = c; px.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = px.getImageData(0, 0, 1, 1).data;
    return a ? [`rgb(${r},${g},${b})`, +(a / 255).toFixed(3)] : ["none", 1];
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
  const label = svg.getAttribute("aria-label");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${label ? ` role="img" aria-label="${label.replace(/"/g, "&quot;")}"` : ""}>${out.join("")}</svg>`;
}
```

```js
const art = mount(el, "laptop", { state: "error" });
setTimeout(() => {
  const file = flatten(el.querySelector("svg"));
  // save it, copy it, or put it in an <img src="data:image/svg+xml,...">
}, 2500);
```

Wait for the drawing to settle first: the error states swing for about two seconds. Under reduced motion it lands at once. The colours come out the way the page resolved them, so pick light or dark before you flatten. The file has no background: the paper colour is only the fill inside each solid shape, so put it on a matching background or add a `<rect>` behind it.

## Pasting into Figma

Figma reads SVG markup from the clipboard. Paste the output of `flatten()` onto the canvas and it comes in as vector layers, in blueprint blue, with the paper fills as shapes.

```js
await navigator.clipboard.writeText(flatten(el.querySelector("svg")));
```

The raw `render()` string will not paste well. Figma does not run the stylesheet, so every state would land on top of the others.

The strokes come in at 1, the one weight the library uses. If you scale the layers up, check the strokes did not scale with them.

## Server rendering

`render()` is pure. It needs no DOM, no `window` and no fonts, and the same options give the same string every time. The workers' small wobbles come from a seed made from the figure's name, so two servers render the same drawing.

That makes it safe to:

- render on the edge or in a serverless function
- cache by options: the figure's name plus `JSON.stringify(options)` is a complete key
- snapshot test the string

```js
import { render } from "ostraca";

const cache = new Map();
export function art(name, options = {}) {
  const key = name + JSON.stringify(options);
  if (!cache.has(key)) cache.set(key, render(name, options));
  return cache.get(key);
}
```

The string still needs the stylesheet on the page it lands in. For an `<img>`, an email or anywhere else without it, use a [flattened file](#static-svg).

## Errors

Both calls throw on a name or state they do not know, and say which ones they do:

```
ostraca: no figure "nope". Figures: bell, bin, bridge, bust, ...
ostraca: state "busy" is not one of idle, empty, loading, success, changed, error
```
