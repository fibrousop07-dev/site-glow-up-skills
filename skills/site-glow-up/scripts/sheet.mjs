#!/usr/bin/env node
// Contact sheet: tiles PNG frames (e.g. shoot.mjs --strip output) into one image so a whole page can be reviewed at once.
// Usage: node sheet.mjs <out.png> <dir> [filterSubstring] [--cols=4] [--tile=360]
// Needs playwright resolvable (same as shoot.mjs).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const pick = (m) => m.chromium ?? m.default?.chromium;
let chromium;
try { chromium = pick(await import("playwright")); if (!chromium) throw 0; }
catch { chromium = pick(await import(pathToFileURL(createRequire(path.join(process.cwd(), "x.js")).resolve("playwright")).href)); }
const args = process.argv.slice(2);
const opt = (n, d) => Number(args.find((a) => a.startsWith(`--${n}=`))?.split("=")[1] ?? d);
const [out, dir, filter = ""] = args.filter((a) => !a.startsWith("--"));
const cols = opt("cols", 4), tile = opt("tile", 360);
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png") && f.includes(filter)).sort();
if (!files.length) { console.error("no frames match"); process.exit(1); }
const html = `<body style="margin:0;background:#777;display:grid;grid-template-columns:repeat(${cols},${tile}px);gap:4px;padding:4px;font:12px sans-serif">${files
  .map((f) => `<figure style="margin:0"><img style="width:${tile}px;display:block" src="data:image/png;base64,${fs.readFileSync(path.join(dir, f)).toString("base64")}"><figcaption style="color:#fff">${f}</figcaption></figure>`).join("")}</body>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: cols * (tile + 4) + 4, height: 400 }, deviceScaleFactor: 1 });
await p.setContent(html, { waitUntil: "load" });
await p.screenshot({ path: out, fullPage: true });
await b.close();
console.log(`${files.length} frames -> ${out}`);
