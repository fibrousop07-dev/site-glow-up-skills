#!/usr/bin/env node
// Screenshot pages at 1440/768/390, scrolling through first so reveal animations finish.
// Usage: node shoot.mjs <outDir> <url> [<url>...] [--reduced] [--strip[=N]] [--widths=1440,390]
// Widths under 600 emulate a touch phone (isMobile, hasTouch): plain headless Chromium reports hover:hover and a mouse,
// so hover-only CSS would otherwise be judged as if it ran on phones.
// --strip: also save viewport frames every N screens (default 1) on the way down. Full-page shots of pinned/scroll-driven
// sections come out blank or stretched, so judge those from the strip frames, which show what a visitor actually sees.
// Needs playwright resolvable: in a scratch dir run `npm i playwright && npx playwright install chromium`, run it from there (it also resolves playwright from the current directory).
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
const args = process.argv.slice(2);
const reduced = args.includes("--reduced");
const stripArg = args.find((a) => a.startsWith("--strip"));
const strip = stripArg ? Number(stripArg.split("=")[1] ?? 1) || 1 : 0;
const widthArg = args.find((a) => a.startsWith("--widths="));
const [out, ...urls] = args.filter((a) => !a.startsWith("--"));
if (!out || !urls.length) { console.error("usage: node shoot.mjs outDir url... [--reduced]"); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
const sizes = [[1440, 900], [768, 1024], [390, 844]].filter(([w]) => !widthArg || widthArg.split("=")[1].split(",").map(Number).includes(w));
const browser = await chromium.launch();
for (const [w, h] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, ...(w < 600 ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}), reducedMotion: reduced ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  page.on("console", (m) => m.type() === "error" && console.log("console error:", m.text()));
  for (const [i, url] of urls.entries()) {
    await page.goto(url, { waitUntil: "load" }); await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await page.screenshot({ path: `${out}/p${i}-${w}-fold${reduced ? "-reduced" : ""}.png` }); // above the fold, before reveals
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    let frame = 0, nextShot = strip ? h * strip : Infinity;
    for (let y = 0; y < height; y += h * 0.6) {
      await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(250);
      if (y >= nextShot) { await page.waitForTimeout(350); await page.screenshot({ path: `${out}/p${i}-${w}-s${String(++frame).padStart(2, "0")}.png` }); nextShot += h * strip; }
    }
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/p${i}-${w}-full${reduced ? "-reduced" : ""}.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow) console.log(`horizontal overflow on ${url} at ${w}px`);
  }
  await ctx.close();
}
await browser.close();
