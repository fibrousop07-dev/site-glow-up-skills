#!/usr/bin/env node
// Browser GUI for the skill installers. Zero dependencies, binds to 127.0.0.1 only.
//   node gui.mjs                                         site-glow-up-skills catalog
//   node gui.mjs --manifest master-fibrous-sites.json    master-fibrous-sites catalog
//   Options: --port 4181  --dest <dir>  --no-open
// The page lists the catalog; "Install selected" runs install.mjs with --only and streams its output back.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const val = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const manifestFile = val('manifest') || 'skills.json';
const manifest = JSON.parse(fs.readFileSync(path.resolve(root, manifestFile), 'utf8'));
const dest = path.resolve((val('dest') || path.join(os.homedir(), '.claude', 'skills')).replace(/^~/, os.homedir()));
const port = Number(val('port')) || 0;

const isInstalled = (s) => fs.existsSync(path.join(dest, s.check || s.id, 'SKILL.md'));
const state = () => ({
  title: manifest.title || manifest.name, dest, groups: manifest.groups,
  skills: manifest.skills.map((s) => ({ id: s.id, group: s.group, title: s.title || s.id, desc: s.desc, external: s.source !== 'local', repo: s.repo, installed: isInstalled(s) })),
});

const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Skill Installer</title>
<style>
:root{--bg:#f6f4ef;--surface:#fffdf9;--ink:#1d1b17;--mute:#6b665c;--line:#e3ded2;--accent:#c4501b;--accent-ink:#fff;--ok:#2f7d4f;--code:#16140f;--code-ink:#e9e4d6}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#14130f;--surface:#1c1a15;--ink:#f1ede3;--mute:#9a9484;--line:#322f26;--accent:#ee7a45;--accent-ink:#14130f;--ok:#6cc08a;--code:#0e0d0a}}
:root[data-theme=dark]{--bg:#14130f;--surface:#1c1a15;--ink:#f1ede3;--mute:#9a9484;--line:#322f26;--accent:#ee7a45;--accent-ink:#14130f;--ok:#6cc08a;--code:#0e0d0a}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 ui-sans-serif,system-ui,"Segoe UI",sans-serif}
main{max-width:760px;margin:0 auto;padding:32px 16px 120px}
h1{font:600 26px/1.2 Georgia,"Times New Roman",serif;margin:0 0 4px;letter-spacing:-.01em}
.sub{color:var(--mute);margin:0 0 24px}.sub code{font:12px ui-monospace,Consolas,monospace;background:var(--surface);border:1px solid var(--line);padding:1px 6px;border-radius:5px}
.bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
button{font:inherit;cursor:pointer;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink);padding:8px 14px}
button:hover{border-color:var(--accent)}button.primary{background:var(--accent);color:var(--accent-ink);border-color:var(--accent);font-weight:600}
button:disabled{opacity:.5;cursor:not-allowed}
h2{font-size:12px;text-transform:uppercase;letter-spacing:.09em;color:var(--mute);margin:26px 0 8px;font-weight:600}
label.row{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;background:var(--surface);border:1px solid var(--line);border-radius:10px;margin-bottom:8px;cursor:pointer}
label.row:hover{border-color:var(--accent)}label.row:has(input:checked){border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset}
input[type=checkbox]{width:18px;height:18px;margin-top:2px;accent-color:var(--accent)}
.name{font:600 15px ui-monospace,Consolas,monospace}.desc{color:var(--mute);font-size:14px}
.tag{font-size:11px;border:1px solid var(--line);border-radius:99px;padding:1px 8px;margin-left:8px;color:var(--mute);font-family:system-ui}
.tag.ok{color:var(--ok);border-color:var(--ok)}
footer{position:fixed;left:0;right:0;bottom:0;background:var(--surface);border-top:1px solid var(--line);padding:12px 16px}
footer div{max-width:760px;margin:0 auto;display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}
#count{color:var(--mute)}
pre{background:var(--code);color:var(--code-ink);border-radius:10px;padding:14px;font:12.5px/1.5 ui-monospace,Consolas,monospace;white-space:pre-wrap;max-height:260px;overflow:auto;margin:20px 0 0}
</style></head><body><main>
<h1 id="title">Skill Installer</h1>
<p class="sub">Installing into <code id="dest"></code>. Restart Claude Code afterwards.</p>
<div class="bar"><button id="all">Select all</button><button id="none">Clear</button><button id="missing">Only missing</button></div>
<div id="list"></div><pre id="log" hidden></pre></main>
<footer><div><span id="count"></span><button class="primary" id="go">Install selected</button></div></footer>
<script>
let S;const $=(i)=>document.getElementById(i);
const sel=()=>[...document.querySelectorAll('input[data-id]:checked')].map(i=>i.dataset.id);
function upd(){const n=sel().length;$('count').textContent=n+' selected';$('go').disabled=!n}
async function load(){S=await (await fetch('/api/state')).json();$('title').textContent=S.title;document.title=S.title;$('dest').textContent=S.dest;
 const L=$('list');L.innerHTML='';
 for(const [g,label] of Object.entries(S.groups)){const items=S.skills.filter(s=>s.group===g);if(!items.length)continue;
  const h=document.createElement('h2');h.textContent=label;L.append(h);
  for(const s of items){const r=document.createElement('label');r.className='row';
   r.innerHTML='<input type="checkbox" data-id="'+s.id+'"><div><div><span class="name"></span><span class="tag"></span></div><div class="desc"></div></div>';
   r.querySelector('.name').textContent=s.title;r.querySelector('.desc').textContent=s.desc;
   const t=r.querySelector('.tag');t.textContent=s.installed?'installed':(s.external?'from author repo':'bundled');if(s.installed)t.classList.add('ok');
   r.querySelector('input').onchange=upd;L.append(r)}}
 upd()}
$('all').onclick=()=>{document.querySelectorAll('input[data-id]').forEach(i=>i.checked=true);upd()};
$('none').onclick=()=>{document.querySelectorAll('input[data-id]').forEach(i=>i.checked=false);upd()};
$('missing').onclick=()=>{S.skills.forEach(s=>{document.querySelector('input[data-id="'+s.id+'"]').checked=!s.installed});upd()};
$('go').onclick=async()=>{const ids=sel();if(!ids.length)return;$('go').disabled=true;const log=$('log');log.hidden=false;log.textContent='';
 const res=await fetch('/api/install',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ids})});
 const rd=res.body.getReader(),dec=new TextDecoder();for(;;){const {done,value}=await rd.read();if(done)break;log.textContent+=dec.decode(value);log.scrollTop=log.scrollHeight}
 await load();for(const id of ids){const c=document.querySelector('input[data-id="'+id+'"]');if(c)c.checked=true}upd()};
load();
</script></body></html>`;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(page); }
  if (req.method === 'GET' && req.url === '/api/state') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(state())); }
  if (req.method === 'POST' && req.url === '/api/install') {
    if (req.headers.host && !/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host)) { res.writeHead(403); return res.end(); }
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e5) req.destroy(); });
    req.on('end', () => {
      let ids; try { ids = JSON.parse(body).ids; } catch { res.writeHead(400); return res.end('bad json'); }
      const known = new Set(manifest.skills.map((s) => s.id));
      ids = (Array.isArray(ids) ? ids : []).filter((i) => known.has(i));
      if (!ids.length) { res.writeHead(400); return res.end('nothing selected'); }
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
      const p = spawn(process.execPath, [path.join(root, 'install.mjs'), '--manifest', manifestFile, '--only', ids.join(','), '--yes', '--dest', dest], { shell: false });
      p.stdout.pipe(res, { end: false }); p.stderr.pipe(res, { end: false });
      p.on('close', (code) => res.end(code === 0 ? '\nAll done.\n' : `\nFinished with errors (exit ${code}).\n`));
    });
    return;
  }
  res.writeHead(404); res.end();
});

server.listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${server.address().port}/`;
  console.log(`${manifest.title || manifest.name} GUI: ${url}  (Ctrl+C to stop)`);
  if (!args.includes('--no-open')) {
    const cmd = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
    exec(cmd, () => {});
  }
});
