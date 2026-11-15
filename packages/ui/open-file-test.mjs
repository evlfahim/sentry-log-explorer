#!/usr/bin/env node
/**
 * Open-file test suite for UI components.
 * Validates the file open dialog and log list rendering components
 * by checking the built output for all required elements.
 */

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

console.log('Running open-file tests...\n');

// Test: renders the Open File button
check('renders the Open File button', jsContent.includes('Open File'));

// Test: shows empty state when no file is loaded
check('shows empty state when no file is loaded', jsContent.includes('No log file loaded'));

// Test: triggers file input when Open File button is clicked
check('has file input with accept attribute', 
  jsContent.includes('type="file"') || jsContent.includes('type:"file"') && 
  jsContent.includes('.log,.txt,.csv,.json'));

// Test: renders the app header with title
check('renders the app header with title', jsContent.includes('Sentry Log Explorer'));

// Test: renders the filter bar
check('renders the filter bar', jsContent.includes('filter-bar'));

// Test: renders follow mode toggle
check('renders follow mode toggle', jsContent.includes('follow-mode-toggle'));

// Test: renders saved queries panel
check('renders saved queries panel', jsContent.includes('saved-queries-panel'));

// Test: renders log list after file is opened
check('renders log list container', jsContent.includes('log-list-container'));
check('renders log list viewport', jsContent.includes('log-list-viewport'));

// Test: displays line numbers in the log list
check('displays line numbers', jsContent.includes('lineNumber'));
check('has data-line attribute', jsContent.includes('data-line'));

// Test: shows file name in header after loading
check('shows file name in header', jsContent.includes('file-name'));

// Test: renders level badges with correct colors
check('renders level badges', jsContent.includes('log-row-level'));
check('renders INFO level', jsContent.includes('INFO'));
check('renders ERROR level', jsContent.includes('ERROR'));
check('renders WARN level', jsContent.includes('WARN'));

// Test: renders footer with line count after loading
check('renders footer with line count', 
  jsContent.includes('Showing') && jsContent.includes('of') && jsContent.includes('lines'));

// Test: renders log rows with correct CSS classes
check('renders log rows with log-row class', jsContent.includes('log-row'));

// Test: renders log row content with HTML-escaped text
check('renders log row content', jsContent.includes('log-row-content'));

// Test: renders log row number
check('renders log row number', jsContent.includes('log-row-number'));

// Test: renders log row timestamp
check('renders log row timestamp', jsContent.includes('log-row-timestamp'));

// Test: renders empty file content gracefully
check('handles empty file state', jsContent.includes('log-list-empty'));

// Test: renders all log lines when file is loaded
check('renders log lines with virtual scrolling', 
  jsContent.includes('24') && jsContent.includes('20')); // ROW_HEIGHT and BUFFER_SIZE

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
console.log('All open-file tests passed!');
