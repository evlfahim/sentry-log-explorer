import {
  LogParser,
  LogLevel,
  LOG_LEVEL_SEVERITY,
  normalizeLevel,
  parseTimestamp,
  DEFAULT_PATTERNS,
  ParsedLogLine,
  LogPattern,
} from './parser';
import { FileIndexer } from './indexer';
import fs from 'fs';
import path from 'path';

describe('LogParser', () => {
  const testDir = path.join(__dirname, '__test_files_parser__');
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

  describe('normalizeLevel', () => {
    it('should normalize uppercase levels', () => {
      expect(normalizeLevel('INFO')).toBe(LogLevel.INFO);
      expect(normalizeLevel('ERROR')).toBe(LogLevel.ERROR);
      expect(normalizeLevel('WARN')).toBe(LogLevel.WARN);
      expect(normalizeLevel('WARNING')).toBe(LogLevel.WARNING);
      expect(normalizeLevel('DEBUG')).toBe(LogLevel.DEBUG);
      expect(normalizeLevel('TRACE')).toBe(LogLevel.TRACE);
      expect(normalizeLevel('FATAL')).toBe(LogLevel.FATAL);
    });

    it('should normalize lowercase levels', () => {
      expect(normalizeLevel('info')).toBe(LogLevel.INFO);
      expect(normalizeLevel('error')).toBe(LogLevel.ERROR);
      expect(normalizeLevel('warn')).toBe(LogLevel.WARN);
      expect(normalizeLevel('warning')).toBe(LogLevel.WARNING);
      expect(normalizeLevel('debug')).toBe(LogLevel.DEBUG);
      expect(normalizeLevel('fatal')).toBe(LogLevel.FATAL);
    });

    it('should return UNKNOWN for unrecognized levels', () => {
      expect(normalizeLevel('CRITICAL')).toBe(LogLevel.UNKNOWN);
      expect(normalizeLevel('')).toBe(LogLevel.UNKNOWN);
      expect(normalizeLevel('   ')).toBe(LogLevel.UNKNOWN);
    });
  });

  describe('parseTimestamp', () => {
    it('should parse ISO 8601 with T separator', () => {
      const d = parseTimestamp('2024-01-15T10:30:45');
      expect(d).not.toBeNull();
      expect(d!.getFullYear()).toBe(2024);
      expect(d!.getMonth()).toBe(0);
      expect(d!.getDate()).toBe(15);
      expect(d!.getHours()).toBe(10);
      expect(d!.getMinutes()).toBe(30);
      expect(d!.getSeconds()).toBe(45);
    });

    it('should parse ISO 8601 with space separator', () => {
      const d = parseTimestamp('2024-01-15 10:30:45');
      expect(d).not.toBeNull();
      expect(d!.getFullYear()).toBe(2024);
      expect(d!.getHours()).toBe(10);
    });

    it('should parse ISO 8601 with milliseconds', () => {
      const d = parseTimestamp('2024-01-15T10:30:45.123');
      expect(d).not.toBeNull();
      expect(d!.getMilliseconds()).toBe(123);
    });

    it('should parse ISO 8601 with timezone offset', () => {
      const d = parseTimestamp('2024-01-15T10:30:45+05:30');
      expect(d).not.toBeNull();
    });

    it('should parse ISO 8601 with Z suffix', () => {
      const d = parseTimestamp('2024-01-15T10:30:45Z');
      expect(d).not.toBeNull();
    });

    it('should parse epoch milliseconds', () => {
      const d = parseTimestamp('1705312245000');
      expect(d).not.toBeNull();
      expect(d!.getFullYear()).toBe(2024);
    });

    it('should parse epoch seconds', () => {
      const d = parseTimestamp('1705312245');
      expect(d).not.toBeNull();
      expect(d!.getFullYear()).toBe(2024);
    });

    it('should return null for invalid timestamps', () => {
      expect(parseTimestamp('')).toBeNull();
      expect(parseTimestamp(null as any)).toBeNull();
      expect(parseTimestamp('not a date')).toBeNull();
      expect(parseTimestamp('   ')).toBeNull();
    });
  });

  describe('parseLine', () => {
    let parser: LogParser;

    beforeEach(() => {
      parser = new LogParser();
    });

    it('should parse ISO 8601 timestamp with level prefix', () => {
      const line = '2024-01-15T10:30:45 INFO Application started';
      const result = parser.parseLine(line, 0);

      expect(result.lineNumber).toBe(0);
      expect(result.rawLine).toBe(line);
      expect(result.timestamp).not.toBeNull();
      expect(result.level).toBe(LogLevel.INFO);
      expect(result.message).toBe('Application started');
      expect(result.rawTimestamp).toBe('2024-01-15T10:30:45');
      expect(result.rawLevel).toBe('INFO');
    });

    it('should parse date with space separator and level prefix', () => {
      const line = '2024-01-15 10:30:45 ERROR Connection failed';
      const result = parser.parseLine(line, 0);

      expect(result.level).toBe(LogLevel.ERROR);
      expect(result.message).toBe('Connection failed');
      expect(result.timestamp).not.toBeNull();
    });

    it('should parse level prefix only (no timestamp)', () => {
      const line = 'WARN Low memory';
      const result = parser.parseLine(line, 0);

      expect(result.level).toBe(LogLevel.WARN);
      expect(result.message).toBe('Low memory');
      expect(result.timestamp).toBeNull();
      expect(result.rawTimestamp).toBeNull();
    });

    it('should parse timestamp with level in brackets', () => {
      const line = '2024-01-15T10:30:45 [ERROR] Disk full';
      const result = parser.parseLine(line, 0);

      expect(result.level).toBe(LogLevel.ERROR);
      expect(result.message).toBe('Disk full');
      expect(result.timestamp).not.toBeNull();
    });

    it('should parse timestamp with level in angle brackets', () => {
      const line = '2024-01-15T10:30:45 <FATAL> System crash';
      const result = parser.parseLine(line, 0);

      expect(result.level).toBe(LogLevel.FATAL);
      expect(result.message).toBe('System crash');
    });

    it('should parse timestamp with level in parentheses', () => {
      const line = '2024-01-15T10:30:45 (DEBUG) Variable x = 42';
      const result = parser.parseLine(line, 0);

      expect(result.level).toBe(LogLevel.DEBUG);
      expect(result.message).toBe('Variable x = 42');
    });

    it('should parse epoch timestamp with level', () => {
      const line = '1705312245000 INFO Service ready';
      const result = parser.parseLine(line, 0);

      expect(result.level).toBe(LogLevel.INFO);
      expect(result.message).toBe('Service ready');
      expect(result.timestamp).not.toBeNull();
    });

    it('should return UNKNOWN level when no pattern matches', () => {
      const line = 'This is a plain log line without any structure';
      const result = parser.parseLine(line, 0);

      expect(result.level).toBe(LogLevel.UNKNOWN);
      expect(result.message).toBe(line);
      expect(result.timestamp).toBeNull();
      expect(result.rawLevel).toBeNull();
    });

    it('should include correct line number', () => {
      const line = 'INFO Test message';
      const result = parser.parseLine(line, 42);

      expect(result.lineNumber).toBe(42);
    });

    it('should handle WARNING as equivalent to WARN', () => {
      const line = '2024-01-15T10:30:45 WARNING Deprecated API';
      const result = parser.parseLine(line, 0);

      expect(result.level).toBe(LogLevel.WARNING);
    });
  });

  describe('parseLines', () => {
    it('should parse multiple lines correctly', () => {
      const parser = new LogParser();
      const result = parser.parseLines({
        lines: [
          '2024-01-15T10:30:45 INFO Starting',
          '2024-01-15T10:30:46 ERROR Failed',
          'WARN Low memory',
        ],
        lineNumbers: [0, 1, 2],
      });

      expect(result).toHaveLength(3);
      expect(result[0].level).toBe(LogLevel.INFO);
      expect(result[1].level).toBe(LogLevel.ERROR);
      expect(result[2].level).toBe(LogLevel.WARN);
      expect(result[0].lineNumber).toBe(0);
      expect(result[1].lineNumber).toBe(1);
      expect(result[2].lineNumber).toBe(2);
    });

    it('should handle empty lines array', () => {
      const parser = new LogParser();
      const result = parser.parseLines({ lines: [], lineNumbers: [] });
      expect(result).toHaveLength(0);
    });
  });

  describe('parseRange', () => {
    it('should parse a range of lines from a FileIndexer', async () => {
      const content =
        '2024-01-15T10:30:45 INFO Starting\n2024-01-15T10:30:46 ERROR Failed\n2024-01-15T10:30:47 WARN Low memory\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      await indexer.buildIndex();

      const parser = new LogParser();
      const result = await parser.parseRange(indexer, 0, 2);

      expect(result).toHaveLength(3);
      expect(result[0].level).toBe(LogLevel.INFO);
      expect(result[1].level).toBe(LogLevel.ERROR);
      expect(result[2].level).toBe(LogLevel.WARN);
    });

    it('should parse a single line range', async () => {
      const content = 'INFO Line one\nERROR Line two\nWARN Line three\n';
      fs.writeFileSync(testFile, content);

      const indexer = new FileIndexer(testFile);
      await indexer.buildIndex();

      const parser = new LogParser();
      const result = await parser.parseRange(indexer, 1, 1);

      expect(result).toHaveLength(1);
      expect(result[0].level).toBe(LogLevel.ERROR);
      expect(result[0].message).toBe('Line two');
    });
  });

  describe('filterByLevel', () => {
    it('should filter lines by minimum log level', () => {
      const parser = new LogParser();
      const lines: ParsedLogLine[] = [
        { lineNumber: 0, rawLine: 'TRACE msg', timestamp: null, level: LogLevel.TRACE, message: 'msg', rawTimestamp: null, rawLevel: 'TRACE' },
        { lineNumber: 1, rawLine: 'DEBUG msg', timestamp: null, level: LogLevel.DEBUG, message: 'msg', rawTimestamp: null, rawLevel: 'DEBUG' },
        { lineNumber: 2, rawLine: 'INFO msg', timestamp: null, level: LogLevel.INFO, message: 'msg', rawTimestamp: null, rawLevel: 'INFO' },
        { lineNumber: 3, rawLine: 'WARN msg', timestamp: null, level: LogLevel.WARN, message: 'msg', rawTimestamp: null, rawLevel: 'WARN' },
        { lineNumber: 4, rawLine: 'ERROR msg', timestamp: null, level: LogLevel.ERROR, message: 'msg', rawTimestamp: null, rawLevel: 'ERROR' },
        { lineNumber: 5, rawLine: 'FATAL msg', timestamp: null, level: LogLevel.FATAL, message: 'msg', rawTimestamp: null, rawLevel: 'FATAL' },
      ];

      const result = parser.filterByLevel(lines, LogLevel.WARN);
      expect(result).toHaveLength(3);
      expect(result.map((l) => l.level)).toEqual([LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL]);
    });

    it('should return all lines when filtering by UNKNOWN', () => {
      const parser = new LogParser();
      const lines: ParsedLogLine[] = [
        { lineNumber: 0, rawLine: 'INFO msg', timestamp: null, level: LogLevel.INFO, message: 'msg', rawTimestamp: null, rawLevel: 'INFO' },
        { lineNumber: 1, rawLine: 'ERROR msg', timestamp: null, level: LogLevel.ERROR, message: 'msg', rawTimestamp: null, rawLevel: 'ERROR' },
      ];

      const result = parser.filterByLevel(lines, LogLevel.UNKNOWN);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no lines meet the level', () => {
      const parser = new LogParser();
      const lines: ParsedLogLine[] = [
        { lineNumber: 0, rawLine: 'INFO msg', timestamp: null, level: LogLevel.INFO, message: 'msg', rawTimestamp: null, rawLevel: 'INFO' },
      ];

      const result = parser.filterByLevel(lines, LogLevel.FATAL);
      expect(result).toHaveLength(0);
    });
  });

  describe('filterByTimeRange', () => {
    it('should filter lines by time range', () => {
      const parser = new LogParser();
      const start = new Date('2024-01-15T10:30:45');
      const end = new Date('2024-01-15T10:30:47');

      const lines: ParsedLogLine[] = [
        { lineNumber: 0, rawLine: 'msg1', timestamp: new Date('2024-01-15T10:30:44'), level: LogLevel.INFO, message: 'msg1', rawTimestamp: null, rawLevel: null },
        { lineNumber: 1, rawLine: 'msg2', timestamp: new Date('2024-01-15T10:30:45'), level: LogLevel.INFO, message: 'msg2', rawTimestamp: null, rawLevel: null },
        { lineNumber: 2, rawLine: 'msg3', timestamp: new Date('2024-01-15T10:30:46'), level: LogLevel.ERROR, message: 'msg3', rawTimestamp: null, rawLevel: null },
        { lineNumber: 3, rawLine: 'msg4', timestamp: new Date('2024-01-15T10:30:47'), level: LogLevel.WARN, message: 'msg4', rawTimestamp: null, rawLevel: null },
        { lineNumber: 4, rawLine: 'msg5', timestamp: new Date('2024-01-15T10:30:48'), level: LogLevel.INFO, message: 'msg5', rawTimestamp: null, rawLevel: null },
      ];

      const result = parser.filterByTimeRange(lines, start, end);
      expect(result).toHaveLength(3);
      expect(result.map((l) => l.lineNumber)).toEqual([1, 2, 3]);
    });

    it('should exclude lines without timestamps', () => {
      const parser = new LogParser();
      const start = new Date('2024-01-15T10:30:45');
      const end = new Date('2024-01-15T10:30:47');

      const lines: ParsedLogLine[] = [
        { lineNumber: 0, rawLine: 'msg1', timestamp: new Date('2024-01-15T10:30:45'), level: LogLevel.INFO, message: 'msg1', rawTimestamp: null, rawLevel: null },
        { lineNumber: 1, rawLine: 'msg2', timestamp: null, level: LogLevel.UNKNOWN, message: 'msg2', rawTimestamp: null, rawLevel: null },
        { lineNumber: 2, rawLine: 'msg3', timestamp: new Date('2024-01-15T10:30:46'), level: LogLevel.ERROR, message: 'msg3', rawTimestamp: null, rawLevel: null },
      ];

      const result = parser.filterByTimeRange(lines, start, end);
      expect(result).toHaveLength(2);
      expect(result.map((l) => l.lineNumber)).toEqual([0, 2]);
    });
  });

  describe('filterByPattern', () => {
    it('should filter lines matching a regex pattern', () => {
      const parser = new LogParser();
      const lines: ParsedLogLine[] = [
        { lineNumber: 0, rawLine: 'ERROR: Connection failed', timestamp: null, level: LogLevel.ERROR, message: 'Connection failed', rawTimestamp: null, rawLevel: 'ERROR' },
        { lineNumber: 1, rawLine: 'INFO: Request processed', timestamp: null, level: LogLevel.INFO, message: 'Request processed', rawTimestamp: null, rawLevel: 'INFO' },
        { lineNumber: 2, rawLine: 'ERROR: Timeout occurred', timestamp: null, level: LogLevel.ERROR, message: 'Timeout occurred', rawTimestamp: null, rawLevel: 'ERROR' },
      ];

      const result = parser.filterByPattern(lines, /ERROR/);
      expect(result).toHaveLength(2);
      expect(result.map((l) => l.lineNumber)).toEqual([0, 2]);
    });

    it('should return empty array when no lines match', () => {
      const parser = new LogParser();
      const lines: ParsedLogLine[] = [
        { lineNumber: 0, rawLine: 'INFO: OK', timestamp: null, level: LogLevel.INFO, message: 'OK', rawTimestamp: null, rawLevel: 'INFO' },
      ];

      const result = parser.filterByPattern(lines, /ERROR/);
      expect(result).toHaveLength(0);
    });
  });

  describe('filter (combined)', () => {
    it('should apply all filters together', () => {
      const parser = new LogParser();
      const lines: ParsedLogLine[] = [
        { lineNumber: 0, rawLine: '2024-01-15T10:30:45 INFO Starting', timestamp: new Date('2024-01-15T10:30:45'), level: LogLevel.INFO, message: 'Starting', rawTimestamp: '2024-01-15T10:30:45', rawLevel: 'INFO' },
        { lineNumber: 1, rawLine: '2024-01-15T10:30:46 ERROR Connection failed', timestamp: new Date('2024-01-15T10:30:46'), level: LogLevel.ERROR, message: 'Connection failed', rawTimestamp: '2024-01-15T10:30:46', rawLevel: 'ERROR' },
        { lineNumber: 2, rawLine: '2024-01-15T10:30:47 WARN Low memory', timestamp: new Date('2024-01-15T10:30:47'), level: LogLevel.WARN, message: 'Low memory', rawTimestamp: '2024-01-15T10:30:47', rawLevel: 'WARN' },
        { lineNumber: 3, rawLine: '2024-01-15T10:30:48 ERROR Timeout', timestamp: new Date('2024-01-15T10:30:48'), level: LogLevel.ERROR, message: 'Timeout', rawTimestamp: '2024-01-15T10:30:48', rawLevel: 'ERROR' },
        { lineNumber: 4, rawLine: '2024-01-15T10:30:49 INFO Done', timestamp: new Date('2024-01-15T10:30:49'), level: LogLevel.INFO, message: 'Done', rawTimestamp: '2024-01-15T10:30:49', rawLevel: 'INFO' },
      ];

      const result = parser.filter(lines, {
        minLevel: LogLevel.ERROR,
        timeStart: new Date('2024-01-15T10:30:46'),
        timeEnd: new Date('2024-01-15T10:30:48'),
        pattern: /Connection/,
      });

      expect(result).toHaveLength(1);
      expect(result[0].lineNumber).toBe(1);
      expect(result[0].level).toBe(LogLevel.ERROR);
    });

    it('should return all lines when no filters are specified', () => {
      const parser = new LogParser();
      const lines: ParsedLogLine[] = [
        { lineNumber: 0, rawLine: 'INFO msg', timestamp: null, level: LogLevel.INFO, message: 'msg', rawTimestamp: null, rawLevel: 'INFO' },
        { lineNumber: 1, rawLine: 'ERROR msg', timestamp: null, level: LogLevel.ERROR, message: 'msg', rawTimestamp: null, rawLevel: 'ERROR' },
      ];

      const result = parser.filter(lines);
      expect(result).toHaveLength(2);
    });

    it('should work with only level filter', () => {
      const parser = new LogParser();
      const lines: ParsedLogLine[] = [
        { lineNumber: 0, rawLine: 'INFO msg', timestamp: null, level: LogLevel.INFO, message: 'msg', rawTimestamp: null, rawLevel: 'INFO' },
        { lineNumber: 1, rawLine: 'ERROR msg', timestamp: null, level: LogLevel.ERROR, message: 'msg', rawTimestamp: null, rawLevel: 'ERROR' },
      ];

      const result = parser.filter(lines, { minLevel: LogLevel.ERROR });
      expect(result).toHaveLength(1);
      expect(result[0].level).toBe(LogLevel.ERROR);
    });
  });

  describe('patterns', () => {
    it('should have default patterns', () => {
      const parser = new LogParser();
      expect(parser.patterns).toHaveLength(DEFAULT_PATTERNS.length);
      expect(parser.patterns.length).toBeGreaterThan(0);
    });

    it('should use custom patterns when provided', () => {
      const customPattern: LogPattern = {
        name: 'Custom format',
        regex: /^(CUSTOM)\s+(.*)$/,
        levelGroup: 1,
        messageGroup: 2,
      };
      const parser = new LogParser([customPattern]);
      expect(parser.patterns).toHaveLength(1);
      expect(parser.patterns[0].name).toBe('Custom format');
    });

    it('should use custom patterns for parsing', () => {
      const customPattern: LogPattern = {
        name: 'Custom format',
        regex: /^(CUSTOM)\s+(.*)$/,
        levelGroup: 1,
        messageGroup: 2,
      };
      const parser = new LogParser([customPattern]);
      const result = parser.parseLine('CUSTOM test message', 0);

      // CUSTOM is not a known LogLevel, so it normalizes to UNKNOWN
      expect(result.level).toBe(LogLevel.UNKNOWN);
      expect(result.rawLevel).toBe('CUSTOM');
      expect(result.message).toBe('test message');
    });
  });

  describe('LOG_LEVEL_SEVERITY', () => {
    it('should have correct severity ordering', () => {
      expect(LOG_LEVEL_SEVERITY[LogLevel.TRACE]).toBe(0);
      expect(LOG_LEVEL_SEVERITY[LogLevel.DEBUG]).toBe(10);
      expect(LOG_LEVEL_SEVERITY[LogLevel.INFO]).toBe(20);
      expect(LOG_LEVEL_SEVERITY[LogLevel.WARN]).toBe(30);
      expect(LOG_LEVEL_SEVERITY[LogLevel.WARNING]).toBe(30);
      expect(LOG_LEVEL_SEVERITY[LogLevel.ERROR]).toBe(40);
      expect(LOG_LEVEL_SEVERITY[LogLevel.FATAL]).toBe(50);
      expect(LOG_LEVEL_SEVERITY[LogLevel.UNKNOWN]).toBe(-1);
    });
  });
});
