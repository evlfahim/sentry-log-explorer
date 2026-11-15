#!/usr/bin/env node
// Wrapper script that converts --grep <pattern> to Vitest's --testNamePattern
// and always runs Vitest in single-run (non-watch) mode.
import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(scriptDir, '..');

// Locate vitest's CLI entry, walking up to support hoisted workspace installs.
function findVitestBin(startDir) {
  let dir = startDir;
  while (true) {
    const candidate = path.join(dir, 'node_modules', 'vitest', 'vitest.mjs');
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const vitestBin = findVitestBin(packageDir);
if (!vitestBin) {
  console.error('vitest is not installed. Run `npm install` first.');
  process.exit(1);
}

const args = process.argv.slice(2);
const newArgs = [];
let i = 0;
while (i < args.length) {
  if (args[i] === '--grep' && i + 1 < args.length) {
    newArgs.push('--testNamePattern', args[i + 1]);
    i += 2;
  } else if (args[i].startsWith('--grep=')) {
    newArgs.push('--testNamePattern', args[i].slice('--grep='.length));
    i++;
  } else {
    newArgs.push(args[i]);
    i++;
  }
}

const result = spawnSync(process.execPath, [vitestBin, 'run', ...newArgs], {
  stdio: 'inherit',
  cwd: packageDir,
});
if (result.error) {
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status ?? 1);
