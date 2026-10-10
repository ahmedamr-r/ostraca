/* Ostraca: hand-written types. */
import type { Pt, Rect, PoseName } from "./engine/engine.js";
import type * as Engine from "./engine/engine.js";

export * from "./engine/engine.js";

/** The six states, in product words. */
export type State = "idle" | "empty" | "loading" | "success" | "changed" | "error";
export declare const STATES: State[];

export interface Measure {
  /** A real value from the app, never a placeholder. */
  value: number | string;
  unit?: string;
}

export interface Options {
  /** Default "idle". */
  state?: State;
  /** 0..1 for loading. Leave it out when nobody knows how far it has got. */
  value?: number;
  /** The app's real version, carried by the changed state's triangle. */
  rev?: string | number;
  /** A real measure, for figures that draw a dimension (the ramp's file size). */
  figure?: Measure | null;
  /** Put the workers on site. Default false. */
  crew?: boolean;
  /** A short word lettered on the drawing in the drawn pen (A to Z and full stop). */
  lettered?: string;
  /** The accessible name. Default: the figure's title and state. */
  title?: string;
  /** Hide it from assistive tech (aria-hidden). */
  decorative?: boolean;
  /** "rtl" mirrors the drawing; lettering and figures still read left to right. */
  dir?: "ltr" | "rtl";
  /** Any CSS colour for the drawing's lines, marks and figures. Default: `--ostraca-thing`. */
  color?: string;
  /** Any CSS colour for the workers. Default: `--ostraca-crew`. */
  crewColor?: string;
  /** Any CSS colour for the paper the drawing sits on: the fill behind each part. Default: `--ostraca-paper`. */
  paperColor?: string;
}

export interface Station {
  pose: PoseName;
  x: number;
  y: number;
  flip?: boolean;
  /** Stand on the working board (scaffold access only). */
  ride?: boolean;
}

export type Stations = Partial<Record<State | "waiting", Station | Station[] | null>>;

export interface Parts {
  /** Svg strings in build order; a still course never leans. */
  courses: Array<string | { svg: string; still?: boolean }>;
  outline?: string;
  contents?: string;
  fixed?: string;
  ground?: string;
  /** false drops the default ground line (a figure drawing its own cut). */
  groundLine?: boolean;
  hatch?: [x0: number, x1: number];
  /** The corner the work stands on, on its plumb side. Needed for "lean". */
  foot?: Pt;
  /** The y of that side's top. Needed for "lean". */
  top?: number;
  error: "lean" | "sag";
  lean?: number;
  /** The taut line for "sag". */
  string?: [Pt, Pt];
  revise: Rect;
  tag?: Pt;
  tick?: Pt;
  stations?: Stations;
  access?: { kind: "scaffold"; at: number[] } | { kind: "ladder"; at: number; height?: number; lean?: number };
  letter?: { at: Pt; angle?: number; arrow?: boolean };
  extras?: string;
}

export type Context = typeof Engine & {
  opts: Required<Omit<Options, "value" | "figure">> & { value: number | undefined; figure: Measure | null };
  width: number;
  height: number;
  /** For travelling figures: how far along it is, 0..1. */
  travelled: number;
};

export interface Description {
  name: string;
  title: string;
  shelf: string;
  use: string;
  width: number;
  height: number;
  depth?: number;
  travel?: { by: Pt; steps?: number };
  /** What the figure measures through opts.figure, for docs and sheets. */
  measures?: { what: string; unit?: string; sample: number };
  draw(ctx: Context): Parts;
}

export interface FigureInfo { name: string; title: string; shelf: string; use: string; measures?: Description["measures"] }
export declare const figures: FigureInfo[];

/** The figure as an <svg> string. Works without a DOM. */
export declare function render(figure: string | Description, opts?: Options): string;

export interface Mounted {
  /** Merge new options; the drawing moves to them with its transitions. */
  update(opts: Options): void;
  destroy(): void;
  readonly opts: Options;
}
/** Draw into el (adopting server markup if it is there) and keep it. */
export declare function mount(el: Element, figure: string | Description, opts?: Options): Mounted;

/** Add a figure of your own. */
export declare function define(description: Description): Readonly<Description & { depth: number }>;

/** For tools: what a figure draws in the given options. */
export declare function inspect(figure: string | Description, opts?: Options): {
  figure: Readonly<Description & { depth: number }>;
  parts: Parts & { stations: Record<State | "waiting", Station[]>; side: 1 | -1 };
  vars: Record<string, string | number>;
};
