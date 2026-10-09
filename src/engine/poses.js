/* ===========================================================================
   The crew. Path for path from the prototype (retyped from the drawing kit
   on ahmedamr.com). Feet at y = 0, facing left, two complete drawings each
   (a and b); styles.css plays them on a 3.4s beat.

   Two weights: .crew-key for the figure, .crew-hair for what it holds and
   the far arm. Both draw in currentColor, the text ink.
   =========================================================================== */
import { n, rng, seedFrom } from "./svg.js";

const K = (d) => `<path class="crew-key" d="${d}"/>`;
const Hd = (cx, cy) => `<circle class="crew-key" cx="${cx}" cy="${cy}" r="4"/>`;
const Hr = (d) => `<path class="crew-hair" d="${d}"/>`;

export const POSES = {
  sitter: [
    Hd(-1, -25) + K("M0 -21 L2 -3 L-10 -9 L-13 0 M0 -16 L-9 -10") + Hr("M2 -3 L-6 -7 L-8 0"),
    Hd(-2, -25) + K("M-1 -21 L2 -3 L-10 -9 L-13 0 M0 -16 L-8 -15 L-11 -22") + Hr("M2 -3 L-6 -7 L-8 0"),
  ],
  leaner: [
    Hd(3, -40) + K("M3 -36 L1 -19 M2 -31 L-7 -25 L-1 -21 M1 -19 L-5 0 M1 -19 L6 0") + Hr("M2 -31 L9 -24 L7 -17"),
    Hd(1, -41) + K("M1 -37 L1 -19 M1 -32 L-8 -27 L-4 -34 M1 -19 L5 0 M1 -19 L-3 0") + Hr("M1 -32 L8 -25 L6 -18"),
  ],
  carrier: [
    Hd(0, -41) + K("M0 -37 L0 -20 M0 -32 L-9 -26 M0 -20 L-7 0 M0 -20 L8 -2") + Hr("M-22 -34 H-8 V-16 H-22 Z"),
    Hd(-1, -41) + K("M-1 -37 L0 -20 M0 -32 L-9 -31 M0 -20 L-6 0 M0 -20 L7 0") + Hr("M-22 -40 H-8 V-22 H-22 Z"),
  ],
  shrugger: [
    Hd(0, -41) + K("M0 -37 L0 -20 M0 -32 L-9 -25 M0 -32 L9 -25 M0 -20 L-6 0 M0 -20 L6 0"),
    Hd(0, -40) + K("M0 -36 L0 -20 M0 -33 L-8 -30 L-13 -38 M0 -33 L8 -30 L13 -38 M0 -20 L-6 0 M0 -20 L6 0"),
  ],
  rope: [
    Hd(0, -41) + K("M0 -37 L0 -20 M0 -32 L14 -30 M0 -20 L-6 0 M0 -20 L6 0") + Hr("M0 -32 L-7 -25 L-5 -18"),
    Hd(-3, -40) + K("M-3 -36 L0 -20 M-2 -31 L14 -30 M0 -20 L-8 0 M0 -20 L5 0") + Hr("M-2 -31 L-11 -33 L-14 -40"),
  ],
  hauler: [
    Hd(-7, -37) + K("M-5 -33 L2 -19 M-3 -29 L9 -25 M2 -19 L-7 0 M2 -19 L11 -1"),
    Hd(-6, -38) + K("M-4 -34 L2 -19 M-2 -30 L9 -25 M2 -19 L-1 0 M2 -19 L6 0"),
  ],
  pusher: [
    Hd(-8, -36) + K("M-6 -32 L2 -19 M-4 -29 L-13 -27 M2 -19 L-5 0 M2 -19 L11 -1"),
    Hd(-7, -37) + K("M-5 -33 L2 -19 M-3 -30 L-13 -27 M2 -19 L0 0 M2 -19 L6 0"),
  ],
  letterer: [
    Hd(0, -41) + K("M0 -37 L0 -20 M0 -32 L-9 -30 L-16 -34.5 M0 -20 L-6 0 M0 -20 L6 0") + Hr("M-16 -34.5 L-20.8 -35.4 M0 -32 L6 -25 L4 -19"),
    Hd(-1, -41) + K("M-1 -37 L0 -20 M0 -32 L-8 -27 L-15 -30 M0 -20 L-6 0 M0 -20 L6 0") + Hr("M-15 -30 L-19.5 -31.5 M0 -32 L6 -25 L4 -19"),
  ],
  caller: [
    Hd(0, -41) + K("M0 -37 L0 -20 M0 -32 L-7 -29 L-9 -37 M0 -20 L-6 0 M0 -20 L6 0") + Hr("M-15 -40 H-9 V-35 H-15 Z M0 -32 L7 -25 L5 -18"),
    Hd(-1, -41.5) + K("M-1 -37.5 L0 -20 M0 -32 L-7 -29 L-9 -37 M0 -32 L8 -36 L11 -44 M0 -20 L-7 0 M0 -20 L5 0") + Hr("M-15 -40 H-9 V-35 H-15 Z"),
  ],
};

export const POSE_NAMES = /** @type {const} */ (Object.keys(POSES));

/* ---------------------------------------------------------------------------
   Where each pose's tool meets the figure, in the pose's own frame (feet at
   y 0, facing left, before flip and scale). Read off the paths above; the
   subjects use them to hang ropes, boards and pens off the right point.
   Where the two drawings differ, a is the rest drawing and b the beat.

   sitter    seat (2, -3) is the hip on the edge it sits on; feet (-13, 0)
             hang below it. Hand a (-9, -10) rests; hand b (-11, -22) waves.
             Placed with y at the top of what it sits on when the feet
             rest on it too; at the top plus 3 when they hang off an edge.
   leaner    feet (-5, 0) and (6, 0). Hand a (-1, -21) on the hip; hand b
             (-4, -34) up at the head. Leans on nothing; stands at ease.
   carrier   holds a block out in front: block a x -22..-8, y -34..-16,
             block b x -22..-8, y -40..-22 (lifted). Hand a (-9, -26),
             hand b (-9, -31). Rear foot a (8, -2) is mid stride.
   shrugger  hands a (-9, -25) and (9, -25); hands b (-13, -38) and
             (13, -38), thrown up.
   rope      pulling hand (14, -30) in both drawings, the rope running off
             behind (to the right). Free arm a (-5, -18), b (-14, -40).
   hauler    rope over the shoulder, hand (9, -25) in both; leans forward
             into the haul, so the rope leaves behind and low.
   pusher    both hands (-13, -27) in both, against the load in front.
   letterer  pen tip a (-20.8, -35.4), b (-19.5, -31.5); pen hand a
             (-16, -34.5), b (-15, -30). Letters on a board at about
             x -21, y -30..-40.
   caller    holds a tin can to the mouth: can x -15..-9, y -40..-35 in both,
             the string leaving from (-15, -37.5) (the can's far end).
             Free arm b raised to (11, -44).
   --------------------------------------------------------------------------- */
export const POSE_POINTS = {
  sitter: { seat: [2, -3], feet: [[-13, 0]], hand: [[-9, -10], [-11, -22]] },
  leaner: { feet: [[-5, 0], [6, 0]], hand: [[-1, -21], [-4, -34]] },
  carrier: { feet: [[-7, 0], [8, -2]], hand: [[-9, -26], [-9, -31]], load: [[-22, -34, 14, 18], [-22, -40, 14, 18]] },
  shrugger: { feet: [[-6, 0], [6, 0]], hand: [[-9, -25], [-13, -38]], otherHand: [[9, -25], [13, -38]] },
  rope: { feet: [[-6, 0], [6, 0]], hand: [[14, -30], [14, -30]] },
  hauler: { feet: [[-7, 0], [11, -1]], hand: [[9, -25], [9, -25]] },
  pusher: { feet: [[-5, 0], [11, -1]], hand: [[-13, -27], [-13, -27]] },
  letterer: { feet: [[-6, 0], [6, 0]], hand: [[-16, -34.5], [-15, -30]], pen: [[-20.8, -35.4], [-19.5, -31.5]] },
  caller: { feet: [[-6, 0], [6, 0]], hand: [[-9, -37], [-9, -37]], can: [-15, -40, 6, 5], string: [-15, -37.5] },
};

/**
 * Map a point from a pose's frame into the drawing, for a worker placed with
 * worker(pose, x, y, { flip, scale }).
 */
export const posePoint = ([px, py], x, y, { flip = false, scale = 1 } = {}) => [
  n(x + (flip ? -px : px) * scale),
  n(y + py * scale),
];

/**
 * A worker at a station: a place and a facing, nothing else. Draws both
 * drawings; the beat's phase is seeded from the pose and the place (or
 * `seed`) so a crew never moves in step.
 */
export function worker(pose, x, y, { flip = false, scale = 1, seed = "" } = {}) {
  const r = rng(seedFrom(seed || `${pose}${x}${y}`));
  const delay = -(r() * 3.4).toFixed(2);
  const sx = (flip ? -1 : 1) * scale;
  return `<g class="crew-g" transform="translate(${n(x)} ${n(y)}) scale(${sx} ${scale})" style="--crew-delay:${delay}s"><g data-pose="a">${POSES[pose][0]}</g><g data-pose="b">${POSES[pose][1]}</g></g>`;
}

/**
 * A station: a group shown only in the states listed (space separated),
 * so each state can put its own worker on site.
 */
export const station = (states, inner, extra = "") => `<g class="st" data-st="${states}" ${extra}>${inner}</g>`;
