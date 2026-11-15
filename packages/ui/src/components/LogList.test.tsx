import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LogList } from './LogList';
import type { ParsedLogLine } from 'core';

const mockLines: ParsedLogLine[] = [
  { lineNumber: 1, level: 'INFO', rawTimestamp: '2024-01-01 10:00:00', message: 'Application started' },
  { lineNumber: 2, level: 'WARN', rawTimestamp: '2024-01-01 10:00:01', message: 'Low memory warning' },
  { lineNumber: 3, level: 'ERROR', rawTimestamp: '2024-01-01 10:00:02', message: 'Connection failed' },
];

const mockRawLines: string[] = [
  '2024-01-01 10:00:00 INFO Application started',
  '2024-01-01 10:00:01 WARN Low memory warning',
  '2024-01-01 10:00:02 ERROR Connection failed',
];

const defaultProps = {
  lines: mockLines,
  rawLines: mockRawLines,
  fileLoaded: true,
  highlightPatterns: [],
  followMode: false,
  followPaused: false,
  onFollowLinesUpdate: vi.fn(),
};

describe('LogList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a list of LogRow components when file is loaded', () => {
    const { container } = render(<LogList {...defaultProps} />);

    // Each row should have a data-line attribute with the line number
    const rows = container.querySelectorAll('.log-row');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveAttribute('data-line', '1');
    expect(rows[1]).toHaveAttribute('data-line', '2');
    expect(rows[2]).toHaveAttribute('data-line', '3');
  });

  it('renders the correct number of rows matching the lines array length', () => {
    const { container } = render(<LogList {...defaultProps} />);
    const rows = container.querySelectorAll('.log-row');
    expect(rows).toHaveLength(mockLines.length);
  });

  it('shows "No log file loaded" message when fileLoaded is false', () => {
    render(<LogList {...defaultProps} fileLoaded={false} />);
    expect(screen.getByText(/no log file loaded/i)).toBeInTheDocument();
  });

  it('renders the footer with line counts', () => {
    render(<LogList {...defaultProps} />);
    expect(screen.getByText(/showing 3 of 3 lines/i)).toBeInTheDocument();
  });

  it('renders footer with different counts for filtered results', () => {
    const filteredLines: ParsedLogLine[] = [
      { lineNumber: 1, level: 'INFO', rawTimestamp: '2024-01-01 10:00:00', message: 'Application started' },
    ];
    render(<LogList {...defaultProps} lines={filteredLines} />);
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

  it('renders the log-list-container element', () => {
    const { container } = render(<LogList {...defaultProps} />);
    const logListContainer = container.querySelector('.log-list-container');
    expect(logListContainer).toBeInTheDocument();
  });

  it('renders the log-list-viewport element', () => {
    const { container } = render(<LogList {...defaultProps} />);
    const viewport = container.querySelector('.log-list-viewport');
    expect(viewport).toBeInTheDocument();
  });

  it('renders the log-list-empty element when file is not loaded', () => {
    const { container } = render(<LogList {...defaultProps} fileLoaded={false} />);
    const emptyDiv = container.querySelector('.log-list-empty');
    expect(emptyDiv).toBeInTheDocument();
  });

  it('renders the log-list-footer element', () => {
    const { container } = render(<LogList {...defaultProps} />);
    const footer = container.querySelector('.log-list-footer');
    expect(footer).toBeInTheDocument();
  });

  it('renders the log-list-no-lines element when lines is empty but rawLines has content', () => {
    const { container } = render(<LogList {...defaultProps} lines={[]} />);
    const noLinesDiv = container.querySelector('.log-list-no-lines');
    expect(noLinesDiv).toBeInTheDocument();
  });

  it('does not render log-list-no-lines when lines has content', () => {
    const { container } = render(<LogList {...defaultProps} />);
    const noLinesDiv = container.querySelector('.log-list-no-lines');
    expect(noLinesDiv).toBeNull();
  });

  it('renders LogRow components with correct line numbers from ParsedLogLine', () => {
    const customLines: ParsedLogLine[] = [
      { lineNumber: 100, level: 'DEBUG', rawTimestamp: '2024-01-01 12:00:00', message: 'Debug message' },
      { lineNumber: 200, level: 'INFO', rawTimestamp: '2024-01-01 12:00:01', message: 'Info message' },
    ];
    const customRawLines = ['2024-01-01 12:00:00 DEBUG Debug message', '2024-01-01 12:00:01 INFO Info message'];
    const { container } = render(<LogList {...defaultProps} lines={customLines} rawLines={customRawLines} />);
    const rows = container.querySelectorAll('.log-row');
    expect(rows[0]).toHaveAttribute('data-line', '100');
    expect(rows[1]).toHaveAttribute('data-line', '200');
  });

  it('renders LogRow components with level, timestamp, and content elements', () => {
    const { container } = render(<LogList {...defaultProps} />);
    const firstRow = container.querySelector('.log-row')!;

    expect(firstRow.querySelector('.log-row-number')).toBeInTheDocument();
    expect(firstRow.querySelector('.log-row-timestamp')).toBeInTheDocument();
    expect(firstRow.querySelector('.log-row-level')).toBeInTheDocument();
    expect(firstRow.querySelector('.log-row-content')).toBeInTheDocument();
  });
});
