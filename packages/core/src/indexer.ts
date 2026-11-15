import fs from 'fs';
import path from 'path';

export interface LineIndexEntry {
  lineNumber: number;
  byteOffset: number;
}

export interface IndexResult {
  totalLines: number;
  fileSize: number;
  index: Map<number, number>;
}

export interface LineRangeResult {
  lines: string[];
  lineNumbers: number[];
}

export interface IndexStats {
  totalLines: number;
  fileSize: number;
  buildTimeMs: number;
  cacheHits: number;
  cacheMisses: number;
}

export class FileIndexer {
  private readonly _filePath: string;
  private readonly _index: Map<number, number> = new Map();
  private _fileSize: number = 0;
  private _totalLines: number = 0;
  private _isIndexed: boolean = false;
  private _buildTimeMs: number = 0;
  private _cacheHits: number = 0;
  private _cacheMisses: number = 0;

  constructor(filePath: string) {
    this._filePath = path.resolve(filePath);
  }

  get isIndexed(): boolean {
    return this._isIndexed;
  }

  get totalLines(): number {
    return this._totalLines;
  }

  get fileSize(): number {
    return this._fileSize;
  }

  get stats(): IndexStats {
    return {
      totalLines: this._totalLines,
      fileSize: this._fileSize,
      buildTimeMs: this._buildTimeMs,
      cacheHits: this._cacheHits,
      cacheMisses: this._cacheMisses,
    };
  }

  /**
   * Build the byte-offset index by reading the file line by line.
   * Uses createReadStream with a small chunk size to handle huge files
   * without loading them entirely into memory.
   */
  async buildIndex(): Promise<IndexResult> {
    const startTime = Date.now();

    // Get file size
    const stats = fs.statSync(this._filePath);
    this._fileSize = stats.size;

    // If file is empty, return early
    if (this._fileSize === 0) {
      this._isIndexed = true;
      this._totalLines = 0;
      this._buildTimeMs = Date.now() - startTime;
      return {
        totalLines: 0,
        fileSize: 0,
        index: new Map(),
      };
    }

    this._index.clear();
    this._totalLines = 0;

    // Read file line by line using createReadStream
    const stream = fs.createReadStream(this._filePath, {
      encoding: 'utf-8',
      highWaterMark: 64 * 1024, // 64KB chunks
    });

    let buffer = '';
    let byteOffset = 0;
    let lineNum = 0;

    for await (const chunk of stream) {
      buffer += chunk;
      const lines = buffer.split('\n');

      // All but the last element are complete lines
      for (let i = 0; i < lines.length - 1; i++) {
        this._index.set(lineNum, byteOffset);
        byteOffset += lines[i].length + 1; // +1 for the newline character
        lineNum++;
      }

      // Keep the last element as it may be incomplete
      buffer = lines[lines.length - 1];
    }

    // Handle the last line (if file doesn't end with newline)
    if (buffer.length > 0) {
      this._index.set(lineNum, byteOffset);
      lineNum++;
    }

    this._totalLines = lineNum;
    this._isIndexed = true;
    this._buildTimeMs = Date.now() - startTime;

    return {
      totalLines: this._totalLines,
      fileSize: this._fileSize,
      index: new Map(this._index),
    };
  }

  /**
   * Get the byte offset for a specific line number.
   * Returns -1 if the line number is out of range.
   */
  getByteOffset(lineNumber: number): number {
    if (!this._isIndexed) {
      throw new Error('Index not built. Call buildIndex() first.');
    }
    if (lineNumber < 0 || lineNumber >= this._totalLines) {
      return -1;
    }
    return this._index.get(lineNumber) ?? -1;
  }

  /**
   * Get the line number for a specific byte offset.
   * Uses binary search on the index for efficiency.
   * Returns the line number that starts at or before the given byte offset.
   */
  getLineNumberForByteOffset(byteOffset: number): number {
    if (!this._isIndexed) {
      throw new Error('Index not built. Call buildIndex() first.');
    }
    if (byteOffset < 0 || byteOffset > this._fileSize) {
      return -1;
    }

    // Binary search through the index
    const lineNumbers = Array.from(this._index.keys()).sort((a, b) => a - b);
    let lo = 0;
    let hi = lineNumbers.length - 1;
    let result = -1;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const lineNum = lineNumbers[mid];
      const offset = this._index.get(lineNum) ?? -1;

      if (offset === byteOffset) {
        return lineNum;
      } else if (offset < byteOffset) {
        result = lineNum;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    return result;
  }

  /**
   * Read a range of lines from the file using byte offsets.
   * Only reads the necessary portion of the file.
   */
  async readLineRange(startLine: number, endLine: number): Promise<LineRangeResult> {
    if (!this._isIndexed) {
      throw new Error('Index not built. Call buildIndex() first.');
    }

    startLine = Math.max(0, startLine);
    endLine = Math.min(this._totalLines - 1, endLine);

    if (startLine > endLine) {
      return { lines: [], lineNumbers: [] };
    }

    const startOffset = this._index.get(startLine) ?? 0;
    const endOffset = endLine < this._totalLines - 1
      ? (this._index.get(endLine + 1) ?? this._fileSize)
      : this._fileSize;

    // Read only the necessary portion
    const stream = fs.createReadStream(this._filePath, {
      encoding: 'utf-8',
      start: startOffset,
      end: endOffset - 1,
    });

    let buffer = '';
    const lines: string[] = [];
    const lineNumbers: number[] = [];

    for await (const chunk of stream) {
      buffer += chunk;
      const lineParts = buffer.split('\n');

      for (let i = 0; i < lineParts.length; i++) {
        if (i < lineParts.length - 1) {
          // Complete line
          lines.push(lineParts[i]);
          lineNumbers.push(startLine + lines.length - 1);
        } else {
          // Last part may be incomplete - keep it
          buffer = lineParts[i];
        }
      }
    }

    // Handle any remaining buffer (last line without newline)
    if (buffer.length > 0) {
      lines.push(buffer);
      lineNumbers.push(startLine + lines.length - 1);
    }

    return { lines, lineNumbers };
  }

  /**
   * Read a single line by line number.
   */
  async readLine(lineNumber: number): Promise<string | null> {
    if (!this._isIndexed) {
      throw new Error('Index not built. Call buildIndex() first.');
    }

    if (lineNumber < 0 || lineNumber >= this._totalLines) {
      return null;
    }

    const result = await this.readLineRange(lineNumber, lineNumber);
    return result.lines[0] ?? null;
  }

  /**
   * Search for lines matching a regex pattern within a byte range.
   * Returns matching lines with their line numbers and byte offsets.
   */
  async searchInByteRange(
    pattern: RegExp,
    startByte: number,
    endByte: number
  ): Promise<Array<{ line: string; lineNumber: number; byteOffset: number }>> {
    if (!this._isIndexed) {
      throw new Error('Index not built. Call buildIndex() first.');
    }

    const results: Array<{ line: string; lineNumber: number; byteOffset: number }> = [];

    // Find the line numbers that correspond to the byte range
    const startLineNum = this.getLineNumberForByteOffset(startByte);
    const endLineNum = this.getLineNumberForByteOffset(endByte);

    if (startLineNum === -1 || endLineNum === -1) {
      return results;
    }

    // Read the relevant lines
    const { lines, lineNumbers } = await this.readLineRange(startLineNum, endLineNum);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = lineNumbers[i];
      const byteOffset = this._index.get(lineNum) ?? -1;

      if (pattern.test(line)) {
        results.push({ line, lineNumber: lineNum, byteOffset });
      }
    }

    return results;
  }

  /**
   * Get the index as a plain object for serialization.
   */
  getIndexAsObject(): Record<number, number> {
    const obj: Record<number, number> = {};
    for (const [lineNum, offset] of this._index) {
      obj[lineNum] = offset;
    }
    return obj;
  }

  /**
   * Clear the index.
   */
  clearIndex(): void {
    this._index.clear();
    this._isIndexed = false;
    this._totalLines = 0;
    this._fileSize = 0;
    this._buildTimeMs = 0;
  }

  /**
   * Check if a file path is valid and readable.
   */
  static isValidFile(filePath: string): boolean {
    try {
      const resolved = path.resolve(filePath);
      const stats = fs.statSync(resolved);
      return stats.isFile();
    } catch {
      return false;
    }
  }
}
