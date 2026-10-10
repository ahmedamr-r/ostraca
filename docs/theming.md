# Theming

Every colour in a drawing comes from a `--ostraca-*` custom property in `ostraca/styles.css`. Set them on `:root` to change every drawing, or on a wrapper to change one.

```css
.empty-state {
  --ostraca-thing: #3b5bdb;
  --ostraca-paper: #ffffff;
}
```

The defaults are set inside `:where(:root)`, so any rule of yours wins without `!important`.

## From options

For one drawing, pass the colours as options instead. `color` sets `--ostraca-thing`, `crewColor` sets `--ostraca-crew` and `paperColor` sets `--ostraca-paper`, on that drawing only:

```jsx
<Ostraca name="seats" state="success" crew color="#2f6f4f" crewColor="#1c1917" paperColor="#ffffff" />
```

```js
render("seats", { state: "success", crew: true, color: "light-dark(#2f6f4f, #9fd6b6)" });
```

They take any CSS colour, `var()` and `light-dark()` included, and win over any stylesheet. The same advice holds as for the tokens below: the paper should match the surface, and the lines need 3:1 against it.

## The tokens

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--ostraca-thing` | `oklch(57% 0.09 243)` | `oklch(80% 0.075 243)` | Everything built: the subject, the scaffold, the marks, the dimension figures |
| `--ostraca-crew` | `oklch(28% 0.02 72)` | `oklch(93% 0.004 307)` | The workers, in the colour of your text |
| `--ostraca-ground` | `oklch(74% 0.016 80)` | `oklch(100% 0 0 / 0.34)` | The ground line and the earth hatching |
| `--ostraca-label` | `oklch(44% 0.021 72)` | `oklch(83% 0.02 250)` | Text labels in the sans face (`class="lbl"`). No library figure draws one today |
| `--ostraca-paper` | `#eee6d6` | `#1f3b5c` | The one fill: the surface the drawing sits on |
| `--ostraca-temp` | `0.6` | `0.6` | Opacity of temporary work, such as the string line |
| `--ostraca-faint` | `0.35` | `0.35` | Opacity of secondary detail and set-out contents |
| `--ostraca-sans` | `"Cubit Sans", ui-sans-serif, system-ui, sans-serif` | same | Text labels |
| `--ostraca-mono` | `"Cubit Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | same | Dimension figures and the version in the revision triangle |

Light is a cream drafting pad with blue lines. Dark is a blueprint: pale blue lines on deep blue, with the workers in near white.

The fonts are only named, never loaded. Without Cubit Sans and Cubit Mono on the page, the system faces take over, which is fine. Set the two font tokens to your own faces to match your product. The lettering is drawn with a pen and does not use a font at all.

Three more tokens hold the springs for the lean, the plumb bob and the sag: `--ostraca-spring-lean`, `--ostraca-spring-bob` and `--ostraca-spring-sag`. They are `linear()` easings. Leave them alone unless you want a stiffer or looser settle.

## Light and dark

The defaults are written with `light-dark()`, so they follow the `color-scheme` of the page. If your page sets it, the drawings follow:

```css
:root { color-scheme: light dark; }
```

If your dark mode is a class on `<html>`, set `color-scheme` with it:

```css
:root { color-scheme: light; }
:root.dark { color-scheme: dark; }
```

Without any `color-scheme`, the page counts as light and the drawings stay light in dark mode.

To pick colours of your own for each mode, use `light-dark()` too:

```css
:root {
  --ostraca-thing: light-dark(#2f6f4f, #9fd6b6);
  --ostraca-paper: light-dark(#ffffff, #121212);
}
```

## Matching your product

Set two tokens and the drawing belongs to your product:

1. **`--ostraca-paper` to the surface the drawing sits on.** If your empty state is on a white card, the paper is white. Get this one right first: the paper is what knocks out the lines behind each part, and if it differs from the surface, every part shows as a patch of another colour.
2. **`--ostraca-thing` to one of your colours at line weight.** A mid tone of your primary works. The lines are one pixel, so they need more contrast than a filled button would: check it at 3:1 or more against the paper.

```css
.card {
  background: var(--surface);
  --ostraca-paper: var(--surface);
  --ostraca-thing: var(--accent-600);
  --ostraca-crew: var(--text);
}
```

`--ostraca-crew` usually wants to be your text colour, so the workers read like people standing in your interface.

Keep the paper a flat colour. A gradient or an image behind the drawing cannot be matched by one fill, and the knockouts will show.

## Why the paper is the only fill

Each solid part of a figure is a closed outline filled with the paper colour. The fill is there to hide what is behind it: the post in front of a letter, the near trestle in front of the desk. A pen drawing on paper works the same way, and there is no other shading.

There are no tints, shadows, gradients or glows. That keeps three things simple:

- **Three properties to match.** The drawing has two colours of line and one of paper, so fitting it to a product takes three.
- **Dark mode is free.** Swap the paper and the lines, and everything that read in light reads in dark. Nothing was shaded for one background.
- **States stay readable.** The states speak with dashes, opacity and marks. A drawing with shading would have to fight its own tones to show a dashed set-out or a faint inside line.

Secondary detail uses lower opacity (`--ostraca-temp`, `--ostraca-faint`), never a second line weight or a second colour.
