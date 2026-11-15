import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';

describe('minimal dom', () => {
  it('creates a jsdom', () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app">Hello</div></body></html>');
    const doc = dom.window.document;
    expect(doc.querySelector('#app')?.textContent).toBe('Hello');
  });
});
