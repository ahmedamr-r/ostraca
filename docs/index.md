# Ostraca

Ostraca is a library of line illustrations for the screens every product has: an empty inbox, a file uploading, a payment that went through, a page that is gone. Each drawing is a small building elevation in blueprint blue, and each one can show six states.

It is MIT licensed, has no runtime dependencies and works with or without React.

The name comes from the limestone flakes Egyptian tomb builders sketched on.

## One drawing, six states

Each subject follows your product through its states, drawn with the marks a builder puts on a drawing.

| State | What your product is doing | What the drawing does |
| --- | --- | --- |
| `idle` | Nothing to report | Built: drawn solid |
| `empty` | Nothing here yet | Set out: a dashed outline where it will stand |
| `loading` | Working on it | Rising: inks from the ground up under a scaffold or ladder |
| `success` | Done | Signed off: the scaffold comes down and a tick draws on |
| `changed` | Something new | Revised: a revision cloud round one part, with your version in a triangle |
| `error` | Something went wrong | Out of true: it leans off a plumb line, or sags under a taut string |

Move from one state to the next and the drawing moves with you. [States](states.md) has the details.

## Install

```sh
npm i ostraca
```

Import the stylesheet once. The drawings are bare SVG without it.

```js
import "ostraca/styles.css";
```

## A 30 second start

React:

```jsx
import { Ostraca } from "ostraca/react";
import "ostraca/styles.css";

export function Inbox({ messages, loading }) {
  if (loading) return <Ostraca name="inbox" state="loading" />;
  if (!messages.length) return <Ostraca name="inbox" state="empty" title="No messages yet" />;
  return <MessageList messages={messages} />;
}
```

Anything else:

```js
import { mount } from "ostraca";
import "ostraca/styles.css";

const art = mount(document.querySelector("#inbox-art"), "inbox", { state: "loading" });

// later, when the fetch comes back empty
art.update({ state: "empty" });
```

`update()` changes attributes on the drawing that is already there, so the move from one state to the next animates.

## Where to go next

- [Usage](usage.md): HTML, React, server rendering, static SVG files and Figma.
- [States](states.md): which state to use for which moment, and the options that go with them.
- [Options](options.md): every option, and every figure on every shelf.
- [Theming](theming.md): colours, dark mode and fitting your product's palette.
- [Workers](workers.md): the crew, and why they stay home by default.
- [Accessibility](accessibility.md): names, motion, right to left and contrast.
- [Agent skill](skill.md): have an agent draw an object the library does not have, in the same hand.
