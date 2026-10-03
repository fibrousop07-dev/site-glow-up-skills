#!/usr/bin/env node
// Signature coverage check for a personality layer.
// For every route, at 1440 and 390 (and once with JS disabled), reports: element count, colour vs token,
// visibility after scrolling the whole page, and (for continuous motifs) breaks between consecutive segments.
// Exit code 1 if any route has 0 elements, a wrong colour, an invisible element, or any break.
//
// Usage:
//   node signature-coverage.mjs --base http://localhost:3000 --routes /,/about,/contact,/__missing \
//        --selector "[data-signature]" --token --jute [--continuous] [--tol 1] [--json out.json]
//   --routes   comma list, or @file with one route per line. Include a nonexistent route to cover the 404.
//   --token    CSS custom property (e.g. --jute) or a literal colour; the computed colour must equal it.
//   --prop     colour property to compare: stroke | fill | color | background-color (default: auto per element)
//   --continuous  segments (in document order) must chain: end x of one == start x of the next, within --tol px.
//   --max-lateral R  shape intent for vertical motifs (a hanging fibre, a rail): each segment's sideways extent divided by its
//                 vertical drop must be <= R (try 0.3). Omit for motifs that are not meant to run down the page.
//   --avoid-text  fail if the motif's path passes through a text glyph box, link, button or form control (3px pad).
// Needs playwright resolvable (same setup as shoot.mjs).
let chromium;
const pick = (m) => m.chromium ?? m.default?.chromium;
try { chromium = pick(await import("playwright")); if (!chromium) throw 0; }
catch {
  // ESM resolves from this script's folder; fall back to the folder the command is run from.
  const { createRequire } = await import("node:module"); const { pathToFileURL } = await import("node:url"); const path = await import("node:path");
  try { chromium = pick(await import(pathToFileURL(createRequire(path.join(process.cwd(), "x.js")).resolve("playwright")).href)); if (!chromium) throw 0; }
  catch { console.error("playwright not found. In a scratch dir run: npm i playwright && npx playwright install chromium, then run this script from that dir."); process.exit(2); }
}
import fs from "node:fs";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const flag = (n) => argv.includes("--" + n);
const base = (opt("base", "") || "").replace(/\/$/, "");
let routes = opt("routes", "/");
if (routes.startsWith("@")) routes = fs.readFileSync(routes.slice(1), "utf8").split(/\r?\n/).filter(Boolean).join(",");
routes = routes.split(",").map((r) => r.trim()).filter(Boolean);
const selector = opt("selector", "[data-signature]");
const token = opt("token", "");
const prop = opt("prop", "auto");
const continuous = flag("continuous");
const tol = parseFloat(opt("tol", "1"));
const maxLateral = opt("max-lateral") ? parseFloat(opt("max-lateral")) : null;
const avoidText = flag("avoid-text");
if (!base || !token) { console.error("need --base and --token (see header)"); process.exit(2); }

// Runs in the page. Returns per-element facts and chain geometry in page coordinates.
function inspect({ selector, token, prop, avoidText }) {
  const probe = document.createElement("i");
  probe.style.color = token.startsWith("--") ? `var(${token})` : token;
  document.body.appendChild(probe);
  const want = getComputedStyle(probe).color; probe.remove();
  const els = [...document.querySelectorAll(selector)];
  const sx = scrollX, sy = scrollY;
  const items = els.map((el) => {
    const cs = getComputedStyle(el);
    const isSvg = el instanceof SVGElement;
    const shape = isSvg ? (el.matches("path,line,polyline,circle,rect") ? el : el.querySelector("path,line,polyline")) : null;
    const ps = shape ? getComputedStyle(shape) : cs;
    const p = prop !== "auto" ? prop : shape ? (ps.stroke !== "none" ? "stroke" : "fill") : (cs.backgroundColor !== "rgba(0, 0, 0, 0)" ? "background-color" : "color");
    const got = ps.getPropertyValue(p);
    let chain = null, samples = [];
    if (shape && shape.getTotalLength && shape.getScreenCTM) {
      const m = shape.getScreenCTM(), len = shape.getTotalLength();
      const a = shape.getPointAtLength(0), b = shape.getPointAtLength(len);
      const tp = (pt) => ({ x: pt.x * m.a + pt.y * m.c + m.e + sx, y: pt.x * m.b + pt.y * m.d + m.f + sy });
      chain = { start: tp(a), end: tp(b) };
      const n = Math.max(8, Math.min(120, Math.ceil(len / 25)));
      for (let k = 0; k <= n; k++) samples.push(tp(shape.getPointAtLength((len * k) / n)));
    } else {
      const r = el.getBoundingClientRect();
      chain = { start: { x: r.left + r.width / 2 + sx, y: r.top + sy }, end: { x: r.left + r.width / 2 + sx, y: r.bottom + sy } };
      for (let k = 0; k <= 10; k++) samples.push({ x: chain.start.x, y: chain.start.y + ((chain.end.y - chain.start.y) * k) / 10 });
    }
    let hidden = cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.05;
    for (let n = el.parentElement; n && !hidden; n = n.parentElement) {
      const c = getComputedStyle(n);
      if (c.display === "none" || c.visibility === "hidden" || parseFloat(c.opacity) < 0.05) hidden = true;
    }
    const r = el.getBoundingClientRect();
    if (!isSvg && (r.width === 0 || r.height === 0)) hidden = true;
    // a dash-drawn stroke that is not fully drawn counts as not drawn
    let undrawn = false;
    if (shape && shape.getTotalLength) {
      const da = parseFloat(ps.strokeDasharray), off = parseFloat(ps.strokeDashoffset);
      if (da > 0 && off > 0.5) undrawn = true;
    }
    return { colorProp: p, got, colorOk: got === want, hidden, undrawn, chain, samples };
  });
  // text glyph boxes and interactive controls in page coordinates, for the keep-clear-of-text rule
  const boxes = [];
  if (avoidText) {
    const add = (r) => { if (r.width > 0 && r.height > 0 && boxes.length < 4000) boxes.push({ l: r.left + sx, t: r.top + sy, r: r.right + sx, b: r.bottom + sy }); };
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.textContent.trim() || n.parentElement.closest("script,style,noscript,[data-signature-ignore]")) continue;
      if (els.some((e) => e.contains(n))) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const r of rg.getClientRects()) add(r);
    }
    document.querySelectorAll("a[href],button,input,select,textarea,summary,[role=button]").forEach((e) => { if (!els.some((s2) => s2.contains(e) || e.contains(s2))) add(e.getBoundingClientRect()); });
  }
  return { want, items, boxes };
}

async function scrollThrough(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = await page.evaluate(() => innerHeight);
  for (let y = 0; y < h; y += Math.max(200, vh * 0.6)) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(120); }
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(400);
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(150);
}

const browser = await chromium.launch();
const rows = [];
const run = async (label, ctxOpts, doScroll) => {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  for (const route of routes) {
    const resp = await page.goto(base + route, { waitUntil: "networkidle" }).catch(() => null);
    await page.waitForTimeout(400); // let dev servers finish hydrating or hot-reloading
    if (doScroll) await scrollThrough(page).catch(async () => { await page.waitForTimeout(800); await scrollThrough(page); });
    const r = await page.evaluate(inspect, { selector, token, prop, avoidText });
    // chain order: document order is what the skill promises; also sort by y to flag out-of-order chains
    let breaks = 0, worst = 0, ygap = 0;
    if (continuous) {
      for (let i = 0; i + 1 < r.items.length; i++) {
        const dx = Math.abs(r.items[i].chain.end.x - r.items[i + 1].chain.start.x);
        const dy = Math.abs(r.items[i + 1].chain.start.y - r.items[i].chain.end.y);
        worst = Math.max(worst, dx); ygap = Math.max(ygap, dy);
        if (dx > tol) breaks++;
      }
    }
    // shape: sideways extent over vertical drop, per segment
    let worstRatio = 0, shapeBad = 0;
    for (const it of r.items) {
      const xs = it.samples.map((q) => q.x), ys = it.samples.map((q) => q.y);
      const lat = Math.max(...xs) - Math.min(...xs), drop = Math.max(...ys) - Math.min(...ys);
      const ratio = drop < 1 ? (lat < 1 ? 0 : Infinity) : lat / drop;
      worstRatio = Math.max(worstRatio, ratio);
      if (maxLateral != null && ratio > maxLateral) shapeBad++;
    }
    // collisions with text or controls
    let collisions = 0;
    if (avoidText) {
      const pad = 3;
      for (const it of r.items) for (const q of it.samples)
        if (r.boxes.some((b) => q.x >= b.l - pad && q.x <= b.r + pad && q.y >= b.t - pad && q.y <= b.b + pad)) { collisions++; break; }
    }
    const count = r.items.length;
    rows.push({
      shapeBad, worstRatio: Number.isFinite(worstRatio) ? +worstRatio.toFixed(3) : "inf", collisions,
      route, view: label, status: resp ? resp.status() : "ERR", count,
      colorOk: count > 0 && r.items.every((i) => i.colorOk), want: r.want,
      got: [...new Set(r.items.map((i) => i.got))].join(" | "),
      visible: count > 0 && r.items.every((i) => !i.hidden && !i.undrawn),
      hiddenCount: r.items.filter((i) => i.hidden || i.undrawn).length,
      breaks, worstDx: +worst.toFixed(1), maxYGap: +ygap.toFixed(1),
      first: count ? r.items[0].chain.start : null, last: count ? r.items[count - 1].chain.end : null,
    });
  }
  await ctx.close();
};
await run("1440", { viewport: { width: 1440, height: 900 } }, true);
await run("390", { viewport: { width: 390, height: 844 } }, true);
await run("1440 reduced-motion", { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }, true);
await run("1440 no-JS", { viewport: { width: 1440, height: 900 }, javaScriptEnabled: false }, false);
await browser.close();

const fails = [];
for (const r of rows) {
  if (r.count === 0) fails.push(`${r.route} @${r.view}: 0 elements`);
  else {
    if (!r.colorOk) fails.push(`${r.route} @${r.view}: colour ${r.got} != token ${r.want}`);
    if (!r.visible) fails.push(`${r.route} @${r.view}: ${r.hiddenCount} element(s) hidden or undrawn`);
    if (continuous && r.breaks > 0) fails.push(`${r.route} @${r.view}: ${r.breaks} break(s), worst dx ${r.worstDx}px`);
    if (r.shapeBad) fails.push(`${r.route} @${r.view}: ${r.shapeBad} segment(s) too lateral (worst sideways/drop ${r.worstRatio} > ${maxLateral})`);
    if (r.collisions) fails.push(`${r.route} @${r.view}: ${r.collisions} element(s) cross text or a control`);
  }
}
console.log("route | view | count | colour ok | visible | breaks (worst dx) | max y gap | sideways/drop | text hits");
for (const r of rows) console.log(`${r.route} | ${r.view} | ${r.count} | ${r.colorOk} | ${r.visible} | ${continuous ? r.breaks + " (" + r.worstDx + ")" : "n/a"} | ${continuous ? r.maxYGap : "n/a"} | ${r.worstRatio} | ${avoidText ? r.collisions : "n/a"}`);
console.log(fails.length ? "\nFAIL\n" + fails.join("\n") : "\nPASS");
if (opt("json")) fs.writeFileSync(opt("json"), JSON.stringify({ rows, fails }, null, 2));
process.exit(fails.length ? 1 : 0);
