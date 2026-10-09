/* The home page's street elevation: everyday figures on one ground line,
   left to right, with the crew on. After changing it, run
   node scripts/measure-street.mjs so the street is laid tight again. */
export const STREET = [
  ["mailbox", { state: "idle" }],
  ["noticeboard", { state: "loading", value: 0.55 }],
  ["seats", { state: "idle" }],
  ["coins", { state: "idle" }],
  ["trolley", { state: "success" }],
  ["calendar", { state: "changed" }],
  ["laptop", { state: "idle" }],
  ["stove", { state: "error" }],
];
