#!/usr/bin/env node
// One reusable audit for glow-up runs and local-vs-live comparisons. Replaces per-run throwaway scripts.
// Per route and width it scrolls the page through (so reveals finish), then records: HTTP status, console/page errors,
// horizontal overflow, axe WCAG 2.2 AA violations (if axe-core resolves), heading outline problems, fonts by role,
// visible text under 12px, broken images, page height, title/description, and status of every same-origin link.
//
// Usage:
//   node audit.mjs <outDir> <baseUrl> [--compare <baseUrl2>] [--routes /,/contact,/404-check] [--widths 1440,390] [--reduced]
// Routes default to "/" plus every same-origin link found in the header/footer of "/", plus a made-up path to test the 404.
// Writes <outDir>/audit.json and <outDir>/audit.md. With --compare, both sites run on the same routes and audit.md is side by side.
// Needs playwright (and optionally axe-core) resolvable from this folder or the current directory (a project with them in
// devDependencies works: run the command from the project root).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const req = createRequire(path.join(process.cwd(), "x.js"));
const pick = (m) => m.chromium ?? m.default?.chromium;
let chromium;
try { chromium = pick(await import("playwright")); if (!chromium) throw 0; }
catch {
  try { chromium = pick(await import(pathToFileURL(req.resolve("playwright")).href)); if (!chromium) throw 0; }
  catch { console.error("playwright not found. Run from a project that has it, or: npm i playwright && npx playwright install chromium"); process.exit(2); }
}
let axeSrc = null;
try { axeSrc = fs.readFileSync(req.resolve("axe-core/axe.min.js"), "utf8"); } catch { console.log("axe-core not found: accessibility rules skipped"); }

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : null; };
const compareBase = flag("--compare");
const routeArg = flag("--routes");
const widths = (flag("--widths") ?? "1440,390").split(",").map(Number);
const reduced = args.includes("--reduced");
const [out, base] = args.filter((a) => !a.startsWith("--"));
if (!out || !base) { console.error("usage: node audit.mjs outDir baseUrl [--compare url] [--routes /,/a] [--widths 1440,390]"); process.exit(1); }
fs.mkdirSync(out, { recursive: true });

const ROLE_JS = () => {
  const roles = { h1: "h1", h2: "h2", h3: "h3", nav: "header nav a, header a", buttons: ".btn, button, a[class*=btn], a[class*=button]",
    body: "main p", labels: "[class*=eyebrow], [class*=tag], [class*=label], [class*=kicker]", figures: "[class*=price], [class*=figure], [class*=metric]", footer: "footer a, footer p" };
  const o = {};
  for (const [k, s] of Object.entries(roles)) {
    const set = new Set();
    for (const e of document.querySelectorAll(s)) {
      if (!e.offsetParent && getComputedStyle(e).position !== "fixed") continue;
      const c = getComputedStyle(e);
      set.add(c.fontFamily.split(",")[0].replace(/["']/g, "").trim() + " " + c.fontWeight + (c.textTransform === "uppercase" ? " UPPER" : ""));
    }
    if (set.size) o[k] = [...set].slice(0, 4).join(" · ");
  }
  return o;
};

async function auditRoute(browser, origin, route, w) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 600 ? 844 : 900 }, ...(w < 600 ? { isMobile: true, hasTouch: true } : {}), reducedMotion: reduced ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 140)));
  page.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && errors.push(m.text().slice(0, 140)));
  page.on("response", (r) => r.status() >= 400 && r.url() !== origin + route && errors.push(`HTTP ${r.status()} ${r.url().slice(0, 120)}`));
  const t0 = Date.now();
  let status = 0;
  try { const r = await page.goto(origin + route, { waitUntil: "load", timeout: 45000 }); status = r?.status() ?? 0;
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {}); } // beacons/long-polls never go idle
  catch (e) { await ctx.close(); return { route, w, status: "load failed: " + e.message.slice(0, 80) }; }
  const loadMs = Date.now() - t0;
  const vh = page.viewportSize().height;
  for (let y = 0, H = await page.evaluate(() => document.documentElement.scrollHeight); y < H; y += vh * 0.6) {
    await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(150);
    H = await page.evaluate(() => document.documentElement.scrollHeight);
  }
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
  const facts = await page.evaluate(({ roleSrc }) => {
    const d = document.documentElement;
    const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter((h) => h.getClientRects().length);
    const skips = [];
    hs.reduce((prev, h) => { const l = +h.tagName[1]; if (prev && l > prev + 1) skips.push(`h${prev}→h${l} "${h.textContent.trim().slice(0, 40)}"`); return l; }, 0);
    const tiny = [];
    for (const e of document.querySelectorAll("body *")) {
      if (!e.childNodes.length || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const c = getComputedStyle(e); const r = e.getBoundingClientRect();
      if (parseFloat(c.fontSize) < 12 && parseFloat(c.fontSize) > 1 && r.width && r.height && c.visibility !== "hidden" && +c.opacity > 0.05 && !e.closest("[aria-hidden=true]"))
        tiny.push(`${parseFloat(c.fontSize)}px "${e.textContent.trim().slice(0, 30)}"`);
    }
    const links = [...new Set([...document.querySelectorAll("a[href]")].map((a) => a.href).filter((h) => h.startsWith(location.origin)).map((h) => h.split("#")[0]))];
    return {
      title: document.title, description: document.querySelector('meta[name=description]')?.content ?? null,
      h1: hs.filter((h) => h.tagName === "H1").map((h) => h.textContent.trim().replace(/\s+/g, " ").slice(0, 80)),
      headingSkips: skips, overflowPx: d.scrollWidth - d.clientWidth, heightPx: d.scrollHeight,
      tinyText: tiny.length, tinySamples: tiny.slice(0, 3),
      brokenImages: [...document.images].filter((i) => i.complete && !i.naturalWidth && i.getClientRects().length).map((i) => i.src).slice(0, 5),
      fonts: new Function("return (" + roleSrc + ")()")(), links,
    };
  }, { roleSrc: ROLE_JS.toString() });
  let axe = null;
  if (axeSrc) {
    await page.evaluate(axeSrc);
    const r = await page.evaluate(() => window.axe.run({ runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"] }));
    axe = r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, first: v.nodes[0]?.target.join(" ").slice(0, 70) }));
  }
  await ctx.close();
  return { route, w, status, loadMs, errors: [...new Set(errors)], axe, ...facts };
}

async function auditSite(browser, origin, routes) {
  if (!routes) {
    const ctx = await browser.newContext(); const p = await ctx.newPage();
    await p.goto(origin + "/", { waitUntil: "load" }); await p.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    const found = await p.evaluate(() => [...document.querySelectorAll("header a[href], nav a[href], footer a[href]")]
      .map((a) => new URL(a.href)).filter((u) => u.origin === location.origin).map((u) => u.pathname));
    await ctx.close();
    routes = [...new Set(["/", ...found])].slice(0, 15).concat("/glow-up-404-check");
  }
  const results = [];
  for (const route of routes) for (const w of widths) { process.stdout.write(`${origin}${route} @${w}… `); const r = await auditRoute(browser, origin, route, w); results.push(r); console.log(r.status); }
  const allLinks = [...new Set(results.flatMap((r) => r.links ?? []))];
  const linkStatus = {};
  for (const l of allLinks) { try { linkStatus[l.replace(origin, "") || "/"] = (await fetch(l, { redirect: "manual" })).status; } catch { linkStatus[l] = "fetch failed"; } }
  return { origin, routes, results, linkStatus };
}

const browser = await chromium.launch();
const A = await auditSite(browser, base.replace(/\/$/, ""), routeArg?.split(","));
const B = compareBase ? await auditSite(browser, compareBase.replace(/\/$/, ""), A.routes) : null;
await browser.close();
fs.writeFileSync(path.join(out, "audit.json"), JSON.stringify({ when: new Date().toISOString(), reduced, A, B }, null, 2));

// ---------- markdown ----------
const cell = (r) => !r ? "–" : typeof r.status === "string" ? r.status : [
  r.status !== 200 ? `**HTTP ${r.status}**` : null,
  r.overflowPx > 0 ? `**overflow ${r.overflowPx}px**` : null,
  r.errors?.length ? `${r.errors.length} console err` : null,
  r.axe?.length ? "axe: " + r.axe.map((v) => `${v.id}(${v.impact[0]}×${v.nodes})`).join(", ") : r.axe ? "axe clean" : null,
  r.h1?.length !== 1 ? `**${r.h1?.length ?? 0} h1**` : null,
  r.headingSkips?.length ? `skips ${r.headingSkips.length}` : null,
  r.tinyText ? `${r.tinyText} text<12px` : null,
  r.brokenImages?.length ? `**${r.brokenImages.length} broken img**` : null,
  `${Math.round(r.heightPx / 100) / 10}k px tall`,
].filter(Boolean).join("; ");
const find = (S, route, w) => S?.results.find((r) => r.route === route && r.w === w);
let md = `# Audit ${new Date().toISOString().slice(0, 10)}${reduced ? " (reduced motion)" : ""}\n\nA = ${A.origin}${B ? `  \nB = ${B.origin}` : ""}\n\n`;
md += `| Route | Width | A | ${B ? "B |" : ""}\n|---|---|---|${B ? "---|" : ""}\n`;
for (const route of A.routes) for (const w of widths) md += `| ${route} | ${w} | ${cell(find(A, route, w))} | ${B ? cell(find(B, route, w)) + " |" : ""}\n`;
md += `\n## Fonts by role (1440, "/")\n\n| Role | A | ${B ? "B |" : ""}\n|---|---|${B ? "---|" : ""}\n`;
const fa = find(A, "/", widths[0])?.fonts ?? {}, fb = find(B, "/", widths[0])?.fonts ?? {};
for (const k of new Set([...Object.keys(fa), ...Object.keys(fb)])) md += `| ${k} | ${fa[k] ?? "–"} | ${B ? (fb[k] ?? "–") + " |" : ""}\n`;
const bad = (S) => Object.entries(S.linkStatus).filter(([, s]) => s !== 200 && !(s >= 300 && s < 400));
md += `\n## Same-origin links not 200/3xx\n\n- A: ${bad(A).map(([l, s]) => `${l} → ${s}`).join(", ") || "none"}\n${B ? `- B: ${bad(B).map(([l, s]) => `${l} → ${s}`).join(", ") || "none"}\n` : ""}`;
md += `\n## Console errors (unique, first 5 per site)\n\n- A: ${[...new Set(A.results.flatMap((r) => r.errors ?? []))].slice(0, 5).join(" / ") || "none"}\n${B ? `- B: ${[...new Set(B.results.flatMap((r) => r.errors ?? []))].slice(0, 5).join(" / ") || "none"}\n` : ""}`;
md += `\n## Titles and h1\n\n| Route | A title / h1 | ${B ? "B title / h1 |" : ""}\n|---|---|${B ? "---|" : ""}\n`;
for (const route of A.routes) { const a = find(A, route, widths[0]), b = find(B, route, widths[0]); md += `| ${route} | ${a?.title ?? "–"} / ${a?.h1?.join(" · ") ?? "–"} | ${B ? `${b?.title ?? "–"} / ${b?.h1?.join(" · ") ?? "–"} |` : ""}\n`; }
fs.writeFileSync(path.join(out, "audit.md"), md);
console.log(`\nwrote ${path.join(out, "audit.md")}`);
