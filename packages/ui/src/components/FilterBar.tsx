import { useState } from 'react';
import { LogLevel, PatternHighlighter } from 'core';
import type { HighlightPattern } from 'core';

interface FilterBarProps {
  onFilterChange: (level: LogLevel | '', timeStart: string, timeEnd: string, pattern: string) => void;
  onHighlightPatternsChange: (patterns: HighlightPattern[]) => void;
}

export function FilterBar({ onFilterChange, onHighlightPatternsChange }: FilterBarProps) {
  const [level, setLevel] = useState<LogLevel | ''>('');
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [pattern, setPattern] = useState('');
  const [highlightPattern, setHighlightPattern] = useState('');
  const [highlightColor, setHighlightColor] = useState('#ff0');
  const [highlightPatterns, setHighlightPatterns] = useState<HighlightPattern[]>([]);

  const handleApplyFilter = () => {
    onFilterChange(level, timeStart, timeEnd, pattern);
  };

  const handleAddHighlight = () => {
    if (highlightPattern.trim()) {
      try {
        const regex = new RegExp(highlightPattern.trim(), 'gi');
        const newPatterns: HighlightPattern[] = [
          ...highlightPatterns,
          {
            name: `Custom: ${highlightPattern.trim()}`,
            regex,
            color: { color: highlightColor },
            group: 0,
            priority: 5,
          },
        ];
        setHighlightPatterns(newPatterns);
        onHighlightPatternsChange(newPatterns);
        setHighlightPattern('');
      } catch {
        // Invalid regex, ignore
      }
    }
  };

  const handleRemoveHighlight = (index: number) => {
    const newPatterns = highlightPatterns.filter((_, i) => i !== index);
    setHighlightPatterns(newPatterns);
    onHighlightPatternsChange(newPatterns);
  };

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>Level:</label>
        <select value={level} onChange={(e) => setLevel(e.target.value as LogLevel | '')}>
          <option value="">All</option>
          <option value={LogLevel.DEBUG}>Debug</option>
          <option value={LogLevel.INFO}>Info</option>
          <option value={LogLevel.WARN}>Warn</option>
          <option value={LogLevel.WARNING}>Warning</option>
          <option value={LogLevel.ERROR}>Error</option>
          <option value={LogLevel.FATAL}>Fatal</option>
          <option value={LogLevel.TRACE}>Trace</option>
        </select>
      </div>

      <div className="filter-group">
        <label>From:</label>
        <input
          type="datetime-local"
          value={timeStart}
          onChange={(e) => setTimeStart(e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label>To:</label>
        <input
          type="datetime-local"
          value={timeEnd}
          onChange={(e) => setTimeEnd(e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label>Pattern:</label>
        <input
          type="text"
          placeholder="Regex pattern..."
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
        />
      </div>

      <button className="btn btn-secondary" onClick={handleApplyFilter}>
        Apply Filter
      </button>

      <div className="filter-group highlight-group">
        <label>Highlight:</label>
        <input
          type="text"
          placeholder="Regex..."
          value={highlightPattern}
          onChange={(e) => setHighlightPattern(e.target.value)}
        />
        <input
          type="color"
          value={highlightColor}
          onChange={(e) => setHighlightColor(e.target.value)}
        />
        <button className="btn btn-small" onClick={handleAddHighlight}>+</button>
      </div>

      {highlightPatterns.length > 0 && (
        <div className="highlight-list">
          {highlightPatterns.map((hp, i) => (
            <span key={i} className="highlight-tag">
              <span style={{ color: hp.color.color }}>{hp.name}</span>
              <button className="btn btn-small" onClick={() => handleRemoveHighlight(i)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
