export { FileIndexer } from './indexer';
export type {
  LineIndexEntry,
  IndexResult,
  LineRangeResult,
  IndexStats,
} from './indexer';

export {
  PatternHighlighter,
  DEFAULT_HIGHLIGHT_PATTERNS,
  DEFAULT_LEVEL_COLORS,
} from './highlighter';
export type {
  HighlightColor,
  HighlightPattern,
  HighlightedSegment,
  HighlightResult,
} from './highlighter';

export {
  LogParser,
  DEFAULT_PATTERNS,
  normalizeLevel,
  parseTimestamp,
  LOG_LEVEL_SEVERITY,
} from './parser';
export type {
  ParsedLogLine,
  LogPattern,
} from './parser';

export { LogLevel } from './highlighter';

export {
  FollowMode,
} from './follow';
export type {
  FollowState,
  FollowCallbacks,
  FollowOptions,
} from './follow';

export {
  SavedQueriesManager,
} from './queries';
export type {
  SavedQuery,
  SavedQueriesManagerOptions,
  QueryFilterOptions,
} from './queries';
