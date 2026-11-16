#!/usr/bin/env node
// master-fibrous-sites installer: the director skill plus the build and polish skills it brings in.
// Same options as install.mjs (--all, --only, --list, --gui, --dry-run, --dest ...), different catalog.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const r = spawnSync(process.execPath, [path.join(root, 'install.mjs'), '--manifest', 'master-fibrous-sites.json', ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(r.status ?? 1);
