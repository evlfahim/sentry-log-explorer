#!/usr/bin/env node
/**
 * FilterBar integration test.
 * This test verifies that the FilterBar component correctly integrates
 * with the App component by checking the component structure and behavior
 * without needing a full DOM environment.
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filterBarPath = path.resolve(__dirname, '..', 'src', 'components', 'FilterBar.tsx');
const filterBarContent = fs.readFileSync(filterBarPath, 'utf-8');

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

console.log('FilterBar tests:');
console.log('');

// Test 1: FilterBar imports LogLevel from core
console.log('1. Imports LogLevel from core');
assert(
  filterBarContent.includes("import { LogLevel, PatternHighlighter } from 'core'"),
  'imports LogLevel and PatternHighlighter from core'
);
console.log('');

// Test 2: FilterBar has level select with all log levels
console.log('2. Has level select with all log levels');
assert(
  filterBarContent.includes('LogLevel.DEBUG'),
  'has DEBUG option'
);
assert(
  filterBarContent.includes('LogLevel.INFO'),
  'has INFO option'
);
assert(
  filterBarContent.includes('LogLevel.WARN'),
  'has WARN option'
);
assert(
  filterBarContent.includes('LogLevel.WARNING'),
  'has WARNING option'
);
assert(
  filterBarContent.includes('LogLevel.ERROR'),
  'has ERROR option'
);
assert(
  filterBarContent.includes('LogLevel.FATAL'),
  'has FATAL option'
);
assert(
  filterBarContent.includes('LogLevel.TRACE'),
  'has TRACE option'
);
console.log('');

// Test 3: FilterBar has time pickers (datetime-local inputs)
console.log('3. Has time pickers (datetime-local inputs)');
assert(
  filterBarContent.includes('type="datetime-local"'),
  'has datetime-local inputs'
);
assert(
  filterBarContent.includes('timeStart'),
  'has timeStart state'
);
assert(
  filterBarContent.includes('timeEnd'),
  'has timeEnd state'
);
assert(
  filterBarContent.includes('setTimeStart'),
  'has setTimeStart handler'
);
assert(
  filterBarContent.includes('setTimeEnd'),
  'has setTimeEnd handler'
);
console.log('');

// Test 4: FilterBar has pattern filter input
console.log('4. Has pattern filter input');
assert(
  filterBarContent.includes('placeholder="Regex pattern..."'),
  'has pattern input with placeholder'
);
assert(
  filterBarContent.includes('pattern'),
  'has pattern state'
);
assert(
  filterBarContent.includes('setPattern'),
  'has setPattern handler'
);
console.log('');

// Test 5: FilterBar has Apply Filter button
console.log('5. Has Apply Filter button');
assert(
  filterBarContent.includes('Apply Filter'),
  'has Apply Filter button'
);
assert(
  filterBarContent.includes('handleApplyFilter'),
  'has handleApplyFilter function'
);
assert(
  filterBarContent.includes('onFilterChange(level, timeStart, timeEnd, pattern)'),
  'calls onFilterChange with all filter values'
);
console.log('');

// Test 6: FilterBar has highlight patterns section
console.log('6. Has highlight patterns section');
assert(
  filterBarContent.includes('highlightPattern'),
  'has highlightPattern state'
);
assert(
  filterBarContent.includes('highlightColor'),
  'has highlightColor state'
);
assert(
  filterBarContent.includes('highlightPatterns'),
  'has highlightPatterns state'
);
assert(
  filterBarContent.includes('handleAddHighlight'),
  'has handleAddHighlight function'
);
assert(
  filterBarContent.includes('handleRemoveHighlight'),
  'has handleRemoveHighlight function'
);
assert(
  filterBarContent.includes('onHighlightPatternsChange'),
  'calls onHighlightPatternsChange'
);
console.log('');

// Test 7: FilterBar is integrated into App
console.log('7. FilterBar is integrated into App');
assert(
  appContent.includes("import { FilterBar } from './components/FilterBar'"),
  'App imports FilterBar'
);
assert(
  appContent.includes('<FilterBar'),
  'App renders FilterBar'
);
assert(
  appContent.includes('onFilterChange={handleFilterChange}'),
  'App passes onFilterChange to FilterBar'
);
assert(
  appContent.includes('onHighlightPatternsChange={handleHighlightPatternsChange}'),
  'App passes onHighlightPatternsChange to FilterBar'
);
console.log('');

// Test 8: App handles filter changes
console.log('8. App handles filter changes');
assert(
  appContent.includes('handleFilterChange'),
  'App has handleFilterChange function'
);
assert(
  appContent.includes('filterLevel'),
  'App has filterLevel state'
);
assert(
  appContent.includes('filterTimeStart'),
  'App has filterTimeStart state'
);
assert(
  appContent.includes('filterTimeEnd'),
  'App has filterTimeEnd state'
);
assert(
  appContent.includes('filterPattern'),
  'App has filterPattern state'
);
console.log('');

// Test 9: App applies filters using core parser
console.log('9. App applies filters using core parser');
assert(
  appContent.includes('filteredLines'),
  'App computes filteredLines'
);
assert(
  appContent.includes('filterByLevel'),
  'App uses filterByLevel from core'
);
assert(
  appContent.includes('filterByTimeRange'),
  'App uses filterByTimeRange from core'
);
assert(
  appContent.includes('filterByPattern'),
  'App uses filterByPattern from core'
);
console.log('');

// Test 10: FilterBar props interface is correct
console.log('10. FilterBar props interface is correct');
assert(
  filterBarContent.includes('interface FilterBarProps'),
  'has FilterBarProps interface'
);
assert(
  filterBarContent.includes('onFilterChange: (level: LogLevel | \'\', timeStart: string, timeEnd: string, pattern: string) => void'),
  'onFilterChange has correct signature'
);
assert(
  filterBarContent.includes('onHighlightPatternsChange: (patterns: HighlightPattern[]) => void'),
  'onHighlightPatternsChange has correct signature'
);
console.log('');

// Summary
console.log('');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All FilterBar tests passed!');
  process.exit(0);
}
