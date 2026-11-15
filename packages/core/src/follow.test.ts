import fs from 'fs';
import path from 'path';
import { FollowMode, FollowState, FollowCallbacks } from './follow';

describe('FollowMode', () => {
  const testDir = path.join(__dirname, '__test_files_follow__');
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
    // Clean up before each test
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  afterEach(() => {
    // Clean up test file
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      fs.writeFileSync(testFile, '');
      const follow = new FollowMode({ filePath: testFile });
      const state = follow.getState();

      expect(state.isActive).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.totalLines).toBe(0);
      expect(state.lastLineNumber).toBe(0);
      expect(state.lastFileSize).toBe(0);
    });

    it('should initialize with custom poll interval', () => {
      fs.writeFileSync(testFile, '');
      const follow = new FollowMode({ filePath: testFile, pollInterval: 100 });
      expect(follow.getState().isActive).toBe(false);
    });

    it('should initialize with custom maxLines', () => {
      fs.writeFileSync(testFile, '');
      const follow = new FollowMode({ filePath: testFile, maxLines: 5000 });
      expect(follow.getState().isActive).toBe(false);
    });

    it('should initialize with initialPaused option', () => {
      fs.writeFileSync(testFile, '');
      const follow = new FollowMode({ filePath: testFile, initialPaused: true });
      const state = follow.getState();
      expect(state.isActive).toBe(false);
      expect(state.isPaused).toBe(false);
    });
  });

  describe('start', () => {
    it('should start follow mode', async () => {
      fs.writeFileSync(testFile, 'INFO Starting\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      expect(follow.getState().isActive).toBe(false);
      follow.start();
      expect(follow.getState().isActive).toBe(true);
      expect(follow.getState().isPaused).toBe(false);

      // Wait for initial read
      await new Promise((r) => setTimeout(r, 100));

      expect(follow.getState().totalLines).toBe(1);
      expect(follow.getState().lastLineNumber).toBe(0);

      follow.stop();
    });

    it('should read initial content on start', async () => {
      fs.writeFileSync(testFile, 'INFO Line 1\nERROR Line 2\nWARN Line 3\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      const lines = follow.getLines();
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('INFO Line 1');
      expect(lines[1]).toBe('ERROR Line 2');
      expect(lines[2]).toBe('WARN Line 3');

      follow.stop();
    });

    it('should not start twice', async () => {
      fs.writeFileSync(testFile, 'INFO Line 1\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));
      const firstCount = follow.getState().totalLines;

      follow.start(); // Second start
      await new Promise((r) => setTimeout(r, 100));

      // Should still have the same number of lines (no duplicate)
      expect(follow.getState().totalLines).toBe(firstCount);

      follow.stop();
    });

    it('should handle empty file on start', async () => {
      fs.writeFileSync(testFile, '');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      expect(follow.getState().totalLines).toBe(0);
      expect(follow.getState().isActive).toBe(true);

      follow.stop();
    });

    it('should handle file with no trailing newline', async () => {
      fs.writeFileSync(testFile, 'INFO No newline');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      // The incomplete line should not be counted yet
      expect(follow.getState().totalLines).toBe(0);

      // Now add a newline to complete it
      fs.appendFileSync(testFile, '\n');
      await new Promise((r) => setTimeout(r, 100));

      expect(follow.getState().totalLines).toBe(1);
      expect(follow.getLines()[0]).toBe('INFO No newline');

      follow.stop();
    });
  });

  describe('polling for new content', () => {
    it('should detect new lines appended to the file', async () => {
      fs.writeFileSync(testFile, 'INFO Initial\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      const receivedLines: string[][] = [];
      const receivedLineNumbers: number[][] = [];

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      // Append new lines
      fs.appendFileSync(testFile, 'ERROR New line 1\nWARN New line 2\n');
      await new Promise((r) => setTimeout(r, 150));

      const lines = follow.getLines();
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('INFO Initial');
      expect(lines[1]).toBe('ERROR New line 1');
      expect(lines[2]).toBe('WARN New line 2');

      follow.stop();
    });

    it('should call onNewLines callback with new lines', async () => {
      fs.writeFileSync(testFile, 'INFO Initial\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      const newLines: string[][] = [];
      const newLineNumbers: number[][] = [];

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      follow._callbacks.onNewLines = (lines, lineNumbers) => {
        newLines.push(lines);
        newLineNumbers.push(lineNumbers);
      };

      // Append new lines
      fs.appendFileSync(testFile, 'ERROR New line\n');
      await new Promise((r) => setTimeout(r, 150));

      expect(newLines).toHaveLength(1);
      expect(newLines[0]).toEqual(['ERROR New line']);
      expect(newLineNumbers[0]).toEqual([1]);

      follow.stop();
    });

    it('should detect multiple appends', async () => {
      fs.writeFileSync(testFile, '');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      // First append
      fs.appendFileSync(testFile, 'INFO First\n');
      await new Promise((r) => setTimeout(r, 100));
      expect(follow.getState().totalLines).toBe(1);

      // Second append
      fs.appendFileSync(testFile, 'ERROR Second\n');
      await new Promise((r) => setTimeout(r, 100));
      expect(follow.getState().totalLines).toBe(2);

      // Third append
      fs.appendFileSync(testFile, 'WARN Third\n');
      await new Promise((r) => setTimeout(r, 100));
      expect(follow.getState().totalLines).toBe(3);

      follow.stop();
    });

    it('should not report the same lines twice', async () => {
      fs.writeFileSync(testFile, 'INFO Line 1\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      const newLines: string[][] = [];
      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      follow._callbacks.onNewLines = (lines) => {
        newLines.push(lines);
      };

      // Wait without appending
      await new Promise((r) => setTimeout(r, 200));

      // Should not have received any new lines
      expect(newLines).toHaveLength(0);

      follow.stop();
    });
  });

  describe('pause', () => {
    it('should pause follow mode', async () => {
      fs.writeFileSync(testFile, 'INFO Initial\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      follow.pause();
      expect(follow.getState().isPaused).toBe(true);
      expect(follow.getState().isActive).toBe(true);

      // Append while paused — should not be detected
      fs.appendFileSync(testFile, 'ERROR Should not appear\n');
      await new Promise((r) => setTimeout(r, 200));

      expect(follow.getState().totalLines).toBe(1);

      follow.stop();
    });

    it('should call onPaused callback', async () => {
      fs.writeFileSync(testFile, 'INFO Initial\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      let pausedCalled = false;
      follow._callbacks.onPaused = () => {
        pausedCalled = true;
      };

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      follow.pause();
      expect(pausedCalled).toBe(true);

      follow.stop();
    });

    it('should not pause if already paused', async () => {
      fs.writeFileSync(testFile, 'INFO Initial\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      follow.pause();
      follow.pause(); // Second pause
      expect(follow.getState().isPaused).toBe(true);

      follow.stop();
    });

    it('should not pause if not active', async () => {
      fs.writeFileSync(testFile, '');
      const follow = new FollowMode({
        filePath: testFile,
      });

      follow.pause(); // Pause before start
      expect(follow.getState().isPaused).toBe(false);

      follow.stop();
    });
  });

  describe('resume', () => {
    it('should resume follow mode', async () => {
      fs.writeFileSync(testFile, 'INFO Initial\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      follow.pause();
      await new Promise((r) => setTimeout(r, 50));

      // Append while paused
      fs.appendFileSync(testFile, 'ERROR Paused line\n');
      await new Promise((r) => setTimeout(r, 100));

      // Should still have only 1 line
      expect(follow.getState().totalLines).toBe(1);

      // Resume
      follow.resume();
      await new Promise((r) => setTimeout(r, 150));

      // Now should have 2 lines
      expect(follow.getState().totalLines).toBe(2);
      expect(follow.getLines()[1]).toBe('ERROR Paused line');

      follow.stop();
    });

    it('should call onResumed callback', async () => {
      fs.writeFileSync(testFile, 'INFO Initial\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      let resumedCalled = false;
      follow._callbacks.onResumed = () => {
        resumedCalled = true;
      };

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      follow.pause();
      follow.resume();
      expect(resumedCalled).toBe(true);

      follow.stop();
    });

    it('should not resume if not paused', async () => {
      fs.writeFileSync(testFile, 'INFO Initial\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      follow.resume(); // Resume when not paused
      expect(follow.getState().isPaused).toBe(false);

      follow.stop();
    });

    it('should not resume if not active', async () => {
      fs.writeFileSync(testFile, '');
      const follow = new FollowMode({
        filePath: testFile,
      });

      follow.resume(); // Resume before start
      expect(follow.getState().isActive).toBe(false);

      follow.stop();
    });
  });

  describe('stop', () => {
    it('should stop follow mode', async () => {
      fs.writeFileSync(testFile, 'INFO Initial\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      follow.stop();
      expect(follow.getState().isActive).toBe(false);
      expect(follow.getState().isPaused).toBe(false);

      // Append after stop — should not be detected
      fs.appendFileSync(testFile, 'ERROR After stop\n');
      await new Promise((r) => setTimeout(r, 200));

      expect(follow.getState().totalLines).toBe(1);
    });

    it('should not stop twice', async () => {
      fs.writeFileSync(testFile, 'INFO Initial\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      follow.stop();
      follow.stop(); // Second stop
      expect(follow.getState().isActive).toBe(false);

      follow.stop();
    });

    it('should not stop if not active', async () => {
      fs.writeFileSync(testFile, '');
      const follow = new FollowMode({
        filePath: testFile,
      });

      follow.stop(); // Stop before start
      expect(follow.getState().isActive).toBe(false);

      follow.stop();
    });
  });

  describe('reset', () => {
    it('should reset follow position to beginning', async () => {
      fs.writeFileSync(testFile, 'INFO Line 1\nERROR Line 2\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      expect(follow.getState().totalLines).toBe(2);

      follow.reset();
      expect(follow.getState().totalLines).toBe(0);
      expect(follow.getState().lastLineNumber).toBe(0);
      expect(follow.getLines()).toHaveLength(0);

      follow.stop();
    });

    it('should reset while follow is still active', async () => {
      fs.writeFileSync(testFile, 'INFO Line 1\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      follow.reset();
      expect(follow.getState().isActive).toBe(true);
      expect(follow.getState().totalLines).toBe(0);

      // Clear the file so only new content is read
      fs.writeFileSync(testFile, '');

      // Append new content
      fs.appendFileSync(testFile, 'ERROR New line\n');
      await new Promise((r) => setTimeout(r, 150));

      expect(follow.getState().totalLines).toBe(1);
      expect(follow.getLines()[0]).toBe('ERROR New line');

      follow.stop();
    });
  });

  describe('clearLines', () => {
    it('should clear tracked lines without stopping follow', async () => {
      fs.writeFileSync(testFile, 'INFO Line 1\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      expect(follow.getState().totalLines).toBe(1);

      follow.clearLines();
      expect(follow.getState().totalLines).toBe(0);
      expect(follow.getLines()).toHaveLength(0);
      expect(follow.getState().isActive).toBe(true);

      // Append new content
      fs.appendFileSync(testFile, 'ERROR New line\n');
      await new Promise((r) => setTimeout(r, 150));

      expect(follow.getState().totalLines).toBe(1);
      expect(follow.getLines()[0]).toBe('ERROR New line');

      follow.stop();
    });
  });

  describe('destroy', () => {
    it('should destroy the follow instance', async () => {
      fs.writeFileSync(testFile, 'INFO Initial\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      follow.destroy();
      expect(follow.getState().isActive).toBe(false);
      expect(follow.getState().totalLines).toBe(0);
      expect(follow.getLines()).toHaveLength(0);
    });

    it('should not throw when destroying a non-started instance', () => {
      fs.writeFileSync(testFile, '');
      const follow = new FollowMode({
        filePath: testFile,
      });

      expect(() => follow.destroy()).not.toThrow();
    });
  });

  describe('maxLines', () => {
    it('should trim lines when exceeding maxLines', async () => {
      fs.writeFileSync(testFile, '');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
        maxLines: 5,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      // Add 8 lines
      for (let i = 0; i < 8; i++) {
        fs.appendFileSync(testFile, `INFO Line ${i}\n`);
        await new Promise((r) => setTimeout(r, 80));
      }

      expect(follow.getState().totalLines).toBe(5);
      // Should keep the most recent 5 lines
      expect(follow.getLines()[0]).toBe('INFO Line 3');
      expect(follow.getLines()[4]).toBe('INFO Line 7');

      follow.stop();
    });
  });

  describe('file truncation (log rotation)', () => {
    it('should detect file truncation and re-read from beginning', async () => {
      fs.writeFileSync(testFile, 'INFO Old line 1\nINFO Old line 2\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      expect(follow.getState().totalLines).toBe(2);

      // Simulate log rotation: truncate and write new content
      fs.writeFileSync(testFile, 'INFO New line 1\n');
      await new Promise((r) => setTimeout(r, 150));

      expect(follow.getState().totalLines).toBe(1);
      expect(follow.getLines()[0]).toBe('INFO New line 1');

      follow.stop();
    });
  });

  describe('non-existent file', () => {
    it('should handle non-existent file gracefully', async () => {
      const nonExistent = path.join(testDir, 'nonexistent.log');
      const follow = new FollowMode({
        filePath: nonExistent,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 200));

      // Should not crash, should have 0 lines
      expect(follow.getState().totalLines).toBe(0);
      expect(follow.getState().isActive).toBe(true);

      follow.stop();
    });

    it('should call onEnd after max errors on non-existent file', async () => {
      const nonExistent = path.join(testDir, 'nonexistent2.log');
      let ended = false;
      const follow = new FollowMode({
        filePath: nonExistent,
        pollInterval: 50,
        maxErrors: 3,
      });

      follow._callbacks.onEnd = () => {
        ended = true;
      };

      follow.start();

      // Wait for max errors to accumulate (3 polls * 50ms = 150ms, plus buffer)
      await new Promise((r) => setTimeout(r, 400));

      expect(ended).toBe(true);
      expect(follow.getState().isActive).toBe(false);

      follow.stop();
    });
  });

  describe('getNewLinesCount', () => {
    it('should return 0 after initial read', async () => {
      fs.writeFileSync(testFile, 'INFO Initial\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      expect(follow.getNewLinesCount()).toBe(0);

      follow.stop();
    });

    it('should return count of new lines after append', async () => {
      fs.writeFileSync(testFile, 'INFO Initial\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      fs.appendFileSync(testFile, 'ERROR New 1\nWARN New 2\n');
      await new Promise((r) => setTimeout(r, 150));

      // First call returns the count of new lines (consumes)
      expect(follow.getNewLinesCount()).toBe(2);
      // Second call returns 0 (already consumed)
      expect(follow.getNewLinesCount()).toBe(0);

      follow.stop();
    });
  });

  describe('getLineNumbers', () => {
    it('should return correct line numbers', async () => {
      fs.writeFileSync(testFile, 'INFO Line 0\nERROR Line 1\nWARN Line 2\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      const lineNumbers = follow.getLineNumbers();
      expect(lineNumbers).toEqual([0, 1, 2]);

      follow.stop();
    });
  });

  describe('getState', () => {
    it('should return correct state after start', async () => {
      fs.writeFileSync(testFile, 'INFO Line 1\nERROR Line 2\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));

      const state = follow.getState();
      expect(state.isActive).toBe(true);
      expect(state.isPaused).toBe(false);
      expect(state.totalLines).toBe(2);
      expect(state.lastLineNumber).toBe(1);
      expect(state.lastFileSize).toBeGreaterThan(0);

      follow.stop();
    });

    it('should return correct state after pause', async () => {
      fs.writeFileSync(testFile, 'INFO Line 1\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));
      follow.pause();

      const state = follow.getState();
      expect(state.isActive).toBe(true);
      expect(state.isPaused).toBe(true);

      follow.stop();
    });

    it('should return correct state after stop', async () => {
      fs.writeFileSync(testFile, 'INFO Line 1\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      follow.start();
      await new Promise((r) => setTimeout(r, 100));
      follow.stop();

      const state = follow.getState();
      expect(state.isActive).toBe(false);
      expect(state.isPaused).toBe(false);

      follow.stop();
    });
  });

  describe('integration: start, pause, resume, stop cycle', () => {
    it('should complete a full lifecycle', async () => {
      fs.writeFileSync(testFile, 'INFO Initial\n');
      const follow = new FollowMode({
        filePath: testFile,
        pollInterval: 50,
      });

      const receivedLines: string[][] = [];
      follow._callbacks.onNewLines = (lines) => {
        receivedLines.push(lines);
      };

      // Start
      follow.start();
      await new Promise((r) => setTimeout(r, 100));
      expect(follow.getState().totalLines).toBe(1);

      // Pause
      follow.pause();
      expect(follow.getState().isPaused).toBe(true);

      // Append while paused (should not be received)
      fs.appendFileSync(testFile, 'ERROR Paused\n');
      await new Promise((r) => setTimeout(r, 150));
      expect(follow.getState().totalLines).toBe(1);
      expect(receivedLines).toHaveLength(0);

      // Resume
      follow.resume();
      expect(follow.getState().isPaused).toBe(false);
      await new Promise((r) => setTimeout(r, 150));
      expect(follow.getState().totalLines).toBe(2);
      expect(receivedLines).toHaveLength(1);
      expect(receivedLines[0]).toEqual(['ERROR Paused']);

      // Append more
      fs.appendFileSync(testFile, 'WARN After resume\n');
      await new Promise((r) => setTimeout(r, 150));
      expect(follow.getState().totalLines).toBe(3);
      expect(receivedLines).toHaveLength(2);
      expect(receivedLines[1]).toEqual(['WARN After resume']);

      // Stop
      follow.stop();
      expect(follow.getState().isActive).toBe(false);

      // Append after stop (should not be received)
      fs.appendFileSync(testFile, 'INFO After stop\n');
      await new Promise((r) => setTimeout(r, 200));
      expect(follow.getState().totalLines).toBe(3);
      expect(receivedLines).toHaveLength(2);
    });
  });
});
