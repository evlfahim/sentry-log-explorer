import { FileIndexer, LineRangeResult } from './indexer';

/**
 * Standard log levels in order of severity.
 */
export enum LogLevel {
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Severity numeric value for each log level, used for filtering.
 */
export const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  [LogLevel.TRACE]: 0,
  [LogLevel.DEBUG]: 10,
  [LogLevel.INFO]: 20,
  [LogLevel.WARN]: 30,
  [LogLevel.WARNING]: 30,
  [LogLevel.ERROR]: 40,
  [LogLevel.FATAL]: 50,
  [LogLevel.UNKNOWN]: -1,
};

/**
 * A parsed log line with extracted metadata.
 */
export interface ParsedLogLine {
  lineNumber: number;
  rawLine: string;
  timestamp: Date | null;
  level: LogLevel;
  message: string;
  rawTimestamp: string | null;
  rawLevel: string | null;
}

/**
 * A configurable parsing pattern for a log format.
 */
export interface LogPattern {
  /** Human-readable name for this pattern */
  name: string;
  /** Regex to match the log line. Groups: 1=timestamp, 2=level, 3=message (all optional) */
  regex: RegExp;
  /** Index of the timestamp capture group (default: 1) */
  timestampGroup?: number;
  /** Index of the level capture group (default: 2) */
  levelGroup?: number;
  /** Index of the message capture group (default: 3) */
  messageGroup?: number;
}

/**
 * Built-in patterns for common log formats.
 */
export const DEFAULT_PATTERNS: LogPattern[] = [
  {
    name: 'ISO 8601 with level prefix',
    regex: /^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:?\d{2}|Z)?)\s+(TRACE|DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL)\s+(.*)$/,
    timestampGroup: 1,
    levelGroup: 2,
    messageGroup: 3,
  },
  {
    name: 'Date with level prefix (no T separator)',
    regex: /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?)\s+(TRACE|DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL)\s+(.*)$/,
    timestampGroup: 1,
    levelGroup: 2,
    messageGroup: 3,
  },
  {
    name: 'Level prefix only',
    regex: /^(TRACE|DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL)\s+(.*)$/,
    levelGroup: 1,
    messageGroup: 2,
  },
  {
    name: 'Timestamp with level in brackets',
    regex: /^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:?\d{2}|Z)?)\s+\[(TRACE|DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL)\]\s+(.*)$/,
    timestampGroup: 1,
    levelGroup: 2,
    messageGroup: 3,
  },
  {
    name: 'Syslog-style (Mon DD HH:MM:SS)',
    regex: /^([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+\S+\s+\S+:\s+(TRACE|DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL)\s+(.*)$/,
    timestampGroup: 1,
    levelGroup: 2,
    messageGroup: 3,
  },
  {
    name: 'Timestamp with level in angle brackets',
    regex: /^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:?\d{2}|Z)?)\s+<(TRACE|DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL)>\s+(.*)$/,
    timestampGroup: 1,
    levelGroup: 2,
    messageGroup: 3,
  },
  {
    name: 'Epoch timestamp with level',
    regex: /^(\d{10,13})(?:\.\d+)?\s+(TRACE|DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL)\s+(.*)$/,
    timestampGroup: 1,
    levelGroup: 2,
    messageGroup: 3,
  },
  {
    name: 'Timestamp with level in parentheses',
    regex: /^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:?\d{2}|Z)?)\s+\((TRACE|DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL)\)\s+(.*)$/,
    timestampGroup: 1,
    levelGroup: 2,
    messageGroup: 3,
  },
];

/**
 * Normalize a log level string to a standard LogLevel enum value.
 */
export function normalizeLevel(level: string): LogLevel {
  const upper = level.toUpperCase().trim();
  if (upper === 'WARN') return LogLevel.WARN;
  if (upper === 'WARNING') return LogLevel.WARNING;
  if (Object.values(LogLevel).includes(upper as LogLevel)) {
    return upper as LogLevel;
  }
  return LogLevel.UNKNOWN;
}

/**
 * Parse a timestamp string into a Date object.
 * Returns null if the string cannot be parsed.
 */
export function parseTimestamp(ts: string): Date | null {
  if (!ts || ts.trim().length === 0) return null;

  const trimmed = ts.trim();

  // Try ISO 8601 with T separator
  let d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d;

  // Try with space separator
  d = new Date(trimmed.replace(' ', 'T'));
  if (!isNaN(d.getTime())) return d;

  // Try epoch milliseconds (10+ digits)
  if (/^\d{10,13}$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    // 10 digits = seconds, 13 digits = milliseconds
    const timestampMs = trimmed.length === 10 ? num * 1000 : num;
    d = new Date(timestampMs);
    if (!isNaN(d.getTime())) return d;
  }

  // Try syslog-style: "Jan 15 10:30:45" (assume current year)
  const syslogMatch = trimmed.match(/^([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (syslogMatch) {
    const months: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };
    const month = months[syslogMatch[1]];
    if (month !== undefined) {
      d = new Date(new Date().getFullYear(), month, parseInt(syslogMatch[2], 10),
        parseInt(syslogMatch[3], 10), parseInt(syslogMatch[4], 10), parseInt(syslogMatch[5], 10));
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
}

/**
 * LogParser parses raw log lines into structured ParsedLogLine objects.
 * It supports multiple configurable patterns and falls back to UNKNOWN level
 * when no pattern matches.
 */
export class LogParser {
  private readonly _patterns: LogPattern[];

  constructor(patterns?: LogPattern[]) {
    this._patterns = patterns && patterns.length > 0 ? patterns : DEFAULT_PATTERNS;
  }

  /**
   * Get the list of configured patterns.
   */
  get patterns(): ReadonlyArray<LogPattern> {
    return this._patterns;
  }

  /**
   * Parse a single raw log line into a ParsedLogLine.
   */
  parseLine(rawLine: string, lineNumber: number): ParsedLogLine {
    for (const pattern of this._patterns) {
      const match = rawLine.match(pattern.regex);
      if (match) {
        const tsGroup = pattern.timestampGroup;
        const lvlGroup = pattern.levelGroup;
        const msgGroup = pattern.messageGroup;

        const rawTs = tsGroup !== undefined ? (match[tsGroup] ?? null) : null;
        const rawLvl = lvlGroup !== undefined ? (match[lvlGroup] ?? null) : null;
        const message = msgGroup !== undefined ? (match[msgGroup] ?? rawLine) : rawLine;

        return {
          lineNumber,
          rawLine,
          timestamp: rawTs ? parseTimestamp(rawTs) : null,
          level: rawLvl ? normalizeLevel(rawLvl) : LogLevel.UNKNOWN,
          message,
          rawTimestamp: rawTs,
          rawLevel: rawLvl,
        };
      }
    }

    // No pattern matched — treat as unknown
    return {
      lineNumber,
      rawLine,
      timestamp: null,
      level: LogLevel.UNKNOWN,
      message: rawLine,
      rawTimestamp: null,
      rawLevel: null,
    };
  }

  /**
   * Parse a batch of lines from a LineRangeResult.
   */
  parseLines(result: LineRangeResult): ParsedLogLine[] {
    return result.lines.map((line, i) =>
      this.parseLine(line, result.lineNumbers[i] ?? i)
    );
  }

  /**
   * Parse lines from a FileIndexer, reading in batches.
   * Returns all parsed lines from startLine to endLine.
   */
  async parseRange(
    indexer: FileIndexer,
    startLine: number,
    endLine: number
  ): Promise<ParsedLogLine[]> {
    const { lines, lineNumbers } = await indexer.readLineRange(startLine, endLine);
    return this.parseLines({ lines, lineNumbers });
  }

  /**
   * Filter parsed lines by log level severity.
   * Returns lines whose severity is >= the given minimum severity.
   */
  filterByLevel(lines: ParsedLogLine[], minLevel: LogLevel): ParsedLogLine[] {
    const minSeverity = LOG_LEVEL_SEVERITY[minLevel] ?? -1;
    return lines.filter((l) => (LOG_LEVEL_SEVERITY[l.level] ?? -1) >= minSeverity);
  }

  /**
   * Filter parsed lines by time range.
   * Returns lines whose timestamp falls within [start, end].
   * Lines without timestamps are excluded.
   */
  filterByTimeRange(
    lines: ParsedLogLine[],
    start: Date,
    end: Date
  ): ParsedLogLine[] {
    return lines.filter((l) => {
      if (!l.timestamp) return false;
      return l.timestamp >= start && l.timestamp <= end;
    });
  }

  /**
   * Filter parsed lines by a regex pattern against the raw line.
   */
  filterByPattern(lines: ParsedLogLine[], pattern: RegExp): ParsedLogLine[] {
    return lines.filter((l) => pattern.test(l.rawLine));
  }

  /**
   * Combine multiple filters.
   */
  filter(
    lines: ParsedLogLine[],
    options?: {
      minLevel?: LogLevel;
      timeStart?: Date;
      timeEnd?: Date;
      pattern?: RegExp;
    }
  ): ParsedLogLine[] {
    let result = lines;

    if (options?.minLevel) {
      result = this.filterByLevel(result, options.minLevel);
    }
    if (options?.timeStart && options?.timeEnd) {
      result = this.filterByTimeRange(result, options.timeStart, options.timeEnd);
    }
    if (options?.pattern) {
      result = this.filterByPattern(result, options.pattern);
    }

    return result;
  }
}
