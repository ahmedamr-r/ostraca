#!/usr/bin/env node
/* Writes the figures list in docs/options.md, between its figures:start and
   figures:end markers, from the registry. Run it after scripts/registry.mjs.
   Usage: node scripts/docs-figures.mjs [--report]
   --report also lists where a figure differs from catalogue.json. */
import { readFileSync, writeFileSync } from "node:fs";
const ROOT = new URL("../", import.meta.url);
const { figures, inspect } = await import(new URL("src/index.js", ROOT));
const cat = JSON.parse(readFileSync(new URL("catalogue.json", ROOT)));
const order = cat.shelves.map((s) => s.key);
const intro = {
  messages: "Inboxes, notifications, email and comments. Most products show their first empty screen here.",
  files: "Keeping, finding, charting and throwing away.",
  people: "Teams, profiles, sign in and the first achievement.",
  money: "Payments, balances, savings and receipts.",
  shopping: "Carts, orders, shop fronts and food on the way.",
  time: "Calendars, countdowns, reminders and time away.",
  devices: "The computer and phone an app runs on, and what it asks of them.",
  site: "The building site the library started from. Six subjects for lists, onboarding, integrations, live connections, missing pages and uploads.",
};
const title = Object.fromEntries(cat.shelves.map((s) => [s.key, s.title]));
const shelves = [...new Set(figures.map((f) => f.shelf))].sort((a, b) => (order.indexOf(a) + 99 * (order.indexOf(a) < 0)) - (order.indexOf(b) + 99 * (order.indexOf(b) < 0)));
const report = [];
let md = `${figures.length} figures on ${shelves.length} shelves. Every figure draws all six states. **Error** says how it goes wrong: it leans off a plumb line or sags under a string. **Measure** is what \`figure\` carries, for the figures that draw one; the example is a sample, so pass your own.\n`;
for (const s of shelves) {
  const list = figures.filter((f) => f.shelf === s).sort((a, b) => a.name.localeCompare(b.name));
  md += `\n### ${title[s] ?? s}\n\n${intro[s] ?? ""}\n\n| Figure | Name | For | Error | Measure |\n| --- | --- | --- | --- | --- |\n`;
  for (const f of list) {
    let err = "";
    try { err = inspect(f.name, { state: "error" }).parts.error; } catch (e) { report.push(`${f.name}: inspect failed ${e.message}`); }
    const lit = (v) => (Array.isArray(v) ? `[${v.join(", ")}]` : JSON.stringify(v));
    const ex = f.measures ? `\`{ value: ${lit(f.measures.sample)}${f.measures.unit ? `, unit: ${lit(f.measures.unit)}` : ""} }\`` : "";
    const m = f.measures ? `${f.measures.what}, such as ${ex}` : "";
    md += `| ${f.title} | \`${f.name}\` | ${f.use} | ${err} | ${m} |\n`;
    const c = cat.shelves.find((x) => x.key === s)?.figures.find((x) => x.name === f.name);
    if (!c) report.push(`${f.name}: not in catalogue`);
    else { if (c.use !== f.use) report.push(`${f.name}: use differs\n   code: ${f.use}\n   cat:  ${c.use}`); if (c.error !== err) report.push(`${f.name}: error ${err} vs catalogue ${c.error}`); }
  }
}
const missing = cat.shelves.flatMap((s) => s.figures.filter((c) => !figures.some((f) => f.name === c.name)).map((c) => `${s.key}/${c.name}`));
const p = new URL("docs/options.md", ROOT);
const doc = readFileSync(p, "utf8");
writeFileSync(p, doc.replace(/<!-- figures:start -->[\s\S]*<!-- figures:end -->/, `<!-- figures:start -->\n${md}\nFigures of your own join this list once you pass them to \`define()\`. The [agent skill](skill.md) draws them.\n<!-- figures:end -->`));
if (process.argv.includes("--report")) console.log(report.join("\n"));
console.log(`docs-figures: ${figures.length} figures -> docs/options.md${missing.length ? `; in catalogue.json, not drawn yet: ${missing.join(", ")}` : ""}`);
