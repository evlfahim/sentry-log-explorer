/**
 * A color specification for highlighting text.
 */
export interface HighlightColor {
  /** CSS color value (hex, rgb, hsl, or named color) */
  color: string;
  /** Optional background color */
  backgroundColor?: string;
  /** Optional font weight (normal, bold, etc.) */
  fontWeight?: string;
  /** Optional font style (normal, italic) */
  fontStyle?: string;
}

/**
 * A configurable highlight pattern with a regex and visual style.
 */
export interface HighlightPattern {
  /** Human-readable name for this pattern */
  name: string;
  /** Regex to match text. Capture groups can be targeted via `group` */
  regex: RegExp;
  /** Color specification for matched text */
  color: HighlightColor;
  /**
   * Index of the capture group to highlight.
   * If undefined or 0, the entire match is highlighted.
   * If a positive integer, only that capture group is highlighted.
   */
  group?: number;
  /**
   * Priority for overlapping matches. Higher values win.
   * Default: 0.
   */
  priority?: number;
}

/**
 * A segment of highlighted text with its associated color.
 */
export interface HighlightedSegment {
  /** The text content of this segment */
  text: string;
  /** The color specification for this segment */
  color: HighlightColor;
  /** Whether this segment is a highlighted match (true) or plain text (false) */
  isMatch: boolean;
}

/**
 * Result of highlighting a single line of text.
 */
export interface HighlightResult {
  /** Array of segments, alternating between plain text and matches */
  segments: HighlightedSegment[];
  /** Total number of matches found in the line */
  totalMatches: number;
}

/**
 * Log levels enum (mirrored from parser for standalone use).
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
 * Default color palette for common log levels.
 */
export const DEFAULT_LEVEL_COLORS: Record<string, HighlightColor> = {
  [LogLevel.TRACE]: { color: '#888888', fontWeight: 'normal' },
  [LogLevel.DEBUG]: { color: '#5b9bd5', fontWeight: 'normal' },
  [LogLevel.INFO]: { color: '#2e7d32', fontWeight: 'normal' },
  [LogLevel.WARN]: { color: '#ed6c02', fontWeight: 'bold' },
  [LogLevel.WARNING]: { color: '#ed6c02', fontWeight: 'bold' },
  [LogLevel.ERROR]: { color: '#d32f2f', fontWeight: 'bold' },
  [LogLevel.FATAL]: { color: '#b71c1c', fontWeight: 'bold', backgroundColor: '#ffcdd2' },
  [LogLevel.UNKNOWN]: { color: '#333333', fontWeight: 'normal' },
};

/**
 * Built-in highlight patterns for common log formats.
 */
export const DEFAULT_HIGHLIGHT_PATTERNS: HighlightPattern[] = [
  {
    name: 'Log level (ISO 8601 prefix)',
    regex: /^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:?\d{2}|Z)?)\s+(TRACE|DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL)\s+(.*)$/,
    color: DEFAULT_LEVEL_COLORS[LogLevel.INFO],
    group: 2,
    priority: 10,
  },
  {
    name: 'Log level (brackets)',
    regex: /^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:?\d{2}|Z)?)\s+\[(TRACE|DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL)\]\s+(.*)$/,
    color: DEFAULT_LEVEL_COLORS[LogLevel.INFO],
    group: 2,
    priority: 10,
  },
  {
    name: 'Log level (angle brackets)',
    regex: /^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:?\d{2}|Z)?)\s+<(TRACE|DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL)>\s+(.*)$/,
    color: DEFAULT_LEVEL_COLORS[LogLevel.INFO],
    group: 2,
    priority: 10,
  },
  {
    name: 'Log level (parentheses)',
    regex: /^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:?\d{2}|Z)?)\s+\((TRACE|DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL)\)\s+(.*)$/,
    color: DEFAULT_LEVEL_COLORS[LogLevel.INFO],
    group: 2,
    priority: 10,
  },
  {
    name: 'Log level (prefix only)',
    regex: /^(TRACE|DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL)\s+(.*)$/,
    color: DEFAULT_LEVEL_COLORS[LogLevel.INFO],
    group: 1,
    priority: 10,
  },
  {
    name: 'Timestamp (ISO 8601)',
    regex: /(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:?\d{2}|Z)?)/,
    color: { color: '#1565c0', fontWeight: 'normal' },
    group: 1,
    priority: 5,
  },
  {
    name: 'Epoch timestamp',
    regex: /(\d{10,13})(?:\.\d+)?/,
    color: { color: '#1565c0', fontWeight: 'normal' },
    group: 1,
    priority: 5,
  },
  {
    name: 'IP addresses',
    regex: /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/,
    color: { color: '#6a1b9a', fontWeight: 'normal' },
    group: 1,
    priority: 3,
  },
  {
    name: 'Email addresses',
    regex: /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/,
    color: { color: '#6a1b9a', fontWeight: 'normal' },
    group: 1,
    priority: 3,
  },
  {
    name: 'URLs',
    regex: /\b(https?:\/\/[^\s<>"{}|\\^`[\]]+)\b/,
    color: { color: '#0288d1', fontWeight: 'normal' },
    group: 1,
    priority: 3,
  },
  {
    name: 'Hex colors',
    regex: /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/,
    color: { color: '#e65100', fontWeight: 'normal' },
    group: 1,
    priority: 2,
  },
  {
    name: 'Numbers',
    regex: /\b(\d+)\b/,
    color: { color: '#00695c', fontWeight: 'normal' },
    group: 1,
    priority: 1,
  },
];

/**
 * PatternHighlighter applies configurable regex patterns with colors to text.
 * It supports multiple overlapping patterns with priority-based resolution,
 * capture group targeting, and batch processing.
 */
export class PatternHighlighter {
  private _patterns: HighlightPattern[];
  private _compiledRegexes: Array<{ regex: RegExp; pattern: HighlightPattern }>;

  constructor(patterns?: HighlightPattern[]) {
    this._patterns = patterns && patterns.length > 0
      ? patterns.map((p) => ({ ...p, color: { ...p.color }, regex: new RegExp(p.regex.source, p.regex.flags) }))
      : [];
    this._compiledRegexes = this._compilePatterns(this._patterns);
  }

  /**
   * Compile all patterns into RegExp instances with the 'g' flag.
   */
  private _compilePatterns(patterns: HighlightPattern[]): Array<{ regex: RegExp; pattern: HighlightPattern }> {
    return patterns.map((p) => {
      const flags = p.regex.flags.includes('g') ? p.regex.flags : `${p.regex.flags}g`;
      return { regex: new RegExp(p.regex.source, flags), pattern: p };
    });
  }

  /**
   * Get the list of configured patterns.
   */
  get patterns(): ReadonlyArray<HighlightPattern> {
    return this._patterns;
  }

  /**
   * Add a highlight pattern. If a pattern with the same name exists, it is replaced.
   */
  addPattern(pattern: HighlightPattern): void {
    const idx = this._patterns.findIndex((p) => p.name === pattern.name);
    if (idx >= 0) {
      this._patterns[idx] = { ...pattern, color: { ...pattern.color }, regex: new RegExp(pattern.regex.source, pattern.regex.flags) };
    } else {
      this._patterns.push({ ...pattern, color: { ...pattern.color }, regex: new RegExp(pattern.regex.source, pattern.regex.flags) });
    }
    this._compiledRegexes = this._compilePatterns(this._patterns);
  }

  /**
   * Remove a pattern by name.
   */
  removePattern(name: string): void {
    this._patterns = this._patterns.filter((p) => p.name !== name);
    this._compiledRegexes = this._compilePatterns(this._patterns);
  }

  /**
   * Replace all patterns.
   */
  setPatterns(patterns: HighlightPattern[]): void {
    this._patterns = patterns.map((p) => ({ ...p, color: { ...p.color }, regex: new RegExp(p.regex.source, p.regex.flags) }));
    this._compiledRegexes = this._compilePatterns(this._patterns);
  }

  /**
   * Highlight a single line of text.
   * Returns segments with color information.
   *
   * Uses a sweep-line algorithm: collect all matches, sort by start position,
   * then greedily select non-overlapping matches (higher priority wins).
   */
  highlight(line: string): HighlightResult {
    if (line.length === 0) {
      return { segments: [{ text: '', color: { color: '#000000' }, isMatch: false }], totalMatches: 0 };
    }

    interface RawMatch {
      start: number;
      end: number;
      text: string;
      color: HighlightColor;
      priority: number;
    }

    const allMatches: RawMatch[] = [];

    for (const { regex, pattern } of this._compiledRegexes) {
      let match: RegExpExecArray | null;
      regex.lastIndex = 0;

      while ((match = regex.exec(line)) !== null) {
        let matchStart: number;
        let matchEnd: number;
        let matchText: string;

        if (pattern.group !== undefined && pattern.group > 0 && pattern.group < match.length) {
          const groupValue = match[pattern.group];
          if (groupValue !== undefined) {
            const groupStartIndex = line.indexOf(groupValue, match.index);
            matchStart = groupStartIndex;
            matchEnd = matchStart + groupValue.length;
            matchText = groupValue;
          } else {
            matchStart = match.index;
            matchEnd = match.index + match[0].length;
            matchText = match[0];
          }
        } else {
          matchStart = match.index;
          matchEnd = match.index + match[0].length;
          matchText = match[0];
        }

        // Skip zero-width matches (they would cause infinite loops)
        if (matchStart === matchEnd) {
          // Advance past this position to avoid infinite loop
          regex.lastIndex = match.index + 1;
          continue;
        }

        allMatches.push({
          start: matchStart,
          end: matchEnd,
          text: matchText,
          color: pattern.color,
          priority: pattern.priority ?? 0,
        });
      }
    }

    if (allMatches.length === 0) {
      return {
        segments: [{ text: line, color: { color: '#000000' }, isMatch: false }],
        totalMatches: 0,
      };
    }

    // Sort by start position, then by priority descending (higher priority first)
    allMatches.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return b.priority - a.priority;
    });

    // Sweep-line: greedily select non-overlapping matches.
    // Since sorted by start position, we only need to check against
    // the last selected match. If a new match starts before the last
    // one ends, it's dominated (lower or equal priority due to sort order).
    const resolved: RawMatch[] = [];
    let lastEnd = -1;
    let lastPriority = -Infinity;

    for (const match of allMatches) {
      if (match.start >= lastEnd) {
        // No overlap with the last selected match
        resolved.push(match);
        lastEnd = match.end;
        lastPriority = match.priority;
      }
      // Otherwise: this match overlaps with the last selected one.
      // Since we sorted by start then priority desc, the last selected
      // match has higher or equal priority. So this one is dominated.
    }

    // Build segments by walking through the line
    const segments: HighlightedSegment[] = [];
    let cursor = 0;

    for (const match of resolved) {
      if (match.start > cursor) {
        segments.push({
          text: line.substring(cursor, match.start),
          color: { color: '#000000' },
          isMatch: false,
        });
      }
      segments.push({
        text: match.text,
        color: match.color,
        isMatch: true,
      });
      cursor = match.end;
    }

    if (cursor < line.length) {
      segments.push({
        text: line.substring(cursor),
        color: { color: '#000000' },
        isMatch: false,
      });
    }

    return { segments, totalMatches: resolved.length };
  }

  /**
   * Highlight an array of lines.
   * Returns an array of HighlightResult, one per line.
   */
  highlightLines(lines: string[]): HighlightResult[] {
    return lines.map((line) => this.highlight(line));
  }

  /**
   * Get a color for a log level.
   * Uses the default level colors.
   */
  static getLevelColor(level: string): HighlightColor {
    const upper = level.toUpperCase();
    if (upper in DEFAULT_LEVEL_COLORS) {
      return DEFAULT_LEVEL_COLORS[upper as keyof typeof DEFAULT_LEVEL_COLORS];
    }
    return { color: '#333333', fontWeight: 'normal' };
  }
}
