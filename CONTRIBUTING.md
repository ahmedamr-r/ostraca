# Contributing

Thank you for wanting to add to Ostraca. There are three ways in, from the smallest to the largest.

## Ask for a figure

Open a [figure request](https://github.com/ahmedamr-r/ostraca/issues/new?template=figure-request.yml). Name the object, the screens it is for and the states you need most. Check [the figures](https://ostraca.ahmedamr.com/figures) first: it may already be on a shelf.

If you only need it for your own product, you do not have to wait. The [skill](https://ostraca.ahmedamr.com/skill) draws it for you in the same hand.

## Report a drawing that is wrong

Open a [drawing report](https://github.com/ahmedamr-r/ostraca/issues/new?template=drawing.yml) with the figure, the options you passed, a screenshot and your browser. A worker standing on air, a tick off the frame or a state that does not read are all worth reporting.

## Draw a figure for the library

Library figures are drawn the way the skill draws one, to the rules in [CONTRACT.md](CONTRACT.md).

1. Pick an object anyone owns or has seen. No brands, no logos.
2. Write `src/figures/<shelf>/<name>.js`, starting from [the inbox](src/figures/messages/inbox.js) for something upright or [the laptop](src/figures/devices/laptop.js) for something that spans. The skill can write the first draft: ask it for the figure, then move the file here.
3. Check it and draw its sheets:

```sh
node scripts/registry.mjs
node scripts/check.mjs --figure <name>
node scripts/sheet.mjs --figure <name>
```

4. Go through the questions under "Look at every sheet" in [CONTRACT.md](CONTRACT.md), on the actual pixels.
5. Open a pull request with both sheets attached, and one line on each choice someone might want changed: the scale, lean or sag, and what the revision cloud goes round.

A library figure draws all six states, passes the check, and keeps to one line weight, two inks and the paper as the only fill.

## Change the engine or the site

- `npm run check` must pass. It renders every figure in every state.
- After any change under `src/engine/`, `src/index.js` or `src/styles.css`, run `node scripts/bundle-skill.mjs` so the skill's copy of the engine matches.
- `npm run site` builds the site into `dist/`, and `npm run site:serve` serves it at http://127.0.0.1:4321.
- `npm run cover`, `npm run og` and `node scripts/demo.mjs` redraw the README cover, the link previews and the README demo. They need Google Chrome, and the demo needs ffmpeg.
- The package has no runtime dependencies, and it stays that way.

Copy, in code comments and docs alike: sentence case, no em or en dashes, British spelling, and the crew are "it" or called by their pose.

## Licence

Everything you contribute is MIT licensed, like the rest of Ostraca.
