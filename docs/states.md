# States

Every figure draws the same six states. You pass the product word; the drawing answers with a drafting mark.

```js
render("inbox", { state: "empty" });
```

`state` defaults to `idle`. The list is exported as `STATES`:

```js
import { STATES } from "ostraca";
// ["idle", "empty", "loading", "success", "changed", "error"]
```

## The six

### `idle`: built

Nothing is happening and nothing is missing. The figure is drawn solid on its ground line. Use it beside content that is there, on a settings page, in an about box.

### `empty`: set out

Nothing here yet. The figure is drawn as a builder sets out a job before work starts: a dashed outline where it will stand, its inside lines faint. It reads as planned, which is how an empty screen should feel to someone who has just arrived.

### `loading`: rising

Something is on its way. The figure goes up under a scaffold or beside a ladder, inking from the ground up in the order it would be built: the stand before the tray, the tray before the letters in it.

- With a `value` between 0 and 1, that share of the figure is built. Change the value and the next pieces ink in.
- With no `value`, one piece is built and a bucket goes up and down on the gin wheel at the top of the scaffold. With the crew off, this is the only thing in the library that loops: work is going on and nobody can say how far it has got.

### `success`: signed off

Done. The scaffold or ladder comes away and a tick draws on in two strokes, the short one then the long one. It plays once and stays.

### `changed`: revised

Something is new since the reader last looked. A revision cloud draws round one part of the figure, the part a drafter would mark as changed: the top letter in the inbox, the screen of the laptop. Pass `rev` and the cloud gets a lettered triangle carrying it.

### `error`: out of true

Something went wrong. The figure goes out of true in one of two ways, and each figure has one:

- **Lean.** The figure tips off its foot and a plumb line drops beside it, swings in and settles, so you can see how far off it is.
- **Sag.** The figure bends down in the middle under a taut string line that shows where it should be.

Either way, the dashed set-out stays where the figure should stand.

## Which state for which moment

| Product moment | State | Options |
| --- | --- | --- |
| First visit, nothing created yet | `empty` | |
| A search or filter that matched nothing | `empty` | `figure` with the real count of 0, where the figure draws one |
| Inbox zero, all caught up | `success`, then `idle` | `figure: { value: 0 }` on a figure that counts, so it draws none |
| Fetching a list, a page, a file | `loading` | `value` if you know it |
| Uploading, importing, installing with a progress bar | `loading` | `value` from the bytes or steps done |
| Waiting on a server that gives no progress | `loading` | no `value` |
| Saved, sent, paid, connected | `success` | |
| Onboarding finished | `success` | |
| A new version, release notes, "what's new" | `changed` | `rev` with the app's real version |
| A document someone else edited | `changed` | |
| A request that failed, a payment declined | `error` | |
| Offline, sync broken, a device gone quiet | `error` | |
| Not found, no permission | `error` | `lettered` for a short word on the drawing |
| A settings page, an about box, a footer | `idle` | |

A screen can move through several of these. An upload goes `empty` to `loading` to `success`, or to `error` and back to `loading` on a retry. With [`mount()`](usage.md#mount-and-update) or the React component, each step animates from the last.

## `value`

A number from 0 to 1: how far a `loading` state has got. Anything outside that range is clamped.

```js
art.update({ state: "loading", value: sent / total });
```

The figure is built in pieces, so the value shows in steps. A piece shows once a quarter of it is in: with 6 pieces and a value of 0.5, three are built.

Leave `value` out when you do not know it. Passing `0` says "it has started and none of it is done", and the figure is set out with nothing built. Passing nothing says "nobody knows", and the gin wheel runs.

`value` is kept by `update()` when the state moves on, so a failed upload can keep its progress when it goes to `error`. Figures that travel instead of rising (the ramp's load goes up the slope) show the load where it stopped.

The accessible name reads the value as a percentage: "Wall, loading, 40 percent".

## `rev`

The app's real version, as a string or number: `"2.4.1"`, `"B"`, `12`. It appears in the triangle on the revision cloud in `changed`, and in the accessible name: "Laptop, changed, now 2.4.1".

```js
render("laptop", { state: "changed", rev: APP_VERSION });
```

With no `rev`, the cloud draws on its own and there is no triangle.

The triangle grows with the length of the version. Short ones read best: a release letter or a two part number.

## `figure`

Some figures can draw a real measure from your app: the inbox draws one letter per unread message, the ramp writes the size being sent on a dimension line. `figure` carries that measure.

```js
render("inbox", { state: "idle", figure: { value: unread } });
render("ramp", { state: "loading", value: 0.3, figure: { value: 1.8, unit: "MB" } });
```

- `value` is the measure. A count (letters, files, results) must be a number; a string is ignored. An amount the figure writes out (a size, a price) can be a number or the string your app already formats. The flip chart takes an array, one value per bar.
- `unit` is written after the value, where the figure writes it out: `1.8 MB`, `240 EGP`.

Which figures take a measure, and what it means for each, is listed under [figures](options.md#figures), with an example. A figure with no measure ignores `figure`.

Pass the real number or nothing. A placeholder such as `12` from a design mock can reach production, and Ostraca draws whatever you give it.

## Unknown progress, in full

When nobody knows how far a job has got:

```js
render("bridge", { state: "loading" });
```

- One piece of the figure is built, so the reader can see what is being made.
- The scaffold or ladder is up, with a gin wheel at the top. Its bucket rises and drops on a loop.
- With [workers](workers.md) on, someone holds the fall of the gin wheel's rope.
- Under reduced motion the bucket holds still at the end of its run and nothing loops.

As soon as you can pass a `value`, pass it. The gin wheel goes and the figure builds to match.
