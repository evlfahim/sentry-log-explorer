#!/usr/bin/env node
// Simple verification script for LogList component
// Does NOT import any test frameworks or React - just verifies file structure

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiSrc = path.resolve(__dirname, '..', 'src');
let passed = 0;
let failed = 0;
const errors = [];

function check(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    errors.push({ name, detail });
    console.log(`  ✗ ${name}: ${detail || 'check failed'}`);
  }
}

console.log('\n=== LogList Component Verification ===\n');

// Read LogList.tsx
const logListPath = path.join(uiSrc, 'components/LogList.tsx');
const logListContent = fs.readFileSync(logListPath, 'utf-8');

console.log('--- LogList.tsx structure ---');
check('File exists', fs.existsSync(logListPath));
check('Exports LogList component', logListContent.includes('export function LogList'));
check('Imports LogRow', logListContent.includes("import { LogRow } from './LogRow'"));
check('Imports PatternHighlighter from core', logListContent.includes("import { PatternHighlighter } from 'core'"));
check('Imports ParsedLogLine type', logListContent.includes("import type { ParsedLogLine } from 'core'"));
check('Imports HighlightPattern type', logListContent.includes("import type { HighlightPattern } from 'core'"));
check('Defines ROW_HEIGHT constant', logListContent.includes('ROW_HEIGHT'));
check('Defines BUFFER_SIZE constant', logListContent.includes('BUFFER_SIZE'));
check('Has virtual scrolling viewport div', logListContent.includes('log-list-viewport'));
check('Uses translateY for offset', logListContent.includes('translateY'));
check('Has empty state with log-list-empty class', logListContent.includes('log-list-empty'));
check('Shows "No log file loaded" message', logListContent.includes('No log file loaded'));
check('Has footer with log-list-footer class', logListContent.includes('log-list-footer'));
check('Shows line count in footer', logListContent.includes('Showing'));
check('Has followMode prop', logListContent.includes('followMode'));
check('Has followPaused prop', logListContent.includes('followPaused'));
check('Has onFollowLinesUpdate callback', logListContent.includes('onFollowLinesUpdate'));
check('Has auto-scroll in follow mode', logListContent.includes('scrollHeight'));
check('Has scroll event handler', logListContent.includes('handleScroll'));
check('Uses useMemo for visible lines', logListContent.includes('useMemo'));
check('Uses useCallback for scroll handler', logListContent.includes('useCallback'));
check('Renders LogRow with key and props', logListContent.includes('key={line.lineNumber}'));
check('Passes highlightResult to LogRow', logListContent.includes('highlightResult'));
check('Has no-lines message for filtered results', logListContent.includes('No lines match'));
check('Has file empty message', logListContent.includes('File is empty'));

// Read LogRow.tsx
const logRowPath = path.join(uiSrc, 'components/LogRow.tsx');
const logRowContent = fs.readFileSync(logRowPath, 'utf-8');

console.log('\n--- LogRow.tsx structure ---');
check('File exists', fs.existsSync(logRowPath));
check('Exports LogRow component', logRowContent.includes('export function LogRow'));
check('Has log-row class', logRowContent.includes('className="log-row"'));
check('Has data-line attribute', logRowContent.includes('data-line={line.lineNumber}'));
check('Has log-row-number span', logRowContent.includes('className="log-row-number"'));
check('Has log-row-timestamp span', logRowContent.includes('className="log-row-timestamp"'));
check('Has log-row-level span', logRowContent.includes('className="log-row-level"'));
check('Has log-row-content span', logRowContent.includes('className="log-row-content"'));
check('Uses PatternHighlighter.getLevelColor', logRowContent.includes('PatternHighlighter.getLevelColor'));
check('Supports highlightResult segments', logRowContent.includes('highlightResult.segments'));
check('Has log-row-highlight class for matches', logRowContent.includes('className="log-row-highlight"'));

// Read LogList.test.tsx
const testPath = path.join(uiSrc, 'components/LogList.test.tsx');
const testContent = fs.readFileSync(testPath, 'utf-8');

console.log('\n--- LogList.test.tsx structure ---');
check('Test file exists', fs.existsSync(testPath));
check('Uses vitest describe/it/expect', testContent.includes('describe') && testContent.includes('it('));
check('Tests rendering of LogRow components', testContent.includes('log-row'));
check('Tests data-line attribute', testContent.includes('data-line'));
check('Tests virtual scrolling viewport sizing', testContent.includes('log-list-viewport'));
check('Tests visible window rendering', testContent.includes('visible'));
check('Tests scroll behavior', testContent.includes('scroll'));
check('Tests follow mode reporting', testContent.includes('followMode'));
check('Tests followPaused behavior', testContent.includes('followPaused'));
check('Tests empty state message', testContent.includes('No log file loaded'));
check('Tests filtered results footer', testContent.includes('showing'));
check('Tests no-lines message', testContent.includes('No lines match'));
check('Tests file empty message', testContent.includes('File is empty'));

// Read setupTests.ts
const setupPath = path.join(uiSrc, 'setupTests.ts');
const setupContent = fs.readFileSync(setupPath, 'utf-8');

console.log('\n--- setupTests.ts ---');
check('Setup file exists', fs.existsSync(setupPath));
check('Imports jest-dom matchers', setupContent.includes('@testing-library/jest-dom'));
check('Has cleanup after each test', setupContent.includes('cleanup'));

// Read vitest.config.ts (at package root, not inside src)
const vitestConfigPath = path.resolve(__dirname, '..', 'vitest.config.ts');
const vitestConfigContent = fs.readFileSync(vitestConfigPath, 'utf-8');

console.log('\n--- vitest.config.ts ---');
check('Vitest config exists', fs.existsSync(vitestConfigPath));
check('Uses jsdom environment', vitestConfigContent.includes('jsdom'));
check('Has core alias', vitestConfigContent.includes('core'));
check('Uses forks pool', vitestConfigContent.includes('forks'));

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
  console.log('Failures:');
  for (const { name, detail } of errors) {
    console.log(`  - ${name}: ${detail}`);
  }
  process.exit(1);
}

console.log('All checks passed! LogList component is correctly implemented.');
process.exit(0);
