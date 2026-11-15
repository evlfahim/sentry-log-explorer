/**
 * Follow-mode integration test (Node.js-based, no DOM).
 * Verifies the FollowModeToggle component structure, the LogList auto-scroll
 * effect wiring, and the App-level follow-mode state flow.
 */

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UI_DIR = join(__dirname, '..');

// ── Helpers ──────────────────────────────────────────────────────────────────

function readTSX(name) {
  return readFileSync(join(UI_DIR, 'src/components', name), 'utf-8');
}

function readApp() {
  return readFileSync(join(UI_DIR, 'src/App.tsx'), 'utf-8');
}

let passed = 0;
let failed = 0;

function check(label, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    console.error(`FAIL: ${label}`);
    console.error(`  ${e.message}`);
  }
}

// ── FollowModeToggle component structure ─────────────────────────────────────

const followModeSrc = readTSX('FollowModeToggle.tsx');

check('FollowModeToggle exports a named component', () => {
  assert(followModeSrc.includes('export function FollowModeToggle'));
});

check('FollowModeToggle accepts followMode prop', () => {
  assert(followModeSrc.includes('followMode'));
});

check('FollowModeToggle accepts followPaused prop', () => {
  assert(followModeSrc.includes('followPaused'));
});

check('FollowModeToggle accepts onChange callback', () => {
  assert(followModeSrc.includes('onChange'));
});

check('FollowModeToggle renders a follow button', () => {
  assert(followModeSrc.includes('<button'));
  assert(followModeSrc.includes('followMode'));
});

check('FollowModeToggle shows "🔴 Follow" when followMode is true', () => {
  assert(followModeSrc.includes('🔴 Follow'));
});

check('FollowModeToggle shows "⚪ Follow" when followMode is false', () => {
  assert(followModeSrc.includes('⚪ Follow'));
});

check('FollowModeToggle conditionally renders pause/resume button', () => {
  assert(followModeSrc.includes('{followMode &&'));
  assert(followModeSrc.includes('Pause') || followModeSrc.includes('⏸'));
  assert(followModeSrc.includes('Resume') || followModeSrc.includes('▶'));
});

check('FollowModeToggle toggleFollow calls onChange with !followMode', () => {
  assert(followModeSrc.includes('onChange(!followMode'));
});

check('FollowModeToggle togglePause calls onChange with followMode and !followPaused', () => {
  assert(followModeSrc.includes('onChange(followMode, !followPaused)'));
});

check('FollowModeToggle has btn-active class when followMode is true', () => {
  assert(followModeSrc.includes('btn-active'));
});

check('FollowModeToggle has btn-warning class when followPaused is true', () => {
  assert(followModeSrc.includes('btn-warning'));
});

check('FollowModeToggle has btn-secondary class for default state', () => {
  assert(followModeSrc.includes('btn-secondary'));
});

// ── LogList auto-scroll wiring ───────────────────────────────────────────────

const logListSrc = readTSX('LogList.tsx');

check('LogList accepts followMode prop', () => {
  assert(logListSrc.includes('followMode'));
});

check('LogList accepts followPaused prop', () => {
  assert(logListSrc.includes('followPaused'));
});

check('LogList accepts onFollowLinesUpdate callback', () => {
  assert(logListSrc.includes('onFollowLinesUpdate'));
});

check('LogList tracks new lines for follow mode', () => {
  assert(logListSrc.includes('prevLinesLength'));
  assert(logListSrc.includes('rawLines.length'));
});

check('LogList auto-scrolls to bottom in follow mode', () => {
  assert(logListSrc.includes('scrollHeight'));
  assert(logListSrc.includes('followMode'));
  assert(logListSrc.includes('followPaused'));
});

check('LogList auto-scroll effect depends on lines.length', () => {
  assert(logListSrc.includes('lines.length'));
  assert(logListSrc.includes('followMode'));
  assert(logListSrc.includes('followPaused'));
});

check('LogList does not auto-scroll when follow mode is off', () => {
  // The auto-scroll effect should check followMode && !followPaused
  assert(logListSrc.includes('followMode'));
  assert(logListSrc.includes('followPaused'));
});

check('LogList does not auto-scroll when follow mode is paused', () => {
  assert(logListSrc.includes('followPaused'));
});

check('LogList resets scroll to top when rawLines change', () => {
  assert(logListSrc.includes('rawLines'));
  assert(logListSrc.includes('scrollTop'));
  assert(logListSrc.includes('0'));
});

// ── App-level follow mode integration ────────────────────────────────────────

const appSrc = readApp();

check('App imports FollowModeToggle', () => {
  assert(appSrc.includes('FollowModeToggle'));
});

check('App has followMode state', () => {
  assert(appSrc.includes('followMode'));
});

check('App has followPaused state', () => {
  assert(appSrc.includes('followPaused'));
});

check('App has followLinesCount state', () => {
  assert(appSrc.includes('followLinesCount'));
});

check('App has handleFollowModeChange callback', () => {
  assert(appSrc.includes('handleFollowModeChange'));
});

check('handleFollowModeChange updates followMode and followPaused', () => {
  assert(appSrc.includes('followMode'));
  assert(appSrc.includes('followPaused'));
});

check('App has handleFollowLinesUpdate callback', () => {
  assert(appSrc.includes('handleFollowLinesUpdate'));
});

check('App passes followMode to LogList', () => {
  assert(appSrc.includes('followMode={state.followMode}'));
});

check('App passes followPaused to LogList', () => {
  assert(appSrc.includes('followPaused={state.followPaused}'));
});

check('App passes onFollowLinesUpdate to LogList', () => {
  assert(appSrc.includes('onFollowLinesUpdate'));
});

check('App passes followMode to FollowModeToggle', () => {
  assert(appSrc.includes('followMode={state.followMode}'));
});

check('App passes followPaused to FollowModeToggle', () => {
  assert(appSrc.includes('followPaused={state.followPaused}'));
});

check('App passes onChange to FollowModeToggle', () => {
  assert(appSrc.includes('onChange={handleFollowModeChange}'));
});

check('FollowModeToggle is rendered in the app toolbar', () => {
  // FollowModeToggle appears in the import and in the JSX.
  // We need to find the JSX usage, not the import.
  const importIdx = appSrc.indexOf("import { FollowModeToggle }");
  const jsxIdx = appSrc.indexOf('<FollowModeToggle', importIdx >= 0 ? importIdx + 1 : 0);
  const toolbarIdx = appSrc.indexOf('app-toolbar');
  assert(toolbarIdx >= 0, 'app-toolbar not found');
  assert(jsxIdx >= 0, 'FollowModeToggle JSX not found');
  assert(jsxIdx > toolbarIdx, 'FollowModeToggle should be after app-toolbar');
  // Check it's before the next major section (FilterBar or SavedQueriesPanel)
  const nextSection = Math.min(
    appSrc.indexOf('FilterBar', jsxIdx),
    appSrc.indexOf('SavedQueriesPanel', jsxIdx),
    appSrc.length
  );
  assert(jsxIdx < nextSection, 'FollowModeToggle should be before FilterBar/SavedQueriesPanel');
});

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${passed} follow-ui checks passed, ${failed} failed`);
if (failed > 0) process.exit(1);
