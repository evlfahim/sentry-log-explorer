import fs from 'fs';
import path from 'path';
import { SavedQueriesManager, SavedQuery, QueryFilterOptions } from './queries';
import { LogLevel } from './highlighter';

describe('SavedQueriesManager', () => {
  const testDir = path.join(__dirname, '__test_files_queries__');
  let testFile: string;
  let manager: SavedQueriesManager;

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
    testFile = path.join(testDir, 'queries.json');
    // Clean up before each test
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    manager = new SavedQueriesManager({ filePath: testFile });
  });

  afterEach(() => {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  describe('constructor', () => {
    it('should initialize with default file path', () => {
      const m = new SavedQueriesManager();
      expect(m).toBeDefined();
    });

    it('should initialize with custom file path', () => {
      const m = new SavedQueriesManager({ filePath: '/tmp/test-queries.json' });
      expect(m).toBeDefined();
    });

    it('should initialize with custom maxHistory', () => {
      const m = new SavedQueriesManager({ maxHistory: 10 });
      expect(m).toBeDefined();
    });

    it('should start with empty queries and history', () => {
      expect(manager.getCount()).toBe(0);
      expect(manager.getHistory()).toEqual([]);
    });
  });

  describe('createQuery', () => {
    it('should create a query with just a name', () => {
      const query = manager.createQuery('Test Query');
      expect(query).toBeDefined();
      expect(query.id).toBeTruthy();
      expect(query.name).toBe('Test Query');
      expect(query.createdAt).toBeDefined();
      expect(query.lastUsedAt).toBeDefined();
      expect(query.usageCount).toBe(1);
      expect(manager.getCount()).toBe(1);
    });

    it('should create a query with all options', () => {
      const query = manager.createQuery('Full Query', {
        description: 'A full test query',
        minLevel: LogLevel.ERROR,
        timeStart: '2024-01-01T00:00:00Z',
        timeEnd: '2024-12-31T23:59:59Z',
        pattern: 'error|fail',
        highlightPatterns: [{ regex: 'error', color: { color: 'red' } }],
      });

      expect(query.name).toBe('Full Query');
      expect(query.description).toBe('A full test query');
      expect(query.minLevel).toBe(LogLevel.ERROR);
      expect(query.timeStart).toBe('2024-01-01T00:00:00Z');
      expect(query.timeEnd).toBe('2024-12-31T23:59:59Z');
      expect(query.pattern).toBe('error|fail');
      expect(query.highlightPatterns).toHaveLength(1);
      expect(query.usageCount).toBe(1);
    });

    it('should add the query to history', () => {
      manager.createQuery('Query 1');
      manager.createQuery('Query 2');
      const history = manager.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0]).toBe(manager.getQuery(history[0])?.id);
      // Most recent should be first
      const q2 = manager.searchByName('Query 2')[0];
      expect(history[0]).toBe(q2.id);
    });

    it('should generate unique ids for each query', () => {
      const q1 = manager.createQuery('Query 1');
      const q2 = manager.createQuery('Query 2');
      expect(q1.id).not.toBe(q2.id);
    });

    it('should add multiple queries', () => {
      manager.createQuery('Query 1');
      manager.createQuery('Query 2');
      manager.createQuery('Query 3');
      expect(manager.getCount()).toBe(3);
    });
  });

  describe('getQuery', () => {
    it('should return undefined for non-existent id', () => {
      expect(manager.getQuery('non-existent')).toBeUndefined();
    });

    it('should return the created query', () => {
      const query = manager.createQuery('Test Query');
      const found = manager.getQuery(query.id);
      expect(found).toBeDefined();
      expect(found!.name).toBe('Test Query');
    });
  });

  describe('updateQuery', () => {
    it('should update a query name', () => {
      const query = manager.createQuery('Old Name');
      const updated = manager.updateQuery(query.id, { name: 'New Name' });
      expect(updated).toBeDefined();
      expect(updated!.name).toBe('New Name');
      expect(manager.getQuery(query.id)!.name).toBe('New Name');
    });

    it('should update query options', () => {
      const query = manager.createQuery('Test', { minLevel: LogLevel.INFO });
      const updated = manager.updateQuery(query.id, {
        minLevel: LogLevel.ERROR,
        pattern: 'error',
      });
      expect(updated!.minLevel).toBe(LogLevel.ERROR);
      expect(updated!.pattern).toBe('error');
    });

    it('should update lastUsedAt on update', () => {
      const query = manager.createQuery('Test');
      const oldLastUsed = query.lastUsedAt;
      // Wait a bit
      // In tests, we can't really wait, but we can verify the field exists
      const updated = manager.updateQuery(query.id, { name: 'Updated' });
      expect(updated!.lastUsedAt).toBeDefined();
    });

    it('should return undefined for non-existent id', () => {
      const result = manager.updateQuery('non-existent', { name: 'Test' });
      expect(result).toBeUndefined();
    });

    it('should not change createdAt on update', () => {
      const query = manager.createQuery('Test');
      const oldCreatedAt = query.createdAt;
      manager.updateQuery(query.id, { name: 'Updated' });
      const updated = manager.getQuery(query.id);
      expect(updated!.createdAt).toBe(oldCreatedAt);
    });

    it('should not change usageCount on update', () => {
      const query = manager.createQuery('Test');
      expect(query.usageCount).toBe(1);
      manager.updateQuery(query.id, { name: 'Updated' });
      const updated = manager.getQuery(query.id);
      expect(updated!.usageCount).toBe(1);
    });
  });

  describe('deleteQuery', () => {
    it('should delete an existing query', () => {
      const query = manager.createQuery('Test');
      const result = manager.deleteQuery(query.id);
      expect(result).toBe(true);
      expect(manager.getCount()).toBe(0);
      expect(manager.getQuery(query.id)).toBeUndefined();
    });

    it('should remove query from history on delete', () => {
      manager.createQuery('Test');
      manager.deleteQuery(manager.getQuery(manager.getHistory()[0])!.id);
      expect(manager.getHistory()).toHaveLength(0);
    });

    it('should return false for non-existent id', () => {
      const result = manager.deleteQuery('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('getFilterOptions', () => {
    it('should return undefined for non-existent id', () => {
      expect(manager.getFilterOptions('non-existent')).toBeUndefined();
    });

    it('should return filter options from a query', () => {
      const query = manager.createQuery('Test', {
        minLevel: LogLevel.ERROR,
        timeStart: '2024-01-01T00:00:00Z',
        timeEnd: '2024-12-31T23:59:59Z',
        pattern: 'error',
      });

      const opts = manager.getFilterOptions(query.id);
      expect(opts).toBeDefined();
      expect(opts!.minLevel).toBe(LogLevel.ERROR);
      expect(opts!.timeStart).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(opts!.timeEnd).toEqual(new Date('2024-12-31T23:59:59Z'));
      expect(opts!.pattern).toBeDefined();
      expect(opts!.pattern!.test('error')).toBe(true);
    });

    it('should handle missing optional fields', () => {
      const query = manager.createQuery('Minimal');
      const opts = manager.getFilterOptions(query.id);
      expect(opts).toBeDefined();
      expect(opts!.minLevel).toBeUndefined();
      expect(opts!.timeStart).toBeUndefined();
      expect(opts!.timeEnd).toBeUndefined();
      expect(opts!.pattern).toBeUndefined();
    });

    it('should skip invalid regex patterns', () => {
      const query = manager.createQuery('Bad Regex', { pattern: '[invalid' });
      const opts = manager.getFilterOptions(query.id);
      expect(opts!.pattern).toBeUndefined();
    });

    it('should skip invalid date strings', () => {
      const query = manager.createQuery('Bad Dates', {
        timeStart: 'not-a-date',
        timeEnd: 'also-not-a-date',
      });
      const opts = manager.getFilterOptions(query.id);
      expect(opts!.timeStart).toBeUndefined();
      expect(opts!.timeEnd).toBeUndefined();
    });
  });

  describe('recordUsage', () => {
    it('should increment usageCount', () => {
      const query = manager.createQuery('Test');
      expect(query.usageCount).toBe(1);
      manager.recordUsage(query.id);
      expect(query.usageCount).toBe(2);
      manager.recordUsage(query.id);
      expect(query.usageCount).toBe(3);
    });

    it('should update lastUsedAt', () => {
      const query = manager.createQuery('Test');
      const oldLastUsed = query.lastUsedAt;
      manager.recordUsage(query.id);
      const updated = manager.getQuery(query.id);
      expect(updated!.lastUsedAt).toBeDefined();
    });

    it('should return false for non-existent id', () => {
      const result = manager.recordUsage('non-existent');
      expect(result).toBe(false);
    });

    it('should add to history if not already there', () => {
      manager.createQuery('Test');
      manager.recordUsage(manager.getHistory()[0]);
      const history = manager.getHistory();
      expect(history).toHaveLength(1);
    });
  });

  describe('getHistory', () => {
    it('should return history in most-recent-first order', () => {
      const q1 = manager.createQuery('First');
      const q2 = manager.createQuery('Second');
      const q3 = manager.createQuery('Third');

      const history = manager.getHistory();
      expect(history).toHaveLength(3);
      expect(history[0]).toBe(q3.id);
      expect(history[1]).toBe(q2.id);
      expect(history[2]).toBe(q1.id);
    });

    it('should not contain duplicates', () => {
      manager.createQuery('Test');
      manager.recordUsage(manager.getHistory()[0]);
      manager.recordUsage(manager.getHistory()[0]);
      expect(manager.getHistory()).toHaveLength(1);
    });
  });

  describe('getAllQueries', () => {
    it('should return all queries sorted by lastUsedAt desc', () => {
      const q1 = manager.createQuery('First');
      const q2 = manager.createQuery('Second');
      const q3 = manager.createQuery('Third');

      // Manually set lastUsedAt to ensure deterministic ordering
      // q3 was created most recently, q1 was used most recently
      q3.lastUsedAt = 3000;
      q2.lastUsedAt = 2000;
      q1.lastUsedAt = 4000; // Most recently used

      const queries = manager.getAllQueries();
      expect(queries).toHaveLength(3);
      // Most recently used (q1, lastUsedAt=4000) should be first
      expect(queries[0].name).toBe('First');
      // Then q3 (lastUsedAt=3000)
      expect(queries[1].name).toBe('Third');
      // Then q2 (lastUsedAt=2000)
      expect(queries[2].name).toBe('Second');
    });

    it('should return empty array when no queries', () => {
      expect(manager.getAllQueries()).toHaveLength(0);
    });
  });

  describe('searchByName', () => {
    it('should find queries by name substring', () => {
      manager.createQuery('Error Logs');
      manager.createQuery('Warning Logs');
      manager.createQuery('Info Messages');

      const results = manager.searchByName('Error');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Error Logs');
    });

    it('should be case-insensitive', () => {
      manager.createQuery('Error Logs');
      const results = manager.searchByName('error');
      expect(results).toHaveLength(1);
    });

    it('should return all queries when search string is empty', () => {
      manager.createQuery('Query 1');
      manager.createQuery('Query 2');
      const results = manager.searchByName('');
      expect(results).toHaveLength(2);
    });

    it('should return empty array when no match', () => {
      manager.createQuery('Error Logs');
      const results = manager.searchByName('nonexistent');
      expect(results).toHaveLength(0);
    });
  });

  describe('save and load', () => {
    it('should save and load queries', () => {
      manager.createQuery('Query 1', { minLevel: LogLevel.ERROR });
      manager.createQuery('Query 2', { pattern: 'warning' });
      manager.recordUsage(manager.getHistory()[0]);

      manager.save();

      // Create a new manager and load
      const newManager = new SavedQueriesManager({ filePath: testFile });
      newManager.load();

      expect(newManager.getCount()).toBe(2);
      const queries = newManager.getAllQueries();
      expect(queries[0].name).toBe('Query 1');
      expect(queries[1].name).toBe('Query 2');
    });

    it('should save and load history', () => {
      manager.createQuery('Query 1');
      manager.createQuery('Query 2');
      manager.recordUsage(manager.getHistory()[0]);

      manager.save();

      const newManager = new SavedQueriesManager({ filePath: testFile });
      newManager.load();

      const history = newManager.getHistory();
      expect(history).toHaveLength(2);
    });

    it('should handle missing file on load', () => {
      manager.load(); // No file exists
      expect(manager.getCount()).toBe(0);
    });

    it('should handle corrupted file on load', () => {
      fs.writeFileSync(testFile, 'this is not json');
      manager.load();
      expect(manager.getCount()).toBe(0);
    });

    it('should create parent directories on save', () => {
      const nestedFile = path.join(testDir, 'nested', 'dir', 'queries.json');
      const nestedManager = new SavedQueriesManager({ filePath: nestedFile });
      nestedManager.createQuery('Test');
      nestedManager.save();

      expect(fs.existsSync(nestedFile)).toBe(true);

      // Clean up
      fs.rmSync(path.join(testDir, 'nested'), { recursive: true, force: true });
    });

    it('should persist usage count across save/load', () => {
      const query = manager.createQuery('Test');
      manager.recordUsage(query.id);
      manager.recordUsage(query.id);
      manager.save();

      const newManager = new SavedQueriesManager({ filePath: testFile });
      newManager.load();
      const loaded = newManager.getQuery(query.id);
      expect(loaded!.usageCount).toBe(3);
    });
  });

  describe('export and import', () => {
    it('should export queries as JSON string', () => {
      manager.createQuery('Query 1', { minLevel: LogLevel.ERROR });
      const json = manager.exportJSON();
      const parsed = JSON.parse(json) as SavedQuery[];
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Query 1');
    });

    it('should export empty array when no queries', () => {
      const json = manager.exportJSON();
      const parsed = JSON.parse(json) as SavedQuery[];
      expect(parsed).toHaveLength(0);
    });

    it('should import queries from JSON string', () => {
      const json = JSON.stringify([
        {
          id: 'q_imported_1',
          name: 'Imported Query',
          createdAt: Date.now(),
          lastUsedAt: Date.now(),
          usageCount: 0,
          minLevel: LogLevel.DEBUG,
        },
      ]);

      const result = manager.importJSON(json);
      expect(result.imported).toBe(1);
      expect(result.errors).toBe(0);
      expect(manager.getCount()).toBe(1);
      expect(manager.getQuery('q_imported_1')!.name).toBe('Imported Query');
    });

    it('should overwrite existing queries on import', () => {
      manager.createQuery('Original', { minLevel: LogLevel.INFO });
      const json = JSON.stringify([
        {
          id: 'q_imported_1',
          name: 'Imported Query',
          createdAt: Date.now(),
          lastUsedAt: Date.now(),
          usageCount: 5,
          minLevel: LogLevel.ERROR,
        },
      ]);

      manager.importJSON(json);
      const query = manager.getQuery('q_imported_1');
      expect(query!.name).toBe('Imported Query');
      expect(query!.minLevel).toBe(LogLevel.ERROR);
      expect(query!.usageCount).toBe(5);
    });

    it('should handle import errors', () => {
      const result = manager.importJSON('not json');
      expect(result.imported).toBe(0);
      expect(result.errors).toBe(1);
    });

    it('should skip invalid query objects on import', () => {
      const json = JSON.stringify([
        { id: 'valid', name: 'Valid', createdAt: Date.now(), lastUsedAt: Date.now(), usageCount: 0 },
        { id: '', name: '', createdAt: 0, lastUsedAt: 0, usageCount: 0 }, // invalid
      ]);

      const result = manager.importJSON(json);
      expect(result.imported).toBe(1);
      expect(result.errors).toBe(1);
      expect(manager.getCount()).toBe(1);
    });

    it('should export to file', () => {
      manager.createQuery('Query 1');
      const exportPath = path.join(testDir, 'export.json');
      const result = manager.exportToFile(exportPath);
      expect(result).toBe(true);
      expect(fs.existsSync(exportPath)).toBe(true);

      const content = fs.readFileSync(exportPath, 'utf-8');
      const parsed = JSON.parse(content) as SavedQuery[];
      expect(parsed).toHaveLength(1);
    });

    it('should import from file', () => {
      const importPath = path.join(testDir, 'import.json');
      fs.writeFileSync(importPath, JSON.stringify([
        {
          id: 'q_from_file',
          name: 'File Query',
          createdAt: Date.now(),
          lastUsedAt: Date.now(),
          usageCount: 0,
        },
      ]));

      const result = manager.importFromFile(importPath);
      expect(result.imported).toBe(1);
      expect(manager.getQuery('q_from_file')!.name).toBe('File Query');
    });

    it('should handle import from non-existent file', () => {
      const result = manager.importFromFile('/nonexistent/path.json');
      expect(result.imported).toBe(0);
      expect(result.errors).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all queries and history', () => {
      manager.createQuery('Query 1');
      manager.createQuery('Query 2');
      manager.clear();
      expect(manager.getCount()).toBe(0);
      expect(manager.getHistory()).toHaveLength(0);
    });
  });

  describe('maxHistory', () => {
    it('should trim history to maxHistory', () => {
      const m = new SavedQueriesManager({ maxHistory: 3, filePath: testFile });
      m.createQuery('Q1');
      m.createQuery('Q2');
      m.createQuery('Q3');
      m.createQuery('Q4');
      m.createQuery('Q5');

      const history = m.getHistory();
      expect(history).toHaveLength(3);
      // Should keep the 3 most recent
      expect(history[0]).toBe(m.getQuery(m.getHistory()[0])!.id);
    });

    it('should trim history on recordUsage', () => {
      const m = new SavedQueriesManager({ maxHistory: 2, filePath: testFile });
      m.createQuery('Q1');
      m.createQuery('Q2');
      m.createQuery('Q3');
      m.recordUsage(m.getHistory()[0]); // Q3 is now most recent

      const history = m.getHistory();
      expect(history).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should handle query with no optional fields', () => {
      const query = manager.createQuery('Minimal Query');
      expect(query.description).toBeUndefined();
      expect(query.minLevel).toBeUndefined();
      expect(query.timeStart).toBeUndefined();
      expect(query.timeEnd).toBeUndefined();
      expect(query.pattern).toBeUndefined();
      expect(query.highlightPatterns).toBeUndefined();
    });

    it('should handle query with empty description', () => {
      const query = manager.createQuery('Test', { description: '' });
      expect(query.description).toBe('');
    });

    it('should handle highlight patterns in query', () => {
      const patterns = [
        { regex: 'error', color: { color: 'red' } },
        { regex: 'warn', color: { color: 'yellow' } },
      ];
      const query = manager.createQuery('With Highlights', { highlightPatterns: patterns });
      expect(query.highlightPatterns).toHaveLength(2);
      expect(query.highlightPatterns![0].regex).toBe('error');
    });

    it('should handle special characters in query name', () => {
      const query = manager.createQuery('Query with "quotes" and <tags>');
      expect(query.name).toBe('Query with "quotes" and <tags>');
    });

    it('should handle very long query name', () => {
      const longName = 'A'.repeat(1000);
      const query = manager.createQuery(longName);
      expect(query.name).toBe(longName);
    });
  });
});
