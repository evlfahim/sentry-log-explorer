#!/usr/bin/env node
/**
 * SavedQueriesPanel integration test.
 * Tests the SavedQueriesPanel component structure, its integration with App,
 * and the core SavedQueriesManager via the compiled JS output.
 *
 * Run: cd packages/ui && node scripts/saved-queries-test.mjs
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiDir = path.resolve(__dirname, '..');
const coreDist = path.resolve(uiDir, '../core/dist');

// Import the compiled core modules
const { SavedQueriesManager } = await import(
  path.join(coreDist, 'queries.js')
);
const { LogLevel } = await import(
  path.join(coreDist, 'highlighter.js')
);

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

function section(name) {
  console.log('');
  console.log(`=== ${name} ===`);
}

// ─── Component structure tests ───────────────────────────────────────────────

section('SavedQueriesPanel component structure');

const savedQueriesPanelPath = path.resolve(uiDir, 'src/components/SavedQueriesPanel.tsx');
const savedQueriesPanelContent = fs.readFileSync(savedQueriesPanelPath, 'utf-8');

// 1. Component exports
assert(
  savedQueriesPanelContent.includes('export function SavedQueriesPanel'),
  'exports SavedQueriesPanel component'
);

// 2. Props interface
assert(
  savedQueriesPanelContent.includes('queries: SavedQuery[]'),
  'has queries prop'
);
assert(
  savedQueriesPanelContent.includes('onChange: (queries: SavedQuery[]) => void'),
  'has onChange prop'
);

// 3. State management
assert(
  savedQueriesPanelContent.includes('useState'),
  'uses useState for state management'
);
assert(
  savedQueriesPanelContent.includes('isOpen'),
  'has isOpen state for panel toggle'
);
assert(
  savedQueriesPanelContent.includes('newName'),
  'has newName state for query name input'
);
assert(
  savedQueriesPanelContent.includes('newDescription'),
  'has newDescription state for query description'
);
assert(
  savedQueriesPanelContent.includes('newMinLevel'),
  'has newMinLevel state for level selection'
);
assert(
  savedQueriesPanelContent.includes('newPattern'),
  'has newPattern state for regex pattern'
);

// 4. Create query handler
assert(
  savedQueriesPanelContent.includes('handleCreateQuery'),
  'has handleCreateQuery function'
);
assert(
  savedQueriesPanelContent.includes('crypto.randomUUID()'),
  'generates unique IDs with crypto.randomUUID()'
);
assert(
  savedQueriesPanelContent.includes('createdAt: Date.now()'),
  'sets createdAt timestamp'
);
assert(
  savedQueriesPanelContent.includes('usageCount: 1'),
  'initializes usageCount to 1'
);
assert(
  savedQueriesPanelContent.includes('onChange([...queries, query])'),
  'appends new query via onChange'
);

// 5. Delete query handler
assert(
  savedQueriesPanelContent.includes('handleDeleteQuery'),
  'has handleDeleteQuery function'
);
assert(
  savedQueriesPanelContent.includes('queries.filter((q) => q.id !== id)'),
  'removes query by id via filter'
);

// 6. Export queries handler
assert(
  savedQueriesPanelContent.includes('handleExportQueries'),
  'has handleExportQueries function'
);
assert(
  savedQueriesPanelContent.includes('JSON.stringify(queries, null, 2)'),
  'exports as formatted JSON'
);
assert(
  savedQueriesPanelContent.includes('new Blob'),
  'creates a Blob for download'
);
assert(
  savedQueriesPanelContent.includes('application/json'),
  'uses application/json MIME type'
);
assert(
  savedQueriesPanelContent.includes('download'),
  'sets download attribute on link'
);
assert(
  savedQueriesPanelContent.includes('URL.revokeObjectURL'),
  'revokes object URL after download'
);

// 7. Import queries handler
assert(
  savedQueriesPanelContent.includes('handleImportQueries'),
  'has handleImportQueries function'
);
assert(
  savedQueriesPanelContent.includes('FileReader'),
  'uses FileReader for file reading'
);
assert(
  savedQueriesPanelContent.includes('JSON.parse'),
  'parses imported JSON'
);
assert(
  savedQueriesPanelContent.includes('Array.isArray'),
  'validates imported data is an array'
);

// 8. UI elements
assert(
  savedQueriesPanelContent.includes('Saved Queries'),
  'displays "Saved Queries" header'
);
assert(
  savedQueriesPanelContent.includes('Export JSON'),
  'has Export JSON button'
);
assert(
  savedQueriesPanelContent.includes('Import JSON'),
  'has Import JSON button'
);
assert(
  savedQueriesPanelContent.includes('type="file"'),
  'has file input for import'
);
assert(
  savedQueriesPanelContent.includes('accept=".json"'),
  'file input accepts .json files'
);
assert(
  savedQueriesPanelContent.includes('No saved queries'),
  'shows empty state message'
);
assert(
  savedQueriesPanelContent.includes('saved-query-item'),
  'renders query items with class'
);
assert(
  savedQueriesPanelContent.includes('saved-query-desc'),
  'renders description with class'
);
assert(
  savedQueriesPanelContent.includes('saved-query-level'),
  'renders level with class'
);
assert(
  savedQueriesPanelContent.includes('saved-query-usage'),
  'renders usage count with class'
);

// 9. Level select options
assert(
  savedQueriesPanelContent.includes('LogLevel.DEBUG'),
  'has DEBUG option in level select'
);
assert(
  savedQueriesPanelContent.includes('LogLevel.INFO'),
  'has INFO option in level select'
);
assert(
  savedQueriesPanelContent.includes('LogLevel.WARN'),
  'has WARN option in level select'
);
assert(
  savedQueriesPanelContent.includes('LogLevel.ERROR'),
  'has ERROR option in level select'
);
assert(
  savedQueriesPanelContent.includes('LogLevel.FATAL'),
  'has FATAL option in level select'
);

// 10. Query item display
assert(
  savedQueriesPanelContent.includes('q.name'),
  'displays query name'
);
assert(
  savedQueriesPanelContent.includes('q.description'),
  'displays query description'
);
assert(
  savedQueriesPanelContent.includes('q.minLevel'),
  'displays query minLevel'
);
assert(
  savedQueriesPanelContent.includes('q.usageCount'),
  'displays query usageCount'
);
assert(
  savedQueriesPanelContent.includes('key={q.id}'),
  'uses query id as React key'
);

// ─── App integration tests ──────────────────────────────────────────────────

section('App integration with SavedQueriesPanel');

const appPath = path.resolve(uiDir, 'src/App.tsx');
const appContent = fs.readFileSync(appPath, 'utf-8');

// 1. Import
assert(
  appContent.includes("import { SavedQueriesPanel } from './components/SavedQueriesPanel'"),
  'App imports SavedQueriesPanel'
);

// 2. State
assert(
  appContent.includes('savedQueries: SavedQuery[]'),
  'App has savedQueries in AppState interface'
);
assert(
  appContent.includes('savedQueries: []'),
  'App initializes savedQueries as empty array'
);

// 3. Handler
assert(
  appContent.includes('handleSavedQueriesChange'),
  'App has handleSavedQueriesChange callback'
);
assert(
  appContent.includes('queries: SavedQuery[]'),
  'handleSavedQueriesChange accepts SavedQuery[]'
);

// 4. Render
assert(
  appContent.includes('<SavedQueriesPanel'),
  'App renders SavedQueriesPanel component'
);
assert(
  appContent.includes('queries={state.savedQueries}'),
  'passes savedQueries to component'
);
assert(
  appContent.includes('onChange={handleSavedQueriesChange}'),
  'passes onChange handler to component'
);

// 5. Toolbar placement
assert(
  appContent.includes('app-toolbar'),
  'SavedQueriesPanel is in the toolbar area'
);

// ─── Core SavedQueriesManager tests ─────────────────────────────────────────

section('SavedQueriesManager (core)');

let tmpDir;
beforeAllTests(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'saved-queries-test-'));
});

afterAllTests(() => {
  try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
});

function beforeAllTests(fn) { fn(); }
function afterAllTests(fn) { fn(); }

// 1. Create query
const q1 = new SavedQueriesManager({
  filePath: join(tmpDir, 'q1.json'),
});
assert(q1.getCount() === 0, 'starts with 0 queries');

const created = q1.createQuery('Errors Only', {
  description: 'Show only errors',
  minLevel: LogLevel.ERROR,
  pattern: 'error',
});
assert(created.id.length > 0, 'creates query with id');
assert(created.name === 'Errors Only', 'sets name');
assert(created.description === 'Show only errors', 'sets description');
assert(created.minLevel === LogLevel.ERROR, 'sets minLevel');
assert(created.pattern === 'error', 'sets pattern');
assert(created.usageCount === 1, 'initializes usageCount to 1');
assert(created.createdAt > 0, 'sets createdAt');
assert(created.lastUsedAt > 0, 'sets lastUsedAt');
assert(q1.getCount() === 1, 'count is 1 after create');

// 2. Create with highlight patterns
const q2 = new SavedQueriesManager({
  filePath: join(tmpDir, 'q2.json'),
});
const created2 = q2.createQuery('Highlighted', {
  highlightPatterns: [
    { name: 'Critical', regex: 'CRITICAL', color: '#ff0000' },
  ],
});
assert(created2.highlightPatterns.length === 1, 'sets highlightPatterns');
assert(created2.highlightPatterns[0].name === 'Critical', 'highlight name preserved');

// 3. Get query
const found = q1.getQuery(created.id);
assert(found !== undefined, 'getQuery returns the query');
assert(found.name === 'Errors Only', 'getQuery returns correct name');

// 4. Get non-existent
assert(q1.getQuery('nonexistent') === undefined, 'getQuery returns undefined for missing id');

// 5. Update query
const updated = q1.updateQuery(created.id, { name: 'Updated Name' });
assert(updated !== undefined, 'updateQuery returns updated query');
assert(updated.name === 'Updated Name', 'name is updated');
assert(updated.usageCount === 1, 'usageCount is preserved');

// 6. Update non-existent
assert(q1.updateQuery('nonexistent', { name: 'X' }) === undefined, 'updateQuery returns undefined for missing id');

// 7. Delete query
const q3 = new SavedQueriesManager({
  filePath: join(tmpDir, 'q3.json'),
});
const qa = q3.createQuery('A');
const qb = q3.createQuery('B');
assert(q3.getCount() === 2, 'has 2 queries');
assert(q3.deleteQuery(qa.id) === true, 'deleteQuery returns true');
assert(q3.getCount() === 1, 'count is 1 after delete');
assert(q3.getQuery(qa.id) === undefined, 'deleted query is gone');
assert(q3.deleteQuery('nonexistent') === false, 'deleteQuery returns false for missing id');

// 8. Record usage
const q4 = new SavedQueriesManager({
  filePath: join(tmpDir, 'q4.json'),
});
const qc = q4.createQuery('Used');
const originalLastUsed = qc.lastUsedAt;
assert(qc.usageCount === 1, 'initial usageCount is 1');
// Ensure time difference for lastUsedAt comparison
await new Promise(r => setTimeout(r, 2));
q4.recordUsage(qc.id);
const afterUsage = q4.getQuery(qc.id);
assert(afterUsage.usageCount === 2, 'usageCount incremented');
assert(afterUsage.lastUsedAt > originalLastUsed, 'lastUsedAt updated');

// 9. Record non-existent
assert(q4.recordUsage('nonexistent') === false, 'recordUsage returns false for missing id');

// 10. Get filter options
const q5 = new SavedQueriesManager({
  filePath: join(tmpDir, 'q5.json'),
});
const qd = q5.createQuery('Filter Query', {
  minLevel: LogLevel.WARN,
  pattern: 'timeout',
  timeStart: '2024-01-01T00:00',
  timeEnd: '2024-12-31T23:59',
});
const filterOpts = q5.getFilterOptions(qd.id);
assert(filterOpts !== undefined, 'getFilterOptions returns options');
assert(filterOpts.minLevel === LogLevel.WARN, 'minLevel in filter options');
assert(filterOpts.pattern !== undefined, 'pattern in filter options');
assert(filterOpts.pattern.source === 'timeout', 'pattern regex source');
assert(filterOpts.timeStart !== undefined, 'timeStart in filter options');
assert(filterOpts.timeEnd !== undefined, 'timeEnd in filter options');

// 11. Invalid regex
const q6 = new SavedQueriesManager({
  filePath: join(tmpDir, 'q6.json'),
});
const qe = q6.createQuery('Bad Regex', { pattern: '[invalid' });
const badOpts = q6.getFilterOptions(qe.id);
assert(badOpts !== undefined, 'getFilterOptions returns options for invalid regex');
assert(badOpts.pattern === undefined, 'invalid regex is skipped');

// 12. Search by name
const q7 = new SavedQueriesManager({
  filePath: join(tmpDir, 'q7.json'),
});
q7.createQuery('Error Handler');
q7.createQuery('Warning Logger');
q7.createQuery('Error Detector');
const searchResults = q7.searchByName('Error');
assert(searchResults.length === 2, 'searchByName finds matching queries');

const searchLower = q7.searchByName('error');
assert(searchLower.length === 2, 'searchByName is case-insensitive');

const noMatch = q7.searchByName('xyz');
assert(noMatch.length === 0, 'searchByName returns empty for no match');

// 13. History
const q8 = new SavedQueriesManager({
  filePath: join(tmpDir, 'q8.json'),
});
const qh1 = q8.createQuery('First');
const qh2 = q8.createQuery('Second');
const qh3 = q8.createQuery('Third');
q8.recordUsage(qh3.id);
q8.recordUsage(qh1.id);
const history = q8.getHistory();
assert(history.includes(qh3.id), 'history includes all queries');
assert(history.includes(qh1.id), 'history includes all queries');
assert(history[0] === qh1.id, 'most recently used is first');

// 14. History trim
const q9 = new SavedQueriesManager({
  filePath: join(tmpDir, 'q9.json'),
  maxHistory: 3,
});
for (let i = 0; i < 10; i++) {
  q9.createQuery(`Query ${i}`);
}
assert(q9.getHistory().length === 3, 'history trimmed to maxHistory');

// 15. Export JSON
const q10 = new SavedQueriesManager({
  filePath: join(tmpDir, 'q10.json'),
});
q10.createQuery('Exported 1', { minLevel: LogLevel.ERROR });
q10.createQuery('Exported 2', { minLevel: LogLevel.WARN });
const json = q10.exportJSON();
const parsed = JSON.parse(json);
assert(Array.isArray(parsed), 'exportJSON returns array');
assert(parsed.length === 2, 'exportJSON has correct count');

// 16. Import JSON
const q11 = new SavedQueriesManager({
  filePath: join(tmpDir, 'q11.json'),
});
const importResult = q11.importJSON(JSON.stringify([
  { id: 'imp1', name: 'Imported 1', createdAt: Date.now(), lastUsedAt: Date.now(), usageCount: 0 },
  { id: 'imp2', name: 'Imported 2', createdAt: Date.now(), lastUsedAt: Date.now(), usageCount: 0 },
]));
assert(importResult.imported === 2, 'importJSON imports correct count');
assert(importResult.errors === 0, 'importJSON has no errors');
assert(q11.getCount() === 2, 'count is 2 after import');

// 17. Invalid JSON import
const q12 = new SavedQueriesManager({
  filePath: join(tmpDir, 'q12.json'),
});
const invalidResult = q12.importJSON('not json');
assert(invalidResult.imported === 0, 'invalid JSON returns 0 imported');
assert(invalidResult.errors === 1, 'invalid JSON returns 1 error');

// 18. Non-array JSON import
const q13 = new SavedQueriesManager({
  filePath: join(tmpDir, 'q13.json'),
});
const nonArrayResult = q13.importJSON(JSON.stringify({ not: 'array' }));
assert(nonArrayResult.imported === 0, 'non-array JSON returns 0 imported');
assert(nonArrayResult.errors === 1, 'non-array JSON returns 1 error');

// 19. Partial import (some valid, some invalid entries)
const q14 = new SavedQueriesManager({
  filePath: join(tmpDir, 'q14.json'),
});
const partialResult = q14.importJSON(JSON.stringify([
  { id: 'valid', name: 'Valid', createdAt: Date.now(), lastUsedAt: Date.now(), usageCount: 0 },
  { id: 'invalid', createdAt: Date.now(), lastUsedAt: Date.now(), usageCount: 0 }, // missing name
]));
assert(partialResult.imported === 1, 'partial import imports valid entries');
assert(partialResult.errors === 1, 'partial import counts invalid entries');

// 20. Overwrite on import
const q15 = new SavedQueriesManager({
  filePath: join(tmpDir, 'q15.json'),
});
const original = q15.createQuery('Original');
q15.importJSON(JSON.stringify([
  { id: original.id, name: 'Overwritten', createdAt: Date.now(), lastUsedAt: Date.now(), usageCount: 0 },
]));
const overwritten = q15.getQuery(original.id);
assert(overwritten.name === 'Overwritten', 'import overwrites existing query');

// 21. Export to file
const q16 = new SavedQueriesManager({
  filePath: join(tmpDir, 'q16.json'),
});
q16.createQuery('File Export', { minLevel: LogLevel.WARN });
const exportPath = join(tmpDir, 'export.json');
assert(q16.exportToFile(exportPath) === true, 'exportToFile returns true');
assert(fs.existsSync(exportPath), 'export file exists');

// 22. Import from file
const importFilePath = join(tmpDir, 'import.json');
writeFileSync(importFilePath, JSON.stringify([
  { id: 'file_imp', name: 'File Imported', createdAt: Date.now(), lastUsedAt: Date.now(), usageCount: 0 },
]));
const fileImportResult = q16.importFromFile(importFilePath);
assert(fileImportResult.imported === 1, 'importFromFile imports correctly');
assert(fileImportResult.errors === 0, 'importFromFile has no errors');

// 23. Non-existent file import
const missingResult = q16.importFromFile(join(tmpDir, 'nonexistent.json'));
assert(missingResult.imported === 0, 'missing file import returns 0');
assert(missingResult.errors === 1, 'missing file import returns 1 error');

// 24. Clear
const q17 = new SavedQueriesManager({
  filePath: join(tmpDir, 'q17.json'),
});
q17.createQuery('A');
q17.createQuery('B');
assert(q17.getCount() === 2, 'has 2 queries before clear');
q17.clear();
assert(q17.getCount() === 0, 'count is 0 after clear');
assert(q17.getHistory().length === 0, 'history is empty after clear');

// 25. getAllQueries sorting
const q18 = new SavedQueriesManager({
  filePath: join(tmpDir, 'q18.json'),
});
const qs1 = q18.createQuery('First');
// Use a small delay to ensure different timestamps
await new Promise(r => setTimeout(r, 10));
const qs2 = q18.createQuery('Second');
const all = q18.getAllQueries();
assert(all[0].id === qs2.id, 'getAllQueries sorts by lastUsedAt desc');
assert(all[1].id === qs1.id, 'getAllQueries sorts by lastUsedAt desc');

// 26. Empty getAllQueries
const q19 = new SavedQueriesManager({
  filePath: join(tmpDir, 'q19.json'),
});
assert(q19.getAllQueries().length === 0, 'getAllQueries returns empty array');

// 27. Persistence: save and load
const q20 = new SavedQueriesManager({
  filePath: join(tmpDir, 'persist.json'),
});
const persistentQuery = q20.createQuery('Persistent', { minLevel: LogLevel.ERROR });
q20.save();

const q21 = new SavedQueriesManager({
  filePath: join(tmpDir, 'persist.json'),
});
q21.load();
assert(q21.getCount() === 1, 'loaded query count is 1');
assert(q21.getQuery(persistentQuery.id) !== undefined, 'loaded query found');

// 28. Load non-existent file
const q22 = new SavedQueriesManager({
  filePath: join(tmpDir, 'nonexistent_persist.json'),
});
q22.load();
assert(q22.getCount() === 0, 'load non-existent file starts empty');

// 29. Handle corrupted file
const corruptPath = join(tmpDir, 'corrupt.json');
writeFileSync(corruptPath, 'not valid json');
const q23 = new SavedQueriesManager({
  filePath: corruptPath,
});
q23.load();
assert(q23.getCount() === 0, 'load corrupted file starts empty');

// 30. Round-trip export/import preserves data
const q24 = new SavedQueriesManager({
  filePath: join(tmpDir, 'roundtrip.json'),
});
q24.createQuery('Round Trip', {
  description: 'Test description',
  minLevel: LogLevel.ERROR,
  pattern: 'timeout',
  highlightPatterns: [{ name: 'H1', regex: 'test', color: '#00ff00' }],
});
const rtJson = q24.exportJSON();
const rtParsed = JSON.parse(rtJson);
assert(rtParsed[0].name === 'Round Trip', 'round-trip preserves name');
assert(rtParsed[0].description === 'Test description', 'round-trip preserves description');
assert(rtParsed[0].minLevel === LogLevel.ERROR, 'round-trip preserves minLevel');
assert(rtParsed[0].pattern === 'timeout', 'round-trip preserves pattern');
assert(rtParsed[0].highlightPatterns.length === 1, 'round-trip preserves highlightPatterns');
assert(rtParsed[0].highlightPatterns[0].name === 'H1', 'round-trip preserves highlight name');

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('Some tests failed!');
  process.exit(1);
} else {
  console.log('All SavedQueriesPanel tests passed!');
  process.exit(0);
}
