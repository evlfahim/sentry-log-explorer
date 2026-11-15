import { describe, it, expect } from 'vitest';
import { LogParser, LogLevel } from 'core';

describe('core import', () => {
  it('can import LogParser', () => {
    const parser = new LogParser();
    expect(parser).toBeDefined();
  });

  it('can parse a log line', () => {
    const parser = new LogParser();
    const line = parser.parseLine('2024-01-01 10:00:00 INFO Hello world', 1);
    expect(line.level).toBe(LogLevel.INFO);
    expect(line.message).toBe('Hello world');
    expect(line.lineNumber).toBe(1);
  });
});
