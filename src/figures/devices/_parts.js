/* Helpers only the devices shelf uses. The registry skips this file. */
import { n } from "../../engine/svg.js";

/** A closed rounded rectangle, path data. */
export const rrect = (x, y, w, h, r) =>
  `M${n(x + r)} ${n(y)}H${n(x + w - r)}A${r} ${r} 0 0 1 ${n(x + w)} ${n(y + r)}V${n(y + h - r)}` +
  `A${r} ${r} 0 0 1 ${n(x + w - r)} ${n(y + h)}H${n(x + r)}A${r} ${r} 0 0 1 ${n(x)} ${n(y + h - r)}V${n(y + r)}` +
  `A${r} ${r} 0 0 1 ${n(x + r)} ${n(y)}Z`;

/** The lower part of a rounded body, open along its top edge at y `cut`.
 *  Filled with the paper, the fill closes along the cut but the stroke does
 *  not, so a body built in two courses shows no seam. */
export const lowerHalf = (x, cut, w, bottom, r) =>
  `M${n(x)} ${n(cut)}V${n(bottom - r)}A${r} ${r} 0 0 0 ${n(x + r)} ${n(bottom)}H${n(x + w - r)}` +
  `A${r} ${r} 0 0 0 ${n(x + w)} ${n(bottom - r)}V${n(cut)}`;

/** The upper part, open along its bottom edge at y `cut`. */
export const upperHalf = (x, cut, w, top, r) =>
  `M${n(x)} ${n(cut)}V${n(top + r)}A${r} ${r} 0 0 1 ${n(x + r)} ${n(top)}H${n(x + w - r)}` +
  `A${r} ${r} 0 0 1 ${n(x + w)} ${n(top + r)}V${n(cut)}`;
