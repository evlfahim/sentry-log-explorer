import fs from 'fs';
import path from 'path';

import { LogLevel } from './highlighter';
import type { HighlightPattern } from './highlighter';

/**
 * A saved query that can be re-applied to a log file.
 */
export interface SavedQuery {
  /** Unique identifier for the query */
  id: string;
  /** Human-readable name */
  name: string;
  /** Optional description */
  description?: string;
  /** Minimum log level to include */
  minLevel?: LogLevel;
  /** Start of time range (ISO string) */
  timeStart?: string;
  /** End of time range (ISO string) */
  timeEnd?: string;
  /** Regex pattern to match against raw lines */
  pattern?: string;
  /** Highlight patterns to apply */
  highlightPatterns?: HighlightPattern[];
  /** Timestamp when the query was created (ms since epoch) */
  createdAt: number;
  /** Timestamp when the query was last used (ms since epoch) */
  lastUsedAt?: number;
  /** How many times this query has been used */
  usageCount: number;
}

/**
 * Options for the SavedQueriesManager.
 */
export interface SavedQueriesManagerOptions {
  /** Path to the JSON file for persistence (default: ~/.sentry-log-explorer/queries.json) */
  filePath?: string;
  /** Maximum number of recent queries to keep in history (default: 50) */
  maxHistory?: number;
}

/**
 * Options for applying a saved query to a filter.
 */
export interface QueryFilterOptions {
  /** Minimum log level */
  minLevel?: LogLevel;
  /** Start of time range */
  timeStart?: Date;
  /** End of time range */
  timeEnd?: Date;
  /** Regex pattern */
  pattern?: RegExp;
}

/**
 * SavedQueriesManager manages a collection of saved queries with JSON
 * persistence and recent query history.
 *
 * Usage:
 *   const manager = new SavedQueriesManager();
 *   const query = manager.createQuery({ name: 'Errors only', minLevel: LogLevel.ERROR });
 *   manager.save();
 *   // ... later
 *   manager.load();
 *   const filterOpts = manager.getFilterOptions(query.id);
 *   manager.recordUsage(query.id);
 */
export class SavedQueriesManager {
  private readonly _filePath: string;
  private readonly _maxHistory: number;

  /** All saved queries, keyed by id */
  private _queries: Map<string, SavedQuery>;
  /** Ordered list of query ids, most recent first */
  private _history: string[];
  /** Whether the manager has been loaded from disk */
  private _loaded: boolean;

  constructor(options?: SavedQueriesManagerOptions) {
    this._filePath =
      options?.filePath ??
      path.join(
        process.env.HOME ?? process.env.USERPROFILE ?? '.',
        '.sentry-log-explorer',
        'queries.json'
      );
    this._maxHistory = options?.maxHistory ?? 50;
    this._queries = new Map();
    this._history = [];
    this._loaded = false;
  }

  /**
   * Load queries from the JSON file.
   * If the file doesn't exist, the manager starts empty.
   */
  load(): void {
    try {
      if (!fs.existsSync(this._filePath)) {
        this._loaded = true;
        return;
      }

      const raw = fs.readFileSync(this._filePath, 'utf-8');
      const data = JSON.parse(raw) as {
        queries: Record<string, SavedQuery>;
        history: string[];
      };

      this._queries = new Map(Object.entries(data.queries ?? {}));
      this._history = data.history ?? [];
      this._loaded = true;
    } catch {
      // If the file is corrupted, start fresh
      this._queries = new Map();
      this._history = [];
      this._loaded = true;
    }
  }

  /**
   * Save all queries to the JSON file.
   * Creates parent directories if they don't exist.
   */
  save(): void {
    const dir = path.dirname(this._filePath);
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch {
      // Best effort — if we can't create the directory, skip saving
      return;
    }

    const data = {
      queries: Object.fromEntries(this._queries),
      history: this._history,
    };

    fs.writeFileSync(this._filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Get all saved queries as an array, ordered by lastUsedAt desc, then createdAt desc,
   * with history position as a stable tiebreaker (most recent first).
   */
  getAllQueries(): SavedQuery[] {
    const queries = Array.from(this._queries.values());
    queries.sort((a, b) => {
      const aLast = a.lastUsedAt ?? a.createdAt;
      const bLast = b.lastUsedAt ?? b.createdAt;
      if (bLast !== aLast) return bLast - aLast;
      if (b.createdAt !== a.createdAt) return b.createdAt - a.createdAt;
      // Use history position as stable tiebreaker: earlier in history = older
      const aIdx = this._history.indexOf(a.id);
      const bIdx = this._history.indexOf(b.id);
      if (aIdx === -1 && bIdx === -1) return 0;
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return bIdx - aIdx; // Earlier index = older = should come later
    });
    return queries;
  }

  /**
   * Get a query by id.
   */
  getQuery(id: string): SavedQuery | undefined {
    return this._queries.get(id);
  }

  /**
   * Create a new saved query.
   * Returns the created query object.
   */
  createQuery(
    name: string,
    options?: {
      description?: string;
      minLevel?: LogLevel;
      timeStart?: string;
      timeEnd?: string;
      pattern?: string;
      highlightPatterns?: HighlightPattern[];
    }
  ): SavedQuery {
    const id = this._generateId();
    const now = Date.now();

    const query: SavedQuery = {
      id,
      name,
      description: options?.description,
      minLevel: options?.minLevel,
      timeStart: options?.timeStart,
      timeEnd: options?.timeEnd,
      pattern: options?.pattern,
      highlightPatterns: options?.highlightPatterns,
      createdAt: now,
      lastUsedAt: now,
      usageCount: 1,
    };

    this._queries.set(id, query);
    this._addToHistory(id);

    return query;
  }

  /**
   * Update an existing query.
   * Returns the updated query, or undefined if not found.
   */
  updateQuery(
    id: string,
    updates: {
      name?: string;
      description?: string;
      minLevel?: LogLevel;
      timeStart?: string;
      timeEnd?: string;
      pattern?: string;
      highlightPatterns?: HighlightPattern[];
    }
  ): SavedQuery | undefined {
    const existing = this._queries.get(id);
    if (!existing) return undefined;

    const updated: SavedQuery = {
      ...existing,
      ...updates,
      // Preserve createdAt and usageCount, update lastUsedAt
      lastUsedAt: Date.now(),
    };

    this._queries.set(id, updated);
    return updated;
  }

  /**
   * Delete a query by id.
   * Returns true if the query was found and deleted.
   */
  deleteQuery(id: string): boolean {
    if (!this._queries.has(id)) return false;
    this._queries.delete(id);
    this._history = this._history.filter((h) => h !== id);
    return true;
  }

  /**
   * Get the filter options from a saved query, suitable for passing to LogParser.filter().
   */
  getFilterOptions(id: string): QueryFilterOptions | undefined {
    const query = this._queries.get(id);
    if (!query) return undefined;

    const opts: QueryFilterOptions = {};

    if (query.minLevel) {
      opts.minLevel = query.minLevel;
    }
    if (query.timeStart) {
      const start = new Date(query.timeStart);
      if (!isNaN(start.getTime())) {
        opts.timeStart = start;
      }
    }
    if (query.timeEnd) {
      const end = new Date(query.timeEnd);
      if (!isNaN(end.getTime())) {
        opts.timeEnd = end;
      }
    }
    if (query.pattern) {
      try {
        opts.pattern = new RegExp(query.pattern);
      } catch {
        // Invalid regex — skip it
      }
    }

    return opts;
  }

  /**
   * Record that a query was used. Updates lastUsedAt and increments usageCount.
   */
  recordUsage(id: string): boolean {
    const query = this._queries.get(id);
    if (!query) return false;

    query.lastUsedAt = Date.now();
    query.usageCount++;
    this._addToHistory(id);
    return true;
  }

  /**
   * Get the recent query history (query ids, most recent first).
   */
  getHistory(): string[] {
    return [...this._history];
  }

  /**
   * Export all queries as a JSON string.
   */
  exportJSON(): string {
    const queries = Array.from(this._queries.values());
    return JSON.stringify(queries, null, 2);
  }

  /**
   * Import queries from a JSON string (array of SavedQuery objects).
   * Existing queries with the same id are overwritten.
   */
  importJSON(json: string): { imported: number; errors: number } {
    try {
      const queries = JSON.parse(json) as SavedQuery[];
      let imported = 0;
      let errors = 0;

      for (const q of queries) {
        if (q.id && q.name && q.createdAt) {
          this._queries.set(q.id, q);
          if (!this._history.includes(q.id)) {
            this._history.push(q.id);
          }
          imported++;
        } else {
          errors++;
        }
      }

      // Trim history to maxHistory
      this._trimHistory();

      return { imported, errors };
    } catch {
      return { imported: 0, errors: 1 };
    }
  }

  /**
   * Import queries from a file path.
   */
  importFromFile(filePath: string): { imported: number; errors: number } {
    try {
      const json = fs.readFileSync(filePath, 'utf-8');
      return this.importJSON(json);
    } catch {
      return { imported: 0, errors: 1 };
    }
  }

  /**
   * Export all queries to a file path.
   */
  exportToFile(filePath: string): boolean {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, this.exportJSON(), 'utf-8');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all queries and history.
   */
  clear(): void {
    this._queries.clear();
    this._history = [];
  }

  /**
   * Get the count of saved queries.
   */
  getCount(): number {
    return this._queries.size;
  }

  /**
   * Search queries by name (case-insensitive substring match).
   */
  searchByName(query: string): SavedQuery[] {
    const lower = query.toLowerCase();
    return this.getAllQueries().filter((q) => q.name.toLowerCase().includes(lower));
  }

  /**
   * Generate a unique query id.
   */
  private _generateId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Add a query id to the front of the history, removing duplicates.
   */
  private _addToHistory(id: string): void {
    this._history = this._history.filter((h) => h !== id);
    this._history.unshift(id);
    this._trimHistory();
  }

  /**
   * Trim the history to the configured maximum.
   */
  private _trimHistory(): void {
    if (this._history.length > this._maxHistory) {
      this._history = this._history.slice(0, this._maxHistory);
    }
  }
}
