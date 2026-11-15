import { useMemo } from 'react';
import { PatternHighlighter } from 'core';
import type { ParsedLogLine } from 'core';
import type { HighlightResult } from 'core';

interface LogRowProps {
  line: ParsedLogLine;
  index: number;
  highlightResult: HighlightResult | null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function LogRow({ line, index, highlightResult }: LogRowProps) {
  const levelColor = useMemo(() => {
    if (line.level && line.level !== 'UNKNOWN') {
      return PatternHighlighter.getLevelColor(line.level).color;
    }
    return '#333333';
  }, [line.level]);

  const renderedContent = useMemo(() => {
    if (!highlightResult || highlightResult.segments.length === 0) {
      return escapeHtml(line.rawLine);
    }

    let html = '';
    for (const segment of highlightResult.segments) {
      if (segment.isMatch) {
        let style = `color: ${segment.color.color}; font-weight: ${segment.color.fontWeight || 'normal'};`;
        if (segment.color.backgroundColor) {
          style += ` background-color: ${segment.color.backgroundColor};`;
        }
        html += `<span style="${style}">${escapeHtml(segment.text)}</span>`;
      } else {
        html += escapeHtml(segment.text);
      }
    }
    return html;
  }, [highlightResult, line.rawLine]);

  return (
    <div className="log-row" data-line={index}>
      <span className="log-row-number">{index + 1}</span>
      {line.level && line.level !== 'UNKNOWN' && (
        <span className="log-row-level" style={{ color: levelColor }}>
          {line.level}
        </span>
      )}
      <span
        className="log-row-content"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
    </div>
  );
}
