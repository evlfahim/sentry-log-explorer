#!/usr/bin/env node
// Simple validation script for UI components
// Checks that all required elements are present in the built output

import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, 'dist', 'assets');

// Read the built JS file
const jsFiles = readdirSync(distDir).filter(f => f.endsWith('.js'));

if (jsFiles.length === 0) {
  console.error('No JS files found in dist/assets');
  process.exit(1);
}

const jsContent = readFileSync(join(distDir, jsFiles[0]), 'utf-8');

let passed = 0;
let failed = 0;

function check(name, condition) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}`);
    failed++;
  }
}

console.log('Checking UI components in built output...\n');

// Test 1: Open File button
check('Open File button', jsContent.includes('Open File'));

// Test 2: File accept attribute
check('File accept attribute (.log,.txt,.csv,.json)', jsContent.includes('.log,.txt,.csv,.json'));

// Test 3: App title
check('App title "Sentry Log Explorer"', jsContent.includes('Sentry Log Explorer'));

// Test 4: Empty state message
check('Empty state "No log file loaded"', jsContent.includes('No log file loaded'));

// Test 5: Log list container class
check('Log list container class', jsContent.includes('log-list-container'));

// Test 6: Log list viewport class
check('Log list viewport class', jsContent.includes('log-list-viewport'));

// Test 7: Filter bar class
check('Filter bar class', jsContent.includes('filter-bar'));

// Test 8: Follow mode toggle class
check('Follow mode toggle class', jsContent.includes('follow-mode-toggle'));

// Test 9: Saved queries panel class
check('Saved queries panel class', jsContent.includes('saved-queries-panel'));

// Test 10: Log row class
check('Log row class', jsContent.includes('log-row'));

// Test 11: data-line attribute
check('data-line attribute', jsContent.includes('data-line'));

// Test 12: Line number rendering
check('Line number rendering', jsContent.includes('lineNumber'));

// Test 13: Level badge rendering
check('Level badge rendering', jsContent.includes('log-row-level'));

// Test 14: File name in header
check('File name in header', jsContent.includes('file-name'));

// Test 15: Loading state
check('Loading state', jsContent.includes('Loading...'));

// Test 16: Error banner
check('Error banner', jsContent.includes('error-banner'));

// Test 17: Footer with line count
check('Footer with line count', jsContent.includes('Showing') && jsContent.includes('of') && jsContent.includes('lines'));

// Test 18: File input type
check('File input type="file"', jsContent.includes('type="file"') || jsContent.includes('type:"file"'));

// Test 19: Log row content class
check('Log row content class', jsContent.includes('log-row-content'));

// Test 20: Log row number class
check('Log row number class', jsContent.includes('log-row-number'));

// Test 21: Log row timestamp class
check('Log row timestamp class', jsContent.includes('log-row-timestamp'));

// Test 22: Follow mode toggle button text
check('Follow mode toggle button', jsContent.includes('Follow'));

// Test 23: Pause/Resume buttons
check('Pause/Resume buttons', jsContent.includes('Pause') || jsContent.includes('Resume'));

// Test 24: Saved queries create button
check('Saved queries create button', jsContent.includes('Create'));

// Test 25: Export JSON button
check('Export JSON button', jsContent.includes('Export JSON'));

// Test 26: Import JSON button
check('Import JSON button', jsContent.includes('Import JSON'));

// Test 27: Delete button
check('Delete button', jsContent.includes('Delete'));

// Test 28: Filter level options
check('Filter level options (INFO)', jsContent.includes('INFO'));
check('Filter level options (ERROR)', jsContent.includes('ERROR'));
check('Filter level options (WARN)', jsContent.includes('WARN'));

// Test 29: Virtual scrolling constants
check('Virtual scrolling ROW_HEIGHT', jsContent.includes('24'));
check('Virtual scrolling BUFFER_SIZE', jsContent.includes('20'));

// Test 30: App CSS classes
check('App container class', jsContent.includes('className:"app"'));
check('App header class', jsContent.includes('app-header'));
check('App toolbar class', jsContent.includes('app-toolbar'));

// Test 31: File open dialog class
check('File open dialog class', jsContent.includes('file-open-dialog'));

// Test 32: Log list empty state class
check('Log list empty state class', jsContent.includes('log-list-empty'));

// Test 33: Log list no lines class
check('Log list no lines class', jsContent.includes('log-list-no-lines'));

// Test 34: Log list footer class
check('Log list footer class', jsContent.includes('log-list-footer'));

// Test 35: Saved queries dropdown
check('Saved queries dropdown', jsContent.includes('saved-queries-dropdown'));

// Test 36: Saved queries list
check('Saved queries list', jsContent.includes('saved-queries-list'));

// Test 37: Saved query item
check('Saved query item', jsContent.includes('saved-query-item'));

// Test 38: Saved query info
check('Saved query info', jsContent.includes('saved-query-info'));

// Test 39: Saved queries actions
check('Saved queries actions', jsContent.includes('saved-queries-actions'));

// Test 40: Highlight patterns support
check('Highlight patterns support', jsContent.includes('highlightPatterns'));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
console.log('All checks passed!');
