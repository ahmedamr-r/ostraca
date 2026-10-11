#!/usr/bin/env node
/* A tiny static server for dist/, with Vercel's clean URLs:
   /ostraca/figures -> ostraca/figures.html, unknown paths -> 404.html.
   The site lives under /ostraca, as on skills.ahmedamr.com, so the root
   sends you there, and a trailing slash comes off, as on Vercel.
     node scripts/serve-site.mjs [port]   (0 or none picks a free port)

   Every page it serves also loads React Grab (hover an element, press ⌘C or
   Ctrl+C to copy its context for an agent). Only this server adds it, so the
   site Vercel builds never loads it. */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../dist", import.meta.url));
const BASE = "/ostraca"; // as in build-site.mjs
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".json": "application/json", ".png": "image/png" };
const GRAB = `<script src="https://unpkg.com/react-grab/dist/index.global.js" crossorigin="anonymous"></script>`;
const isFile = async (p) => { try { return (await stat(p)).isFile(); } catch { return false; } };
const load = async (f) => extname(f) === ".html" ? (await readFile(f, "utf8")).replace("</head>", `${GRAB}</head>`) : readFile(f);

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  const moved = path === "/" ? BASE : path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : null;
  if (moved) { res.writeHead(path === "/" ? 307 : 308, { Location: moved }); return res.end(); }
  const tries = [path, `${path}.html`, join(path, "index.html")];
  for (const t of tries) {
    const f = join(DIST, t);
    if (f.startsWith(DIST) && await isFile(f)) {
      res.writeHead(200, { "Content-Type": TYPES[extname(f)] || "application/octet-stream" });
      return res.end(await load(f));
    }
  }
  res.writeHead(404, { "Content-Type": TYPES[".html"] });
  res.end(await load(join(DIST, "404.html")));
});
server.listen(Number(process.argv[2] || 0), "127.0.0.1", () => console.log(`http://127.0.0.1:${server.address().port}${BASE}`));
