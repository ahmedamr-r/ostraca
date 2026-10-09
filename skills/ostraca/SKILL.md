---
name: ostraca
description: Draw a new Ostraca figure, an everyday object as a flat line elevation on a ground line that the Ostraca engine turns into six product states (idle, empty, loading, success, changed, error). Use when someone asks for a new Ostraca figure, an illustration in the Ostraca style, or a hand drawn blueprint style empty, loading or error state illustration for a product.
argument-hint: "[subject]"
---

# Ostraca figures

Ostraca is an open illustration library. Every figure is an everyday object drawn as a flat elevation on a ground line, in one fine line, blueprint blue on cream paper. A figure is a single description file. The engine reads it and draws all six states from it:

| State | Drawn as |
| --- | --- |
| `idle` | built: solid, nothing happening |
| `empty` | set out: a dashed outline, contents faint |
| `loading` | rising: inked from the ground up under a ladder or scaffold; with no value, a gin wheel bucket loops |
| `success` | signed off: the access struck, a tick in two strokes |
| `changed` | revised: a revision cloud round one part, the app's version in a triangle |
| `error` | out of true: it leans off a plumb line, or sags under a taut string |

Optional line people (the crew) stand where the description says. They are off by default and every state must read without them.

Your job is the description file. You never write state code, never draw the marks above yourself, and never change the engine.

## What is in this folder

- `contract.md`: the description format, every part, the poses and their points, every helper, the rules, the traps. Read it before writing anything.
- `marks.md`: what each mark means, the inks, what is never drawn, sizes, where the crew stand, and a table of common mistakes.
- `examples/inbox.js`: a subject that leans in error and draws a real count. Start here for anything upright.
- `examples/laptop.js`: a subject that sags in error, every moving part drawn twice. Start here for anything that spans or rests on a surface.
- `examples/coffee-cup.js`: a small object brought up to working height on a stand, written by following this skill.
- `engine.js`: the engine in one file, with no dependencies. `check.mjs` and `sheet.mjs` use it.
- `check.mjs`: checks one figure file. `sheet.mjs`: draws its contact sheets.

Everything runs with Node 22 and Google Chrome or Chromium. Nothing to install. Inside the Ostraca repo you can use the repo's own scripts instead (see the workflow in `contract.md`).

## Steps

### 1. Pin the subject

If the person named a concrete object ("a coffee cup", "a bicycle"), take it and go to step 2.

Otherwise offer two or three readings, one line each, and wait for a pick. Each reading names:

- the object, as it would be drawn from the side or the front;
- the product moment it serves (an empty cart, a sync, an upload that failed);
- how it builds while loading, bottom first;
- the one part the cloud goes round when it changes;
- whether it leans or sags in error.

For example, for "something for a fitness app":

> 1. A barbell on its rack: workouts, a personal best, a missed session. Builds rack, bar, plates; the cloud goes round the outer plate; it sags.
> 2. A water bottle on a bench: daily goals, a streak kept. Builds bench, bottle, cap; the cloud goes round the cap; it leans.
> 3. A treadmill from the side: a run in progress, a plan finished. Builds deck, uprights, console; the cloud goes round the console; it leans.

Never offer an object the library already has: alarm clock, bell, bin, bridge, bust, calendar, camera, card reader, coins, deck chair, door frame, filing cabinet, flip chart, gate, hourglass, inbox, laptop, magnifier, mailbox, market stall, noticeboard, parcel, phone, ramp, receipt, safe, seats, server rack, stair, stove, tin can line, trolley, trophy, wall.

Stick to things anyone owns or has seen. No brand, no logo, no specific product someone could name.

### 2. Write the description file

1. Read `contract.md` and `marks.md`, then read both examples top to bottom.
2. Copy the closer example to `<name>.js` (kebab-case, the thing's plain name) and replace its geometry. Pick the `shelf` from this list: messages, files, people, money, shopping, time, devices, site. Keep its shape: constants at the top measured off one origin, a header comment saying what it is and what it is for, then the description.
3. Draw it at the crew's scale: a worker is 45 tall. If the object is small, stand it on something (a table, a shelf, a stand) that is a still course. Fill `width` 300 to 320, `height` 90 to 135.
4. Write `courses` bottom first, in the order it would be put together. Each solid thing is one closed path with `class="paper"`. Inside detail goes in a separate course or as `faint`.
5. Write `outline` yourself: the profile of every course, still ones too, in one path dashed with `SET_OUT`. Put inside lines in `contents`.
6. Choose `error`. Upright things lean (`foot`, `top`, `lean` of 4 to 6); things that span or rest across supports sag (`string`, and every moving part through `ctx.sag(build(0), build(DROP))`).
7. Set `revise` round one part, `tick` above and clear, `tag` with 25 clear each side, `access` (a ladder for anything under about 80 tall, a scaffold for wide work), and the `stations`. Three placements catch most first drafts: in `empty` nothing is built, so the letterer stands on the ground; the success sitter sits at the other end of the top from the tick, at the top plus 3 when its feet hang over an edge; and the plumb line hangs about 12 out from the top corner on the `foot` side, so keep any table or shelf short on that side.
8. Use only what `ctx` gives you and the nine poses: `sitter`, `leaner`, `carrier`, `shrugger`, `rope`, `hauler`, `pusher`, `letterer`, `caller`. The file imports nothing. 180 lines at most.

Copy rules for `title`, `use` and every comment: sentence case, no em or en dashes, no full stop at the end of `use`, and the crew are "it" or called by pose name, never a gendered pronoun.

### 3. Check, draw the sheet, look

From this folder (or with the paths spelled out):

```sh
node check.mjs path/to/<name>.js
node sheet.mjs path/to/<name>.js
```

`check.mjs` renders every state with the crew off and on, mirrored, with no value and at 0 and 1, and exits 1 on a broken rule. Fix every failure. Read every warning. A clean check means the rules hold; most of what is wrong with a first draft only shows on the sheet.

`sheet.mjs` writes `sheets/<name>-light.png` and `sheets/<name>-dark.png` beside the figure. It starts its own headless Chrome on a free port and stops it after; pass `--port` only to reuse a Chrome you already run with remote debugging, and `--out` to write elsewhere. Open both and go through the look list at the end of `contract.md`, one question at a time, on the actual pixels. The ones that catch most first drafts:

- At 240px with the crew off, can someone name the object?
- Is the bottom half built at loading 0.5, and is the still course in the set-out?
- Does the tick, the tag and `2.4.1` stay inside the frame and off the work and the crew, mirrored too?
- Does the lean go away from the shrugger, or the sag stay above the ground?
- Is every worker's feet on a real edge?

Fix, check, draw again. Expect two or three passes.

### 4. Hand it over

Give the person:

- the file's path;
- the light sheet (and the dark one if anything differs);
- one line on each choice they might want changed: the scale (true or stood on something), lean or sag, what the cloud goes round;
- anything not verified. The sheets show each state at rest; say if you did not watch the motion (`sheet.mjs --motion`), or did not try it in their app.

To use it, the person adds it with `define()`:

```js
import { define, render } from "ostraca";
import cup from "./coffee-cup.js";
define(cup);
el.innerHTML = render("coffee-cup", { state: "loading", value: 0.4 });
```

In the Ostraca repo, put the file under `src/figures/<shelf>/` and run `node scripts/registry.mjs` and `node scripts/check.mjs` instead.

### 5. Revise on request

Revisions change the geometry and leave the marks alone. If the person asks for a mark to mean something new, a colour, a shadow, a perspective view or a word of the figure's own, say which rule in `marks.md` it breaks and offer what the grammar can do instead. After every change run the check and the sheet again and show the new sheet.
