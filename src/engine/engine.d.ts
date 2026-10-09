/* Hand-written types for the drawing engine. Every drawing function returns
   an SVG fragment as a string; coordinates are drawing units with the ground
   line at y = 0 and up negative. */

export type Pt = [x: number, y: number];
export type Rect = [x: number, y: number, w: number, h: number];

/* svg.js */
export declare const n: (v: number) => number;
export declare const line: (x1: number, y1: number, x2: number, y2: number) => string;
export declare const ARROW_LONG: 7;
export declare const ARROW_WIDE: 3;
export declare const DIM_TICK: 5;
export declare function arrow(x: number, y: number, dx: number, dy: number): string;
export declare function chain(x1: number, y1: number, x2: number, y2: number, gap?: number): string;
export declare const SET_OUT: "4 3";
export declare function seedFrom(text: string): number;
export declare function rng(seed: number): () => number;
export interface Spring { value: number; velocity: number }
export declare const stepSpring: (s: Spring, to: number, omega: number, zeta: number, dt: number) => void;
export declare function springEasing(omega: number, zeta: number, seconds: number, samples?: number): string;
export declare const SPRINGS: Record<"lean" | "bob" | "sag", [omega: number, zeta: number, seconds: number]>;
export declare function cloudArcs(x: number, y: number, w: number, h: number, bump?: number): string[];
export declare const rectPath: (x: number, y: number, w: number, h: number) => string;
export declare const poly: (pts: Pt[], close?: boolean) => string;
export declare const sagPath: (a: Pt, b: Pt, sag?: number) => string;
export declare const esc: (s: unknown) => string;

/* poses.js */
export type PoseName = "sitter" | "leaner" | "carrier" | "shrugger" | "rope" | "hauler" | "pusher" | "letterer" | "caller";
export declare const POSES: Record<PoseName, [a: string, b: string]>;
export declare const POSE_NAMES: PoseName[];
export interface PosePoints {
  feet?: Pt[]; hand?: [a: Pt, b: Pt]; otherHand?: [a: Pt, b: Pt];
  seat?: Pt; load?: [a: Rect, b: Rect]; pen?: [a: Pt, b: Pt]; can?: Rect; string?: Pt;
}
export declare const POSE_POINTS: Record<PoseName, PosePoints>;
export interface WorkerOptions { flip?: boolean; scale?: number; seed?: string }
export declare const posePoint: (p: Pt, x: number, y: number, opts?: WorkerOptions) => Pt;
export declare function worker(pose: PoseName, x: number, y: number, opts?: WorkerOptions): string;
export declare const station: (states: string, inner: string, extra?: string) => string;

/* lettering.js */
export declare const GLYPHS: Record<string, [advance: number, d: string]>;
export declare const LETTERABLE: string;
export interface LetterOptions { size?: number; angle?: number; seed?: string; arrowAfter?: boolean; underline?: boolean }
export declare function letter(text: string, x: number, y: number, opts?: LetterOptions): { w: number; svg: string };

/* marks.js */
export declare const tickMark: (x: number, y: number) => string;
export declare function cloudMark(box: Rect, tagAt?: Pt | null, rev?: string): string;
export declare function revisionTag(at: Pt, rev: string, delayMs?: number): string;
export declare function plumbMark(bx: number, by: number, len: number, w?: number, h?: number): string;
export declare const plumbBracket: (x: number, top: number, reach?: number) => string;
export declare const plumbHang: (x: number, top: number, pivotY: number, deg: number, reach?: number) => Pt;
export declare const trueLine: (x0: number, x1: number, y: number) => string;
export declare const hatch: (from: number, to: number, y?: number) => string;
export declare const ground: (W: number, x0?: number) => string;
export declare function scaffold(o: { xs: number[]; base?: number; top: number; lifts: number; liftIndex: (j: number) => number }): string;
export declare const board: (x0: number, x1: number) => string;
export declare function ladder(x: number, height: number, o?: { lean?: number; rungs?: number; base?: number }): string;
export declare function pegs(xs: number[], o?: { y?: number; h?: number }): string;
export declare const stringLine: (a: Pt, b: Pt, sag?: number, cls?: string) => string;
export declare function ginWheel(o: { x: number; liftTop: number; loadTop?: number; restTo?: Pt | null; out?: number }): string;
export declare function dimension(x1: number, y1: number, x2: number, y2: number, figure?: string | number, o?: { gapPerChar?: number }): string;
export declare const dashed: string;

/* compose.js: helpers a figure's draw(ctx) also gets */
/** A path that drops from d0 to d1 in error (cross-fades if the shapes differ). */
export declare function sag(d0: string, d1: string, cls?: string): string;
/** Svg shown only in the listed states (space separated). */
export declare const when: (states: string, inner: string) => string;
