import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';

// Mock the core module BEFORE importing App to prevent hangs
vi.mock('core', () => ({
  LogParser: class LogParser {
    parseLine(line: string, lineNumber: number) {
      return {
        lineNumber,
        message: line,
        level: line.includes('ERROR') ? 'ERROR' : line.includes('WARN') ? 'WARN' : line.includes('INFO') ? 'INFO' : 'UNKNOWN',
        rawTimestamp: line.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)?.[0] || '',
      };
    }
    filterByLevel(lines: any[], level: string) {
      return lines.filter((l: any) => l.level === level);
    }
    filterByTimeRange(lines: any[], start: Date, end: Date) {
      return lines;
    }
    filterByPattern(lines: any[], pattern: RegExp) {
      return lines.filter((l: any) => pattern.test(l.message));
    }
  },
  PatternHighlighter: class PatternHighlighter {
    static getLevelColor(level: string) {
      return { color: '#333' };
    }
    setPatterns() {}
    highlightLines() {
      return [];
    }
  },
  LogLevel: {
    UNKNOWN: 'UNKNOWN',
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    FATAL: 'FATAL',
  },
}));

// Now import App after mocking core
import App from './App';

describe('App integration', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.restoreAllMocks();
  });

  it('renders FileOpenDialog and LogList in initial state', () => {
    root.render(<App />);
    expect(container.textContent).toContain('Sentry Log Explorer');
    expect(container.textContent).toContain('Open File');
    expect(container.textContent).toContain('No log file loaded');
  });

  it('renders log rows after file is opened', async () => {
    const mockFileContent =
      '2024-01-01 10:00:00 INFO Hello world\n2024-01-01 10:00:01 ERROR Something failed';

    // Mock FileReader so it resolves synchronously with our content
    class MockFileReader {
      onload: ((e: ProgressEvent<FileReader>) => void) | null = null;
      onerror: (() => void) | null = null;
      onprogress: ((e: ProgressEvent<FileReader>) => void) | null = null;

      readAsText() {
        if (this.onload) {
          this.onload({ target: { result: mockFileContent } } as ProgressEvent<FileReader>);
        }
      }
    }
    vi.spyOn(globalThis, 'FileReader' as any).mockImplementation(() => new MockFileReader());

    root.render(<App />);

    // Click the Open File button to focus the hidden file input
    const openButton = container.querySelector('button.btn-primary');
    expect(openButton).not.toBeNull();
    openButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Get the hidden file input and simulate a file selection
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    const file = new File([mockFileContent], 'test.log', { type: 'text/plain' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput!.files = dataTransfer.files;

    // Trigger the change event that fires the onFileOpen callback
    fileInput!.dispatchEvent(new Event('change', { bubbles: true }));

    // Flush React state updates (FileReader.onload → setState → re-render)
    await Promise.resolve();
    await Promise.resolve();

    // Verify the log list now shows parsed content
    expect(container.textContent).toContain('Hello world');
    expect(container.textContent).toContain('Something failed');
    expect(container.textContent).toContain('test.log');
  });

  it('shows error banner when file reading fails', async () => {
    // Mock FileReader to trigger error
    class MockFileReader {
      onload: ((e: ProgressEvent<FileReader>) => void) | null = null;
      onerror: (() => void) | null = null;
      onprogress: ((e: ProgressEvent<FileReader>) => void) | null = null;

      readAsText() {
        if (this.onerror) {
          this.onerror();
        }
      }
    }
    vi.spyOn(globalThis, 'FileReader' as any).mockImplementation(() => new MockFileReader());

    root.render(<App />);

    const openButton = container.querySelector('button.btn-primary');
    openButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'test.log', { type: 'text/plain' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput!.files = dataTransfer.files;

    fileInput!.dispatchEvent(new Event('change', { bubbles: true }));

    await Promise.resolve();
    await Promise.resolve();

    expect(container.textContent).toContain('Failed to read file');
  });
});
