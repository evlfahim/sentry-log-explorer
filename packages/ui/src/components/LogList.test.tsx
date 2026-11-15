import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LogList } from './LogList';
import type { ParsedLogLine } from 'core';

// The `LogLevel` exported from 'core' is the highlighter's enum, not the parser enum used by
// ParsedLogLine, so build levels from their (identical) string values instead.
const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as unknown as Record<'DEBUG' | 'INFO' | 'WARN' | 'ERROR', ParsedLogLine['level']>;

function makeLine(
  lineNumber: number,
  level: ParsedLogLine['level'],
  rawTimestamp: string,
  message: string
): ParsedLogLine {
  return {
    lineNumber,
    rawLine: `${rawTimestamp} ${level} ${message}`,
    timestamp: new Date(rawTimestamp.replace(' ', 'T')),
    level,
    message,
    rawTimestamp,
    rawLevel: level,
  };
}

const mockLines: ParsedLogLine[] = [
  makeLine(1, LogLevel.INFO, '2024-01-01 10:00:00', 'Application started'),
  makeLine(2, LogLevel.WARN, '2024-01-01 10:00:01', 'Low memory warning'),
  makeLine(3, LogLevel.ERROR, '2024-01-01 10:00:02', 'Connection failed'),
];

const mockRawLines: string[] = mockLines.map((l) => l.rawLine);

const defaultProps = {
  lines: mockLines,
  rawLines: mockRawLines,
  fileLoaded: true,
  highlightPatterns: [],
  followMode: false,
  followPaused: false,
  onFollowLinesUpdate: vi.fn(),
};

function makeManyLines(count: number): ParsedLogLine[] {
  return Array.from({ length: count }, (_, i) =>
    makeLine(i + 1, LogLevel.INFO, '2024-01-01 10:00:00', `Message ${i + 1}`)
  );
}

describe('LogList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a list of LogRow components when file is loaded', () => {
    const { container } = render(<LogList {...defaultProps} />);

    const rows = container.querySelectorAll('.log-row');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveAttribute('data-line', '1');
    expect(rows[1]).toHaveAttribute('data-line', '2');
    expect(rows[2]).toHaveAttribute('data-line', '3');
  });

  it('renders each LogRow with number, timestamp, level and message', () => {
    const { container } = render(<LogList {...defaultProps} />);
    const firstRow = container.querySelector('.log-row')!;

    expect(firstRow.querySelector('.log-row-number')).toHaveTextContent('1');
    expect(firstRow.querySelector('.log-row-timestamp')).toHaveTextContent('2024-01-01 10:00:00');
    expect(firstRow.querySelector('.log-row-level')).toHaveTextContent('INFO');
    expect(firstRow.querySelector('.log-row-content')).toHaveTextContent('Application started');
  });

  it('renders LogRow components with line numbers taken from ParsedLogLine', () => {
    const customLines = [
      makeLine(100, LogLevel.DEBUG, '2024-01-01 12:00:00', 'Debug message'),
      makeLine(200, LogLevel.INFO, '2024-01-01 12:00:01', 'Info message'),
    ];
    const { container } = render(
      <LogList {...defaultProps} lines={customLines} rawLines={customLines.map((l) => l.rawLine)} />
    );
    const rows = container.querySelectorAll('.log-row');
    expect(rows[0]).toHaveAttribute('data-line', '100');
    expect(rows[1]).toHaveAttribute('data-line', '200');
  });

  it('shows "No log file loaded" message when fileLoaded is false', () => {
    const { container } = render(<LogList {...defaultProps} fileLoaded={false} />);
    expect(screen.getByText(/no log file loaded/i)).toBeInTheDocument();
    expect(container.querySelector('.log-list-empty')).toBeInTheDocument();
    expect(container.querySelectorAll('.log-row')).toHaveLength(0);
  });

  it('renders the footer with line counts', () => {
    render(<LogList {...defaultProps} />);
    expect(screen.getByText(/showing 3 of 3 lines/i)).toBeInTheDocument();
  });

  it('renders footer with different counts for filtered results', () => {
    render(<LogList {...defaultProps} lines={[mockLines[0]]} />);
    expect(screen.getByText(/showing 1 of 3 lines/i)).toBeInTheDocument();
  });

  it('renders "No lines match the current filters" when lines is empty but rawLines has content', () => {
    render(<LogList {...defaultProps} lines={[]} />);
    expect(screen.getByText(/no lines match the current filters/i)).toBeInTheDocument();
  });

  it('renders "File is empty" when both lines and rawLines are empty', () => {
    render(<LogList {...defaultProps} lines={[]} rawLines={[]} />);
    expect(screen.getByText(/file is empty/i)).toBeInTheDocument();
  });

  it('does not render the no-lines message when lines has content', () => {
    const { container } = render(<LogList {...defaultProps} />);
    expect(container.querySelector('.log-list-no-lines')).toBeNull();
  });

  describe('virtual scrolling', () => {
    const manyLines = makeManyLines(1000);
    const manyRawLines = manyLines.map((l) => l.rawLine);

    it('sizes the viewport to the full list height (24px per row)', () => {
      const { container } = render(<LogList {...defaultProps} lines={manyLines} rawLines={manyRawLines} />);
      const viewport = container.querySelector('.log-list-viewport') as HTMLElement;
      expect(viewport.style.height).toBe('24000px');
    });

    it('only renders the visible window of rows, not all of them', () => {
      const { container } = render(<LogList {...defaultProps} lines={manyLines} rawLines={manyRawLines} />);
      const rows = container.querySelectorAll('.log-row');
      // 600px default viewport / 24px rows = 25 rows, plus a 20-row buffer below.
      expect(rows).toHaveLength(45);
      expect(rows[0]).toHaveAttribute('data-line', '1');
      expect(screen.getByText(/showing 1000 of 1000 lines/i)).toBeInTheDocument();
    });

    it('renders a different window of rows after scrolling', () => {
      const { container } = render(<LogList {...defaultProps} lines={manyLines} rawLines={manyRawLines} />);
      const scroller = container.querySelector('.log-list-container') as HTMLElement;

      // jsdom does not do layout, so set scrollTop directly before firing the scroll event.
      Object.defineProperty(scroller, 'scrollTop', { value: 2400, writable: true, configurable: true });
      fireEvent.scroll(scroller);

      const rows = container.querySelectorAll('.log-row');
      // scrollTop 2400 -> first visible index 100, minus 20 buffer = index 80 (line 81);
      // last index = ceil((2400 + 600) / 24) + 20 = 145 (exclusive).
      expect(rows).toHaveLength(65);
      expect(rows[0]).toHaveAttribute('data-line', '81');
      expect(rows[rows.length - 1]).toHaveAttribute('data-line', '145');

      const offsetWrapper = rows[0].parentElement as HTMLElement;
      expect(offsetWrapper.style.transform).toBe('translateY(1920px)');
    });
  });

  describe('follow mode', () => {
    it('reports newly appended lines while following', () => {
      const onFollowLinesUpdate = vi.fn();
      const { rerender } = render(
        <LogList {...defaultProps} followMode onFollowLinesUpdate={onFollowLinesUpdate} />
      );
      onFollowLinesUpdate.mockClear();

      const appended = [...mockLines, makeLine(4, LogLevel.INFO, '2024-01-01 10:00:03', 'New line')];
      rerender(
        <LogList
          {...defaultProps}
          lines={appended}
          rawLines={appended.map((l) => l.rawLine)}
          followMode
          onFollowLinesUpdate={onFollowLinesUpdate}
        />
      );

      expect(onFollowLinesUpdate).toHaveBeenCalledWith(1);
    });

    it('does not report new lines while follow mode is paused', () => {
      const onFollowLinesUpdate = vi.fn();
      const { rerender } = render(
        <LogList {...defaultProps} followMode followPaused onFollowLinesUpdate={onFollowLinesUpdate} />
      );

      const appended = [...mockLines, makeLine(4, LogLevel.INFO, '2024-01-01 10:00:03', 'New line')];
      rerender(
        <LogList
          {...defaultProps}
          lines={appended}
          rawLines={appended.map((l) => l.rawLine)}
          followMode
          followPaused
          onFollowLinesUpdate={onFollowLinesUpdate}
        />
      );

      expect(onFollowLinesUpdate).not.toHaveBeenCalled();
    });
  });
});
