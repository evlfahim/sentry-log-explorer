#!/usr/bin/env node
// Simple test runner for UI components that works in this sandbox
// Uses happy-dom directly without vitest/jest

import { Window } from 'happy-dom';
import React from 'react';
import { renderToString } from 'react-dom/server';

const window = new Window();
const document = window.document;

// Test 1: FileOpenDialog renders Open File button
console.log('Test 1: FileOpenDialog renders Open File button');
const { FileOpenDialog } = await import('./src/components/FileOpenDialog.tsx');
const fileOpenDialog = React.createElement(FileOpenDialog, { onFileOpen: () => {} });
const html1 = renderToString(fileOpenDialog);
if (html1.includes('Open File')) {
  console.log('  PASS: Open File button found');
} else {
  console.log('  FAIL: Open File button not found');
  process.exit(1);
}

// Test 2: FileOpenDialog has correct accept attribute
console.log('Test 2: FileOpenDialog has correct accept attribute');
if (html1.includes('.log,.txt,.csv,.json')) {
  console.log('  PASS: Accept attribute correct');
} else {
  console.log('  FAIL: Accept attribute incorrect');
  process.exit(1);
}

// Test 3: LogList renders empty state
console.log('Test 3: LogList renders empty state');
const { LogList } = await import('./src/components/LogList.tsx');
const logList = React.createElement(LogList, {
  lines: [],
  rawLines: [],
  fileLoaded: false,
  highlightPatterns: [],
  followMode: false,
  followPaused: false,
  onFollowLinesUpdate: () => {},
});
const html3 = renderToString(logList);
if (html3.includes('No log file loaded')) {
  console.log('  PASS: Empty state found');
} else {
  console.log('  FAIL: Empty state not found');
  process.exit(1);
}

// Test 4: LogList renders with data
console.log('Test 4: LogList renders with data');
const { LogRow } = await import('./src/components/LogRow.tsx');
const { PatternHighlighter, LogLevel } = await import('../core/src/index.ts');

const testLine = {
  lineNumber: 1,
  rawLine: '2024-01-01 10:00:00 INFO Test message',
  timestamp: new Date('2024-01-01T10:00:00'),
  level: LogLevel.INFO,
  message: 'Test message',
  rawTimestamp: '2024-01-01 10:00:00',
  rawLevel: 'INFO',
};

const logListWithData = React.createElement(LogList, {
  lines: [testLine],
  rawLines: ['2024-01-01 10:00:00 INFO Test message'],
  fileLoaded: true,
  highlightPatterns: [],
  followMode: false,
  followPaused: false,
  onFollowLinesUpdate: () => {},
});
const html4 = renderToString(logListWithData);
if (html4.includes('Test message') && html4.includes('INFO')) {
  console.log('  PASS: Log data rendered');
} else {
  console.log('  FAIL: Log data not rendered');
  process.exit(1);
}

// Test 5: LogRow renders with line number
console.log('Test 5: LogRow renders with line number');
const logRow = React.createElement(LogRow, { line: testLine, highlightResult: null });
const html5 = renderToString(logRow);
if (html5.includes('1') && html5.includes('Test message')) {
  console.log('  PASS: Line number and content rendered');
} else {
  console.log('  FAIL: Line number or content not rendered');
  process.exit(1);
}

// Test 6: FilterBar renders
console.log('Test 6: FilterBar renders');
const { FilterBar } = await import('./src/components/FilterBar.tsx');
const filterBar = React.createElement(FilterBar, {
  onFilterChange: () => {},
  onHighlightPatternsChange: () => {},
});
const html6 = renderToString(filterBar);
if (html6.includes('filter-bar')) {
  console.log('  PASS: FilterBar renders');
} else {
  console.log('  FAIL: FilterBar not rendered');
  process.exit(1);
}

// Test 7: FollowModeToggle renders
console.log('Test 7: FollowModeToggle renders');
const { FollowModeToggle } = await import('./src/components/FollowModeToggle.tsx');
const followMode = React.createElement(FollowModeToggle, {
  followMode: false,
  followPaused: false,
  onChange: () => {},
});
const html7 = renderToString(followMode);
if (html7.includes('follow-mode-toggle')) {
  console.log('  PASS: FollowModeToggle renders');
} else {
  console.log('  FAIL: FollowModeToggle not rendered');
  process.exit(1);
}

// Test 8: SavedQueriesPanel renders
console.log('Test 8: SavedQueriesPanel renders');
const { SavedQueriesPanel } = await import('./src/components/SavedQueriesPanel.tsx');
const savedQueries = React.createElement(SavedQueriesPanel, {
  queries: [],
  onChange: () => {},
});
const html8 = renderToString(savedQueries);
if (html8.includes('saved-queries-panel')) {
  console.log('  PASS: SavedQueriesPanel renders');
} else {
  console.log('  FAIL: SavedQueriesPanel not rendered');
  process.exit(1);
}

// Test 9: App renders with all components
console.log('Test 9: App renders with all components');
const App = await import('./src/App.tsx');
const app = React.createElement(App.default, {});
const html9 = renderToString(app);
if (html9.includes('Sentry Log Explorer')) {
  console.log('  PASS: App renders with title');
} else {
  console.log('  FAIL: App title not found');
  process.exit(1);
}

// Test 10: LogRow with XSS content is escaped
console.log('Test 10: LogRow with XSS content is escaped');
const xssLine = {
  lineNumber: 1,
  rawLine: '<script>alert("xss")</script>',
  timestamp: null,
  level: LogLevel.UNKNOWN,
  message: '<script>alert("xss")</script>',
  rawTimestamp: null,
  rawLevel: null,
};
const xssRow = React.createElement(LogRow, { line: xssLine, highlightResult: null });
const html10 = renderToString(xssRow);
if (!html10.includes('<script>') && html10.includes('alert')) {
  console.log('  PASS: XSS content is escaped');
} else {
  console.log('  FAIL: XSS content not escaped');
  process.exit(1);
}

// Test 11: LogRow has data-line attribute
console.log('Test 11: LogRow has data-line attribute');
if (html5.includes('data-line="1"')) {
  console.log('  PASS: data-line attribute present');
} else {
  console.log('  FAIL: data-line attribute missing');
  process.exit(1);
}

// Test 12: LogList has correct CSS classes
console.log('Test 12: LogList has correct CSS classes');
if (html4.includes('log-list-container') && html4.includes('log-list-viewport')) {
  console.log('  PASS: LogList has correct CSS classes');
} else {
  console.log('  FAIL: LogList CSS classes missing');
  process.exit(1);
}

// Test 13: LogList footer shows line count
console.log('Test 13: LogList footer shows line count');
if (html4.includes('Showing 1 of 1 lines')) {
  console.log('  PASS: Footer shows line count');
} else {
  console.log('  FAIL: Footer line count not found');
  process.exit(1);
}

// Test 14: FileOpenDialog has input[type="file"]
console.log('Test 14: FileOpenDialog has input[type="file"]');
if (html1.includes('type="file"')) {
  console.log('  PASS: File input present');
} else {
  console.log('  FAIL: File input missing');
  process.exit(1);
}

// Test 15: LogRow content is rendered as text (not HTML)
console.log('Test 15: LogRow content is rendered as text');
const textLine = {
  lineNumber: 1,
  rawLine: 'Hello & World',
  timestamp: null,
  level: LogLevel.UNKNOWN,
  message: 'Hello & World',
  rawTimestamp: null,
  rawLevel: null,
};
const textRow = React.createElement(LogRow, { line: textLine, highlightResult: null });
const html15 = renderToString(textRow);
if (html15.includes('Hello &amp; World')) {
  console.log('  PASS: Special characters are escaped');
} else {
  console.log('  FAIL: Special characters not escaped');
  process.exit(1);
}

console.log('\nAll tests passed!');
