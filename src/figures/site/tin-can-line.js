/* Tin can line: two posts, a can on each, a string between. Calls,
   connections and anything live. With the crew on, a caller holds the
   near can to the ear and the string runs from it; with the crew off, the
   can sits on its post's bracket. Out of true, the string goes slack. */
const PL = 140, PR = 420, H = 50, CREW_AT = 22, Y = -37.5, SLACK = 30;

export default {
  name: "tin-can-line",
  title: "Tin can line",
  shelf: "site",
  use: "Calls, connections and anything live",
  width: 560,
  height: 78,
  draw({ SET_OUT, sag, sagPath, opts }) {
    // A post with a bracket off its top toward the string, `dir` 1 or -1.
    const post = (x, dir) => `<path class="paper" d="M${x} 0V${-H}H${x + 3}V0Z"/><path d="M${x - 1} ${-H}H${x + 4}"/><path d="M${dir > 0 ? x + 3 : x} -44h${dir * 6}v3.5"/>`;
    const can = (x) => `<path class="paper" d="M${x} -40H${x + 6}V-35H${x}Z"/><path d="M${x + 1.2} -40V-35" opacity="0.5"/>`;

    // The string's ends: the far can, and the near can on its post or in hand.
    const R = [PR - 12, Y], L = [PL + 12, Y], held = [PL + CREW_AT + 15, Y];
    const line = (from) => sag(sagPath(from, R, 0), sagPath(from, R, SLACK));

    return {
      courses: [
        post(PL, 1) + `<g class="rest-off">${can(PL + 6)}</g>`,
        post(PR - 3, -1) + can(PR - 12),
        `<g class="rest-on">${line(held)}</g><g class="rest-off">${line(L)}</g>`,
      ],
      outline: `<path d="M${PL} 0V${-H}H${PL + 3}V0M${PR - 3} 0V${-H}H${PR}V0" stroke-dasharray="${SET_OUT}"/>`,
      contents: `<path d="M${L[0]} ${Y}L${R[0]} ${Y}"/>`,
      foot: [PR, 0],
      top: -H,
      error: "sag",
      string: [opts.crew ? held : L, R],
      tick: [PR + 8, -H - 6],
      revise: [PR - 22, -50, 26, 22],
      tag: [PR + 16, -58],
      stations: {
        empty: { pose: "caller", x: PL + CREW_AT, y: 0, flip: true },
        loading: { pose: "caller", x: PL + CREW_AT, y: 0, flip: true },
        idle: { pose: "caller", x: PL + CREW_AT, y: 0, flip: true },
        success: { pose: "caller", x: PL + CREW_AT, y: 0, flip: true },
        changed: { pose: "caller", x: PL + CREW_AT, y: 0, flip: true },
        error: { pose: "caller", x: PL + CREW_AT, y: 0, flip: true },
      },
    };
  },
};
