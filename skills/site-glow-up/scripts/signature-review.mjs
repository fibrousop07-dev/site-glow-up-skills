#!/usr/bin/env node
// Builds the image set for the signature visual review (see references/signature-review.md).
// For each route it saves: the top of the page, the full page, close crops of the joins and of the footer end, at 1440 and 390,
// with any animation frozen at its start and at its extreme. It scores nothing; a reviewer looks at the images.
// Usage: node signature-review.mjs --base http://localhost:3000 --routes /,/about,/__missing --selector "[data-signature]" --out .glow-up/signature-review
let chromium;
const pick = (m) => m.chromium ?? m.default?.chromium;
try { chromium = pick(await import("playwright")); if (!chromium) throw 0; }
catch {
  const { createRequire } = await import("node:module"); const { pathToFileURL } = await import("node:url"); const path = await import("node:path");
  try { chromium = pick(await import(pathToFileURL(createRequire(path.join(process.cwd(), "x.js")).resolve("playwright")).href)); if (!chromium) throw 0; }
  catch { console.error("playwright not found (see shoot.mjs header)."); process.exit(2); }
}
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const base = (opt("base", "") || "").replace(/\/$/, "");
let routes = opt("routes", "/");
if (routes.startsWith("@")) routes = fs.readFileSync(routes.slice(1), "utf8").split(/\r?\n/).filter(Boolean).join(",");
routes = routes.split(",").map((r) => r.trim()).filter(Boolean);
const selector = opt("selector", "[data-signature]");
const out = opt("out", ".glow-up/signature-review");
if (!base) { console.error("need --base"); process.exit(2); }
fs.mkdirSync(out, { recursive: true });

const freezeAt = (page, f) => page.evaluate((f) => document.getAnimations().forEach((a) => { try { const t = a.effect.getComputedTiming(); a.pause(); if (isFinite(t.duration) && t.duration > 0) a.currentTime = t.duration * f; } catch {} }), f);
const joins = (sel) => {
  const els = [...document.querySelectorAll(sel)], sx = scrollX, sy = scrollY;
  const pts = els.map((el) => {
    const shape = el instanceof SVGElement ? (el.matches("path,line,polyline") ? el : el.querySelector("path,line,polyline")) : null;
    if (shape && shape.getTotalLength && shape.getScreenCTM) {
      const m = shape.getScreenCTM(), e = shape.getPointAtLength(shape.getTotalLength());
      return { x: e.x * m.a + e.y * m.c + m.e + sx, y: e.x * m.b + e.y * m.d + m.f + sy };
    }
    const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2 + sx, y: r.bottom + sy };
  });
  return { ends: pts, height: document.documentElement.scrollHeight, width: innerWidth };
};

const browser = await chromium.launch();
const manifest = [];
for (const [label, vp] of [["1440", { width: 1440, height: 900 }], ["390", { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  for (const route of routes) {
    await page.goto(base + route, { waitUntil: "networkidle" }).catch(() => null);
    await page.waitForTimeout(400);
    // scroll through once so reveal animations finish, then back to the top
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 500) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(80); }
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(200);
    const g = await page.evaluate(joins, selector);
    const slug = (route === "/" ? "home" : route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")) + "_" + label;
    const shots = [];
    const snap = async (name, opts) => { const f = path.join(out, `${slug}_${name}.png`); await page.screenshot({ path: f, ...opts }); shots.push(f); };
    for (const [tag, frac] of [["rest", 0], ["extreme", 1]]) {
      await freezeAt(page, frac);
      await snap(`top-${tag}`, {});
      if (tag === "rest") await snap("full", { fullPage: true });
    }
    // crops: up to 3 joins (not the last end) and the foot of the page, 360px tall, full width
    const clipAt = (y) => ({ x: 0, y: Math.max(0, Math.min(g.height - 360, y - 180)), width: g.width, height: Math.min(360, g.height) });
    const mids = g.ends.slice(0, -1).filter((_, i, a) => a.length <= 3 || i % Math.ceil(a.length / 3) === 0).slice(0, 3);
    for (const [i, e] of mids.entries()) await snap(`join${i + 1}`, { fullPage: true, clip: clipAt(e.y) });
    await snap("foot", { fullPage: true, clip: clipAt(g.height - 180) });
    manifest.push({ route, view: label, images: shots });
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`${manifest.reduce((n, m) => n + m.images.length, 0)} images in ${out}`);
for (const m of manifest) console.log(`${m.route} @${m.view}: ${m.images.map((f) => path.basename(f)).join(", ")}`);
