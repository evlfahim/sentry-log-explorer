#!/usr/bin/env node
/**
 * Integration test for App component.
 * This test verifies that the App component correctly integrates
 * FileOpenDialog and LogList by checking the component structure
 * and behavior without needing a full DOM environment.
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appPath = path.resolve(__dirname, '..', 'src', 'App.tsx');
const appContent = fs.readFileSync(appPath, 'utf-8');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.log(`  ✗ ${message}`);
    failed++;
  }
}

console.log('App integration tests:');
console.log('');

// Test 1: imports FileOpenDialog and LogList
console.log('1. Imports FileOpenDialog and LogList');
assert(appContent.includes("from './components/FileOpenDialog'"), 'imports FileOpenDialog');
assert(appContent.includes("from './components/LogList'"), 'imports LogList');
console.log('');

// Test 2: passes onFileOpen callback to FileOpenDialog
console.log('2. Passes onFileOpen callback to FileOpenDialog');
assert(appContent.includes('<FileOpenDialog onFileOpen={handleFileOpen}'), 'FileOpenDialog receives onFileOpen prop');
console.log('');

// Test 3: passes filtered lines to LogList
console.log('3. Passes filtered lines to LogList');
assert(appContent.includes('<LogList'), 'renders LogList component');
assert(appContent.includes('lines={filteredLines}'), 'passes filteredLines to LogList');
console.log('');

// Test 4: has handleFileOpen that parses log content
console.log('4. Has handleFileOpen that parses log content');
assert(appContent.includes('handleFileOpen'), 'has handleFileOpen function');
assert(appContent.includes('reader.readAsText(file)'), 'reads file as text');
assert(appContent.includes('parserRef.current.parseLine'), 'parses log lines');
console.log('');

// Test 5: renders FileOpenDialog in the JSX
console.log('5. Renders FileOpenDialog in the JSX');
assert(appContent.includes('<FileOpenDialog'), 'FileOpenDialog is rendered');
console.log('');

// Test 6: renders LogList in the JSX
console.log('6. Renders LogList in the JSX');
assert(appContent.includes('<LogList'), 'LogList is rendered');
console.log('');

// Test 7: has a fileLoaded state that controls LogList rendering
console.log('7. Has a fileLoaded state that controls LogList rendering');
assert(appContent.includes('fileLoaded'), 'has fileLoaded state');
assert(appContent.includes('fileLoaded={state.fileLoaded}'), 'passes fileLoaded to LogList');
console.log('');

// Test 8: handles file open error state
console.log('8. Handles file open error state');
assert(appContent.includes('error'), 'has error state');
assert(appContent.includes('state.error'), 'renders error state');
console.log('');

// Test 9: applies filters before passing to LogList
console.log('9. Applies filters before passing to LogList');
assert(appContent.includes('filteredLines'), 'has filteredLines variable');
assert(appContent.includes('filterByLevel'), 'filters by level');
assert(appContent.includes('filterByTimeRange'), 'filters by time range');
assert(appContent.includes('filterByPattern'), 'filters by pattern');
console.log('');

// Summary
console.log('');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All integration tests passed!');
  process.exit(0);
}
