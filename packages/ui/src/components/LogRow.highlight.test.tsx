import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LogRow } from './LogRow';
import { PatternHighlighter, DEFAULT_HIGHLIGHT_PATTERNS } from 'core';
import type { ParsedLogLine, HighlightResult } from 'core';

function makeLine(
  lineNumber: number,
  level: string,
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

describe('LogRow highlight-ui integration', () => {
  let highlighter: PatternHighlighter;

  beforeEach(() => {
    highlighter = new PatternHighlighter(DEFAULT_HIGHLIGHT_PATTERNS);
  });

  it('renders plain text when no highlightResult is provided', () => {
    const line = makeLine(1, 'INFO', '2024-01-01 10:00:00', 'Hello world');
    const { container } = render(<LogRow line={line} highlightResult={null} />);
    const content = container.querySelector('.log-row-content');
    expect(content).toHaveTextContent('Hello world');
  });

  it('renders highlighted segments when highlightResult has matches', () => {
    const line = makeLine(1, 'INFO', '2024-01-01 10:00:00', 'Hello world');
    const highlightResult = highlighter.highlight(line.message);

    const { container } = render(
      <LogRow line={line} highlightResult={highlightResult} />
    );

    const content = container.querySelector('.log-row-content')!;
    // The message should still be present
    expect(content).toHaveTextContent('Hello world');

    // Highlighted segments should have the highlight class
    const highlightedSpans = content.querySelectorAll('.log-row-highlight');
    expect(highlightedSpans.length).toBeGreaterThan(0);
  });

  it('renders multiple highlighted segments for multiple matches', () => {
    const line = makeLine(1, 'INFO', '2024-01-01 10:00:00', 'User 192.168.1.1 connected at 2024-01-01 10:00:00');
    const highlightResult = highlighter.highlight(line.message);

    const { container } = render(
      <LogRow line={line} highlightResult={highlightResult} />
    );

    const content = container.querySelector('.log-row-content')!;
    expect(content).toHaveTextContent('User 192.168.1.1 connected at 2024-01-01 10:00:00');

    const highlightedSpans = content.querySelectorAll('.log-row-highlight');
    // Should have highlights for IP address, timestamp, and numbers
    expect(highlightedSpans.length).toBeGreaterThan(1);
  });

  it('applies color styles to highlighted segments', () => {
    const line = makeLine(1, 'INFO', '2024-01-01 10:00:00', 'Hello world');
    const highlightResult = highlighter.highlight(line.message);

    const { container } = render(
      <LogRow line={line} highlightResult={highlightResult} />
    );

    const highlightedSpans = container.querySelectorAll('.log-row-highlight');
    highlightedSpans.forEach((span) => {
      expect(span).toHaveStyle({ color: expect.any(String) });
    });
  });

  it('renders plain text segments between matches', () => {
    const line = makeLine(1, 'INFO', '2024-01-01 10:00:00', 'Hello world test');
    const highlightResult = highlighter.highlight(line.message);

    const { container } = render(
      <LogRow line={line} highlightResult={highlightResult} />
    );

    const content = container.querySelector('.log-row-content')!;
    // The full message should be visible
    expect(content).toHaveTextContent('Hello world test');
  });

  it('renders correctly with empty highlight result segments', () => {
    const line = makeLine(1, 'INFO', '2024-01-01 10:00:00', 'Test message');
    const highlightResult: HighlightResult = {
      segments: [{ text: 'Test message', color: { color: '#000000' }, isMatch: false }],
      totalMatches: 0,
    };

    const { container } = render(
      <LogRow line={line} highlightResult={highlightResult} />
    );

    const content = container.querySelector('.log-row-content')!;
    expect(content).toHaveTextContent('Test message');
    const highlightedSpans = content.querySelectorAll('.log-row-highlight');
    expect(highlightedSpans.length).toBe(0);
  });

  it('renders level color correctly for ERROR level', () => {
    const line = makeLine(1, 'ERROR', '2024-01-01 10:00:00', 'Something failed');
    const { container } = render(<LogRow line={line} highlightResult={null} />);
    const levelSpan = container.querySelector('.log-row-level');
    expect(levelSpan).toHaveStyle({ color: '#d32f2f' });
  });

  it('renders level color correctly for FATAL level', () => {
    const line = makeLine(1, 'FATAL', '2024-01-01 10:00:00', 'Critical failure');
    const { container } = render(<LogRow line={line} highlightResult={null} />);
    const levelSpan = container.querySelector('.log-row-level');
    expect(levelSpan).toHaveStyle({ color: '#b71c1c' });
  });

  it('renders level color correctly for INFO level', () => {
    const line = makeLine(1, 'INFO', '2024-01-01 10:00:00', 'Started');
    const { container } = render(<LogRow line={line} highlightResult={null} />);
    const levelSpan = container.querySelector('.log-row-level');
    expect(levelSpan).toHaveStyle({ color: '#2e7d32' });
  });

  it('renders level color correctly for WARN level', () => {
    const line = makeLine(1, 'WARN', '2024-01-01 10:00:00', 'Warning');
    const { container } = render(<LogRow line={line} highlightResult={null} />);
    const levelSpan = container.querySelector('.log-row-level');
    expect(levelSpan).toHaveStyle({ color: '#ed6c02' });
  });

  it('renders level color correctly for DEBUG level', () => {
    const line = makeLine(1, 'DEBUG', '2024-01-01 10:00:00', 'Debug info');
    const { container } = render(<LogRow line={line} highlightResult={null} />);
    const levelSpan = container.querySelector('.log-row-level');
    expect(levelSpan).toHaveStyle({ color: '#5b9bd5' });
  });

  it('renders level color correctly for TRACE level', () => {
    const line = makeLine(1, 'TRACE', '2024-01-01 10:00:00', 'Trace info');
    const { container } = render(<LogRow line={line} highlightResult={null} />);
    const levelSpan = container.querySelector('.log-row-level');
    expect(levelSpan).toHaveStyle({ color: '#888888' });
  });

  it('renders line number and timestamp alongside highlighted content', () => {
    const line = makeLine(42, 'INFO', '2024-01-01 12:00:00', 'Test message');
    const highlightResult = highlighter.highlight(line.message);

    const { container } = render(
      <LogRow line={line} highlightResult={highlightResult} />
    );

    expect(container.querySelector('.log-row-number')?.textContent).toBe('42');
    expect(container.querySelector('.log-row-timestamp')?.textContent).toBe('2024-01-01 12:00:00');
    expect(container.querySelector('.log-row-level')?.textContent).toBe('INFO');
    expect(container.querySelector('.log-row-content')?.textContent).toBe('Test message');
  });

  it('renders content correctly when highlightResult has many segments', () => {
    const line = makeLine(1, 'INFO', '2024-01-01 10:00:00', 'Error connecting to http://example.com from 10.0.0.1 at 1704067200');
    const highlightResult = highlighter.highlight(line.message);

    const { container } = render(
      <LogRow line={line} highlightResult={highlightResult} />
    );

    const content = container.querySelector('.log-row-content')!;
    expect(content).toHaveTextContent('Error connecting to http://example.com from 10.0.0.1 at 1704067200');

    const highlightedSpans = content.querySelectorAll('.log-row-highlight');
    // Should have highlights for URL, IP, and epoch timestamp
    expect(highlightedSpans.length).toBeGreaterThan(2);
  });

  it('renders with custom highlight patterns applied', () => {
    const customPatterns = [
      {
        name: 'Custom error pattern',
        regex: /ERROR/gi,
        color: { color: '#ff0000', fontWeight: 'bold' },
        group: 0,
        priority: 10,
      },
    ];
    const customHighlighter = new PatternHighlighter(customPatterns);
    const line = makeLine(1, 'INFO', '2024-01-01 10:00:00', 'Found ERROR in module');
    const highlightResult = customHighlighter.highlight(line.message);

    const { container } = render(
      <LogRow line={line} highlightResult={highlightResult} />
    );

    const content = container.querySelector('.log-row-content')!;
    expect(content).toHaveTextContent('Found ERROR in module');

    const highlightedSpans = content.querySelectorAll('.log-row-highlight');
    expect(highlightedSpans.length).toBeGreaterThan(0);

    // The highlighted span should have the custom color
    const firstHighlighted = highlightedSpans[0];
    expect(firstHighlighted).toHaveStyle({ color: '#ff0000' });
  });
});
