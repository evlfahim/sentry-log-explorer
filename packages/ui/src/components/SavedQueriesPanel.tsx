import { useState } from 'react';
import { LogLevel } from 'core';
import type { SavedQuery } from 'core';

interface SavedQueriesPanelProps {
  queries: SavedQuery[];
  onChange: (queries: SavedQuery[]) => void;
}

export function SavedQueriesPanel({ queries, onChange }: SavedQueriesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newMinLevel, setNewMinLevel] = useState<LogLevel | ''>('');
  const [newPattern, setNewPattern] = useState('');

  const handleCreateQuery = () => {
    if (!newName.trim()) return;
    const query: SavedQuery = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      minLevel: newMinLevel || undefined,
      timeStart: undefined,
      timeEnd: undefined,
      pattern: newPattern || undefined,
      highlightPatterns: [],
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      usageCount: 1,
    };
    onChange([...queries, query]);
    setNewName('');
    setNewDescription('');
    setNewMinLevel('');
    setNewPattern('');
  };

  const handleDeleteQuery = (id: string) => {
    onChange(queries.filter((q) => q.id !== id));
  };

  const handleExportQueries = () => {
    const json = JSON.stringify(queries, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'saved-queries.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportQueries = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string) as SavedQuery[];
        if (Array.isArray(imported)) {
          onChange(imported);
        }
      } catch {
        // Invalid JSON, ignore
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="saved-queries-panel">
      <button className="btn btn-secondary" onClick={() => setIsOpen(!isOpen)}>
        Saved Queries ({queries.length})
      </button>

      {isOpen && (
        <div className="saved-queries-dropdown">
          <div className="saved-queries-header">
            <h3>Saved Queries</h3>
            <button className="btn btn-small" onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="saved-queries-create">
            <input
              type="text"
              placeholder="Query name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <select
              value={newMinLevel}
              onChange={(e) => setNewMinLevel(e.target.value as LogLevel | '')}
            >
              <option value="">Any Level</option>
              <option value={LogLevel.DEBUG}>DEBUG</option>
              <option value={LogLevel.INFO}>INFO</option>
              <option value={LogLevel.WARN}>WARN</option>
              <option value={LogLevel.ERROR}>ERROR</option>
              <option value={LogLevel.FATAL}>FATAL</option>
            </select>
            <input
              type="text"
              placeholder="Regex pattern (optional)"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleCreateQuery}>
              Create
            </button>
          </div>

          <div className="saved-queries-list">
            {queries.length === 0 && <p className="empty-msg">No saved queries</p>}
            {queries.map((q) => (
              <div key={q.id} className="saved-query-item">
                <div className="saved-query-info">
                  <strong>{q.name}</strong>
                  {q.description && <span className="saved-query-desc">{q.description}</span>}
                  {q.minLevel && (
                    <span className="saved-query-level">Level: {q.minLevel}</span>
                  )}
                  {q.usageCount > 0 && (
                    <span className="saved-query-usage">Used {q.usageCount}×</span>
                  )}
                </div>
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => handleDeleteQuery(q.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          <div className="saved-queries-actions">
            <button className="btn btn-small" onClick={handleExportQueries}>
              Export JSON
            </button>
            <label className="btn btn-small">
              Import JSON
              <input
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportQueries}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
