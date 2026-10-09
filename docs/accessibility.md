# Accessibility

## A name for every drawing

Each drawing is an `<svg role="img">` with an `aria-label` and a `<title>` saying the same thing. With no `title` option, the name is the figure's title and its state:

| Options | Name |
| --- | --- |
| `{ }` | Inbox |
| `{ state: "empty" }` | Inbox, empty |
| `{ state: "loading" }` | Inbox, loading |
| `{ state: "loading", value: 0.25 }` | Inbox, loading, 25 percent |
| `{ state: "success" }` | Inbox, done |
| `{ state: "changed", rev: "2.4.1" }` | Inbox, changed, now 2.4.1 |
| `{ state: "error" }` | Inbox, something went wrong |

Most of the time you know more than the drawing does, so say it:

```js
render("inbox", { state: "empty", title: "No messages yet" });
```

The title is also the tooltip some browsers show on hover, so write it for a reader.

## Decorative drawings

Most empty states already say what happened in a heading next to the drawing. Then the drawing repeats it, and a screen reader would read it twice. Mark it decorative:

```jsx
<Ostraca name="inbox" state="empty" decorative />
<h2>No messages yet</h2>
```

A decorative drawing gets `aria-hidden="true"` and `focusable="false"`, and no title.

## State changes are not announced

When a mounted drawing moves to a new state, its name changes with it. Screen readers do not announce a change to an image, so a reader will not hear that the upload finished from the drawing alone. Announce it in your own text, in a live region:

```html
<div id="upload-art"></div>
<p role="status" id="upload-status"></p>
```

```js
art.update({ state: "success" });
status.textContent = "Upload complete";
```

In that setup the drawing can be decorative.

## Reduced motion

Under `prefers-reduced-motion: reduce`:

- every state lands at once, with no transitions
- the plumb bob does not swing
- the gin wheel's bucket holds still
- the workers keep to one drawing

Nothing is left out. The drawing shows the same state, built to the same value, with the same marks.

With motion on, the gin wheel and the workers are the only things that move without a state change. The gin wheel only runs in `loading` with no value, and the workers are off unless you turn them on.

## Right to left

```js
render("tin-can-line", { state: "error", dir: "rtl" });
```

`dir: "rtl"` mirrors the drawing, so it faces into a right to left layout the way it faces into a left to right one. The drawing reads the same: the subject, the scaffold and the crew swap sides together.

What does not mirror:

- **Dimension figures** (a count, a file size, a version in the triangle) read left to right, as numbers do in Arabic and Hebrew interfaces.
- **Lettering** stays in Latin capitals reading left to right. It moves to the other side of the figure, and its arrow is left off.

Ostraca does not read `dir` from the page. Pass it yourself:

```js
render("inbox", { dir: document.dir === "rtl" ? "rtl" : "ltr" });
```

## Contrast

The lines are one pixel wide. Against the default paper:

| Colour | Light | Dark |
| --- | --- | --- |
| Things (`--ostraca-thing`) | 3.6 : 1 | 6.2 : 1 |
| Workers (`--ostraca-crew`) | 11.8 : 1 | 9.3 : 1 |
| Ground (`--ostraca-ground`) | 1.9 : 1 | 2.7 : 1 |

The blue clears the 3 : 1 that WCAG asks of graphics in both modes. The ground line is quieter on purpose: it is a reference line and nothing depends on seeing it. Secondary detail at `--ostraca-faint`, such as the inside lines of a set-out, sits lower again.

Two things to watch:

- **Dimension figures are text**, set in the mono face at 10 units in the blue. In light mode that is 3.6 : 1, under the 4.5 : 1 WCAG asks of small text. If a number on the drawing matters, say it in your own text as well, or darken `--ostraca-thing`.
- **Your own colours.** When you [retheme](theming.md), check `--ostraca-thing` against `--ostraca-paper` at 3 : 1 or more. One pixel lines lose contrast faster than filled shapes.

Lettering drawn with the pen is a picture of words. It has a hidden text twin inside the `<svg>`, but a drawing with `role="img"` is read by its name, so put anything the reader must know in `title` or in your own text.
