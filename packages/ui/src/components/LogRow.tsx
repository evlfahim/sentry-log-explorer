import { useMemo } from 'react';
import { PatternHighlighter } from 'core';
import type { ParsedLogLine } from 'core';
import type { HighlightResult } from 'core';

interface LogRowProps {
  line: ParsedLogLine;
  highlightResult: HighlightResult | null;
}

export function LogRow({ line, highlightResult }: LogRowProps) {
  const hasLevel = Boolean(line.level) && line.level !== 'UNKNOWN';

  const levelColor = useMemo(() => {
    if (hasLevel) {
      return PatternHighlighter.getLevelColor(line.level).color;
    }
    return '#333333';
  }, [hasLevel, line.level]);

  // Text is rendered as React children (never as raw HTML), so log content is always escaped.
  const content = useMemo(() => {
    if (!highlightResult || highlightResult.segments.length === 0) {
      return line.message;
    }
    return highlightResult.segments.map((segment, i) =>
      segment.isMatch ? (
        <span
          key={i}
          className="log-row-highlight"
          style={{
            color: segment.color.color,
            fontWeight: segment.color.fontWeight || 'normal',
            fontStyle: segment.color.fontStyle,
            backgroundColor: segment.color.backgroundColor,
          }}
        >
          {segment.text}
        </span>
      ) : (
        <span key={i}>{segment.text}</span>
      )
    );
  }, [highlightResult, line.message]);

  return (
    <div className="log-row" data-line={line.lineNumber}>
      <span className="log-row-number">{line.lineNumber}</span>
      {line.rawTimestamp && <span className="log-row-timestamp">{line.rawTimestamp}</span>}
      {hasLevel && (
        <span className="log-row-level" style={{ color: levelColor }}>
          {line.level}
        </span>
      )}
      <span className="log-row-content">{content}</span>
    </div>
  );
}
