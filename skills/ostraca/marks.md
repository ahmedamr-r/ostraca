# Marks

The visual grammar of an Ostraca figure, as a working reference. The contract (`contract.md`) says what to return from `draw()`; this file says what the result should look like and why.

Ostraca draws the way a site drawing is drawn: a flat elevation of one thing standing on the ground, with the marks a builder would chalk on it. Product states borrow those marks. A loading spinner becomes work rising under a ladder; an error becomes a wall that has gone out of plumb. The reader does not need to know the trade. They need each mark to mean the same thing every time it appears.

## Each mark and its one meaning

The engine draws every mark in this table from your parts. Do not draw them yourself, and never use one for anything else.

| Mark | Meaning | State | Comes from |
| --- | --- | --- | --- |
| Dashed outline (`SET_OUT`, `4 3`) | Planned here, not built yet | `empty`, and under `error` where the work should stand | `outline` |
| Faint inside lines | What will go inside once it is built | `empty` | `contents` |
| Scaffold, or a ladder | Work in progress | `loading` | `access` |
| Gin wheel and bucket on its fall | Still working, nobody knows how far | `loading` with no value (the only loop) | `access` |
| Tick in two strokes, short then long | Signed off | `success` | `tick` |
| Revision cloud round one part | This part changed | `changed` | `revise` |
| Triangle with the version inside, in the mono face | The revision it changed to, the app's real version | `changed` with `rev` | `tag` |
| Plumb line, bob swinging in | Out of true: it leans | `error` with `error: "lean"` | `foot`, `top`, `lean` |
| Taut string with a stop at each end | Out of true: it sags below where it should be | `error` with `error: "sag"` | `string` |
| Dimension chain with a figure in its gap | A real number from the app | any | `extras`, `ctx.dimension()` |
| Short slanted strokes under the ground | Earth, cut or dug | any | `hatch` |
| Ground line | Where everything stands | always | the engine (`groundLine: false` to draw your own cut) |
| Drawn-pen capitals | A word the app passed in | any | `letter`, `opts.lettered` |

A figure may add `extras` that use these marks for a real value (a dimension chain over a stack of letters with the true count). It may not invent new marks. If a state seems to need one, change the description: move the part until an existing mark fits.

## Line, inks and paper

- **One line weight.** Every line is the same weight. Secondary detail drops in opacity (`class="faint"`, or `opacity="0.35"` to `0.6`). Never a `stroke-width`.
- **Two inks, set by the engine.** Things draw in blueprint blue (`--ostraca-thing`), people in the text ink (`--ostraca-crew`). A figure never names a colour.
- **The paper is the only fill.** A solid thing is one closed path with `class="paper"`, so it knocks out whatever is behind it. That is how one part sits in front of another. Cream in light, blueprint in dark.
- **Paint order is build order.** Later courses cover earlier ones. Order the courses the way the thing would be put together and the way its parts overlap.

## Never drawn

- Isometric, three-quarter or perspective views. Flat side or front elevation only.
- Shading, hatching for tone, gradients, glows, shadows, filters, images, patterns, masks.
- A second line weight, a second thing colour, coloured fills.
- Words set in a font (`<text>`), except the figure in a dimension chain.
- Numbers the app did not pass. Five letters in a tray is a drawing; a "5" is a claim.
- Logos, brand shapes, real products, app icons, UI chrome copied from a known product.
- Faces, hands with fingers, clothing detail. The crew are line people.
- A worker in front of the part the state is about.

## Sizes

All in drawing units, ground at y 0, up negative.

| What | Size |
| --- | --- |
| A worker, feet to head | 45 |
| A sitter, seat to head | about 29 |
| A small subject (inbox trays, a cup on a saucer) | 60 to 125 wide, 40 to 80 tall |
| A subject on a desk or stand (the laptop) | about 150 by 110 with its desk |
| `width` for one subject with its crew and access | 300 to 320 |
| `width` for a wide subject (wall, bridge, ramp) | 460 to 600 |
| `height` | 90 to 135, room above for a sitter, the tick and the tag |
| `depth` under the ground | 22 by default |
| Room each side of `tag` | about 25, more for a long version |
| Gap between parallel lines that must read apart at 240px | 3 or more |

Small everyday things raise a choice. Kept true to the worker's scale, a cup is a speck on the ground line, so it needs something to stand on (a table, a shelf, a stand) that brings it up to where the crew can work on it. The laptop and the inbox both do this. Drawn big instead, the thing becomes a monument the crew climb, which suits subjects that are already about building (a stack, a tower of boxes). Choose one and say which.

## How workers stand

The crew are the engine's nine poses. A figure only says where they stand, in `stations`.

- Feet on a real edge: the ground (y 0), a tread, a desk top, a tray's back. A sitter's `y` is the top of the thing it sits on when its feet rest on it too, or the top plus 3 when its feet hang over the edge, so the seat lands on the edge.
- Poses face left. `flip: true` faces right. Face the work.
- `empty`: a `letterer` setting out, on the ground. Nothing is built in `empty`, the still courses included, so there is nothing else to stand on (a figure's `ground` and `fixed` parts are the exception: they are always drawn).
- `loading`: a `carrier` on the ladder or the scaffold board (`ride: true`), holding the next piece near where it goes.
- `waiting` (loading with no value): a `hauler` on the gin wheel's fall, clear of the ladder.
- `idle` and `success`: a `sitter` on top of or at the end of the work, at the opposite end from the tick, so the tick does not land on it.
- `changed`: a `letterer` pointing at the cloud; stand it on something if the cloud is more than 35 up.
- `error`: a `shrugger` beside the plumb line or under the sag, on the side the work leans away from.
- Crew is off by default. Every state must read with nobody there.
- In copy about the crew (comments, captions, docs), never use a gendered pronoun. "The letterer", "the carrier", "it".

## Lettered words

`opts.lettered` is drawn in the pen, never set in a font. The only set type in a figure is a figure: the version in the revision triangle and the number in a dimension chain, both in the mono face, both from the app.

- The pen has the capitals A to Z, space and full stop. Anything else is dropped, so digits never go in `lettered`.
- One short word: `DRAFT`, `SENT`, `NEW`. Check a long one on the sheet before promising it fits.
- The words come from the app. A figure never letters a word of its own.
- Leave the `letter` spot clear of the work and the crew, and check it mirrored: with `dir: "rtl"` the word starts at the far end.

## Common mistakes and the fix

| Mistake | What it looks like | Fix |
| --- | --- | --- |
| No still courses in the outline | `empty` shows a floating set-out with no stand or feet | Put every course, still ones included, into `outline` |
| Outline drawn as the courses again | The set-out repeats inner detail and reads as built | Outline the profile only; put inside lines in `contents` |
| Sag paths built separately | The sag snaps or cross-fades | One builder called twice, `sag(build(0), build(DROP))` |
| Quadratic control at the drop | The middle only drops half as far | Put the control point at twice the drop |
| Foot on the crew's side | The work leans onto the shrugger | Put `foot` on the side away from where the crew stands in `error` |
| Revise box round the whole thing | The cloud reads as "everything changed" | Round one part: the screen, the top letter, the cup's handle |
| Tag at the frame's edge | `2.4.1` is cut off, or lands on a worker mirrored | Leave 25 each side; check the mirrored row on the sheet |
| Tick over the work | The tick reads as part of the object | Set `tick` above and clear of the top corner, inside the frame |
| Tick on the sitter | In `success` with the crew on, the tick sits in the sitter's lap | Seat the sitter at the other end of the top |
| Worker standing on the set-out | In `empty` a letterer stands on a dashed table | Stand it on the ground; nothing is built yet |
| Plumb line through a support | The cord crosses a table top or a shelf on the way down | It hangs about 12 out from the top corner on the `foot` side, down past the foot; keep supports short on that side |
| Parts drawn from `opts` that move | They snap on update instead of animating | Fine for counts; keep moving geometry in `sag()` or the courses |
| Branching on `opts.state` | Check fails; states drift from the grammar | Return parts; the engine decides what each state shows |
| A second line weight for emphasis | Thick outline among fine lines | Same weight; drop the secondary lines to `faint` |
| A colour or a fill | Check fails | `class="paper"` to knock out; no other fill |
| Lines closer than 3 apart | They merge at 240px | Fewer lines, wider gaps; show a quantity with fewer, clearer strokes |
| Courses that are one thing each | Loading at 0.5 shows a random half | Order bottom first, the way it is put together |
| Thing too small for the frame | A speck on a ground line | Scale the subject up or put it on a stand or table |
| Invented number on the drawing | "3" written on a stack | Draw the quantity, or take the number from `opts.figure` |
