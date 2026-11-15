import React, { useState, useCallback, useRef } from 'react';
import { LogList } from './components/LogList';
import { FilterBar } from './components/FilterBar';
import { SavedQueriesPanel } from './components/SavedQueriesPanel';
import { FollowModeToggle } from './components/FollowModeToggle';
import { LogParser, LogLevel, PatternHighlighter, type ParsedLogLine, type HighlightPattern, type SavedQuery, type HighlightColor } from 'core';

interface AppState {
  lines: ParsedLogLine[];
  rawLines: string[];
  isLoading: boolean;
  fileName: string;
  filterLevel: LogLevel | '';
  filterTimeStart: string;
  filterTimeEnd: string;
  filterPattern: string;
  highlightPatterns: HighlightPattern[];
  savedQueries: SavedQuery[];
  followMode: boolean;
  followPaused: boolean;
  followLinesCount: number;
  error: string | null;
}

export default function App() {
  const [state, setState] = useState<AppState>({
    lines: [],
    rawLines: [],
    isLoading: false,
    fileName: '',
    filterLevel: '',
    filterTimeStart: '',
    filterTimeEnd: '',
    filterPattern: '',
    highlightPatterns: [],
    savedQueries: [],
    followMode: false,
    followPaused: false,
    followLinesCount: 0,
    error: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const parserRef = useRef(new LogParser());

  const handleFileOpen = useCallback((file: File) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const rawLines = content.split('\n').filter(Boolean);
        const parsed = rawLines.map((line, i) => parserRef.current.parseLine(line, i + 1));
        setState((prev) => ({
          ...prev,
          lines: parsed,
          rawLines,
          isLoading: false,
          fileName: file.name,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to read file',
        }));
      }
    };
    reader.onerror = () => {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to read file',
      }));
    };
    reader.readAsText(file);
  }, []);

  const handleFilterChange = useCallback(
    (filterLevel: LogLevel | '', timeStart: string, timeEnd: string, pattern: string) => {
      setState((prev) => ({
        ...prev,
        filterLevel,
        filterTimeStart: timeStart,
        filterTimeEnd: timeEnd,
        filterPattern: pattern,
      }));
    },
    []
  );

  const handleHighlightPatternsChange = useCallback(
    (patterns: HighlightPattern[]) => {
      setState((prev) => ({ ...prev, highlightPatterns: patterns }));
    },
    []
  );

  const handleSavedQueriesChange = useCallback((queries: SavedQuery[]) => {
    setState((prev) => ({ ...prev, savedQueries: queries }));
  }, []);

  const handleFollowModeChange = useCallback((followMode: boolean, paused: boolean) => {
    setState((prev) => ({
      ...prev,
      followMode,
      followPaused: paused,
    }));
  }, []);

  const handleFollowLinesUpdate = useCallback((count: number) => {
    setState((prev) => ({ ...prev, followLinesCount: count }));
  }, []);

  // Apply filters to get filtered lines
  const filteredLines = (() => {
    let result = state.lines;

    if (state.filterLevel && state.filterLevel !== LogLevel.UNKNOWN) {
      result = parserRef.current.filterByLevel(result, state.filterLevel);
    }

    if (state.filterTimeStart || state.filterTimeEnd) {
      const start = state.filterTimeStart ? new Date(state.filterTimeStart) : null;
      const end = state.filterTimeEnd ? new Date(state.filterTimeEnd) : null;
      if (start && end) {
        result = parserRef.current.filterByTimeRange(result, start, end);
      }
    }

    if (state.filterPattern) {
      try {
        const regex = new RegExp(state.filterPattern, 'i');
        result = parserRef.current.filterByPattern(result, regex);
      } catch {
        // Invalid regex, skip
      }
    }

    return result;
  })();

  // Build highlight patterns for the current view
  const highlightPatterns = state.highlightPatterns.length > 0
    ? state.highlightPatterns
    : [];

  return (
    <div className="app">
      <header className="app-header">
        <h1>Sentry Log Explorer</h1>
        {state.fileName && <span className="file-name">{state.fileName}</span>}
      </header>

      <div className="app-toolbar">
        <button
          className="btn btn-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={state.isLoading}
        >
          Open File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".log,.txt,.csv,.json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileOpen(file);
          }}
        />

        <FollowModeToggle
          followMode={state.followMode}
          followPaused={state.followPaused}
          onChange={handleFollowModeChange}
        />

        <SavedQueriesPanel
          queries={state.savedQueries}
          onChange={handleSavedQueriesChange}
        />
      </div>

      <FilterBar
        onFilterChange={handleFilterChange}
        onHighlightPatternsChange={handleHighlightPatternsChange}
      />

      {state.error && <div className="error-banner">{state.error}</div>}

      {state.isLoading && <div className="loading">Loading...</div>}

      <LogList
        lines={filteredLines}
        rawLines={state.rawLines}
        highlightPatterns={highlightPatterns}
        followMode={state.followMode}
        followPaused={state.followPaused}
        onFollowLinesUpdate={handleFollowLinesUpdate}
      />
    </div>
  );
}
