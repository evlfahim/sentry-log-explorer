#!/usr/bin/env node
/**
 * FilterBar unit tests using happy-dom directly.
 * Tests the actual React component rendering without vitest.
 */
import { JSDOM } from 'jsdom';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { FilterBar } from '../src/components/FilterBar.tsx';
import { LogLevel } from '../src/highlighter.tsx';

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

function setupDOM() {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost',
  });
  global.document = dom.window.document;
  global.window = dom.window;
  return dom;
}

console.log('FilterBar unit tests (happy-dom):');
console.log('');

// Test 1: Renders level select
console.log('1. Renders level select dropdown');
{
  const dom = setupDOM();
  const onFilterChange = () => {};
  const onHighlightPatternsChange = () => {};
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(FilterBar, { onFilterChange, onHighlightPatternsChange }));
  const select = document.querySelector('select');
  assert(select !== null, 'select element exists');
  const options = select.querySelectorAll('option');
  assert(options.length >= 8, `select has ${options.length} options (expected >= 8)`);
  root.unmount();
}
console.log('');

// Test 2: Level select has correct options
console.log('2. Level select has all log level options');
{
  const dom = setupDOM();
  const onFilterChange = () => {};
  const onHighlightPatternsChange = () => {};
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(FilterBar, { onFilterChange, onHighlightPatternsChange }));
  const select = document.querySelector('select');
  const values = Array.from(select.querySelectorAll('option')).map(o => o.value);
  assert(values.includes(''), 'has "All" option');
  assert(values.includes(LogLevel.DEBUG), 'has DEBUG option');
  assert(values.includes(LogLevel.INFO), 'has INFO option');
  assert(values.includes(LogLevel.WARN), 'has WARN option');
  assert(values.includes(LogLevel.WARNING), 'has WARNING option');
  assert(values.includes(LogLevel.ERROR), 'has ERROR option');
  assert(values.includes(LogLevel.FATAL), 'has FATAL option');
  assert(values.includes(LogLevel.TRACE), 'has TRACE option');
  root.unmount();
}
console.log('');

// Test 3: Renders datetime-local inputs
console.log('3. Renders datetime-local inputs for time range');
{
  const dom = setupDOM();
  const onFilterChange = () => {};
  const onHighlightPatternsChange = () => {};
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(FilterBar, { onFilterChange, onHighlightPatternsChange }));
  const inputs = document.querySelectorAll('input[type="datetime-local"]');
  assert(inputs.length === 2, `has 2 datetime-local inputs, found ${inputs.length}`);
  root.unmount();
}
console.log('');

// Test 4: Renders pattern input
console.log('4. Renders pattern filter input');
{
  const dom = setupDOM();
  const onFilterChange = () => {};
  const onHighlightPatternsChange = () => {};
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(FilterBar, { onFilterChange, onHighlightPatternsChange }));
  const patternInput = document.querySelector('input[placeholder="Regex pattern..."]');
  assert(patternInput !== null, 'pattern input exists');
  root.unmount();
}
console.log('');

// Test 5: Apply Filter button exists
console.log('5. Apply Filter button exists');
{
  const dom = setupDOM();
  const onFilterChange = () => {};
  const onHighlightPatternsChange = () => {};
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(FilterBar, { onFilterChange, onHighlightPatternsChange }));
  const btn = document.querySelector('button');
  assert(btn !== null, 'button exists');
  assert(btn.textContent === 'Apply Filter', 'button text is "Apply Filter"');
  root.unmount();
}
console.log('');

// Test 6: Level change triggers onFilterChange
console.log('6. Level change triggers onFilterChange');
{
  const dom = setupDOM();
  let calledWith = null;
  const onFilterChange = (...args) => { calledWith = args; };
  const onHighlightPatternsChange = () => {};
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(FilterBar, { onFilterChange, onHighlightPatternsChange }));
  const select = document.querySelector('select');
  select.value = LogLevel.ERROR;
  select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  const btn = document.querySelector('button');
  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert(calledWith !== null, 'onFilterChange was called');
  assert(calledWith[0] === LogLevel.ERROR, `level is ERROR, got ${calledWith[0]}`);
  assert(calledWith[1] === '', `timeStart is empty, got ${calledWith[1]}`);
  assert(calledWith[2] === '', `timeEnd is empty, got ${calledWith[2]}`);
  assert(calledWith[3] === '', `pattern is empty, got ${calledWith[3]}`);
  root.unmount();
}
console.log('');

// Test 7: Time inputs trigger onFilterChange
console.log('7. Time inputs trigger onFilterChange');
{
  const dom = setupDOM();
  let calledWith = null;
  const onFilterChange = (...args) => { calledWith = args; };
  const onHighlightPatternsChange = () => {};
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(FilterBar, { onFilterChange, onHighlightPatternsChange }));
  const inputs = document.querySelectorAll('input[type="datetime-local"]');
  inputs[0].value = '2024-01-01T00:00';
  inputs[0].dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  inputs[1].value = '2024-12-31T23:59';
  inputs[1].dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  const btn = document.querySelector('button');
  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert(calledWith[1] === '2024-01-01T00:00', `timeStart is correct`);
  assert(calledWith[2] === '2024-12-31T23:59', `timeEnd is correct`);
  root.unmount();
}
console.log('');

// Test 8: Pattern input triggers onFilterChange
console.log('8. Pattern input triggers onFilterChange');
{
  const dom = setupDOM();
  let calledWith = null;
  const onFilterChange = (...args) => { calledWith = args; };
  const onHighlightPatternsChange = () => {};
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(FilterBar, { onFilterChange, onHighlightPatternsChange }));
  const patternInput = document.querySelector('input[placeholder="Regex pattern..."]');
  patternInput.value = 'ERROR|FATAL';
  patternInput.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  const btn = document.querySelector('button');
  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert(calledWith[3] === 'ERROR|FATAL', `pattern is correct`);
  root.unmount();
}
console.log('');

// Test 9: Combined filter values
console.log('9. Combined filter values are passed correctly');
{
  const dom = setupDOM();
  let calledWith = null;
  const onFilterChange = (...args) => { calledWith = args; };
  const onHighlightPatternsChange = () => {};
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(FilterBar, { onFilterChange, onHighlightPatternsChange }));
  const select = document.querySelector('select');
  select.value = LogLevel.WARN;
  select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  const inputs = document.querySelectorAll('input[type="datetime-local"]');
  inputs[0].value = '2024-06-01T10:00';
  inputs[0].dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  inputs[1].value = '2024-06-01T12:00';
  inputs[1].dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  const patternInput = document.querySelector('input[placeholder="Regex pattern..."]');
  patternInput.value = 'timeout';
  patternInput.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  const btn = document.querySelector('button');
  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert(calledWith[0] === LogLevel.WARN, `level is WARN`);
  assert(calledWith[1] === '2024-06-01T10:00', `timeStart is correct`);
  assert(calledWith[2] === '2024-06-01T12:00', `timeEnd is correct`);
  assert(calledWith[3] === 'timeout', `pattern is correct`);
  root.unmount();
}
console.log('');

// Test 10: Highlight pattern input exists
console.log('10. Highlight pattern input exists');
{
  const dom = setupDOM();
  const onFilterChange = () => {};
  const onHighlightPatternsChange = () => {};
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(FilterBar, { onFilterChange, onHighlightPatternsChange }));
  const highlightInput = document.querySelector('input[placeholder="Regex..."]');
  assert(highlightInput !== null, 'highlight pattern input exists');
  root.unmount();
}
console.log('');

// Test 11: Add highlight button works
console.log('11. Add highlight button works');
{
  const dom = setupDOM();
  let calledWith = null;
  const onFilterChange = () => {};
  const onHighlightPatternsChange = (...args) => { calledWith = args; };
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(FilterBar, { onFilterChange, onHighlightPatternsChange }));
  const highlightInput = document.querySelector('input[placeholder="Regex..."]');
  highlightInput.value = 'ERROR';
  const addBtn = document.querySelectorAll('button')[1]; // second button is the + button
  addBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert(calledWith !== null, 'onHighlightPatternsChange was called');
  assert(calledWith[0].length === 1, `has 1 pattern, got ${calledWith[0].length}`);
  assert(calledWith[0][0].name === 'Custom: ERROR', `pattern name is correct`);
  root.unmount();
}
console.log('');

// Test 12: Remove highlight button works
console.log('12. Remove highlight button works');
{
  const dom = setupDOM();
  let callCount = 0;
  let lastPatterns = null;
  const onFilterChange = () => {};
  const onHighlightPatternsChange = (...args) => { callCount++; lastPatterns = args[0]; };
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(FilterBar, { onFilterChange, onHighlightPatternsChange }));
  // Add a pattern
  const highlightInput = document.querySelector('input[placeholder="Regex..."]');
  highlightInput.value = 'ERROR';
  const addBtn = document.querySelectorAll('button')[1];
  addBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert(callCount === 1, 'pattern added');
  // Remove it
  const removeBtns = document.querySelectorAll('button');
  // The remove button is the last one (×)
  const removeBtn = removeBtns[removeBtns.length - 1];
  removeBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert(callCount === 2, 'remove was called');
  assert(lastPatterns.length === 0, `no patterns after removal, got ${lastPatterns.length}`);
  root.unmount();
}
console.log('');

// Test 13: Empty highlight pattern is not added
console.log('13. Empty highlight pattern is not added');
{
  const dom = setupDOM();
  let callCount = 0;
  const onFilterChange = () => {};
  const onHighlightPatternsChange = () => { callCount++; };
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(FilterBar, { onFilterChange, onHighlightPatternsChange }));
  const addBtn = document.querySelectorAll('button')[1];
  addBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert(callCount === 0, 'onHighlightPatternsChange was not called for empty pattern');
  root.unmount();
}
console.log('');

// Test 14: Invalid regex is not added
console.log('14. Invalid regex is not added');
{
  const dom = setupDOM();
  let callCount = 0;
  const onFilterChange = () => {};
  const onHighlightPatternsChange = () => { callCount++; };
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(FilterBar, { onFilterChange, onHighlightPatternsChange }));
  const highlightInput = document.querySelector('input[placeholder="Regex..."]');
  highlightInput.value = '[invalid';
  const addBtn = document.querySelectorAll('button')[1];
  addBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert(callCount === 0, 'onHighlightPatternsChange was not called for invalid regex');
  root.unmount();
}
console.log('');

// Summary
console.log('');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All FilterBar unit tests passed!');
  process.exit(0);
}
