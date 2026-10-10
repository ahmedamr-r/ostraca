# The figure contract

This is how a figure is drawn for Ostraca. A figure is one file under `src/figures/<shelf>/<name>.js`. It describes a subject in geometry. The engine in `src/engine/` turns that description into all six states, so a figure file never contains state code.

Two figures are the worked examples. Copy from them:

- `src/figures/messages/inbox.js`, a subject that leans when something goes wrong (`error: "lean"`), with a real count drawn from the app.
- `src/figures/devices/laptop.js`, a subject that sags when something goes wrong (`error: "sag"`), where every moving part is drawn twice.

## The six states

The API uses product words. The drawing uses drafting marks, and each mark means one thing.

| State | Drawn as | What the engine does with your parts |
| --- | --- | --- |
| `idle` | built | courses solid, nothing else |
| `empty` | set out | `outline` dashed, `contents` faint, no courses |
| `loading` | rising | courses ink in build order as `value` goes from 0 to 1, under `access`; with no value, one course shows and the gin wheel bucket loops |
| `success` | signed off | access struck, a tick in two strokes at `tick` |
| `changed` | revised | a revision cloud round `revise`, a lettered triangle at `tag` carrying `rev` |
| `error` | out of true | `lean`: the courses lean about `foot` off a plumb line; `sag`: every `ctx.sag()` path drops to its second drawing under a taut `string` |

In `error`, the set-out stays where the work should stand.

## Coordinates and sizes

- y grows down. The ground line is y 0, so anything standing on it has a negative y.
- The viewBox is `0 -height width height+depth`. `depth` (default 22) is the room under the ground for hatching.
- A worker is 45 tall, feet at y 0. Draw the subject to that scale: the inbox trays are about 124 by 76, the laptop on its desk about 150 by 110, the wall 196 by 86 with its footing.
- Typical `height`: 90 to 135, leaving room above the subject for a sitter (about 29 tall), the tick and the revision tag. Typical `width`: 300 to 320 for one subject with its crew and access, 460 to 600 for wide ones (wall, bridge, ramp).
- Write coordinates as constants at the top of the file, measured off one origin (`X0`) so the drawing can be moved by changing one number. Pass computed values through `n()`, which rounds to two places.

## The description

```js
export default {
  name: "inbox",          // kebab-case, unique, the file's name
  title: "Inbox",         // sentence case
  shelf: "messages",      // the folder it lives in
  use: "Inbox zero, no messages yet, new mail coming in, a message that failed to send",
  width: 300,
  height: 112,
  depth: 22,              // optional
  travel: { by: [dx, dy], steps: 8 },  // optional: the work moves instead of rising (ramp)
  measures: { what: "Unread messages", sample: 12 },  // optional: what opts.figure carries
  states: ["empty"],      // optional: the states it draws (default all six); see Fewer states
  draw(ctx) { return parts; },
};
```

`draw(ctx)` returns the parts:

| Part | Required | Meaning |
| --- | --- | --- |
| `courses` | yes | Svg strings in build order, bottom first. `{ svg, still: true }` never leans (a footing, a stand). |
| `outline` | yes (check) for empty, loading or error | The set-out, already dashed with `SET_OUT`. Include the still courses: in `empty` nothing is built. |
| `contents` | no | Inside lines of the set-out, drawn faint. |
| `fixed` | no | Always solid, not part of the build (a sledge, bearings, falsework under `when()`). |
| `ground`, `hatch`, `groundLine` | no | Extra ground work; `hatch: [x0, x1]` for earth; `groundLine: false` when the figure draws its own cut (bridge). |
| `foot`, `top` | yes for lean | The corner the work leans about and that side's top y. The work leans toward the side `foot` is on. |
| `error` | yes for error | `"lean"` or `"sag"`. |
| `lean` | no | Degrees, default 6. Use 4 or 5 for tall narrow things. |
| `string` | yes for sag | `[[x0, y0], [x1, y1]]`, the taut line the sag is measured against. |
| `revise` | yes for changed | `[x, y, w, h]`, the one part the cloud goes round. Must sit inside the viewBox. |
| `tag`, `tick` | no | Where the revision triangle and the tick land. Defaults sit off `revise` and `foot`; set them when a worker or the work is in the way. |
| `access` | no | `{ kind: "scaffold", at: [x0, x1] }` or `{ kind: "ladder", at, height, lean }`. Both get the gin wheel. |
| `stations` | no | Where workers stand in each state (below). |
| `letter` | no | `{ at, angle, arrow }`, where `opts.lettered` goes. |
| `extras` | no | Real values drawn with the marks, such as `ctx.dimension(...)`. |

### Fewer states

A figure made for one screen can draw only that screen's state. Name them in `states`, and leave out every part that only the other states use:

| State | Needs, beyond `courses` |
| --- | --- |
| `idle` | nothing |
| `empty` | `outline` (and `contents`) |
| `loading` | `outline`, and `access` with `foot` and `top` for a scaffold, or a ladder `height` |
| `success` | `tick`, or `foot` and `top` for its default |
| `changed` | `revise` (and `tag`) |
| `error` | `outline`, `error`, then `foot`, `top` and `lean`, or `string` |

Stations for states it does not draw are dropped, so give only its own. `render()` starts on the figure's first state (`idle` whenever it draws it), and any other state throws (`figure "cup" draws only empty, not "error"`). The check and the sheets cover only its states. Draw it to the same rules all the same: a figure for one state is still the same object in the same hand, so another state can be added later by adding its parts.

Library figures draw all six: `scripts/check.mjs` fails one that does not, because the catalogue switches every figure through every state. Fewer states are for a figure made for one product.

### The inbox, annotated

```js
// Constants measured off the tray's front edge.
const X0 = 60, L = 124, XB = X0 + L;
const STAND = -7, FLOOR = -10, LIP = -20, BACK = -34;

draw({ n, SET_OUT, rng, seedFrom, rectPath, dimension, opts }) {
  // A real count from the app draws one letter each, up to eight.
  const count = Number.isFinite(opts.figure?.value) ? Math.floor(opts.figure.value) : null;

  // One closed path per solid thing, filled with the paper, so whatever
  // is behind it is knocked out. That is the only fill in the library.
  const tray = (x0, x1, fb, ft, lip, back) =>
    `<path class="paper" d="M${x0} ${fb}V${lip}H${x0 + 3}V${ft}H${x1 - 3}V${back}H${x1}V${fb}Z"/>`;

  return {
    courses: [
      { svg: standSvg, still: true },  // the stand stays put when the trays lean
      tray(X0, XB, STAND, FLOOR, LIP, BACK),
      lowerLetters,                     // painted after the tray, so they lie in it
      posts,                            // painted after the letters, so the near post covers them
      upperTray,
      upperLetters,
    ].filter(Boolean),                  // an empty course is left out, not drawn blank
    outline: `<path d="...both trays and the stand..." stroke-dasharray="${SET_OUT}"/>`,
    foot: [XB, STAND],                  // leans off the stand's back corner, toward the ladder side
    top: UBACK,
    error: "lean",
    lean: 5,
    revise,                             // round the top letter: the one that changed
    access: { kind: "ladder", at: XB + 44, height: 76, lean: 22 },
    extras: count > 8 ? dimension(...) : "",  // past eight, the real number on a chain
    stations: { ... },
  };
}
```

### The laptop, annotated

The sag is drawn, not computed by the engine. Every part that moves in error goes through `ctx.sag(d0, d1, cls)`: the same path builder called twice, once with no drop and once dropped, so both paths have the same commands and the browser tweens between them.

```js
const dip = (x, s) => s * (1 - ((x - XM) / (DW / 2)) ** 2);   // most at the middle
const moves = (build, cls = "") => sag(build(0), build(DROP), cls);

courses: [
  trestle(TRESTLES[0]),            // heads ride the dip, feet stay on the ground
  trestle(TRESTLES[1]),
  moves(board, "paper"),           // the desk top's faces curve down
  moves(box(bx0, DESK - BASE_H, BASE_W, BASE_H), "paper") + moves(keys, "faint"),
  moves(lid, "paper") + moves(screen),
  moves(rows, "faint"),
],
string: [[X0 - 4, DESK], [X0 + DW + 4, DESK]],   // where the desk top should be
```

The laptop is rigid, so it drops by the dip under its own two ends, not by the board's middle. A quadratic's control point sits at twice the drop you want at the middle.

## Stations

```js
stations: {
  empty:   { pose: "letterer", x, y },
  loading: { pose: "carrier", x, y, ride: true },  // ride: on the scaffold board
  waiting: { pose: "hauler", x, y, flip: true },  // loading with no value; holds the gin wheel's fall
  idle:    { pose: "sitter", x, y },
  success: { pose: "sitter", x, y },
  changed: { pose: "letterer", x, y },
  error:   { pose: "shrugger", x, y },
}
```

- Each value is one station, an array, or `null`. `waiting` defaults to `loading`.
- Workers stand on real edges: the ground (y 0), a tread, a desk top, a tray's back. A sitter's `y` is the top of what it sits on when its feet rest on that top too. When its feet hang over an edge, use the top plus 3, so the seat (2, -3) lands on the edge and the sitter does not float.
- Poses face left. `flip: true` faces right.
- Crew is off by default in the package. Every state must read without a worker.
- A worker may stand behind the work, never in front of the part the state is about.

### Poses and their points

Points are in the pose's own frame: feet at y 0, facing left, before flip. Map one into the drawing with `posePoint(pt, x, y, { flip })`. Where the two drawings differ, a is the rest drawing and b the beat.

| Pose | Use | Points |
| --- | --- | --- |
| `sitter` | idle, success | seat (2, -3); feet (-13, 0) hang off the front; hand a (-9, -10), b (-11, -22) |
| `leaner` | idle, error helper | feet (-5, 0) and (6, 0); hand a (-1, -21), b (-4, -34) |
| `carrier` | loading | block a x -22..-8, y -34..-16; b y -40..-22; hand a (-9, -26), b (-9, -31); feet (-7, 0), (8, -2) |
| `shrugger` | error | hands a (-9, -25) and (9, -25); b (-13, -38) and (13, -38) |
| `rope` | holding a line | pulling hand (14, -30); the rope runs off behind |
| `hauler` | waiting, ramp | hand (9, -25) with the rope over the shoulder; leans into the haul |
| `pusher` | ramp | hands (-13, -27) against the load |
| `letterer` | empty, changed | pen tip a (-20.8, -35.4), b (-19.5, -31.5); the pen reaches about 35 up |
| `caller` | tin can line | can x -15..-9, y -40..-35; string leaves from (-15, -37.5) |

A letterer's pen reaches 35 above its feet. Stand it on something (a desk top, a tread) to reach a cloud higher than that.

## Helpers

`ctx` carries every engine export below, plus `opts`, `width`, `height`, `travelled` (0 to 1 for travelling figures), `sag` and `when`.

**Geometry** (`svg.js`)
- `n(v)` rounds to two places.
- `line(x1, y1, x2, y2)`, `rectPath(x, y, w, h)`, `poly(pts, close?)` return path data.
- `sagPath(a, b, sag)` is a quadratic from a to b dropping `sag` at the middle.
- `arrow(x, y, dx, dy)`, `chain(x1, y1, x2, y2, gap?)` return dimension path data.
- `SET_OUT` is the set-out dash, `"4 3"`. `dashed` is the same as an attribute.
- `seedFrom(text)` and `rng(seed)` give seeded randomness, so a drawing is the same on every render.
- `cloudArcs(x, y, w, h, bump?)`, `stepSpring`, `springEasing`, `SPRINGS`, `esc(s)`.

**State** (`compose.js`)
- `sag(d0, d1, cls?)` is a path that becomes `d1` in error. Same commands tween; different commands cross-fade.
- `when(states, svg)` shows svg only in the listed states, space separated (`when("loading", falsework)`).

**Marks** (`marks.js`). The engine already draws tick, cloud, tag, plumb line, string, scaffold, ladder and gin wheel from your parts. Call these only for extras:
- `dimension(x1, y1, x2, y2, figure)`: a chain with a real value set in its gap, in the mono face.
- `hatch(from, to, y?)`, `ground(W, x0?)`, `pegs(xs, { y, h })`, `stringLine(a, b, sag, cls?)`, `trueLine(x0, x1, y)`.
- `tickMark(x, y)`, `cloudMark(rect, tagAt, rev)`, `revisionTag(at, rev)`, `plumbMark(bx, by, len)`, `plumbBracket`, `plumbHang`, `scaffold({...})`, `board(x0, x1)`, `ladder(x, height, { lean, rungs })`, `ginWheel({...})`.

**Crew** (`poses.js`)
- `worker(pose, x, y, { flip, scale, seed })`, `station(states, svg)`, `posePoint(pt, x, y, { flip })`, `POSES`, `POSE_NAMES`, `POSE_POINTS`.

**Lettering** (`lettering.js`)
- `letter(text, x, y, { size, angle, seed, arrowAfter, underline })` returns `{ svg, w }`. A to Z, space and full stop only; anything else is skipped. `GLYPHS`, `LETTERABLE`.

## Rules

1. One line weight. Secondary detail is lower opacity (`opacity="0.35"` to `0.6`, or `class="faint"`), never a second weight.
2. Things draw in `--ostraca-thing` (blueprint blue) through `class="ink"`, which the layers already carry. People draw in the text ink. Do not set colours.
3. The paper is the only fill: `class="paper"` on closed paths that must knock out what is behind them. No shading, gradients, glows, shadows, filters or images.
4. Paint back to front. A later course covers an earlier one, so order courses as they would be built and as they overlap.
5. Flat side or front elevation on the ground line. Never isometric, never a perspective.
6. Lettering only through the drawn pen. `<text>` is allowed for dimension figures (`class="fig"`) and nothing else.
7. No invented numbers. A number on a drawing comes from `opts` (`figure`, `rev`). A drawn quantity with no number on it (five letters in a tray) is fine.
8. No brand marks, no logos, nothing a reader could take for a real product.
9. No state code in a figure. Do not branch on `opts.state`. Reading `opts.value`, `opts.figure` or `opts.crew` to place something is allowed (the stair's carrier climbs to the last tread laid), but a slot drawn from them is replaced on update and snaps instead of animating.
10. Figure files never edit `src/engine/`. Helpers that only one shelf needs go in `src/figures/<shelf>/_parts.js`. The registry skips files starting with `_`.
11. 180 lines or fewer per figure file. Title in sentence case, no dashes in title or use.

## Naming

- File and `name`: kebab-case, the thing's plain name (`tin-can-line`, `door-frame`, `filing-cabinet`).
- `title`: sentence case (`Tin can line`).
- `use`: the product moments it is for, comma separated, no full stop.
- Shelf folders: `messages`, `files`, `people`, `money`, `shopping`, `time`, `devices`, `site`.

## Workflow

```sh
node scripts/registry.mjs                  # writes src/figures/index.js
node scripts/check.mjs --figure inbox      # every state, crew on and off; exits 1 on a broken rule
node scripts/sheet.mjs --figure inbox      # .tmp/sheets/<shelf>/inbox-light.png and -dark.png
```

`sheet.mjs` takes `--port` (default 9470) and starts its own headless Chrome if nothing answers there. It renders reduced motion, so a sheet shows each state at rest.

## Look at every sheet

Open both PNGs and ask:

1. At 240px, crew off, can someone name the subject without the caption?
2. Does `empty` read as planned and not as broken? Is the stand or footing in the set-out?
3. In `loading` at 0.5, is the built half the bottom half? Does the carrier hold the next piece near where it goes?
4. In `loading` with no value, is there a hauler on the gin wheel's fall, and does the fall clear the ladder or scaffold?
5. Does the tick land clear of the work and inside the frame?
6. Does the cloud go round one part, and does the tag stay clear of the work and the letterer, with a long version such as 2.4.1?
7. In `error`, is the dashed set-out still where the work should stand? Does the lean go away from the crew, or does the sag stay above the ground?
8. Is every worker on a real edge, feet on something?
9. Is there anything in front of the part the state is about?
10. In dark, does anything disappear or glow?
11. Mirrored (`dir: "rtl"`), does the tag or the lettering land on a worker?

## Traps

- Valueless attributes are written `=""`, or the markup is not valid XML.
- `sag()` paths must share their commands to tween. Build both from one function.
- Anything drawn from `opts` or `travelled` is replaced on update and snaps. Loading to error keeps the value, so the sag still animates there.
- The default `outline` is the courses dashed; library figures write their own (check requires it).
- A course shows once it is a quarter in: with `value` v and N courses, `ceil(v * N - 0.25)` are visible. Count the same way when a worker follows the build.
- The revision tag widens with a longer version. Leave about 25 units each side of `tag` clear.
- Safari has no CSS `d`, so `mount()` swaps the `d` attribute without a tween.
- Mirrored, the lettering starts at the word's far end and the arrow after it is dropped.
