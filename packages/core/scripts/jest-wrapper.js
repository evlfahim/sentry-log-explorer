#!/usr/bin/env node
// Wrapper script that converts --grep to Jest's --testNamePattern
const { spawnSync } = require('child_process');
const args = process.argv.slice(2);
const newArgs = [];
let i = 0;
while (i < args.length) {
  if (args[i] === '--grep' && i + 1 < args.length) {
    newArgs.push('--testNamePattern', args[i + 1]);
    i += 2;
  } else {
    newArgs.push(args[i]);
    i++;
  }
}
const result = spawnSync('npx', ['jest', ...newArgs], {
  stdio: 'inherit',
});
process.exit(result.status || 0);
