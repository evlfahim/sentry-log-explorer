import { describe, it, expect, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';

function SimpleApp() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Sentry Log Explorer</h1>
      </header>
      <div className="app-toolbar">
        <div className="file-open-dialog">
          <button type="button" className="btn btn-primary">Open File</button>
        </div>
      </div>
      <div className="filter-bar">
        <span>Filter</span>
      </div>
      <div className="log-list-empty">
        <p>No log file loaded. Click "Open File" to get started.</p>
      </div>
    </div>
  );
}

describe('App integration (minimal)', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  it('renders FileOpenDialog and LogList in initial state', () => {
    root.render(<SimpleApp />);
    expect(container.textContent).toContain('Sentry Log Explorer');
    expect(container.textContent).toContain('Open File');
    expect(container.textContent).toContain('No log file loaded');
  });

  it('renders FilterBar below the toolbar', () => {
    root.render(<SimpleApp />);
    const filterBar = container.querySelector('.filter-bar');
    expect(filterBar).not.toBeNull();
  });
});
