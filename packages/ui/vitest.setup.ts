import { vi } from 'vitest';

// Mock the core module before any test imports it
// Use the full resolved path to match the alias in vitest.config.ts
vi.mock('/work/sentry-log-explorer/packages/core/src', () => {
  const LogLevel = {
    TRACE: 'TRACE',
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    FATAL: 'FATAL',
    UNKNOWN: 'UNKNOWN',
  };

  const DEFAULT_LEVEL_COLORS = {
    [LogLevel.TRACE]: { color: '#888888', fontWeight: 'normal' },
    [LogLevel.DEBUG]: { color: '#5b9bd5', fontWeight: 'normal' },
    [LogLevel.INFO]: { color: '#2e7d32', fontWeight: 'normal' },
    [LogLevel.WARN]: { color: '#ed6c02', fontWeight: 'bold' },
    [LogLevel.WARNING]: { color: '#ed6c02', fontWeight: 'bold' },
    [LogLevel.ERROR]: { color: '#d32f2f', fontWeight: 'bold' },
    [LogLevel.FATAL]: { color: '#b71c1c', fontWeight: 'bold', backgroundColor: '#ffcdd2' },
    [LogLevel.UNKNOWN]: { color: '#333333', fontWeight: 'normal' },
  };

  class LogParser {
    parseLine(rawLine: string, lineNumber: number) {
      const levelMatch = rawLine.match(/\b(TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL)\b/);
      const level = levelMatch ? (levelMatch[1] as keyof typeof LogLevel) : LogLevel.UNKNOWN;
      return {
        lineNumber,
        rawLine,
        timestamp: null,
        level: level as any,
        message: rawLine,
        rawTimestamp: null,
        rawLevel: levelMatch ? levelMatch[1] : null,
      };
    }

    filterByLevel(lines: any[], minLevel: string) {
      return lines.filter(l => l.level === minLevel);
    }

    filterByTimeRange(lines: any[], start: Date, end: Date) {
      return lines.filter(l => {
        if (!l.timestamp) return false;
        return l.timestamp >= start && l.timestamp <= end;
      });
    }

    filterByPattern(lines: any[], pattern: RegExp) {
      return lines.filter(l => pattern.test(l.rawLine));
    }
  }

  class PatternHighlighter {
    static getLevelColor(level: string) {
      const upper = level.toUpperCase();
      if (upper in DEFAULT_LEVEL_COLORS) {
        return DEFAULT_LEVEL_COLORS[upper as keyof typeof DEFAULT_LEVEL_COLORS];
      }
      return { color: '#333333', fontWeight: 'normal' };
    }

    highlight(_line: string) {
      return {
        segments: [{ text: '', color: { color: '#000000' }, isMatch: false }],
        totalMatches: 0,
      };
    }

    highlightLines(_lines: string[]) {
      return _lines.map(() => ({
        segments: [{ text: '', color: { color: '#000000' }, isMatch: false }],
        totalMatches: 0,
      }));
    }

    setPatterns(_patterns: any[]) {}
  }

  class SavedQueriesManager {
    constructor() {}
    save() {}
    load() {}
    createQuery() {
      return {
        id: 'test-id',
        name: '',
        description: undefined,
        minLevel: undefined,
        timeStart: undefined,
        timeEnd: undefined,
        pattern: undefined,
        highlightPatterns: [],
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
        usageCount: 1,
      };
    }
    updateQuery() {}
    deleteQuery() {}
    getQuery() { return null; }
    getAllQueries() { return []; }
    searchByName() { return []; }
    recordUsage() {}
    getFilterOptions() { return {}; }
    clear() {}
    getCount() { return 0; }
    exportJSON() { return ''; }
    importJSON() {}
    importFromFile() {}
    exportToFile() {}
  }

  return {
    LogParser,
    LogLevel,
    PatternHighlighter,
    DEFAULT_HIGHLIGHT_PATTERNS: [],
    DEFAULT_LEVEL_COLORS,
    normalizeLevel: (l: string) => l,
    parseTimestamp: (s: string) => new Date(s),
    LOG_LEVEL_SEVERITY: {},
    FollowMode: class {},
    SavedQueriesManager,
  };
});
