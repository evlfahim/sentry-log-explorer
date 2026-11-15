import fs from 'fs';
import path from 'path';

/**
 * State of the follow mode.
 */
export interface FollowState {
  /** Whether follow mode is currently active (started and not stopped) */
  isActive: boolean;
  /** Whether follow is currently paused (active but not polling) */
  isPaused: boolean;
  /** Total number of lines currently tracked */
  totalLines: number;
  /** Line number of the last tracked line (0-based) */
  lastLineNumber: number;
  /** File size at last poll */
  lastFileSize: number;
}

/**
 * Callbacks for follow mode events.
 */
export interface FollowCallbacks {
  /** Called when new lines are detected (may be called multiple times) */
  onNewLines?: (lines: string[], lineNumbers: number[]) => void;
  /** Called when follow is paused */
  onPaused?: () => void;
  /** Called when follow is resumed */
  onResumed?: () => void;
  /** Called when follow ends (file deleted, permission lost, etc.) */
  onEnd?: () => void;
}

/**
 * Configuration options for follow mode.
 */
export interface FollowOptions {
  /** Path to the log file to follow */
  filePath: string;
  /** Polling interval in milliseconds (default: 500) */
  pollInterval?: number;
  /** Maximum number of lines to keep in memory (default: 10000) */
  maxLines?: number;
  /** Whether to start in paused state (default: false) */
  initialPaused?: boolean;
  /** Maximum number of consecutive read errors before giving up (default: 5) */
  maxErrors?: number;
}

/**
 * FollowMode watches a log file for new content and notifies via callbacks.
 * It maintains an internal buffer of lines and tracks the file position.
 *
 * Usage:
 *   const follow = new FollowMode({ filePath: '/var/log/app.log' });
 *   follow.onNewLines = (lines, lineNumbers) => { ... };
 *   follow.start();
 *   // ... later
 *   follow.pause();
 *   follow.resume();
 *   follow.stop();
 */
export class FollowMode {
  private readonly _filePath: string;
  private readonly _resolvedPath: string;
  private readonly _pollInterval: number;
  private readonly _maxLines: number;
  private readonly _maxErrors: number;

  private _isActive: boolean = false;
  private _isPaused: boolean = false;
  private _pollTimer: ReturnType<typeof setInterval> | null = null;
  private _lastOffset: number = 0;
  private _lastFileSize: number = 0;
  private _lastLineNumber: number = 0;
  private _lines: string[] = [];
  private _lineNumbers: number[] = [];
  private _errorCount: number = 0;
  private _fileExists: boolean = false;
  private _initialReadDone: boolean = false;
  /** Number of lines present at the last successful poll (for getNewLinesCount) */
  private _lastPollLineCount: number = 0;
  /** Pending incomplete line from previous read (no trailing newline) */
  private _pendingIncomplete: string | null = null;
  /** Callbacks for follow mode events */
  private _callbacks: FollowCallbacks;

  constructor(options: FollowOptions) {
    this._filePath = options.filePath;
    this._resolvedPath = path.resolve(options.filePath);
    this._pollInterval = options.pollInterval ?? 500;
    this._maxLines = options.maxLines ?? 10000;
    this._maxErrors = options.maxErrors ?? 5;
    this._callbacks = {};
  }

  /**
   * Get the current follow state.
   */
  getState(): FollowState {
    return {
      isActive: this._isActive,
      isPaused: this._isPaused,
      totalLines: this._lines.length,
      lastLineNumber: this._lastLineNumber,
      lastFileSize: this._lastFileSize,
    };
  }

  /**
   * Get all tracked lines.
   */
  getLines(): string[] {
    return [...this._lines];
  }

  /**
   * Get all tracked line numbers.
   */
  getLineNumbers(): number[] {
    return [...this._lineNumbers];
  }

  /**
   * Get the number of new lines since the last poll.
   */
  getNewLinesCount(): number {
    const count = this._lines.length - this._lastPollLineCount;
    this._lastPollLineCount = this._lines.length;
    return count;
  }

  /**
   * Check if the file exists and is readable.
   */
  private _checkFile(): boolean {
    try {
      const stats = fs.statSync(this._resolvedPath);
      this._fileExists = stats.isFile();
      return this._fileExists;
    } catch {
      this._fileExists = false;
      return false;
    }
  }

  /**
   * Read new content from the file starting at the last offset.
   * Returns the new lines and their line numbers.
   */
  private _readNewContent(): { lines: string[]; lineNumbers: number[] } | null {
    if (!this._checkFile()) {
      this._errorCount++;
      if (this._errorCount >= this._maxErrors) {
        this._stopInternal();
        if (this._callbacks.onEnd) {
          this._callbacks.onEnd();
        }
      }
      return null;
    }

    try {
      const stats = fs.statSync(this._resolvedPath);
      const currentSize = stats.size;

      // File was truncated (e.g., log rotation)
      if (currentSize < this._lastOffset) {
        // Reset and re-read from the beginning
        this._lastOffset = 0;
        this._lines = [];
        this._lineNumbers = [];
        this._lastLineNumber = 0;
        this._initialReadDone = false;
        this._pendingIncomplete = null;
      }

      if (currentSize === this._lastOffset) {
        // No new content
        return null;
      }

      // Read from last offset to current end
      const fd = fs.openSync(this._resolvedPath, 'r');
      try {
        const buffer = Buffer.alloc(currentSize - this._lastOffset);
        fs.readSync(fd, buffer, 0, buffer.length, this._lastOffset);
        fs.closeSync(fd);

        let content = buffer.toString('utf-8');
        this._lastOffset = currentSize;
        this._lastFileSize = currentSize;

        // If there was a pending incomplete line from the previous read,
        // prepend it to the new content
        if (this._pendingIncomplete !== null) {
          content = this._pendingIncomplete + content;
          this._pendingIncomplete = null;
        }

        // Split into lines
        const rawLines = content.split('\n');

        // If the content doesn't end with a newline, the last element is
        // an incomplete line — don't process it yet (wait for more data)
        let completeLines: string[];

        if (rawLines.length > 0 && !content.endsWith('\n')) {
          // Save the incomplete line for next poll
          this._pendingIncomplete = rawLines[rawLines.length - 1];
          completeLines = rawLines.slice(0, -1);
        } else {
          // Content ends with newline (or is empty): the last element is an
          // artifact of the trailing newline, not a real line. Drop it.
          if (rawLines.length > 0 && rawLines[rawLines.length - 1] === '') {
            completeLines = rawLines.slice(0, -1);
          } else {
            completeLines = rawLines;
          }
        }

        if (completeLines.length === 0 && !this._initialReadDone) {
          // First poll found no complete lines yet — still mark as done
          // so we don't keep waiting forever on a file that only appends
          this._initialReadDone = true;
        }

        if (completeLines.length === 0) {
          return null;
        }

        // Determine starting line number
        let startLineNum: number;
        if (this._lines.length === 0) {
          startLineNum = 0;
        } else {
          startLineNum = this._lineNumbers[this._lineNumbers.length - 1] + 1;
        }

        const newLines: string[] = [];
        const newLineNumbers: number[] = [];

        for (let i = 0; i < completeLines.length; i++) {
          const line = completeLines[i];
          newLines.push(line);
          newLineNumbers.push(startLineNum + i);
        }

        this._initialReadDone = true;

        return { lines: newLines, lineNumbers: newLineNumbers };
      } catch (readErr) {
        fs.closeSync(fd);
        throw readErr;
      }
    } catch {
      this._errorCount++;
      if (this._errorCount >= this._maxErrors) {
        this._stopInternal();
        if (this._callbacks.onEnd) {
          this._callbacks.onEnd();
        }
      }
      return null;
    }
  }

  /**
   * Internal poll function — called on each interval.
   */
  private _poll(): void {
    if (!this._isActive || this._isPaused) {
      return;
    }

    const result = this._readNewContent();

    if (result && result.lines.length > 0) {
      this._errorCount = 0;

      // Append new lines
      this._lines.push(...result.lines);
      this._lineNumbers.push(...result.lineNumbers);
      this._lastLineNumber = this._lineNumbers[this._lineNumbers.length - 1];

      // Trim to maxLines if necessary (keep the most recent lines)
      if (this._lines.length > this._maxLines) {
        const excess = this._lines.length - this._maxLines;
        this._lines = this._lines.slice(excess);
        this._lineNumbers = this._lineNumbers.slice(excess);
        this._lastLineNumber = this._lineNumbers[this._lineNumbers.length - 1];
      }

      if (this._callbacks.onNewLines) {
        this._callbacks.onNewLines(result.lines, result.lineNumbers);
      }
    }
  }

  /**
   * Start following the file.
   * If already started, does nothing.
   */
  start(): void {
    if (this._isActive) {
      return;
    }

    this._isActive = true;
    this._isPaused = false;
    this._errorCount = 0;
    this._lastPollLineCount = 0;

    // Do an initial read to establish the starting position
    const initialResult = this._readNewContent();
    if (initialResult && initialResult.lines.length > 0) {
      this._lines.push(...initialResult.lines);
      this._lineNumbers.push(...initialResult.lineNumbers);
      this._lastLineNumber = this._lineNumbers[this._lineNumbers.length - 1];
    }

    // Record the line count after initial read
    this._lastPollLineCount = this._lines.length;

    // Start polling
    this._pollTimer = setInterval(() => {
      this._poll();
    }, this._pollInterval);
  }

  /**
   * Pause follow mode. No new lines will be polled while paused.
   * Does nothing if already paused or not active.
   */
  pause(): void {
    if (!this._isActive || this._isPaused) {
      return;
    }

    this._isPaused = true;
    if (this._callbacks.onPaused) {
      this._callbacks.onPaused();
    }
  }

  /**
   * Resume follow mode after a pause.
   * Does nothing if not paused or not active.
   */
  resume(): void {
    if (!this._isActive || !this._isPaused) {
      return;
    }

    this._isPaused = false;
    if (this._callbacks.onResumed) {
      this._callbacks.onResumed();
    }
  }

  /**
   * Stop follow mode and release resources.
   * Does nothing if already stopped.
   */
  stop(): void {
    if (!this._isActive) {
      return;
    }

    this._stopInternal();
  }

  /**
   * Internal stop without checking state.
   */
  private _stopInternal(): void {
    this._isActive = false;
    this._isPaused = false;

    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }

  /**
   * Reset the follow position to the beginning of the file.
   * Useful after log rotation or when the user wants to re-read from start.
   */
  reset(): void {
    this._lastOffset = 0;
    this._lastFileSize = 0;
    this._lastLineNumber = 0;
    this._lines = [];
    this._lineNumbers = [];
    this._errorCount = 0;
    this._initialReadDone = false;
    this._pendingIncomplete = null;
    this._lastPollLineCount = 0;
  }

  /**
   * Clear all tracked lines without stopping follow mode.
   */
  clearLines(): void {
    this._lines = [];
    this._lineNumbers = [];
    this._lastLineNumber = 0;
    this._lastPollLineCount = 0;
  }

  /**
   * Destroy the follow instance and release all resources.
   */
  destroy(): void {
    this._stopInternal();
    this._lines = [];
    this._lineNumbers = [];
    this._callbacks = {};
  }
}
