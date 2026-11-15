import { FileIndexer } from './indexer';
import fs from 'fs';
import path from 'path';

describe('FileIndexer', () => {
  const testDir = path.join(__dirname, '__test_files_indexer__');
  let testFile: string;

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    testFile = path.join(testDir, 'test.log');
  });

  afterEach(() => {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  describe('buildIndex', () => {
    it('should build an index for a simple log file', async () => {
      const content = 'INFO: Starting application\nERROR: Something failed\nWARN: Low memory\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      const result = await indexer.buildIndex();

      expect(result.totalLines).toBe(3);
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.index.size).toBe(3);
      expect(indexer.isIndexed).toBe(true);
      expect(indexer.totalLines).toBe(3);
    });

    it('should handle an empty file', async () => {
      fs.writeFileSync(testFile, '');

      const indexer = new FileIndexer(testFile);
      const result = await indexer.buildIndex();

      expect(result.totalLines).toBe(0);
      expect(result.fileSize).toBe(0);
      expect(result.index.size).toBe(0);
    });

    it('should handle a file with no trailing newline', async () => {
      const content = 'INFO: Line one\nERROR: Line two';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      const result = await indexer.buildIndex();

      expect(result.totalLines).toBe(2);
      expect(result.index.size).toBe(2);
    });

    it('should handle a file with a trailing newline', async () => {
      const content = 'INFO: Line one\nERROR: Line two\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      const result = await indexer.buildIndex();

      // Trailing newline does NOT create an extra line
      expect(result.totalLines).toBe(2);
      expect(result.index.size).toBe(2);
    });

    it('should build index within reasonable time for a large file', async () => {
      const lines: string[] = [];
      for (let i = 0; i < 20000; i++) {
        lines.push(`INFO: Log entry ${i} - This is a test log line with some content`);
      }
      fs.writeFileSync(testFile, lines.join('\n'));

      const indexer = new FileIndexer(testFile);
      const result = await indexer.buildIndex();

      expect(result.totalLines).toBe(20000);
      expect(result.fileSize).toBeGreaterThan(0);
      expect(indexer.stats.buildTimeMs).toBeGreaterThan(0);
      expect(indexer.stats.buildTimeMs).toBeLessThan(5000);
    });

    it('should return correct stats', async () => {
      const content = 'INFO: Line one\nERROR: Line two\nWARN: Line three\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      await indexer.buildIndex();

      const stats = indexer.stats;
      expect(stats.totalLines).toBe(3);
      expect(stats.fileSize).toBeGreaterThan(0);
      expect(stats.buildTimeMs).toBeGreaterThan(0);
      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheMisses).toBe(0);
    });
  });

  describe('getByteOffset', () => {
    it('should return correct byte offset for each line', async () => {
      const content = 'INFO: Line one\nERROR: Line two\nWARN: Line three\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      await indexer.buildIndex();

      // Line 0 starts at byte 0
      expect(indexer.getByteOffset(0)).toBe(0);

      // Line 1 starts after "INFO: Line one\n" (15 chars)
      expect(indexer.getByteOffset(1)).toBe(15);

      // Line 2 starts after "ERROR: Line two\n" (16 chars)
      expect(indexer.getByteOffset(2)).toBe(31);
    });

    it('should return -1 for out-of-range line numbers', async () => {
      const content = 'INFO: Line one\nERROR: Line two\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      await indexer.buildIndex();

      expect(indexer.getByteOffset(-1)).toBe(-1);
      expect(indexer.getByteOffset(100)).toBe(-1);
    });

    it('should throw if index not built', () => {
      const indexer = new FileIndexer(testFile);
      expect(() => indexer.getByteOffset(0)).toThrow('Index not built');
    });
  });

  describe('getLineNumberForByteOffset', () => {
    it('should return correct line number for a byte offset', async () => {
      const content = 'INFO: Line one\nERROR: Line two\nWARN: Line three\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      await indexer.buildIndex();

      // Byte 0 is line 0
      expect(indexer.getLineNumberForByteOffset(0)).toBe(0);

      // Byte 15 is line 1
      expect(indexer.getLineNumberForByteOffset(15)).toBe(1);

      // Byte 31 is line 2
      expect(indexer.getLineNumberForByteOffset(31)).toBe(2);
    });

    it('should return the correct line for an offset in the middle of a line', async () => {
      const content = 'INFO: Line one\nERROR: Line two\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      await indexer.buildIndex();

      // Byte 5 is in the middle of line 0
      expect(indexer.getLineNumberForByteOffset(5)).toBe(0);

      // Byte 20 is in the middle of line 1
      expect(indexer.getLineNumberForByteOffset(20)).toBe(1);
    });

    it('should return -1 for out-of-range byte offsets', async () => {
      const content = 'INFO: Line one\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      await indexer.buildIndex();

      expect(indexer.getLineNumberForByteOffset(-1)).toBe(-1);
      expect(indexer.getLineNumberForByteOffset(10000)).toBe(-1);
    });

    it('should throw if index not built', () => {
      const indexer = new FileIndexer(testFile);
      expect(() => indexer.getLineNumberForByteOffset(0)).toThrow('Index not built');
    });
  });

  describe('readLineRange', () => {
    it('should read a range of lines correctly', async () => {
      const content = 'INFO: Line one\nERROR: Line two\nWARN: Line three\nDEBUG: Line four\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      await indexer.buildIndex();

      const result = await indexer.readLineRange(1, 2);

      expect(result.lines).toEqual(['ERROR: Line two', 'WARN: Line three']);
      expect(result.lineNumbers).toEqual([1, 2]);
    });

    it('should read a single line', async () => {
      const content = 'INFO: Line one\nERROR: Line two\nWARN: Line three\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      await indexer.buildIndex();

      const result = await indexer.readLineRange(1, 1);

      expect(result.lines).toEqual(['ERROR: Line two']);
      expect(result.lineNumbers).toEqual([1]);
    });

    it('should handle out-of-range line numbers gracefully', async () => {
      const content = 'INFO: Line one\nERROR: Line two\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      await indexer.buildIndex();

      const result = await indexer.readLineRange(0, 100);

      // Should return all lines (2 lines, no trailing newline extra)
      expect(result.lines.length).toBe(2);
      expect(result.lines[0]).toBe('INFO: Line one');
      expect(result.lines[1]).toBe('ERROR: Line two');
    });

    it('should throw if index not built', async () => {
      const indexer = new FileIndexer(testFile);
      await expect(indexer.readLineRange(0, 10)).rejects.toThrow('Index not built');
    });
  });

  describe('readLine', () => {
    it('should read a single line correctly', async () => {
      const content = 'INFO: Line one\nERROR: Line two\nWARN: Line three\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      await indexer.buildIndex();

      expect(await indexer.readLine(0)).toBe('INFO: Line one');
      expect(await indexer.readLine(1)).toBe('ERROR: Line two');
      expect(await indexer.readLine(2)).toBe('WARN: Line three');
    });

    it('should return null for out-of-range line numbers', async () => {
      const content = 'INFO: Line one\nERROR: Line two\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      await indexer.buildIndex();

      expect(await indexer.readLine(-1)).toBeNull();
      expect(await indexer.readLine(100)).toBeNull();
    });

    it('should throw if index not built', async () => {
      const indexer = new FileIndexer(testFile);
      await expect(indexer.readLine(0)).rejects.toThrow('Index not built');
    });
  });

  describe('searchInByteRange', () => {
    it('should find lines matching a regex pattern', async () => {
      const content = 'INFO: Starting\nERROR: Connection failed\nWARN: Low memory\nERROR: Timeout\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      await indexer.buildIndex();

      const results = await indexer.searchInByteRange(
        /ERROR/,
        0,
        indexer.fileSize
      );

      expect(results.length).toBe(2);
      expect(results[0].line).toBe('ERROR: Connection failed');
      expect(results[0].lineNumber).toBe(1);
      expect(results[1].line).toBe('ERROR: Timeout');
      expect(results[1].lineNumber).toBe(3);
    });

    it('should return empty array when no matches', async () => {
      const content = 'INFO: Starting\nINFO: Running\nINFO: Done\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      await indexer.buildIndex();

      const results = await indexer.searchInByteRange(
        /ERROR/,
        0,
        indexer.fileSize
      );

      expect(results.length).toBe(0);
    });

    it('should respect byte range boundaries', async () => {
      const content = 'INFO: First\nERROR: Should find\nERROR: Should not find\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      await indexer.buildIndex();

      // Search only within the first 5 bytes of line 0 ("INFO:")
      const results = await indexer.searchInByteRange(
        /ERROR/,
        0,
        5
      );

      expect(results.length).toBe(0);
    });

    it('should throw if index not built', async () => {
      const indexer = new FileIndexer(testFile);
      await expect(indexer.searchInByteRange(/test/, 0, 100)).rejects.toThrow('Index not built');
    });
  });

  describe('getIndexAsObject', () => {
    it('should return a plain object representation of the index', async () => {
      const content = 'INFO: Line one\nERROR: Line two\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      await indexer.buildIndex();

      const obj = indexer.getIndexAsObject();

      expect(typeof obj).toBe('object');
      expect(obj[0]).toBe(0);
      expect(obj[1]).toBe(15);
    });
  });

  describe('clearIndex', () => {
    it('should clear all index data', async () => {
      const content = 'INFO: Line one\nERROR: Line two\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      await indexer.buildIndex();

      expect(indexer.isIndexed).toBe(true);
      expect(indexer.totalLines).toBe(2);

      indexer.clearIndex();

      expect(indexer.isIndexed).toBe(false);
      expect(indexer.totalLines).toBe(0);
      expect(indexer.fileSize).toBe(0);
    });
  });

  describe('isValidFile', () => {
    it('should return true for a valid file', () => {
      fs.writeFileSync(testFile, 'test');
      expect(FileIndexer.isValidFile(testFile)).toBe(true);
    });

    it('should return false for a non-existent file', () => {
      expect(FileIndexer.isValidFile('/nonexistent/path/file.log')).toBe(false);
    });

    it('should return false for a directory', () => {
      expect(FileIndexer.isValidFile(testDir)).toBe(false);
    });
  });
});
