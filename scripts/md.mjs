/* A small Markdown converter for the docs pages: headings, paragraphs,
   lists (one level of nesting), code fences, inline code, links, bold and
   italic, tables, images, block quotes and rules. Nothing else, on purpose.

     md(source, { link: (href) => href }) -> { html, title, headings }  */

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function slug(s) {
  return s.toLowerCase().replace(/<[^>]+>/g, "").replace(/`/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function inline(src, link) {
  // Code spans first, held out of everything else.
  const held = [];
  let s = src.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_, __, code) => {
    held.push(`<code>${esc(code.trim())}</code>`);
    return `\u0000${held.length - 1}\u0000`;
  });
  s = esc(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_, alt, href, title) =>
    `<img src="${link(href)}" alt="${alt}"${title ? ` title="${title}"` : ""} loading="lazy">`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) => {
    const h = link(href.replace(/&amp;/g, "&"));
    const ext = /^https?:/.test(h);
    return `<a href="${esc(h)}"${ext ? ' rel="noopener"' : ""}>${text}</a>`;
  });
  s = s.replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, (_, u) => `<a href="${u}" rel="noopener">${u}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^\w*])\*([^*\s][^*]*?)\*(?!\w)/g, "$1<em>$2</em>");
  s = s.replace(/(^|[^\w])_([^_\s][^_]*?)_(?!\w)/g, "$1<em>$2</em>");
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => held[+i]);
}

const cells = (line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));

export function md(source, { link = (h) => h } = {}) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  const headings = [];
  let title = "";
  let i = 0;
  const isBlockStart = (l) => /^(#{1,6}\s|```|>\s?|\s*([-*+]|\d+[.)])\s|\|.*\||---+\s*$|\*\*\*+\s*$)/.test(l);

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    // Fenced code
    const fence = line.match(/^(`{3,}|~{3,})\s*([\w-]*)/);
    if (fence) {
      const body = [];
      i++;
      while (i < lines.length && !lines[i].startsWith(fence[1])) body.push(lines[i++]);
      i++;
      const lang = fence[2] || "";
      out.push(`<pre class="code"${lang ? ` data-lang="${lang}"` : ""}><code>${esc(body.join("\n"))}</code></pre>`);
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (h) {
      const level = h[1].length;
      const html = inline(h[2], link);
      if (level === 1 && !title) { title = h[2].replace(/`/g, ""); out.push(`<h1>${html}</h1>`); i++; continue; }
      let id = slug(h[2]);
      while (headings.some((x) => x.id === id)) id += "-2";
      headings.push({ level, id, text: h[2].replace(/`/g, "") });
      out.push(`<h${level} id="${id}">${html}<a class="anchor" href="#${id}" aria-label="Link to this section">#</a></h${level}>`);
      i++;
      continue;
    }

    // Rule
    if (/^(---+|\*\*\*+)\s*$/.test(line)) { out.push("<hr>"); i++; continue; }

    // Table: a header row, then a divider row
    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const head = cells(line);
      const align = cells(lines[i + 1]).map((c) => (c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : ""));
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(cells(lines[i++]));
      const td = (tag, c, k) => `<${tag}${align[k] ? ` style="text-align:${align[k]}"` : ""}>${inline(c, link)}</${tag}>`;
      out.push(`<div class="table"><table><thead><tr>${head.map((c, k) => td("th", c, k)).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${head.map((_, k) => td("td", r[k] ?? "", k)).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }

    // Block quote
    if (/^>\s?/.test(line)) {
      const body = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) body.push(lines[i++].replace(/^>\s?/, ""));
      out.push(`<blockquote>${md(body.join("\n"), { link }).html}</blockquote>`);
      continue;
    }

    // Lists
    const li = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
    if (li) {
      const ordered = /\d/.test(li[2]);
      const base = li[1].length;
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
        if (m && m[1].length === base && /\d/.test(m[2]) === ordered) { items.push([m[3]]); i++; continue; }
        if (m && m[1].length > base && items.length) { items[items.length - 1].push(lines[i]); i++; continue; }
        if (lines[i].trim() && /^\s+/.test(lines[i]) && items.length && !isBlockStart(lines[i].trim())) {
          items[items.length - 1][0] += " " + lines[i].trim(); i++; continue;
        }
        if (!lines[i].trim() && i + 1 < lines.length) {
          const n = lines[i + 1].match(/^(\s*)([-*+]|\d+[.)])\s+/);
          if (n && n[1].length === base && /\d/.test(n[2]) === ordered) { i++; continue; }
        }
        break;
      }
      const tag = ordered ? "ol" : "ul";
      const start = ordered && parseInt(li[2], 10) !== 1 ? ` start="${parseInt(li[2], 10)}"` : "";
      out.push(`<${tag}${start}>${items.map(([first, ...rest]) => {
        const nested = rest.length ? md(rest.map((l) => l.slice(base + 2)).join("\n"), { link }).html : "";
        return `<li>${inline(first, link)}${nested}</li>`;
      }).join("")}</${tag}>`);
      continue;
    }

    // Raw HTML blocks pass through (the docs use none, but a <details> should survive).
    if (/^<(details|div|figure|p|table)[\s>]/.test(line)) {
      const body = [];
      while (i < lines.length && lines[i].trim()) body.push(lines[i++]);
      out.push(body.join("\n"));
      continue;
    }

    // Paragraph
    const para = [];
    while (i < lines.length && lines[i].trim() && !(para.length && isBlockStart(lines[i]))) para.push(lines[i++].trim());
    out.push(`<p>${inline(para.join(" "), link)}</p>`);
  }
  return { html: out.join("\n"), title, headings };
}
