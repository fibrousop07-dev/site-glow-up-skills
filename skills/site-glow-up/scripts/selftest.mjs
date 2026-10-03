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
  { name: "good multi-segment chains + 404", routes: "/good-a,/good-b,/good-c,/__missing", args: ["--continuous", "--max-lateral", "0.3", "--avoid-text"], expect: 0 },
  { name: "segments at different x -> breaks", routes: "/break", args: ["--continuous"], expect: 1, match: /break\(s\)/ },
  { name: "wide lateral sweep -> swoosh", routes: "/swoosh", args: ["--max-lateral", "0.3"], expect: 1, match: /too lateral/ },
  { name: "hidden until JS runs -> fails no-JS", routes: "/nojs", args: [], expect: 1, match: /no-JS: \d+ element\(s\) hidden/ },
  { name: "thread crosses text -> overlap", routes: "/overlap", args: ["--avoid-text"], expect: 1, match: /cross text/ },
  { name: "route without the motif -> count 0", routes: "/nothread", args: [], expect: 1, match: /0 elements/ },
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
