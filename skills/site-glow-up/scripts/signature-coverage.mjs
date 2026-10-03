#!/usr/bin/env node
// Signature coverage and craft check for a personality layer.
// For every route, at 1440, 390, 1440 with reduced motion, and 1440 with JS off, it reports: element count, colour vs token,
// visibility after scrolling the whole page, chain breaks, shape, smoothness, contrast, overlaps and sideways overflow.
// Animated motifs are measured at the start, middle and end of their animation, so a swing that only collides at its extreme is caught.
// Exit code 1 on any failure. It judges measurable craft, not taste: see references/signature-review.md for the visual review.
//
// Usage:
//   node signature-coverage.mjs --base http://localhost:3000 --routes /,/about,/contact,/__missing \
//        --selector "[data-signature]" --token --signature [--continuous] [flags] [--json out.json]
//   --routes      comma list, or @file with one route per line. Include a nonexistent route to cover the 404.
//   --token       CSS custom property (e.g. --signature) or a literal colour; the computed colour must equal it.
//   --prop        colour property to compare: stroke | fill | color | background-color (default: auto per element)
//   --continuous  segments (document order) must chain: end x of one == start x of the next, within --tol px (default 1).
//   --max-lateral R   vertical motifs (hanging fibre, rail): per segment, sideways extent / vertical drop <= R (try 0.3).
//   --max-kink DEG    smoothness: largest direction change between neighbouring ~25px stretches, inside a segment and at every
//                     join between segments, must be <= DEG (try 25). Catches corners, zigzags and kinked joins.
//   --min-contrast R / --max-contrast R   stroke or fill colour against the background it sits on (WCAG ratio). A decorative
//                     line wants to be seen (>= 1.3) without shouting (<= 5, say). Restraint is part of craft.
//   --min-edge PX     the whole motif, at every point of its animation, stays at least PX from the left and right viewport edges
//                     (12 is a good start). A strand pinned to the edge reads as a border and clips when it sways.
//   --ends-inside PX  the motif starts at least PX below the top of the page and ends at least PX above its foot, so it has a
//                     visible start and end instead of running off the page (use for a hanging strand; skip for a full-bleed rail).
//   --avoid-text  fail if the path passes within 3px of a text glyph box, link, button or form control.
//   --avoid-media also fail for images, video, canvas, iframes and other SVGs. Mark exceptions with data-signature-ignore.
//   Always checked: the page must not scroll sideways at any width.
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
const num = (n) => (opt(n) != null ? parseFloat(opt(n)) : null);
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
const maxLateral = num("max-lateral"), maxKink = num("max-kink"), minContrast = num("min-contrast"), maxContrast = num("max-contrast");
const avoidText = flag("avoid-text"), avoidMedia = flag("avoid-media");
const minEdge = num("min-edge"), endsInside = num("ends-inside");
if (!base || !token) { console.error("need --base and --token (see header)"); process.exit(2); }

// Runs in the page. Returns per-element facts, sampled path points in page coordinates, and obstacle boxes.
function inspect({ selector, token, prop, avoidText, avoidMedia }) {
  const probe = document.createElement("i");
  probe.style.color = token.startsWith("--") ? `var(${token})` : token;
  document.body.appendChild(probe);
  const want = getComputedStyle(probe).color; probe.remove();
  const els = [...document.querySelectorAll(selector)];
  const sx = scrollX, sy = scrollY;
  const parse = (c) => { const m = (c || "").match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = (u) => { u /= 255; return u <= 0.03928 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  // background actually behind a page point: scroll it into view, look through the motif, take the first solid background
  const bgAt = (q) => {
    const oy = scrollY; scrollTo(0, Math.max(0, q.y - innerHeight / 2));
    const vx = Math.min(innerWidth - 1, Math.max(0, q.x - scrollX)), vy = q.y - scrollY;
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (const e of document.elementsFromPoint(vx, vy)) {
      if (els.some((m) => m === e || m.contains(e))) continue;
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0.5) { bg = c; break; }
    }
    scrollTo(0, oy); return bg;
  };
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
      const tp = (pt) => ({ x: pt.x * m.a + pt.y * m.c + m.e + sx, y: pt.x * m.b + pt.y * m.d + m.f + sy });
      const n = Math.max(8, Math.min(160, Math.ceil(len / 25)));
      for (let k = 0; k <= n; k++) samples.push(tp(shape.getPointAtLength((len * k) / n)));
      chain = { start: samples[0], end: samples[n] };
    } else {
      const r = el.getBoundingClientRect();
      chain = { start: { x: r.left + r.width / 2 + sx, y: r.top + sy }, end: { x: r.left + r.width / 2 + sx, y: r.bottom + sy } };
      for (let k = 0; k <= 10; k++) samples.push({ x: chain.start.x, y: chain.start.y + ((chain.end.y - chain.start.y) * k) / 10 });
    }
    // direction of each stretch between neighbouring samples, for smoothness
    const dirs = [];
    for (let i = 0; i + 1 < samples.length; i++) { const dx = samples[i + 1].x - samples[i].x, dy = samples[i + 1].y - samples[i].y; if (Math.hypot(dx, dy) > 0.5) dirs.push(Math.atan2(dy, dx)); }
    const turn = (a, b) => { let d = Math.abs(a - b) % (2 * Math.PI); if (d > Math.PI) d = 2 * Math.PI - d; return (d * 180) / Math.PI; };
    let kink = 0; for (let i = 0; i + 1 < dirs.length; i++) kink = Math.max(kink, turn(dirs[i], dirs[i + 1]));
    let hidden = cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.05;
    for (let n = el.parentElement; n && !hidden; n = n.parentElement) {
      const c = getComputedStyle(n);
      if (c.display === "none" || c.visibility === "hidden" || parseFloat(c.opacity) < 0.05) hidden = true;
    }
    const r = el.getBoundingClientRect();
    if (!isSvg && (r.width === 0 || r.height === 0)) hidden = true;
    let undrawn = false;
    if (shape && shape.getTotalLength) {
      const da = parseFloat(ps.strokeDasharray), off = parseFloat(ps.strokeDashoffset);
      if (da > 0 && off > 0.5) undrawn = true;
    }
    const col = parse(got);
    const contrast = col && samples.length ? ratio(col, bgAt(samples[Math.floor(samples.length / 2)])) : null;
    const xs = samples.map((q) => q.x), ysAll = samples.map((q) => q.y);
    return { edge: Math.min(...xs, ...xs.map((x) => innerWidth - x)), topY: Math.min(...ysAll), footGap: document.documentElement.scrollHeight - Math.max(...ysAll),
      got, colorOk: got === want, hidden, undrawn, chain, samples, kink, dirStart: dirs[0] ?? 0, dirEnd: dirs[dirs.length - 1] ?? 0,
      contrast, width: shape ? parseFloat(ps.strokeWidth) || 0 : null, offscreen: Math.min(...xs) < -1 || Math.max(...xs) > innerWidth + 1 };
  });
  const boxes = [];
  if (avoidText || avoidMedia) {
    const add = (r) => { if (r.width > 0 && r.height > 0 && boxes.length < 4000) boxes.push({ l: r.left + sx, t: r.top + sy, r: r.right + sx, b: r.bottom + sy }); };
    const mine = (e) => els.some((m) => m === e || m.contains(e) || e.contains(m));
    if (avoidText) {
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (!n.textContent.trim() || n.parentElement.closest("script,style,noscript,[data-signature-ignore]") || mine(n.parentElement)) continue;
        const rg = document.createRange(); rg.selectNodeContents(n);
        for (const r of rg.getClientRects()) add(r);
      }
      document.querySelectorAll("a[href],button,input,select,textarea,summary,[role=button]").forEach((e) => { if (!mine(e) && !e.closest("[data-signature-ignore]")) add(e.getBoundingClientRect()); });
    }
    if (avoidMedia) document.querySelectorAll("img,video,canvas,picture,iframe,svg,[role=img]").forEach((e) => { if (!mine(e) && !e.closest("[data-signature-ignore]")) add(e.getBoundingClientRect()); });
  }
  return { want, items, boxes, overflowX: Math.max(0, document.documentElement.scrollWidth - innerWidth) };
}

async function scrollThrough(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = await page.evaluate(() => innerHeight);
  for (let y = 0; y < h; y += Math.max(200, vh * 0.6)) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(120); }
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(400);
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(150);
}

// Freeze every running animation at a fraction of one cycle (start, middle, end), so swings are measured at their extremes.
const freezeAt = (page, f) => page.evaluate((f) => document.getAnimations().forEach((a) => { try { const t = a.effect.getComputedTiming(); a.pause(); if (isFinite(t.duration) && t.duration > 0) a.currentTime = t.duration * f; } catch {} }), f);

function measure(r) {
  let breaks = 0, worstDx = 0, maxYGap = 0, joinKink = 0;
  if (continuous) {
    for (let i = 0; i + 1 < r.items.length; i++) {
      const a = r.items[i], b = r.items[i + 1];
      const dx = Math.abs(a.chain.end.x - b.chain.start.x);
      worstDx = Math.max(worstDx, dx); maxYGap = Math.max(maxYGap, Math.abs(b.chain.start.y - a.chain.end.y));
      if (dx > tol) breaks++;
      let d = Math.abs(a.dirEnd - b.dirStart) % (2 * Math.PI); if (d > Math.PI) d = 2 * Math.PI - d;
      joinKink = Math.max(joinKink, (d * 180) / Math.PI);
    }
  }
  let worstRatio = 0, shapeBad = 0;
  for (const it of r.items) {
    const xs = it.samples.map((q) => q.x), ys = it.samples.map((q) => q.y);
    const lat = Math.max(...xs) - Math.min(...xs), drop = Math.max(...ys) - Math.min(...ys);
    const ratio = drop < 1 ? (lat < 1 ? 0 : Infinity) : lat / drop;
    worstRatio = Math.max(worstRatio, ratio);
    if (maxLateral != null && ratio > maxLateral) shapeBad++;
  }
  let collisions = 0;
  if (avoidText || avoidMedia) {
    const pad = 3;
    for (const it of r.items) for (const q of it.samples)
      if (r.boxes.some((b) => q.x >= b.l - pad && q.x <= b.r + pad && q.y >= b.t - pad && q.y <= b.b + pad)) { collisions++; break; }
  }
  const cs = r.items.map((i) => i.contrast).filter((c) => c != null);
  return {
    count: r.items.length, want: r.want, got: [...new Set(r.items.map((i) => i.got))].join(" | "),
    colorOk: r.items.length > 0 && r.items.every((i) => i.colorOk),
    visible: r.items.length > 0 && r.items.every((i) => !i.hidden && !i.undrawn),
    hiddenCount: r.items.filter((i) => i.hidden || i.undrawn).length,
    breaks, worstDx, maxYGap, shapeBad, worstRatio, collisions, joinKink,
    kink: Math.max(0, ...r.items.map((i) => i.kink)),
    contrastMin: cs.length ? Math.min(...cs) : null, contrastMax: cs.length ? Math.max(...cs) : null,
    width: r.items.length ? Math.min(...r.items.map((i) => i.width ?? Infinity)) : null,
    offscreen: r.items.some((i) => i.offscreen), overflowX: r.overflowX,
    edge: r.items.length ? Math.min(...r.items.map((i) => i.edge)) : null, topY: r.items.length ? Math.min(...r.items.map((i) => i.topY)) : null, footGap: r.items.length ? Math.min(...r.items.map((i) => i.footGap)) : null,
  };
}
const worse = (a, b) => ({
  ...a, colorOk: a.colorOk && b.colorOk, visible: a.visible && b.visible, hiddenCount: Math.max(a.hiddenCount, b.hiddenCount),
  breaks: Math.max(a.breaks, b.breaks), worstDx: Math.max(a.worstDx, b.worstDx), maxYGap: Math.max(a.maxYGap, b.maxYGap),
  shapeBad: Math.max(a.shapeBad, b.shapeBad), worstRatio: Math.max(a.worstRatio, b.worstRatio), collisions: Math.max(a.collisions, b.collisions),
  joinKink: Math.max(a.joinKink, b.joinKink), kink: Math.max(a.kink, b.kink), offscreen: a.offscreen || b.offscreen, overflowX: Math.max(a.overflowX, b.overflowX),
  edge: Math.min(a.edge, b.edge), topY: Math.min(a.topY, b.topY), footGap: Math.min(a.footGap, b.footGap),
  contrastMin: a.contrastMin == null ? b.contrastMin : Math.min(a.contrastMin, b.contrastMin ?? Infinity),
  contrastMax: a.contrastMax == null ? b.contrastMax : Math.max(a.contrastMax, b.contrastMax ?? 0),
});

const browser = await chromium.launch();
const rows = [];
const run = async (label, ctxOpts, doScroll) => {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const args = { selector, token, prop, avoidText, avoidMedia };
  for (const route of routes) {
    const resp = await page.goto(base + route, { waitUntil: "networkidle" }).catch(() => null);
    await page.waitForTimeout(400); // let dev servers finish hydrating or hot-reloading
    if (doScroll) await scrollThrough(page).catch(async () => { await page.waitForTimeout(800); await scrollThrough(page); });
    let m = null;
    for (const f of [0, 0.5, 1]) { await freezeAt(page, f); const x = measure(await page.evaluate(inspect, args)); m = m ? worse(m, x) : x; }
    rows.push({ route, view: label, status: resp ? resp.status() : "ERR", ...m });
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
  const at = `${r.route} @${r.view}`;
  if (r.count === 0) { fails.push(`${at}: 0 elements`); continue; }
  if (!r.colorOk) fails.push(`${at}: colour ${r.got} != token ${r.want}`);
  if (!r.visible) fails.push(`${at}: ${r.hiddenCount} element(s) hidden or undrawn`);
  if (continuous && r.breaks > 0) fails.push(`${at}: ${r.breaks} break(s), worst dx ${r.worstDx.toFixed(1)}px`);
  if (r.shapeBad) fails.push(`${at}: ${r.shapeBad} segment(s) too lateral (worst sideways/drop ${fmt(r.worstRatio)} > ${maxLateral})`);
  if (maxKink != null && Math.max(r.kink, r.joinKink) > maxKink) fails.push(`${at}: kinked, ${Math.max(r.kink, r.joinKink).toFixed(0)} deg turn (${r.joinKink > r.kink ? "at a join" : "inside a segment"}) > ${maxKink}`);
  if (minContrast != null && r.contrastMin != null && r.contrastMin < minContrast) fails.push(`${at}: contrast ${r.contrastMin.toFixed(2)} < ${minContrast} (too faint)`);
  if (maxContrast != null && r.contrastMax != null && r.contrastMax > maxContrast) fails.push(`${at}: contrast ${r.contrastMax.toFixed(2)} > ${maxContrast} (too loud)`);
  if (r.collisions) fails.push(`${at}: ${r.collisions} element(s) cross ${avoidMedia ? "text, a control or media" : "text or a control"}`);
  if (minEdge != null && r.edge < minEdge) fails.push(`${at}: motif comes within ${r.edge.toFixed(0)}px of the viewport edge (< ${minEdge}px)`);
  if (endsInside != null && r.topY < endsInside) fails.push(`${at}: motif starts ${r.topY.toFixed(0)}px from the top of the page, no visible anchor (< ${endsInside}px)`);
  if (endsInside != null && r.footGap < endsInside) fails.push(`${at}: motif ends ${r.footGap.toFixed(0)}px from the foot of the page, it runs off the page (< ${endsInside}px)`);
  if (r.overflowX > 0) fails.push(`${at}: page scrolls sideways by ${r.overflowX}px`);
  if (r.offscreen && r.view === "390") fails.push(`${at}: part of the motif is outside the viewport`);
}
function fmt(v) { return Number.isFinite(v) ? v.toFixed(3) : "inf"; }
console.log("route | view | count | colour ok | visible | breaks (worst dx) | sideways/drop | kink/join deg | contrast | text hits | overflow px");
for (const r of rows) console.log([r.route, r.view, r.count, r.colorOk, r.visible, continuous ? `${r.breaks} (${r.worstDx.toFixed(1)})` : "n/a", fmt(r.worstRatio),
  `${r.kink.toFixed(0)}/${r.joinKink.toFixed(0)}`, r.contrastMin == null ? "n/a" : r.contrastMin.toFixed(2), avoidText || avoidMedia ? r.collisions : "n/a", r.overflowX].join(" | "));
console.log(fails.length ? "\nFAIL\n" + fails.join("\n") : "\nPASS");
if (opt("json")) fs.writeFileSync(opt("json"), JSON.stringify({ rows, fails }, null, 2));
process.exit(fails.length ? 1 : 0);
