#!/usr/bin/env node
// Skill installer for site-glow-up-skills. Zero dependencies, Node 18+.
//
//   node install.mjs                 interactive picker
//   node install.mjs --all           install everything (glow-up suite + impeccable + ui-ux-pro-max)
//   node install.mjs --glow-up       just the 7 glow-up skills
//   node install.mjs --only a,b      specific skill ids
//   node install.mjs --list          show what is available and what is installed
//   --manifest <file>   use another catalog (master-fibrous-sites.json = the master-fibrous-sites bundle)
//   --gui               open the browser installer (see gui.mjs)
//   Options: --dest <dir> (default ~/.claude/skills)  --link (symlink instead of copy)
//            --dry-run  --yes (no prompts, overwrite)  --no-external (skip npx companions)
//
// Local skills are copied from this repo. Companion skills (impeccable, ui-ux-pro-max) are NOT bundled:
// they are installed from their original authors via `npx skills add <repo>`, so you get the current version.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const val = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const manifest = JSON.parse(fs.readFileSync(path.resolve(root, val('manifest') || 'skills.json'), 'utf8'));

const dest = path.resolve((val('dest') || path.join(os.homedir(), '.claude', 'skills')).replace(/^~/, os.homedir()));
const dry = flag('dry-run'), yes = flag('yes'), link = flag('link');
const all = manifest.skills;
const byId = Object.fromEntries(all.map((s) => [s.id, s]));
const installed = (s) => fs.existsSync(path.join(dest, s.id, 'SKILL.md'));

function list() {
  console.log(`Install target: ${dest}\n`);
  for (const [g, label] of Object.entries(manifest.groups)) {
    console.log(label);
    for (const s of all.filter((x) => x.group === g)) {
      console.log(`  ${installed(s) ? '[installed]' : '[         ]'} ${s.id.padEnd(20)} ${s.desc}`);
    }
    console.log();
  }
}

async function pick() {
  list();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('Numbers below. Enter e.g. "1 3 5", "a" for ALL, "g" for glow-up suite only, empty to cancel.\n');
  all.forEach((s, i) => console.log(`  ${String(i + 1).padStart(2)}. ${s.id.padEnd(20)} ${s.desc}`));
  const ans = (await rl.question('\nInstall which? ')).trim().toLowerCase();
  rl.close();
  if (!ans) return [];
  if (ans === 'a' || ans === 'all') return all;
  if (ans === 'g') return all.filter((s) => s.group === 'glow-up');
  return ans.split(/[\s,]+/).map((n) => all[Number(n) - 1]).filter(Boolean);
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (e.name === '__pycache__' || e.name === '.git') continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

function installLocal(s) {
  const src = path.join(root, s.path), dst = path.join(dest, s.id);
  if (!fs.existsSync(path.join(src, 'SKILL.md'))) return `FAILED  ${s.id}: no SKILL.md in repo`;
  if (dry) return `would ${link ? 'link' : 'copy'} ${s.id} -> ${dst}`;
  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  if (link) fs.symlinkSync(src, dst, process.platform === 'win32' ? 'junction' : 'dir');
  else copyDir(src, dst);
  return `${link ? 'linked' : 'copied'}  ${s.id}`;
}

function installNpx(s) {
  if (flag('no-external')) return `skipped ${s.id} (--no-external)`;
  if (dry) return `would run: npx skills add ${s.repo}`;
  const r = spawnSync('npx', ['--yes', 'skills', 'add', s.repo], { stdio: 'inherit', shell: process.platform === 'win32' });
  return r.status === 0 ? `installed ${s.id} from ${s.repo}` : `FAILED  ${s.id}: npx skills add exited ${r.status}. Run it by hand: npx skills add ${s.repo}`;
}

let chosen;
if (flag('all')) chosen = all;
else if (flag('glow-up')) chosen = all.filter((s) => s.group === 'glow-up');
else if (flag('gui')) { const r = spawnSync(process.execPath, [path.join(root, 'gui.mjs'), '--manifest', val('manifest') || 'skills.json', ...(val('dest') ? ['--dest', val('dest')] : [])], { stdio: 'inherit' }); process.exit(r.status ?? 0); }
else if (val('only')) {
  const ids = val('only').split(',').map((x) => x.trim());
  const bad = ids.filter((i) => !byId[i]);
  if (bad.length) { console.error(`Unknown skill id(s): ${bad.join(', ')}. Use --list.`); process.exit(1); }
  chosen = ids.map((i) => byId[i]);
} else if (flag('list')) { list(); process.exit(0); }
else if (process.stdin.isTTY) chosen = await pick();
else { console.error('No selection and not interactive. Use --all, --glow-up, --only a,b or --list.'); process.exit(1); }

if (!chosen.length) { console.log('Nothing selected.'); process.exit(0); }

if (!yes && !dry) {
  const clash = chosen.filter((s) => s.source === 'local' && fs.existsSync(path.join(dest, s.id)));
  if (clash.length && process.stdin.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const a = (await rl.question(`Overwrite existing: ${clash.map((s) => s.id).join(', ')}? [y/N] `)).trim().toLowerCase();
    rl.close();
    if (a !== 'y') chosen = chosen.filter((s) => !clash.includes(s));
  }
}

console.log(`\nTarget: ${dest}${dry ? '  (dry run)' : ''}\n`);
let failed = 0;
for (const s of chosen) {
  const msg = s.source === 'local' ? installLocal(s) : installNpx(s);
  if (msg.startsWith('FAILED')) failed++;
  console.log(msg);
}
console.log(failed ? `\n${failed} failed.` : '\nDone. Restart Claude Code to load the skills.');
process.exit(failed ? 1 : 0);
