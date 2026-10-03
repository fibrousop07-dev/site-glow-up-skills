#!/usr/bin/env node
// Self-test for signature-coverage.mjs. Serves generated fixtures on a local port and checks that the script
// passes good multi-segment chains (including a 404 with the thread) and fails each known defect for the right reason.
// Usage: node selftest.mjs   (run from a folder where `playwright` resolves, same as the other scripts)
import http from "node:http";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const H = 320; // section height

// One segment = one SVG path, absolutely positioned in its section, hung in the right gutter.
const seg = (right) => `<svg data-signature class="seg" style="right:${right}px" width="16" height="${H}" viewBox="0 0 16 ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="M8 0 C 12 80, 4 240, 8 ${H}" fill="none" stroke="var(--signature)" stroke-width="1.5"/></svg>`;
const section = (i, right) => `<section><h1>Section ${i + 1}</h1><p>Some body text that sits well clear of the gutter.</p>${seg(right(i))}</section>`;
const page = ({ n = 3, right = () => 6, head = "", body = null, token = "#a8864f" } = {}) => `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<style>:root{--signature:${token}}*{box-sizing:border-box}body{margin:0;font:18px/1.5 Georgia,serif}
section{position:relative;height:${H}px;padding:60px 36px 0 8vw;border-bottom:1px solid #ddd;overflow:visible}.seg{position:absolute;top:0;pointer-events:none}${head}</style>
${body ?? Array.from({ length: n }, (_, i) => section(i, right)).join("")}`;

const pages = {
  "/good-a": page({ n: 4 }),
  "/good-b": page({ n: 2 }),
  "/good-c": page({ n: 6 }),
  "/break": page({ n: 4, right: (i) => (i % 2 ? 40 : 6) }),
  "/swoosh": page({ body: `<section><h1>Swoosh</h1><svg data-signature width="300" height="120" viewBox="0 0 300 120" style="position:absolute;left:0;top:200px" aria-hidden="true"><path d="M0 0 C 300 0, 300 100, 0 120" fill="none" stroke="var(--signature)" stroke-width="1.5"/></svg></section>` }),
  "/nojs": page({ n: 3, head: ".seg{opacity:0}.on .seg{opacity:1}", body: undefined }).replace("</style>", "</style><script>document.documentElement.classList.add('on')</script>"),
  "/overlap": page({ n: 2, head: ".seg{right:auto!important;left:150px}" }),
  "/nothread": page({ body: "<section><h1>No thread here</h1></section>" }),
  "/elbow": page({ body: `<section><h1>Elbow</h1><svg data-signature class="seg" style="right:6px" width="24" height="${H}" viewBox="0 0 24 ${H}" aria-hidden="true"><path d="M8 0 L 8 140 L 18 140 L 18 ${H}" fill="none" stroke="var(--signature)" stroke-width="1.5"/></svg></section>` }),
  "/joinkink": page({ body: `<section><h1>Join</h1><svg data-signature class="seg" style="right:6px" width="16" height="${H}" viewBox="0 0 16 ${H}" aria-hidden="true"><path d="M8 0 C 8 100, 8 220, 8 ${H}" fill="none" stroke="var(--signature)" stroke-width="1.5"/></svg></section><section><svg data-signature class="seg" style="right:6px" width="120" height="${H}" viewBox="0 0 120 ${H}" aria-hidden="true"><path d="M112 0 C 20 0, 20 160, 112 ${H}" fill="none" stroke="var(--signature)" stroke-width="1.5"/></svg></section>` }),
  "/faint": page({ n: 2, head: "body{background:#ab8a52}" }),
  "/loud": page({ n: 2, head: "body{background:#000;color:#fff}" }),
  "/overflow": page({ n: 2, head: ".seg{right:-40px!important}" }),
  "/media": page({ n: 2, head: ".seg{right:auto!important;left:170px}", body: undefined }).replace("</style>", "</style><img alt='' style='position:absolute;left:150px;top:20px;width:120px;height:120px' src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3E%3Crect width='10' height='10' fill='%23ccc'/%3E%3C/svg%3E\">"),
  "/swing": page({ n: 2, head: "@keyframes sw{from{transform:translateX(0)}to{transform:translateX(-1300px)}}.seg{animation:sw 4s linear infinite alternate}" }),
  "/edge": page({ n: 2, head: ".seg{right:0!important}" }),
  "/offpage": page({ n: 2 }),
  "/wrongcolour": page({ n: 2, token: "#ff0000" }),
};
const notFound = page({ n: 1 });

const server = http.createServer((req, res) => {
  const p = req.url.split("?")[0];
  const body = pages[p] ?? notFound;
  res.writeHead(pages[p] ? 200 : 404, { "content-type": "text/html" }); res.end(body);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const common = ["--base", base, "--selector", "[data-signature]", "--token", "#a8864f"];
const scenarios = [
  { name: "good multi-segment chains + 404", routes: "/good-a,/good-b,/good-c,/__missing", args: ["--continuous", "--max-lateral", "0.3", "--max-kink", "25", "--min-contrast", "1.3", "--max-contrast", "5", "--min-edge", "4", "--avoid-text", "--avoid-media"], expect: 0 },
  { name: "segments at different x -> breaks", routes: "/break", args: ["--continuous"], expect: 1, match: /break\(s\)/ },
  { name: "wide lateral sweep -> swoosh", routes: "/swoosh", args: ["--max-lateral", "0.3"], expect: 1, match: /too lateral/ },
  { name: "hidden until JS runs -> fails no-JS", routes: "/nojs", args: [], expect: 1, match: /no-JS: \d+ element\(s\) hidden/ },
  { name: "thread crosses text -> overlap", routes: "/overlap", args: ["--avoid-text"], expect: 1, match: /cross text/ },
  { name: "route without the motif -> count 0", routes: "/nothread", args: [], expect: 1, match: /0 elements/ },
  { name: "sharp corner inside a segment -> kink", routes: "/elbow", args: ["--max-kink", "25"], expect: 1, match: /kinked/ },
  { name: "segments meet at a sharp angle -> kinked join", routes: "/joinkink", args: ["--continuous", "--max-kink", "25"], expect: 1, match: /kinked.*join/ },
  { name: "colour too close to background -> too faint", routes: "/faint", args: ["--min-contrast", "1.3"], expect: 1, match: /too faint/ },
  { name: "colour far too strong on dark -> too loud", routes: "/loud", args: ["--max-contrast", "5"], expect: 1, match: /too loud/ },
  { name: "page scrolls sideways", routes: "/overflow", args: [], expect: 1, match: /scrolls sideways/ },
  { name: "thread crosses an image -> media overlap", routes: "/media", args: ["--avoid-media"], expect: 1, match: /cross text, a control or media/ },
  { name: "swing collides only at its extreme", routes: "/swing", args: ["--avoid-text"], expect: 1, match: /cross text/ },
  { name: "pinned to the viewport edge", routes: "/edge", args: ["--min-edge", "12"], expect: 1, match: /viewport edge/ },
  { name: "full-height strand has no visible start or end", routes: "/offpage", args: ["--ends-inside", "10"], expect: 1, match: /no visible anchor|runs off the page/ },
  { name: "literal colour instead of token", routes: "/wrongcolour", args: [], expect: 1, match: /colour/ },
];

let bad = 0;
for (const s of scenarios) {
  // async spawn: the fixture server lives in this process, so the event loop must stay free
  const r = await new Promise((resolve) => {
    const c = spawn(process.execPath, [path.join(here, "signature-coverage.mjs"), ...common, "--routes", s.routes, ...s.args], { env: { ...process.env, MSYS_NO_PATHCONV: "1" }, windowsHide: true });
    let o = ""; c.stdout.on("data", (d) => (o += d)); c.stderr.on("data", (d) => (o += d));
    c.on("close", (status) => resolve({ status, stdout: o }));
  });
  const out = r.stdout;
  const ok = r.status === s.expect && (!s.match || s.match.test(out));
  if (!ok) { bad++; console.log(out.split("\n").slice(-12).join("\n")); }
  console.log(`${ok ? "ok  " : "FAIL"}  ${s.name}  (exit ${r.status}, expected ${s.expect})`);
}
server.close();
console.log(bad ? `\n${bad} self-test(s) failed` : "\nall self-tests passed");
process.exit(bad ? 1 : 0);
