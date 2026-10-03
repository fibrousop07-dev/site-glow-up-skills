#!/usr/bin/env node
// Batch-run copy units through the LOCAL humanizer API. Only talks to 127.0.0.1.
// Usage: node humanize_units.mjs units.json results.json [--mode auto|rules|ai] [--strength 1] [--port 4177]
// units.json: [{ "id": "hero.title", "file": "src/App.jsx", "text": "..." }, ...]
import fs from "node:fs";

const [inFile, outFile, ...rest] = process.argv.slice(2);
if (!inFile || !outFile) {
  console.error("usage: node humanize_units.mjs units.json results.json [--mode auto|rules|ai] [--strength N] [--port N]");
  process.exit(1);
}
const opt = (name, def) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : def;
};
const mode = opt("mode", "auto");
const strength = Number(opt("strength", 1));
const port = Number(opt("port", 4177));
const url = `http://127.0.0.1:${port}/api/humanize`; // loopback only, by design

const units = JSON.parse(fs.readFileSync(inFile, "utf8"));
const results = [];
for (const u of units) {
  const entry = { ...u, before: u.text };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: u.text, mode, strength }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || res.statusText);
    Object.assign(entry, {
      after: j.text,
      engine: j.engine,
      chosen: j.chosen,
      note: j.note,
      factsPreserved: j.factsPreserved,
      lengthRatio: +(j.text.length / u.text.length).toFixed(2),
      changed: j.text !== u.text,
      accept: j.factsPreserved === true && j.text !== u.text,
    });
  } catch (e) {
    entry.error = e.message;
    entry.accept = false;
  }
  results.push(entry);
  if (entry.note) console.log("  note: " + entry.note);
  const flag = entry.error ? `ERROR ${entry.error}` : entry.factsPreserved ? (entry.changed ? "changed" : "unchanged") : "REJECT facts";
  console.log(`${u.id ?? results.length}: ${flag}`);
}
fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
console.log(`wrote ${outFile}`);
