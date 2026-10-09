/* Helpers the time shelf shares. The registry skips files starting with
   "_", so this is not a figure. */

const r2 = (v) => Math.round(v * 100) / 100;

/** A circle as path data, for outlines that join one path. */
export function ring(cx, cy, r) {
  return `M${r2(cx - r)} ${r2(cy)}A${r} ${r} 0 1 0 ${r2(cx + r)} ${r2(cy)}A${r} ${r} 0 1 0 ${r2(cx - r)} ${r2(cy)}Z`;
}

/** An ellipse as path data. */
export function oval(cx, cy, rx, ry) {
  return `M${r2(cx - rx)} ${r2(cy)}A${r2(rx)} ${r2(ry)} 0 1 0 ${r2(cx + rx)} ${r2(cy)}A${r2(rx)} ${r2(ry)} 0 1 0 ${r2(cx - rx)} ${r2(cy)}Z`;
}

/** The real measure as the app wrote it, or "" when there is none. */
export function shown(fig) {
  if (!fig || fig.value == null || fig.value === "") return "";
  return `${fig.value}${fig.unit ? ` ${fig.unit}` : ""}`;
}

/** A date from the app: "2026-10-09" (or anything Date can read, or a
    timestamp). Returns { year, month, day } or null. Read as written, with
    no time zone shift for a plain date. */
export function dateOf(fig) {
  const v = fig?.value;
  if (v == null || v === "") return null;
  const m = typeof v === "string" && /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(v);
  if (m) {
    const year = +m[1], month = +m[2] - 1, day = +m[3];
    if (month < 0 || month > 11 || day < 1 || day > daysIn(year, month)) return null;
    return { year, month, day };
  }
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

/** Days in a month (0 based). */
export const daysIn = (year, month) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

/** Weekday of the month's first day, Monday 0 to Sunday 6. */
export const firstWeekday = (year, month) => (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;

/** A time from the app: "07:30", "7:30 pm", a Date, a timestamp, or
    { hour, minute } numbers. Returns { hour, minute } on a 12 hour dial, or null. */
export function timeOf(fig) {
  const v = fig?.value;
  if (v == null || v === "") return null;
  if (typeof v === "string") {
    const m = /^\s*(\d{1,2}):(\d{2})\s*([ap]\.?m\.?)?/i.exec(v);
    if (m) {
      const hour = +m[1], minute = +m[2];
      if (hour > 23 || minute > 59) return null;
      return { hour: hour % 12, minute };
    }
  }
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return { hour: d.getHours() % 12, minute: d.getMinutes() };
}

/** A dimension chain standing upright, its figure turned to read up it
    (ctx.dimension() keeps its figure level, which only suits a level chain). */
export function upright(ctx, x, y0, y1, figure) {
  const { chain, esc, n } = ctx;
  const text = String(figure);
  const gap = text.length * 6.4 + 6; // a mono figure is about 6.4 a character at 10px
  const my = (y0 + y1) / 2;
  return `<g class="ink dim"><path class="chainline" d="${chain(x, y0, x, y1, gap)}" opacity="0.85"/>` +
    `<g transform="translate(${n(x + 3.5)} ${n(my)}) rotate(-90)"><text class="fig" x="0" y="0" text-anchor="middle">${esc(text)}</text></g></g>`;
}

/** A turned post, front on: a profile of [u, half width] stations from the
    foot (u 0) to the head (u 1), mirrored about x. Returns closed path data. */
export function turned(x, yFoot, yHead, profile) {
  const pt = ([u, w], s) => `${r2(x + s * w)} ${r2(yFoot + (yHead - yFoot) * u)}`;
  const right = profile.map((p) => pt(p, 1));
  const left = [...profile].reverse().map((p) => pt(p, -1));
  return `M${right.join("L")}L${left.join("L")}Z`;
}
