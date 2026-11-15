import {
  PatternHighlighter,
  HighlightPattern,
  HighlightColor,
  HighlightedSegment,
  HighlightResult,
  DEFAULT_HIGHLIGHT_PATTERNS,
  DEFAULT_LEVEL_COLORS,
  LogLevel,
} from './highlighter';

describe('PatternHighlighter', () => {
  describe('constructor', () => {
    it('should initialize with no patterns', () => {
      const h = new PatternHighlighter();
      expect(h.patterns).toHaveLength(0);
    });

    it('should initialize with provided patterns', () => {
      const pattern: HighlightPattern = {
        name: 'Test',
        regex: /test/,
        color: { color: '#ff0000' },
      };
      const h = new PatternHighlighter([pattern]);
      expect(h.patterns).toHaveLength(1);
      expect(h.patterns[0].name).toBe('Test');
    });

    it('should copy patterns (not reference)', () => {
      const pattern: HighlightPattern = {
        name: 'Test',
        regex: /test/,
        color: { color: '#ff0000' },
      };
      const patterns = [pattern];
      const h = new PatternHighlighter(patterns);
      h.patterns[0].name = 'Modified';
      expect(patterns[0].name).toBe('Test');
    });
  });

  describe('addPattern', () => {
    it('should add a new pattern', () => {
      const h = new PatternHighlighter();
      const pattern: HighlightPattern = {
        name: 'Test',
        regex: /test/,
        color: { color: '#ff0000' },
      };
      h.addPattern(pattern);
      expect(h.patterns).toHaveLength(1);
      expect(h.patterns[0].name).toBe('Test');
    });

    it('should replace an existing pattern with the same name', () => {
      const h = new PatternHighlighter();
      h.addPattern({
        name: 'Test',
        regex: /old/,
        color: { color: '#ff0000' },
      });
      h.addPattern({
        name: 'Test',
        regex: /new/,
        color: { color: '#00ff00' },
      });
      expect(h.patterns).toHaveLength(1);
      expect(h.patterns[0].regex.source).toBe('new');
      expect(h.patterns[0].color.color).toBe('#00ff00');
    });
  });

  describe('removePattern', () => {
    it('should remove a pattern by name', () => {
      const h = new PatternHighlighter();
      h.addPattern({
        name: 'Keep',
        regex: /keep/,
        color: { color: '#ff0000' },
      });
      h.addPattern({
        name: 'Remove',
        regex: /remove/,
        color: { color: '#00ff00' },
      });
      h.removePattern('Remove');
      expect(h.patterns).toHaveLength(1);
      expect(h.patterns[0].name).toBe('Keep');
    });

    it('should do nothing when removing a non-existent pattern', () => {
      const h = new PatternHighlighter();
      h.addPattern({
        name: 'Keep',
        regex: /keep/,
        color: { color: '#ff0000' },
      });
      h.removePattern('NonExistent');
      expect(h.patterns).toHaveLength(1);
    });
  });

  describe('setPatterns', () => {
    it('should replace all patterns', () => {
      const h = new PatternHighlighter();
      h.addPattern({
        name: 'Old',
        regex: /old/,
        color: { color: '#ff0000' },
      });
      h.setPatterns([
        {
          name: 'New1',
          regex: /new1/,
          color: { color: '#00ff00' },
        },
        {
          name: 'New2',
          regex: /new2/,
          color: { color: '#0000ff' },
        },
      ]);
      expect(h.patterns).toHaveLength(2);
      expect(h.patterns[0].name).toBe('New1');
      expect(h.patterns[1].name).toBe('New2');
    });
  });

  describe('highlight (single line)', () => {
    it('should return plain text when no patterns match', () => {
      const h = new PatternHighlighter();
      const result = h.highlight('Hello world');
      expect(result.totalMatches).toBe(0);
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].text).toBe('Hello world');
      expect(result.segments[0].isMatch).toBe(false);
    });

    it('should highlight a simple regex match', () => {
      const h = new PatternHighlighter([
        {
          name: 'Error',
          regex: /ERROR/,
          color: { color: '#d32f2f' },
        },
      ]);
      const result = h.highlight('Something ERROR happened');
      expect(result.totalMatches).toBe(1);
      expect(result.segments).toHaveLength(3);
      expect(result.segments[0].text).toBe('Something ');
      expect(result.segments[0].isMatch).toBe(false);
      expect(result.segments[1].text).toBe('ERROR');
      expect(result.segments[1].isMatch).toBe(true);
      expect(result.segments[1].color.color).toBe('#d32f2f');
    });

    it('should highlight multiple matches', () => {
      const h = new PatternHighlighter([
        {
          name: 'Error',
          regex: /ERROR/,
          color: { color: '#d32f2f' },
        },
      ]);
      const result = h.highlight('ERROR first and ERROR second');
      expect(result.totalMatches).toBe(2);
      expect(result.segments).toHaveLength(4);
      // match, plain, match, plain (first match is at start, no leading plain text)
      expect(result.segments[0].isMatch).toBe(true);
      expect(result.segments[1].isMatch).toBe(false);
      expect(result.segments[2].isMatch).toBe(true);
      expect(result.segments[3].isMatch).toBe(false);
    });

    it('should highlight at the start of a line', () => {
      const h = new PatternHighlighter([
        {
          name: 'Error',
          regex: /ERROR/,
          color: { color: '#d32f2f' },
        },
      ]);
      const result = h.highlight('ERROR at start');
      expect(result.totalMatches).toBe(1);
      expect(result.segments).toHaveLength(2);
      expect(result.segments[0].text).toBe('ERROR');
      expect(result.segments[0].isMatch).toBe(true);
      expect(result.segments[0].color.color).toBe('#d32f2f');
    });

    it('should highlight at the end of a line', () => {
      const h = new PatternHighlighter([
        {
          name: 'Error',
          regex: /ERROR/,
          color: { color: '#d32f2f' },
        },
      ]);
      const result = h.highlight('at end ERROR');
      expect(result.totalMatches).toBe(1);
      expect(result.segments).toHaveLength(2);
      expect(result.segments[0].isMatch).toBe(false);
      expect(result.segments[1].isMatch).toBe(true);
    });

    it('should handle an empty string', () => {
      const h = new PatternHighlighter([
        {
          name: 'Error',
          regex: /ERROR/,
          color: { color: '#d32f2f' },
        },
      ]);
      const result = h.highlight('');
      expect(result.totalMatches).toBe(0);
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].text).toBe('');
      expect(result.segments[0].isMatch).toBe(false);
    });

    it('should use capture group targeting', () => {
      const h = new PatternHighlighter([
        {
          name: 'Level',
          regex: /(\d{4}-\d{2}-\d{2})\s+(ERROR)/,
          color: { color: '#d32f2f' },
          group: 2,
        },
      ]);
      const result = h.highlight('2024-01-15 ERROR something');
      expect(result.totalMatches).toBe(1);
      // Only the group should be highlighted, not the timestamp
      const matchSegment = result.segments.find((s) => s.isMatch);
      expect(matchSegment).toBeDefined();
      expect(matchSegment!.text).toBe('ERROR');
    });

    it('should highlight entire match when group is undefined', () => {
      const h = new PatternHighlighter([
        {
          name: 'Full',
          regex: /(\d{4}-\d{2}-\d{2})\s+(ERROR)/,
          color: { color: '#d32f2f' },
        },
      ]);
      const result = h.highlight('2024-01-15 ERROR something');
      expect(result.totalMatches).toBe(1);
      const matchSegment = result.segments.find((s) => s.isMatch);
      expect(matchSegment).toBeDefined();
      expect(matchSegment!.text).toBe('2024-01-15 ERROR');
    });

    it('should highlight entire match when group is 0', () => {
      const h = new PatternHighlighter([
        {
          name: 'Full',
          regex: /(\d{4}-\d{2}-\d{2})\s+(ERROR)/,
          color: { color: '#d32f2f' },
          group: 0,
        },
      ]);
      const result = h.highlight('2024-01-15 ERROR something');
      expect(result.totalMatches).toBe(1);
      const matchSegment = result.segments.find((s) => s.isMatch);
      expect(matchSegment).toBeDefined();
      expect(matchSegment!.text).toBe('2024-01-15 ERROR');
    });

    it('should apply background color when specified', () => {
      const h = new PatternHighlighter([
        {
          name: 'Fatal',
          regex: /FATAL/,
          color: { color: '#b71c1c', backgroundColor: '#ffcdd2' },
        },
      ]);
      const result = h.highlight('FATAL crash');
      const matchSegment = result.segments.find((s) => s.isMatch);
      expect(matchSegment).toBeDefined();
      expect(matchSegment!.color.backgroundColor).toBe('#ffcdd2');
    });

    it('should apply font weight when specified', () => {
      const h = new PatternHighlighter([
        {
          name: 'Bold',
          regex: /ERROR/,
          color: { color: '#d32f2f', fontWeight: 'bold' },
        },
      ]);
      const result = h.highlight('ERROR here');
      const matchSegment = result.segments.find((s) => s.isMatch);
      expect(matchSegment).toBeDefined();
      expect(matchSegment!.color.fontWeight).toBe('bold');
    });

    it('should apply font style when specified', () => {
      const h = new PatternHighlighter([
        {
          name: 'Italic',
          regex: /WARN/,
          color: { color: '#ed6c02', fontStyle: 'italic' },
        },
      ]);
      const result = h.highlight('WARN here');
      const matchSegment = result.segments.find((s) => s.isMatch);
      expect(matchSegment).toBeDefined();
      expect(matchSegment!.color.fontStyle).toBe('italic');
    });
  });

  describe('highlightLines (batch)', () => {
    it('should highlight multiple lines', () => {
      const h = new PatternHighlighter([
        {
          name: 'Error',
          regex: /ERROR/,
          color: { color: '#d32f2f' },
        },
      ]);
      const lines = ['INFO ok', 'ERROR fail', 'INFO ok'];
      const results = h.highlightLines(lines);
      expect(results).toHaveLength(3);
      expect(results[0].totalMatches).toBe(0);
      expect(results[1].totalMatches).toBe(1);
      expect(results[2].totalMatches).toBe(0);
    });

    it('should handle empty lines array', () => {
      const h = new PatternHighlighter([
        {
          name: 'Error',
          regex: /ERROR/,
          color: { color: '#d32f2f' },
        },
      ]);
      const results = h.highlightLines([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('priority-based overlap resolution', () => {
    it('should give higher priority matches precedence', () => {
      const h = new PatternHighlighter([
        {
          name: 'Low priority',
          regex: /ERROR/,
          color: { color: '#555555' },
          priority: 1,
        },
        {
          name: 'High priority',
          regex: /ERROR/,
          color: { color: '#d32f2f' },
          priority: 10,
        },
      ]);
      const result = h.highlight('ERROR here');
      expect(result.totalMatches).toBe(1);
      const matchSegment = result.segments.find((s) => s.isMatch);
      expect(matchSegment!.color.color).toBe('#d32f2f');
    });

    it('should resolve overlapping patterns at the same position', () => {
      const h = new PatternHighlighter([
        {
          name: 'Numbers',
          regex: /\d+/,
          color: { color: '#00695c' },
          priority: 1,
        },
        {
          name: 'IP address',
          regex: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
          color: { color: '#6a1b9a' },
          priority: 5,
        },
      ]);
      const result = h.highlight('192.168.1.1 is an IP');
      expect(result.totalMatches).toBe(1);
      const matchSegment = result.segments.find((s) => s.isMatch);
      expect(matchSegment!.text).toBe('192.168.1.1');
      expect(matchSegment!.color.color).toBe('#6a1b9a');
    });

    it('should handle non-overlapping matches from different patterns', () => {
      const h = new PatternHighlighter([
        {
          name: 'Error',
          regex: /ERROR/,
          color: { color: '#d32f2f' },
          priority: 1,
        },
        {
          name: 'Number',
          regex: /\d+/,
          color: { color: '#00695c' },
          priority: 2,
        },
      ]);
      const result = h.highlight('ERROR 42');
      expect(result.totalMatches).toBe(2);
      const matches = result.segments.filter((s) => s.isMatch);
      expect(matches).toHaveLength(2);
      expect(matches[0].text).toBe('ERROR');
      expect(matches[1].text).toBe('42');
    });

    it('should handle equal priority by keeping the first match', () => {
      const h = new PatternHighlighter([
        {
          name: 'First',
          regex: /ERROR/,
          color: { color: '#d32f2f' },
          priority: 5,
        },
        {
          name: 'Second',
          regex: /ERROR/,
          color: { color: '#00695c' },
          priority: 5,
        },
      ]);
      const result = h.highlight('ERROR here');
      expect(result.totalMatches).toBe(1);
      const matchSegment = result.segments.find((s) => s.isMatch);
      // First pattern added should win at equal priority
      expect(matchSegment!.color.color).toBe('#d32f2f');
    });
  });

  describe('DEFAULT_HIGHLIGHT_PATTERNS', () => {
    it('should have multiple default patterns', () => {
      expect(DEFAULT_HIGHLIGHT_PATTERNS.length).toBeGreaterThan(0);
    });

    it('should have patterns with names', () => {
      for (const p of DEFAULT_HIGHLIGHT_PATTERNS) {
        expect(p.name).toBeDefined();
        expect(p.name.length).toBeGreaterThan(0);
      }
    });

    it('should have patterns with valid regex', () => {
      for (const p of DEFAULT_HIGHLIGHT_PATTERNS) {
        expect(p.regex).toBeInstanceOf(RegExp);
      }
    });

    it('should have patterns with colors', () => {
      for (const p of DEFAULT_HIGHLIGHT_PATTERNS) {
        expect(p.color).toBeDefined();
        expect(p.color.color).toBeDefined();
      }
    });
  });

  describe('DEFAULT_LEVEL_COLORS', () => {
    it('should have colors for all log levels', () => {
      expect(DEFAULT_LEVEL_COLORS[LogLevel.TRACE]).toBeDefined();
      expect(DEFAULT_LEVEL_COLORS[LogLevel.DEBUG]).toBeDefined();
      expect(DEFAULT_LEVEL_COLORS[LogLevel.INFO]).toBeDefined();
      expect(DEFAULT_LEVEL_COLORS[LogLevel.WARN]).toBeDefined();
      expect(DEFAULT_LEVEL_COLORS[LogLevel.WARNING]).toBeDefined();
      expect(DEFAULT_LEVEL_COLORS[LogLevel.ERROR]).toBeDefined();
      expect(DEFAULT_LEVEL_COLORS[LogLevel.FATAL]).toBeDefined();
      expect(DEFAULT_LEVEL_COLORS[LogLevel.UNKNOWN]).toBeDefined();
    });

    it('should have color property for each level', () => {
      for (const level of Object.values(LogLevel)) {
        if (level === LogLevel.UNKNOWN) continue;
        expect(DEFAULT_LEVEL_COLORS[level].color).toBeDefined();
      }
    });

    it('should have bold font for WARN and above', () => {
      expect(DEFAULT_LEVEL_COLORS[LogLevel.WARN].fontWeight).toBe('bold');
      expect(DEFAULT_LEVEL_COLORS[LogLevel.ERROR].fontWeight).toBe('bold');
      expect(DEFAULT_LEVEL_COLORS[LogLevel.FATAL].fontWeight).toBe('bold');
    });

    it('should have background color for FATAL', () => {
      expect(DEFAULT_LEVEL_COLORS[LogLevel.FATAL].backgroundColor).toBeDefined();
    });
  });

  describe('getLevelColor (static)', () => {
    it('should return the correct color for a known level', () => {
      const color = PatternHighlighter.getLevelColor('ERROR');
      expect(color.color).toBe('#d32f2f');
    });

    it('should return a default color for unknown levels', () => {
      const color = PatternHighlighter.getLevelColor('CRITICAL');
      expect(color.color).toBe('#333333');
      expect(color.fontWeight).toBe('normal');
    });

    it('should be case-insensitive', () => {
      const color1 = PatternHighlighter.getLevelColor('error');
      const color2 = PatternHighlighter.getLevelColor('ERROR');
      expect(color1.color).toBe(color2.color);
    });
  });

  describe('complex highlighting scenarios', () => {
    it('should highlight a full log line with multiple patterns', () => {
      const h = new PatternHighlighter([
        {
          name: 'Level',
          regex: /(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:?\d{2}|Z)?)\s+(ERROR)\s+(.*)$/,
          color: { color: '#d32f2f', fontWeight: 'bold' },
          group: 2,
          priority: 10,
        },
        {
          name: 'Timestamp',
          regex: /(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:?\d{2}|Z)?)/,
          color: { color: '#1565c0' },
          group: 1,
          priority: 5,
        },
        {
          name: 'Number',
          regex: /\b(\d+)\b/,
          color: { color: '#00695c' },
          group: 1,
          priority: 1,
        },
      ]);

      const result = h.highlight('2024-01-15T10:30:45 ERROR Connection failed to 192.168.1.1:8080');
      expect(result.totalMatches).toBeGreaterThan(0);

      // Should have at least one match segment
      const hasMatch = result.segments.some((s) => s.isMatch);
      expect(hasMatch).toBe(true);

      // Should have at least one non-match segment (the rest of the line)
      const hasNonMatch = result.segments.some((s) => !s.isMatch);
      expect(hasNonMatch).toBe(true);
    });

    it('should handle lines with only whitespace', () => {
      const h = new PatternHighlighter([
        {
          name: 'Error',
          regex: /ERROR/,
          color: { color: '#d32f2f' },
        },
      ]);
      const result = h.highlight('   ');
      expect(result.totalMatches).toBe(0);
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].text).toBe('   ');
      expect(result.segments[0].isMatch).toBe(false);
    });

    it('should handle special characters in text', () => {
      const h = new PatternHighlighter([
        {
          name: 'Error',
          regex: /ERROR/,
          color: { color: '#d32f2f' },
        },
      ]);
      const result = h.highlight('ERROR: <script>alert("xss")</script>');
      expect(result.totalMatches).toBe(1);
      const matchSegment = result.segments.find((s) => s.isMatch);
      expect(matchSegment!.text).toBe('ERROR');
    });

    it('should handle Unicode characters', () => {
      const h = new PatternHighlighter([
        {
          name: 'Error',
          regex: /ERROR/,
          color: { color: '#d32f2f' },
        },
      ]);
      const result = h.highlight('ERROR: 日本語 テスト');
      expect(result.totalMatches).toBe(1);
      const matchSegment = result.segments.find((s) => s.isMatch);
      expect(matchSegment!.text).toBe('ERROR');
    });

    it('should handle very long lines', () => {
      const longLine = 'ERROR ' + 'x'.repeat(10000) + ' ERROR';
      const h = new PatternHighlighter([
        {
          name: 'Error',
          regex: /ERROR/,
          color: { color: '#d32f2f' },
        },
      ]);
      const result = h.highlight(longLine);
      expect(result.totalMatches).toBe(2);
    });
  });

  describe('pattern with flags', () => {
    it('should handle case-insensitive regex', () => {
      const h = new PatternHighlighter([
        {
          name: 'Error (case-insensitive)',
          regex: /error/i,
          color: { color: '#d32f2f' },
        },
      ]);
      const result1 = h.highlight('ERROR here');
      const result2 = h.highlight('error here');
      const result3 = h.highlight('Error here');
      expect(result1.totalMatches).toBe(1);
      expect(result2.totalMatches).toBe(1);
      expect(result3.totalMatches).toBe(1);
    });

    it('should handle multiline flag', () => {
      const h = new PatternHighlighter([
        {
          name: 'Start anchor',
          regex: /^ERROR/m,
          color: { color: '#d32f2f' },
        },
      ]);
      const result = h.highlight('ERROR at start\nINFO not error\nERROR again');
      expect(result.totalMatches).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle regex that matches empty string', () => {
      const h = new PatternHighlighter([
        {
          name: 'Empty match',
          regex: /(?=x)/,
          color: { color: '#d32f2f' },
        },
      ]);
      // This is a zero-width assertion - should not cause issues
      const result = h.highlight('x');
      // Zero-width matches at the same position should be deduplicated
      expect(result.segments.length).toBeGreaterThan(0);
    });

    it('should handle regex with no capture groups', () => {
      const h = new PatternHighlighter([
        {
          name: 'No groups',
          regex: /ERROR/,
          color: { color: '#d32f2f' },
        },
      ]);
      const result = h.highlight('ERROR here');
      expect(result.totalMatches).toBe(1);
      const matchSegment = result.segments.find((s) => s.isMatch);
      expect(matchSegment!.text).toBe('ERROR');
    });

    it('should handle multiple capture groups with group targeting', () => {
      const h = new PatternHighlighter([
        {
          name: 'Two groups',
          regex: /(\d+):(\d+):(\d+)/,
          color: { color: '#1565c0' },
          group: 2,
        },
      ]);
      const result = h.highlight('Time: 10:30:45');
      expect(result.totalMatches).toBe(1);
      const matchSegment = result.segments.find((s) => s.isMatch);
      expect(matchSegment!.text).toBe('30');
    });

    it('should handle group index that does not exist', () => {
      const h = new PatternHighlighter([
        {
          name: 'Bad group',
          regex: /ERROR/,
          color: { color: '#d32f2f' },
          group: 99,
        },
      ]);
      const result = h.highlight('ERROR here');
      // Should fall back to full match
      expect(result.totalMatches).toBe(1);
      const matchSegment = result.segments.find((s) => s.isMatch);
      expect(matchSegment!.text).toBe('ERROR');
    });
  });
});
