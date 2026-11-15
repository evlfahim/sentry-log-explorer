import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LogRow } from './LogRow';
import { PatternHighlighter } from 'core';
import type { ParsedLogLine } from 'core';
import type { HighlightPattern } from 'core';

const ROW_HEIGHT = 24;
const BUFFER_SIZE = 20;
const DEFAULT_VIEWPORT_HEIGHT = 600;

interface LogListProps {
  lines: ParsedLogLine[];
  rawLines: string[];
  fileLoaded: boolean;
  highlightPatterns: HighlightPattern[];
  followMode: boolean;
  followPaused: boolean;
  onFollowLinesUpdate: (count: number) => void;
}

export function LogList({
  lines,
  rawLines,
  fileLoaded,
  highlightPatterns,
  followMode,
  followPaused,
  onFollowLinesUpdate,
}: LogListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLinesLength = useRef(0);

  // Track new lines for follow mode
  useEffect(() => {
    if (followMode && !followPaused && rawLines.length > prevLinesLength.current) {
      const newCount = rawLines.length - prevLinesLength.current;
      onFollowLinesUpdate(newCount);
    }
    prevLinesLength.current = rawLines.length;
  }, [rawLines.length, followMode, followPaused, onFollowLinesUpdate]);

  // Auto-scroll to bottom in follow mode
  useEffect(() => {
    if (followMode && !followPaused && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines.length, followMode, followPaused]);

  // Jump back to the top when a different data set is loaded
  useEffect(() => {
    setScrollTop(0);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [rawLines]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = lines.length * ROW_HEIGHT;
  const viewportHeight = containerRef.current?.clientHeight || DEFAULT_VIEWPORT_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_SIZE);
  const endIndex = Math.min(
    lines.length,
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + BUFFER_SIZE
  );
  const visibleLines = useMemo(() => lines.slice(startIndex, endIndex), [lines, startIndex, endIndex]);
  const offsetY = startIndex * ROW_HEIGHT;

  // Pre-compute highlight results for visible lines
  const highlighterRef = useRef(new PatternHighlighter());
  const highlightResults = useMemo(() => {
    if (highlightPatterns.length === 0) return null;
    highlighterRef.current.setPatterns(highlightPatterns);
    return highlighterRef.current.highlightLines(visibleLines.map((l) => l.message));
  }, [visibleLines, highlightPatterns]);

  if (!fileLoaded) {
    return (
      <div className="log-list-empty">
        <p>No log file loaded. Click "Open File" to get started.</p>
      </div>
    );
  }

  return (
    <div className="log-list-container" ref={containerRef} onScroll={handleScroll}>
      <div className="log-list-viewport" style={{ height: totalHeight }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleLines.map((line, i) => (
            <LogRow
              key={line.lineNumber}
              line={line}
              highlightResult={highlightResults?.[i] ?? null}
            />
          ))}
        </div>
      </div>
      {lines.length === 0 && (
        <div className="log-list-no-lines">
          {rawLines.length === 0 ? 'File is empty.' : 'No lines match the current filters.'}
        </div>
      )}
      <div className="log-list-footer">
        Showing {lines.length} of {rawLines.length} lines
      </div>
    </div>
  );
}
