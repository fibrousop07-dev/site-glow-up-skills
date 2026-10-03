#!/usr/bin/env node
// Screenshot pages at 1440/768/390, scrolling through first so reveal animations finish.
// Usage: node shoot.mjs <outDir> <url> [<url>...] [--reduced]
// Needs playwright resolvable: in a scratch dir run `npm i playwright && npx playwright install chromium`, run this from there.
import { chromium } from "playwright";
import fs from "node:fs";
const args = process.argv.slice(2);
const reduced = args.includes("--reduced");
const [out, ...urls] = args.filter((a) => !a.startsWith("--"));
if (!out || !urls.length) { console.error("usage: node shoot.mjs outDir url... [--reduced]"); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
const sizes = [[1440, 900], [768, 1024], [390, 844]];
const browser = await chromium.launch();
for (const [w, h] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: reduced ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  page.on("console", (m) => m.type() === "error" && console.log("console error:", m.text()));
  for (const [i, url] of urls.entries()) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${out}/p${i}-${w}-fold${reduced ? "-reduced" : ""}.png` }); // above the fold, before reveals
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += h * 0.6) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(250); }
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/p${i}-${w}-full${reduced ? "-reduced" : ""}.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow) console.log(`horizontal overflow on ${url} at ${w}px`);
  }
  await ctx.close();
}
await browser.close();
