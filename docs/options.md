# Options

`render()`, `mount()`, `update()` and the React component all take the same options. Every one is optional.

```js
render("inbox", {
  state: "loading",
  value: 0.4,
  crew: true,
});
```

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `state` | `"idle"`, `"empty"`, `"loading"`, `"success"`, `"changed"`, `"error"` | `"idle"` | Which of the [six states](states.md) to draw |
| `value` | number, 0 to 1 | none | How far `loading` has got. Leave it out when nobody knows |
| `rev` | string or number | none | The app's real version, in the `changed` triangle |
| `figure` | `{ value, unit? }` or `null` | `null` | A real measure, for figures that draw one |
| `crew` | boolean | `false` | Puts the [workers](workers.md) on site |
| `lettered` | string | none | A short word lettered on the drawing in the drawn pen |
| `title` | string | the figure's title and state | The accessible name |
| `decorative` | boolean | `false` | Hides the drawing from assistive tech |
| `dir` | `"ltr"` or `"rtl"` | `"ltr"` | `"rtl"` mirrors the drawing for right to left pages |

## `state`

```js
render("laptop", { state: "error" });
```

An unknown state throws. See [states](states.md).

## `value`

```js
render("wall", { state: "loading", value: rows.length / total });
```

Only `loading` builds by it. Values outside 0 to 1 are clamped. A value that is not a finite number counts as no value. See [value](states.md#value).

## `rev`

```js
render("door-frame", { state: "changed", rev: "2.4.1" });
```

Only `changed` draws it. Numbers are turned into strings. See [rev](states.md#rev).

## `figure`

```js
render("ramp", { state: "loading", value: 0.5, figure: { value: 1.8, unit: "MB" } });
```

Only the figures listed with a measure [below](#figures) draw it. See [figure](states.md#figure).

## `crew`

```js
render("stair", { state: "loading", value: 0.5, crew: true });
```

Draws the workers for the state: a carrier on the stair while it goes up, a sitter on top when it is done. See [workers](workers.md).

## `lettered`

```js
render("door-frame", { state: "error", lettered: "Not here" });
```

A word or two, lettered in the library's own drawn capitals. Some figures keep a place for it, and four of them (the door frame, the ramp, the phone and the camera) point an arrow from the word to the work. The rest letter it in their top left corner.

The pen knows A to Z, the space and the full stop. Lower case is lettered as capitals, and anything else (digits, punctuation, other scripts) is left out of the drawing.

Keep it to about ten letters. The lettering is drawn at one size, and "Page not found anywhere" is already two thirds of a figure's width.

## `title`

```js
render("inbox", { state: "empty", title: "No messages yet" });
```

The accessible name, written to the drawing's `<title>` and `aria-label`. With no title it is the figure's title and state: "Inbox, empty", "Wall, loading, 40 percent", "Laptop, something went wrong". See [accessibility](accessibility.md).

## `decorative`

```js
render("bridge", { state: "success", decorative: true });
```

For a drawing next to text that already says what happened. It gets `aria-hidden="true"` and no title.

## `dir`

```js
render("tin-can-line", { state: "error", dir: "rtl" });
```

Mirrors the drawing so it faces the way your page reads. Lettering and dimension figures still read left to right. See [right to left](accessibility.md#right-to-left).

## Figures

<!-- figures:start -->
34 figures on 8 shelves. Every figure draws all six states. **Error** says how it goes wrong: it leans off a plumb line or sags under a string. **Measure** is what `figure` carries, for the figures that draw one; the example is a sample, so pass your own.

### Messages

Inboxes, notifications, email and comments. Most products show their first empty screen here.

| Figure | Name | For | Error | Measure |
| --- | --- | --- | --- | --- |
| Bell | `bell` | Notifications, all caught up, alerts muted, a reminder going out | lean | Unread notifications, such as `{ value: 3 }` |
| Inbox | `inbox` | Inbox zero, no messages yet, new mail coming in, a message that failed to send | lean | Unread messages, such as `{ value: 12 }` |
| Mailbox | `mailbox` | Email, newsletters, subscribe forms, a confirmation sent, an address that bounced | lean | Unread messages, raising the flag above zero, such as `{ value: 2 }` |
| Noticeboard | `noticeboard` | Comments, feedback, announcements, notes and idea boards with nothing pinned yet | lean | Comments, such as `{ value: 14 }` |

### Files

Keeping, finding, charting and throwing away.

| Figure | Name | For | Error | Measure |
| --- | --- | --- | --- | --- |
| Bin | `bin` | Trash, deleted items, an empty bin, restore, deleted for good | lean | Days until the bin empties itself, such as `{ value: 30, unit: "days" }` |
| Filing cabinet | `filing-cabinet` | Documents, folders, records, no files yet, a file that failed to save | lean | Files in the folder, such as `{ value: 6 }` |
| Flip chart | `flip-chart` | Analytics, reports, dashboards and charts with no data yet | lean | The series to chart, one value per bar, such as `{ value: [12, 19, 15, 26, 22] }` |
| Magnifier | `magnifier` | Search, no results, filters that matched nothing, explore | lean | Results, such as `{ value: 0 }` |

### People

Teams, profiles, sign in and the first achievement.

| Figure | Name | For | Error | Measure |
| --- | --- | --- | --- | --- |
| Bust | `bust` | Profile, account, no photo yet, finish your profile, a deleted account | lean |  |
| Gate | `gate` | Sign in, private pages, permission needed, locked features, access denied | sag |  |
| Seats | `seats` | Team members, invites, seats on a plan, attendees, a waiting list | sag | Seats taken, of the plan's total, such as `{ value: 4, unit: "seats" }` |
| Trophy | `trophy` | Achievements, rewards, goals reached, streaks, leaderboards | lean | A streak, rank or score, such as `{ value: 12 }` |

### Money

Payments, balances, savings and receipts.

| Figure | Name | For | Error | Measure |
| --- | --- | --- | --- | --- |
| Card reader | `card-reader` | Checkout, a payment going through, card added, payment declined, subscriptions | lean | The amount being paid, such as `{ value: 240, unit: "EGP" }` |
| Coins | `coins` | Balance, savings, earnings, points, cashback, top ups | lean | The balance, such as `{ value: 1240, unit: "EGP" }` |
| Receipt | `receipt` | Invoices, receipts, billing history, statements, refunds | lean | The total, or with no unit a count of line items, such as `{ value: 1240, unit: "EGP" }` |
| Safe | `safe` | Savings goals, vaults, secure storage, backups, encrypted or private data | lean | A saved amount or a goal, such as `{ value: 25000, unit: "EGP" }` |

### Shopping

Carts, orders, shop fronts and food on the way.

| Figure | Name | For | Error | Measure |
| --- | --- | --- | --- | --- |
| Market stall | `market-stall` | Storefront, seller dashboard, product catalogue, a shop with no products yet, store closed | sag | Products, such as `{ value: 6 }` |
| Parcel | `parcel` | Orders, shipping, delivery tracking, returns, a delivery that failed | lean | Parcels in the order, such as `{ value: 3 }` |
| Stove | `stove` | Food orders being cooked, recipes, meal plans, a kitchen closed for the night | lean | Time left, such as `{ value: 12, unit: "min" }` |
| Trolley | `trolley` | Shopping cart, wishlist, saved for later, checkout, an item out of stock | lean | Items in the cart, such as `{ value: 9 }` |

### Time

Calendars, countdowns, reminders and time away.

| Figure | Name | For | Error | Measure |
| --- | --- | --- | --- | --- |
| Alarm clock | `alarm-clock` | Reminders, alarms, due soon, snooze, deadlines | lean | Time, such as `{ value: "7:30" }` |
| Calendar | `calendar` | Schedule, bookings, events, no meetings today, a booking that failed | lean | Date, such as `{ value: "2026-10-09" }` |
| Deck chair | `deck-chair` | Away, out of office, time off, do not disturb, quiet hours | lean | Back on, such as `{ value: "Oct 20" }` |
| Hourglass | `hourglass` | Waiting, a trial ending, a session timing out, rate limited, try again later | lean | Time left, such as `{ value: "4 min" }` |

### Devices

The computer and phone an app runs on, and what it asks of them.

| Figure | Name | For | Error | Measure |
| --- | --- | --- | --- | --- |
| Camera | `camera` | Photos, video, a media library, camera access, a photo upload | lean |  |
| Laptop | `laptop` | Desktop apps, installs, signing in on a new computer, a device gone offline | sag |  |
| Phone | `phone` | Mobile apps, scan to install, a code sent by text, two step sign in, push notifications | lean |  |
| Server rack | `server-rack` | Maintenance, status pages, outages, deploys, self hosting | lean | Services, such as `{ value: 6 }` |

### Site

The building site the library started from. Six subjects for lists, onboarding, integrations, live connections, missing pages and uploads.

| Figure | Name | For | Error | Measure |
| --- | --- | --- | --- | --- |
| Bridge | `bridge` | Sync, linked accounts and anything joining two ends | sag |  |
| Door frame | `door-frame` | Not found, a page that moved, a way in | lean |  |
| Ramp | `ramp` | Uploads, imports and anything sent somewhere | sag | The size being sent, such as `{ value: 1.8, unit: "MB" }` |
| Stair | `stair` | Onboarding, setup and anything done in steps | lean |  |
| Tin can line | `tin-can-line` | Calls, connections and anything live | sag |  |
| Wall | `wall` | Lists, tables and rows that fill in | lean |  |

Figures of your own join this list once you pass them to `define()`. The [agent skill](skill.md) draws them.
<!-- figures:end -->
