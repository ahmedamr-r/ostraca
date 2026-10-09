import type { CSSProperties, ElementType, ReactElement } from "react";
import type { Description, Options } from "./index.js";

export interface OstracaProps extends Options {
  /** A figure's name, or a description of your own. */
  name: string | Description;
  /** The wrapping element. Default "div". */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}

export declare function Ostraca(props: OstracaProps): ReactElement;
export default Ostraca;
