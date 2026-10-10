# Agent skill

Your product needs its own objects. The Ostraca skill teaches a coding agent to draw any of them in the Ostraca hand, check it against the rules and show you the result before you use it. The ready-drawn figures are there to use as they are, to start from, and to show the hand.

## Install

```sh
npx skills add ahmedamr-r/ostraca
```

This adds the `ostraca` skill to your agent. It works in any agent that reads `SKILL.md` skills, such as Claude Code.

It needs Node 22 and Google Chrome or Chromium on the machine, for the checks and the contact sheets. There is nothing else to install.

## Call it

Ask your agent for an illustration, for an empty state, an upload screen, a 404 or anything else in your product, and it reaches for the skill. Or call it by name:

```
/ostraca coffee cup
```

Name an object and the agent draws it. Name a moment instead and it offers you two or three objects to pick from:

```
/ostraca something for a fitness app
```

> 1. A barbell on its rack: workouts, a personal best, a missed session. Builds rack, bar, plates; the cloud goes round the outer plate; it sags.
> 2. A water bottle on a bench: daily goals, a streak kept. Builds bench, bottle, cap; the cloud goes round the cap; it leans.
> 3. A treadmill from the side: a run in progress, a plan finished. Builds deck, uprights, console; the cloud goes round the console; it leans.

You pick one, and it carries on. Check the [figures](options.md#figures) first: the thing you want may already be on a shelf.

### The options it asks for

Before it draws, the agent asks what you need, in one message, with a default for each. Say "the defaults" and it draws all six states as a figure. Anything your request already said, it does not ask again.

| Option | Choices | Default |
| --- | --- | --- |
| States | All six, or any of `idle`, `empty`, `loading`, `success`, `changed` and `error` | All six |
| Output | A figure for your app, or one standalone SVG picture | A figure |
| Theme, for a picture | Light, dark or both | Both |
| Workers, for a picture | On or off | Off |
| Background, for a picture | The paper colour, or transparent | Transparent |
| Colours, for a picture | The library's, or any CSS colour for the lines, the workers and the paper | The library's |

A figure does not need the last four: your app passes them when it draws it, with `crew`, `color`, `crewColor`, `paperColor` and your page's `color-scheme`.

### Only the states you need

A figure draws all six states unless you say otherwise. Name the ones you need and the agent draws only those, which is less to draw and less to check:

```
/ostraca coffee cup, empty only
```

```
/ostraca a parcel locker for the done and error screens of checkout
```

The figure file says so with `states: ["empty"]`, and leaves out every part only the other states use: an empty only figure has no revision cloud, tick, plumb line or scaffold. A state can be added later by adding its parts.

### Just the picture

Ask for an image instead of a figure, for a design file, a slide, an email or an `<img>`, and the agent hands you one standalone SVG of the state you asked for:

```
/ostraca a coffee cup for our empty orders page, as an svg
```

The file needs no stylesheet and no JavaScript: every line has its colour written on it. It comes in light, dark or both, with or without the workers and the paper behind it, in the library's colours or yours.

## What it does

1. **Pins the subject and asks for your options.** The object, the product moments it serves, how it builds bottom first, which part changes, and whether it leans or sags when something goes wrong. Then the states, a figure or a picture, and for a picture how it should look.
2. **Writes one description file.** Geometry only: the pieces in build order, the dashed set-out, where the tick and the cloud land, where the workers stand, or only the parts the states you asked for use. The engine draws the states from it, so the file has no state code.
3. **Checks it.** Every state it draws, workers on and off, mirrored, at no value and at 0 and 1. A broken rule fails the check, and the agent fixes it.
4. **Draws contact sheets and looks at them.** Light and dark, every state it draws, then a list of questions on the actual pixels: can you name the object at 240px, is the bottom half built at 0.5, does the tick stay inside the frame. It expects two or three passes.
5. **Hands it over.** The file, or the standalone SVG if you asked for a picture, with the sheets, the choices you might want changed, and what it did not verify (it looks at each state at rest, so it says when it has not watched the motion).

Then you add the figure to your app with `define()`:

```js
import { define, render } from "ostraca";
import cup from "./coffee-cup.js";

define(cup);
el.innerHTML = render("coffee-cup", { state: "loading", value: 0.4 });
```

After `define()`, the new figure works everywhere a library figure does: `render()`, `mount()`, the React component and the `figures` list. A figure that draws fewer states starts on its first one, lists them in `figures`, and throws if asked for a state it does not draw.

For another picture of the same figure, in a different state or theme, run the skill's sheet script on the file:

```sh
node sheet.mjs coffee-cup.js --svg empty --theme light --paper
```

## What it will not do

The skill keeps to the library's grammar. Ask it for any of these and it will say which rule is in the way and offer what the drawing can do instead:

- **Perspective or isometric views.** Every figure is a flat elevation on a ground line.
- **Shading, gradients, shadows or glows.** The paper is the only fill.
- **New colours or a second line weight.** Things in blueprint blue, people in the text ink, detail by opacity.
- **A new mark, or an old mark with a new meaning.** The tick always means signed off, the cloud always means revised.
- **Brands or logos.** Nothing a reader could take for a real product.
- **Made up numbers.** A number on a drawing comes from your app through `figure` or `rev`, or it is not there.
- **Words of the figure's own.** Lettering comes from the `lettered` option, in the drawn pen.
- **New poses.** It places the nine workers that exist.
- **Changes to the engine.** It writes the description file and nothing else.

## Inside the skill

The skill folder holds what the agent reads and runs: the instructions, the figure contract, a reference of what each mark means, two worked examples (an inbox that leans and a laptop that sags), the engine in one file, and the check and sheet scripts. You can read them on [GitHub](https://github.com/ahmedamr-r/ostraca/tree/main/skills/ostraca).
