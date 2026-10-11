/* ===========================================================================
   Bookcase: a tall bookcase on a plinth, front on, its shelves part full.
   Saved items, bookmarks, reading lists, a collection with nothing in it
   yet.

   The worked example of a figure made for one screen. It draws only empty
   (states below), so it carries only what empty uses: the courses, the
   set-out (outline), the lines inside it (contents) and the letterer's
   station. No error, foot, top, revise, tag, tick or access, and no
   station for another state. The courses are still the whole bookcase,
   books and all, so a state can be added later by adding the parts it
   needs (the table under "Fewer states" in contract.md).

   Drawn big, nearly twice a worker's height: at the crew's true scale the
   books would be too small to read at 240px.
   =========================================================================== */

// Measured off the case's left side (X0). A worker is 45 tall.
const X0 = 94, W = 96, X1 = X0 + W;   // the carcass's outer sides
const T = 3;                          // every board, thick enough to read as two lines at 240px
const BASE = -5, TOP = -78;           // the carcass on a plinth 5 high; its top board's upper face
const BAY = 14.5;                     // clear height between boards
const FLOORS = [0, 1, 2, 3].map((k) => BASE - T - k * (BAY + T)); // each bay's floor, bottom first

export default {
  name: "bookcase",
  title: "Bookcase",
  shelf: "files",
  use: "Saved items, bookmarks, reading lists, a collection with nothing in it yet",
  width: 300,
  height: 112,
  states: ["empty"],

  draw({ n, SET_OUT, rng, seedFrom, rectPath }) {
    // The case: a plinth set back under it, the carcass with its opening,
    // a cornice proud of the sides, and the three shelves.
    const plinth = rectPath(X0 + T, BASE, W - 2 * T, -BASE);
    const opening = rectPath(X0 + T, TOP + T, W - 2 * T, BASE - TOP - 2 * T);
    const carcass = rectPath(X0, TOP, W, BASE - TOP) + opening;
    const cornice = rectPath(X0 - 2, TOP - T, W + 4, T);
    const shelves = FLOORS.slice(1).map((y) => rectPath(X0 + T, y, W - 2 * T, T)).join("");

    // Books: a run along each shelf from the left, part full, each 3 to 5
    // wide so their sides stay apart. Seeded, so the case is the same on
    // every render.
    const r = rng(seedFrom("bookcase"));
    const books = (floor) => {
      const end = X0 + T + 2 + (W - 2 * T - 4) * (0.45 + r() * 0.35);
      let d = "";
      for (let x = X0 + T + 2; x < end; ) {
        const w = 3 + Math.round(r() * 2), h = BAY - 2 - Math.round(r() * 4);
        d += rectPath(n(x), floor - h, w, h);
        x += w;
      }
      return `<path class="paper" d="${d}"/>`;
    };

    return {
      // Bottom first, the way it is put together: the case, then the books
      // shelf by shelf. In empty none of this shows; it is the bookcase
      // the other states would draw.
      courses: [
        `<path class="paper" d="${plinth}"/>`,
        `<path class="paper" d="${carcass}"/>`,
        `<path class="paper" d="${cornice}"/>`,
        `<path class="paper" d="${shelves}"/>`,
        ...FLOORS.map(books),
      ],
      // The set-out: the profile only, cornice and plinth included.
      outline: `<path d="M${X0 + T} 0V${BASE}H${X0}V${TOP}H${X0 - 2}V${TOP - T}H${X1 + 2}V${TOP}H${X1}V${BASE}H${X1 - T}V0Z" stroke-dasharray="${SET_OUT}"/>`,
      // Faint inside it: the opening and where each shelf goes, nothing on them.
      contents: `<path d="${opening}${FLOORS.slice(1).map((y) => `M${X0 + T} ${y}H${X1 - T}`).join("")}"/>`,
      stations: {
        empty: { pose: "letterer", x: X1 + 24, y: 0 }, // on the ground, pen at the case's side
      },
    };
  },
};
