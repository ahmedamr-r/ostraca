# Ostraca

Illustrations for every state your product is in, drawn by your agent.

Ostraca is a skill for coding agents and the engine it draws with. Name an object and your agent draws it as a small building elevation in blueprint blue that can show six states: an empty inbox, a file uploading, a payment that went through, a page that is gone. A set of ready-drawn figures comes with it, to use as they are and to start from.

MIT licensed. No runtime dependencies. Works with or without React.

Ostraca are the limestone flakes Egyptian tomb builders sketched on.

## Draw any object

```sh
npx skills add ahmedamr-r/ostraca
```

```
/ostraca coffee cup
```

The agent writes one description file, checks it against the library's rules, draws contact sheets in light and dark, looks at them and fixes what it sees. Name a moment instead, such as `/ostraca something for a fitness app`, and it offers two or three objects to pick from. Then add the figure with `define()`, and it works everywhere a ready-drawn one does:

```js
import { define } from "ostraca";
import cup from "./coffee-cup.js";

define(cup);
```

See [docs/skill.md](docs/skill.md).

## Install the engine

```sh
npm i ostraca
```

## React

```jsx
import { Ostraca } from "ostraca/react";
import "ostraca/styles.css";

export function Upload({ sent, total, failed, done }) {
  const state = failed ? "error" : done ? "success" : total ? "loading" : "empty";
  return <Ostraca name="ramp" state={state} value={total ? sent / total : undefined} />;
}
```

It renders on the server. When a prop changes in the browser, the drawing animates to the new state.

## HTML

```js
import { render, mount } from "ostraca";
import "ostraca/styles.css";

// a string, anywhere
document.querySelector("#inbox-art").innerHTML = render("inbox", { state: "empty" });

// or kept, so changes animate
const art = mount(document.querySelector("#sync-art"), "bridge", { state: "loading" });
art.update({ state: "success" });
```

## Six states

| State | Your product | The drawing |
| --- | --- | --- |
| `idle` | Nothing to report | Built: drawn solid |
| `empty` | Nothing here yet | Set out: a dashed outline where it will stand |
| `loading` | Working on it | Rising: inks from the ground up under a scaffold or ladder. Pass `value` from 0 to 1, or leave it out and a gin wheel bucket goes up and down |
| `success` | Done | Signed off: the scaffold comes down and a tick draws on |
| `changed` | Something new | Revised: a revision cloud round one part, with your real version in a triangle (`rev`) |
| `error` | Something went wrong | Out of true: it leans off a plumb line, or sags under a taut string |

## Figures

Ready-drawn subjects on shelves, to use as they are: messages, files, people, money, shopping, time, devices, and the building site the library started from. The full list, with what each one is for, is in [docs/options.md](docs/options.md#figures).

```js
import { figures } from "ostraca";
```

## Options

| Option | Default | |
| --- | --- | --- |
| `state` | `"idle"` | One of the six |
| `value` | none | 0 to 1 for `loading` |
| `rev` | none | The app's version, for `changed` |
| `figure` | `null` | `{ value, unit }`, a real measure for figures that draw one |
| `crew` | `false` | Puts the workers on site |
| `lettered` | none | A short word in the drawn pen |
| `title` | title and state | The accessible name |
| `decorative` | `false` | Hides it from assistive tech |
| `dir` | `"ltr"` | `"rtl"` mirrors the drawing |
| `color` | `--ostraca-thing` | Any CSS colour for the drawing |
| `crewColor` | `--ostraca-crew` | Any CSS colour for the workers |
| `paperColor` | `--ostraca-paper` | Any CSS colour for the paper under it |

## Docs

- [Start](docs/index.md)
- [Agent skill](docs/skill.md)
- [Usage](docs/usage.md): HTML, React, server rendering, static SVG, Figma
- [States](docs/states.md)
- [Options and figures](docs/options.md)
- [Theming](docs/theming.md)
- [Workers](docs/workers.md)
- [Accessibility](docs/accessibility.md)

## Licence

MIT, so the drawings can go in anything you make, commercial or not. See [LICENSE](LICENSE).

Made in Cairo by [Ahmed Amr](https://ahmedamr.com). [@ahmedamrr_r](https://x.com/ahmedamrr_r) on X.
