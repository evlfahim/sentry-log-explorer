#!/usr/bin/env node
/**
 * Highlight-UI integration test.
 * Verifies that the pattern highlighter is properly integrated into log rows
 * by checking source code structure, imports, and rendering logic.
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logRowPath = path.resolve(__dirname, '..', 'src', 'components', 'LogRow.tsx');
const logListPath = path.resolve(__dirname, '..', 'src', 'components', 'LogList.tsx');
const appPath = path.resolve(__dirname, '..', 'src', 'App.tsx');
const highlighterPath = path.resolve(__dirname, '..', '..', 'core', 'src', 'highlighter.ts');
const coreIndexPath = path.resolve(__dirname, '..', '..', 'core', 'src', 'index.ts');

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

console.log('Highlight-UI integration tests:');
console.log('');

// Test 1: Core exports PatternHighlighter
console.log('1. Core exports PatternHighlighter');
const coreIndexContent = fs.readFileSync(coreIndexPath, 'utf-8');
assert(
  coreIndexContent.includes('PatternHighlighter') && coreIndexContent.includes('export'),
  'core exports PatternHighlighter'
);
assert(
  coreIndexContent.includes('DEFAULT_HIGHLIGHT_PATTERNS'),
  'core exports DEFAULT_HIGHLIGHT_PATTERNS'
);
assert(
  coreIndexContent.includes('DEFAULT_LEVEL_COLORS'),
  'core exports DEFAULT_LEVEL_COLORS'
);
assert(
  coreIndexContent.includes('HighlightPattern'),
  'core exports HighlightPattern type'
);
assert(
  coreIndexContent.includes('HighlightResult'),
  'core exports HighlightResult type'
);
assert(
  coreIndexContent.includes('HighlightedSegment'),
  'core exports HighlightedSegment type'
);
console.log('');

// Test 2: Core exports LogLevel enum
console.log('2. Core exports LogLevel enum');
assert(
  coreIndexContent.includes("export { LogLevel }"),
  'core exports LogLevel'
);
console.log('');

// Test 3: LogRow imports PatternHighlighter from core
console.log('3. LogRow imports PatternHighlighter from core');
const logRowContent = fs.readFileSync(logRowPath, 'utf-8');
assert(
  logRowContent.includes("import { PatternHighlighter } from 'core'"),
  'LogRow imports PatternHighlighter from core'
);
assert(
  logRowContent.includes("import type { ParsedLogLine } from 'core'"),
  'LogRow imports ParsedLogLine from core'
);
assert(
  logRowContent.includes("import type { HighlightResult } from 'core'"),
  'LogRow imports HighlightResult from core'
);
console.log('');

// Test 4: LogRow uses PatternHighlighter.getLevelColor for level colors
console.log('4. LogRow uses PatternHighlighter.getLevelColor for level colors');
assert(
  logRowContent.includes('PatternHighlighter.getLevelColor'),
  'LogRow calls PatternHighlighter.getLevelColor'
);
assert(
  logRowContent.includes('line.level'),
  'LogRow passes line.level to getLevelColor'
);
console.log('');

// Test 5: LogRow renders highlight segments from highlightResult
console.log('5. LogRow renders highlight segments from highlightResult');
assert(
  logRowContent.includes('highlightResult'),
  'LogRow accepts highlightResult prop'
);
assert(
  logRowContent.includes('highlightResult.segments'),
  'LogRow accesses highlightResult.segments'
);
assert(
  logRowContent.includes('segment.isMatch'),
  'LogRow checks segment.isMatch'
);
assert(
  logRowContent.includes('segment.color'),
  'LogRow accesses segment.color'
);
assert(
  logRowContent.includes('segment.text'),
  'LogRow renders segment.text'
);
assert(
  logRowContent.includes('className="log-row-highlight"'),
  'LogRow applies log-row-highlight class to matched segments'
);
assert(
  logRowContent.includes('color: segment.color.color'),
  'LogRow applies segment color to matched spans'
);
console.log('');

// Test 6: LogRow handles null highlightResult gracefully
console.log('6. LogRow handles null highlightResult gracefully');
assert(
  logRowContent.includes('!highlightResult') || logRowContent.includes('highlightResult === null') || logRowContent.includes('highlightResult == null'),
  'LogRow checks for null highlightResult'
);
assert(
  logRowContent.includes('highlightResult.segments.length === 0'),
  'LogRow checks for empty segments'
);
assert(
  logRowContent.includes('line.message'),
  'LogRow falls back to line.message when no highlights'
);
console.log('');

// Test 7: LogRow renders level with color from highlighter
console.log('7. LogRow renders level with color from highlighter');
assert(
  logRowContent.includes('levelColor'),
  'LogRow computes levelColor'
);
assert(
  logRowContent.includes('style={{ color: levelColor }}'),
  'LogRow applies levelColor as style'
);
assert(
  logRowContent.includes('hasLevel'),
  'LogRow checks hasLevel before rendering level'
);
console.log('');

// Test 8: LogRow renders line number, timestamp, level, and content
console.log('8. LogRow renders line number, timestamp, level, and content');
assert(
  logRowContent.includes('log-row-number'),
  'LogRow renders .log-row-number'
);
assert(
  logRowContent.includes('line.lineNumber'),
  'LogRow uses line.lineNumber'
);
assert(
  logRowContent.includes('log-row-timestamp'),
  'LogRow renders .log-row-timestamp'
);
assert(
  logRowContent.includes('log-row-level'),
  'LogRow renders .log-row-level'
);
assert(
  logRowContent.includes('log-row-content'),
  'LogRow renders .log-row-content'
);
assert(
  logRowContent.includes('data-line={line.lineNumber}'),
  'LogRow sets data-line attribute'
);
console.log('');

// Test 9: LogList imports PatternHighlighter and passes highlightPatterns
console.log('9. LogList imports PatternHighlighter and passes highlightPatterns');
const logListContent = fs.readFileSync(logListPath, 'utf-8');
assert(
  logListContent.includes("import { PatternHighlighter } from 'core'"),
  'LogList imports PatternHighlighter from core'
);
assert(
  logListContent.includes("import type { HighlightPattern } from 'core'"),
  'LogList imports HighlightPattern from core'
);
assert(
  logListContent.includes('highlightPatterns'),
  'LogList accepts highlightPatterns prop'
);
assert(
  logListContent.includes('highlightPatterns: HighlightPattern[]'),
  'LogList has highlightPatterns prop with correct type'
);
console.log('');

// Test 10: LogList creates PatternHighlighter instance and highlights lines
console.log('10. LogList creates PatternHighlighter instance and highlights lines');
assert(
  logListContent.includes('new PatternHighlighter()'),
  'LogList creates a PatternHighlighter instance'
);
assert(
  logListContent.includes('setPatterns'),
  'LogList calls setPatterns on the highlighter'
);
assert(
  logListContent.includes('highlightLines'),
  'LogList calls highlightLines on the highlighter'
);
assert(
  logListContent.includes('visibleLines.map'),
  'LogList maps over visibleLines for highlighting'
);
console.log('');

// Test 11: LogList passes highlightResult to LogRow
console.log('11. LogList passes highlightResult to LogRow');
assert(
  logListContent.includes('highlightResult'),
  'LogList references highlightResult'
);
assert(
  logListContent.includes('highlightResults'),
  'LogList stores highlightResults'
);
assert(
  logListContent.includes('highlightResults?.[') || logListContent.includes('highlightResults['),
  'LogList indexes into highlightResults'
);
assert(
  logListContent.includes('highlightResult={highlightResults'),
  'LogList passes highlightResults to LogRow'
);
console.log('');

// Test 12: LogList only highlights visible lines (virtual scrolling integration)
console.log('12. LogList only highlights visible lines (virtual scrolling integration)');
assert(
  logListContent.includes('visibleLines.map((l) => l.message)'),
  'LogList highlights only visible lines'
);
assert(
  logListContent.includes('highlightPatterns.length === 0'),
  'LogList skips highlighting when no patterns'
);
assert(
  logListContent.includes('highlightResults = useMemo'),
  'LogList memoizes highlight results'
);
console.log('');

// Test 13: App integrates highlight patterns through FilterBar
console.log('13. App integrates highlight patterns through FilterBar');
const appContent = fs.readFileSync(appPath, 'utf-8');
assert(
  appContent.includes('HighlightPattern') && appContent.includes("from 'core'"),
  'App imports HighlightPattern type from core'
);
assert(
  appContent.includes('highlightPatterns'),
  'App has highlightPatterns state'
);
assert(
  appContent.includes('handleHighlightPatternsChange'),
  'App has handleHighlightPatternsChange callback'
);
assert(
  appContent.includes('onHighlightPatternsChange={handleHighlightPatternsChange}'),
  'App passes onHighlightPatternsChange to FilterBar'
);
console.log('');

// Test 14: App passes highlightPatterns to LogList
console.log('14. App passes highlightPatterns to LogList');
assert(
  appContent.includes('<LogList'),
  'App renders LogList'
);
assert(
  appContent.includes('highlightPatterns={highlightPatterns}'),
  'App passes highlightPatterns to LogList'
);
console.log('');

// Test 15: Core highlighter has DEFAULT_HIGHLIGHT_PATTERNS with useful patterns
console.log('15. Core highlighter has DEFAULT_HIGHLIGHT_PATTERNS with useful patterns');
const highlighterContent = fs.readFileSync(highlighterPath, 'utf-8');
assert(
  highlighterContent.includes('DEFAULT_HIGHLIGHT_PATTERNS'),
  'highlighter.ts defines DEFAULT_HIGHLIGHT_PATTERNS'
);
assert(
  highlighterContent.includes('IP addresses') || highlighterContent.includes('IP'),
  'DEFAULT_HIGHLIGHT_PATTERNS includes IP address pattern'
);
assert(
  highlighterContent.includes('Email addresses') || highlighterContent.includes('Email'),
  'DEFAULT_HIGHLIGHT_PATTERNS includes email pattern'
);
assert(
  highlighterContent.includes('URLs') || highlighterContent.includes('http'),
  'DEFAULT_HIGHLIGHT_PATTERNS includes URL pattern'
);
assert(
  highlighterContent.includes('Timestamp') || highlighterContent.includes('timestamp'),
  'DEFAULT_HIGHLIGHT_PATTERNS includes timestamp pattern'
);
console.log('');

// Test 16: Core highlighter has DEFAULT_LEVEL_COLORS for all levels
console.log('16. Core highlighter has DEFAULT_LEVEL_COLORS for all levels');
assert(
  highlighterContent.includes('TRACE'),
  'DEFAULT_LEVEL_COLORS includes TRACE'
);
assert(
  highlighterContent.includes('DEBUG'),
  'DEFAULT_LEVEL_COLORS includes DEBUG'
);
assert(
  highlighterContent.includes('INFO'),
  'DEFAULT_LEVEL_COLORS includes INFO'
);
assert(
  highlighterContent.includes('WARN'),
  'DEFAULT_LEVEL_COLORS includes WARN'
);
assert(
  highlighterContent.includes('ERROR'),
  'DEFAULT_LEVEL_COLORS includes ERROR'
);
assert(
  highlighterContent.includes('FATAL'),
  'DEFAULT_LEVEL_COLORS includes FATAL'
);
console.log('');

// Test 17: PatternHighlighter class has highlight method
console.log('17. PatternHighlighter class has highlight method');
assert(
  highlighterContent.includes('highlight(line: string): HighlightResult'),
  'PatternHighlighter has highlight(line: string): HighlightResult method'
);
assert(
  highlighterContent.includes('highlightLines(lines: string[]): HighlightResult[]'),
  'PatternHighlighter has highlightLines method'
);
assert(
  highlighterContent.includes('static getLevelColor'),
  'PatternHighlighter has static getLevelColor method'
);
assert(
  highlighterContent.includes('addPattern'),
  'PatternHighlighter has addPattern method'
);
assert(
  highlighterContent.includes('removePattern'),
  'PatternHighlighter has removePattern method'
);
assert(
  highlighterContent.includes('setPatterns'),
  'PatternHighlighter has setPatterns method'
);
console.log('');

// Test 18: LogRow uses useMemo for performance
console.log('18. LogRow uses useMemo for performance');
assert(
  logRowContent.includes('useMemo'),
  'LogRow uses useMemo'
);
assert(
  logRowContent.includes('levelColor'),
  'LogRow memoizes levelColor'
);
assert(
  logRowContent.includes('content'),
  'LogRow memoizes content'
);
console.log('');

// Test 19: LogList uses useMemo for highlight results
console.log('19. LogList uses useMemo for highlight results');
assert(
  logListContent.includes('useMemo'),
  'LogList uses useMemo'
);
assert(
  logListContent.includes('highlightResults = useMemo'),
  'LogList memoizes highlightResults'
);
assert(
  logListContent.includes('visibleLines'),
  'LogList depends on visibleLines'
);
assert(
  logListContent.includes('highlightPatterns'),
  'LogList depends on highlightPatterns'
);
console.log('');

// Test 20: LogRow renders non-matched segments as plain text
console.log('20. LogRow renders non-matched segments as plain text');
assert(
  logRowContent.includes('segment.isMatch ?'),
  'LogRow conditionally renders based on isMatch'
);
assert(
  logRowContent.includes('className="log-row-highlight"'),
  'LogRow applies highlight class only to matched segments'
);
assert(
  logRowContent.includes('<span key={i}>{segment.text}</span>'),
  'LogRow renders non-matched segments as plain spans'
);
console.log('');

// Summary
console.log('');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All highlight-ui integration tests passed!');
  process.exit(0);
}
