# Workers

Every figure has a small crew who can come and work on it. Turn them on with `crew: true`:

```js
render("stair", { state: "loading", value: 0.5, crew: true });
```

```jsx
<Ostraca name="stair" state="loading" value={0.5} crew />
```

The workers are drawn in your text colour (`--ostraca-crew`), and the thing they work on in blueprint blue, so people and work never blur together. A worker is 45 units tall, against figures 90 to 135 tall.

## Who does what

Each state gives the crew a job that matches what the drawing is doing. The figures place their own workers, so the details move a little from one to the next; the table is the usual pattern.

| State | Job | What you see |
| --- | --- | --- |
| `empty` | Setting out | A letterer marks out the dashed outline at its end |
| `loading` | Building | A carrier brings the next piece up the ladder or along the scaffold board, holding it near where it goes |
| `loading`, no value | Hauling | A hauler on the ground holds the fall of the gin wheel's rope while the bucket goes up and down |
| `idle` | Resting | A sitter on top of the work, legs over the edge, or a leaner against it |
| `success` | Done | The sitter stays on top, or sits on the ground facing the finished work. Some figures give it a job that fits: a rope on the bell, a call on the mailbox |
| `changed` | Marking the change | The letterer comes back, pen at the revision cloud |
| `error` | Puzzled | A shrugger stands beside the plumb line or the sag, hands up. A few figures put a pusher against the part that gave way |

A few figures go their own way. On the tin can line the same caller holds one end of the string in every state, because the line runs from the can in that hand. On the ramp a gang of haulers pulls the load up the slope.

The crew stand behind the work or beside it, never in front of the part the state is about, so turning them on never hides what the drawing says.

## Nine poses

`sitter`, `leaner`, `carrier`, `shrugger`, `rope`, `hauler`, `pusher`, `letterer` and `caller`. Each has two drawings, a rest and a beat. With the crew on, a worker switches between the two every few seconds, and faster while the job is `loading`. Under reduced motion the workers keep still.

The poses are exported for drawing figures of your own: `worker(pose, x, y, { flip })` returns a worker's markup, and `POSE_NAMES` lists them.

## Why they are off by default

- **Your screen is the subject.** An empty state sits next to a heading, a line of copy and a button. A person in the drawing pulls the eye before any of those, and in a product the button should win.
- **They move.** Even a slow shift between two drawings is motion that never stops. Fine on a landing page, tiring on a screen someone looks at all day.
- **Every state reads without them.** The marks carry the meaning: the dashes, the tick, the cloud, the plumb line. The crew add character on top.

Turn them on where there is room and a moment to spare: a first run screen, a 404, a page that announces something, a marketing page about your product.
