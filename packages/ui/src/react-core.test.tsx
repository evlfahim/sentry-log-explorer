import { describe, it, expect } from 'vitest';
import { createRoot } from 'react-dom/client';
import { LogParser, LogLevel } from 'core';

function SimpleComponent() {
  const parser = new LogParser();
  const line = parser.parseLine('2024-01-01 10:00:00 INFO Hello', 1);
  return <div data-level={line.level}>{line.message}</div>;
}

describe('react with core import', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  it('renders a component that imports from core', () => {
    root.render(<SimpleComponent />);
    expect(container.textContent).toBe('Hello');
    const div = container.querySelector('div');
    expect(div?.getAttribute('data-level')).toBe('INFO');
  });
});
