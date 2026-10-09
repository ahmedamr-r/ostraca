/* Wall: courses of block on a footing. Lists, tables, rows that fill in. */
const X0 = 112, COLS = 5, ROWS = 6, BW = 36, BH = 13, FOOT = 8;

export default {
  name: "wall",
  title: "Wall",
  shelf: "site",
  use: "Lists, tables and rows that fill in",
  width: 460,
  height: 126,
  draw({ n, SET_OUT }) {
    const w = COLS * BW, x1 = X0 + w, top = -FOOT - ROWS * BH;
    const fx0 = X0 - 8, fx1 = x1 + 8;
    const courseY = (r) => -FOOT - (r + 1) * BH;
    const joints = (r) => {
      let d = "";
      const off = r % 2 ? BW / 2 : 0;
      for (let x = X0 + off + (off ? 0 : BW); x < x1 - 1; x += BW) d += `M${n(x)} ${n(courseY(r))}v${BH}`;
      return d;
    };
    const courses = [{ svg: `<path class="paper" d="M${fx0} 0V${-FOOT}H${fx1}V0Z"/>`, still: true }];
    let inside = "";
    for (let r = 0; r < ROWS; r++) {
      inside += `M${X0} ${courseY(r) + BH}H${x1}` + joints(r);
      courses.push(`<rect class="paper" x="${X0}" y="${courseY(r)}" width="${w}" height="${BH}"/><path d="${joints(r)}" opacity="0.55"/>`);
    }
    const r2 = courseY(2);
    return {
      courses,
      outline: `<path d="M${fx0} 0V${-FOOT}H${X0}V${top}H${x1}V${-FOOT}H${fx1}V0" stroke-dasharray="${SET_OUT}"/>`,
      contents: `<path d="${inside}"/>`,
      hatch: [fx0 + 8, fx1],
      foot: [x1, -FOOT],
      top,
      error: "lean",
      revise: [x1 - 2 * BW - 5, r2 - 5, 2 * BW + 10, BH + 10],
      tag: [x1 + 18, r2 - 9],
      access: { kind: "scaffold", at: [x1 + 5, x1 + 40] },
      stations: {
        empty: { pose: "letterer", x: x1 + 20.8, y: 0 },
        changed: { pose: "letterer", x: x1 + 20.8, y: 0 },
        loading: { pose: "carrier", x: x1 + 30, y: -2.5, ride: true },
        waiting: { pose: "hauler", x: x1 + 100, y: 0, flip: true },
        idle: { pose: "sitter", x: X0 + 46, y: top, flip: true },
        success: { pose: "sitter", x: X0 + 46, y: top, flip: true },
        error: { pose: "shrugger", x: X0 - 34, y: 0 },
      },
    };
  },
};
