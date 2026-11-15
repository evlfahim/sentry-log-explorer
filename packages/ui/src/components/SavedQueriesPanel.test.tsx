import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SavedQueriesPanel } from './SavedQueriesPanel';
import { LogLevel } from 'core';
import type { SavedQuery } from 'core';

describe('SavedQueriesPanel (queries-ui)', () => {
  const onChange = vi.fn();
  const initialQueries: SavedQuery[] = [
    {
      id: 'q_1',
      name: 'Errors Only',
      description: 'Show only ERROR and above',
      minLevel: LogLevel.ERROR,
      createdAt: Date.now() - 100000,
      lastUsedAt: Date.now() - 50000,
      usageCount: 3,
    },
    {
      id: 'q_2',
      name: 'Warnings',
      minLevel: LogLevel.WARN,
      createdAt: Date.now() - 200000,
      lastUsedAt: Date.now() - 150000,
      usageCount: 1,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  function renderPanel(queries: SavedQuery[] = initialQueries) {
    return render(
      <SavedQueriesPanel queries={queries} onChange={onChange} />
    );
  }

  describe('rendering', () => {
    it('renders a toggle button with the query count', () => {
      renderPanel();
      const btn = screen.getByRole('button', { name: /saved queries \(2\)/i });
      expect(btn).toBeInTheDocument();
    });

    it('shows "No saved queries" when the list is empty', () => {
      renderPanel([]);
      const btn = screen.getByRole('button', { name: /saved queries \(0\)/i });
      fireEvent.click(btn);
      expect(screen.getByText('No saved queries')).toBeInTheDocument();
    });

    it('renders the panel header with a close button when opened', () => {
      renderPanel();
      const btn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(btn);
      expect(screen.getByText('Saved Queries')).toBeInTheDocument();
      const closeBtn = screen.getByRole('button', { name: /\u00d7/ });
      expect(closeBtn).toBeInTheDocument();
    });
  });

  describe('create query', () => {
    it('renders create form fields', () => {
      renderPanel();
      const btn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(btn);
      expect(screen.getByPlaceholderText(/query name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/description/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/regex pattern/i)).toBeInTheDocument();
    });

    it('creates a new query when Create is clicked with a name', () => {
      renderPanel();
      const btn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(btn);

      const nameInput = screen.getByPlaceholderText(/query name/i);
      fireEvent.change(nameInput, { target: { value: 'My Query' } });

      const createBtn = screen.getByText('Create');
      fireEvent.click(createBtn);

      expect(onChange).toHaveBeenCalledTimes(1);
      const newQueries = onChange.mock.calls[0][0];
      expect(newQueries).toHaveLength(3);
      expect(newQueries.find((q) => q.name === 'My Query')).toBeTruthy();
    });

    it('does not create a query when the name is empty', () => {
      renderPanel();
      const btn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(btn);

      const createBtn = screen.getByText('Create');
      fireEvent.click(createBtn);

      expect(onChange).not.toHaveBeenCalled();
    });

    it('resets form fields after creating a query', () => {
      renderPanel();
      const btn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(btn);

      const nameInput = screen.getByPlaceholderText(/query name/i);
      const descInput = screen.getByPlaceholderText(/description/i);
      const patternInput = screen.getByPlaceholderText(/regex pattern/i);
      const levelSelect = screen.getByRole('combobox');

      fireEvent.change(nameInput, { target: { value: 'Test' } });
      fireEvent.change(descInput, { target: { value: 'A desc' } });
      fireEvent.change(patternInput, { target: { value: 'ERROR' } });
      fireEvent.change(levelSelect, { target: { value: LogLevel.ERROR } });

      fireEvent.click(screen.getByText('Create'));

      expect(nameInput).toHaveValue('');
      expect(descInput).toHaveValue('');
      expect(patternInput).toHaveValue('');
      expect(levelSelect).toHaveValue('');
    });

    it('includes the selected minLevel in the created query', () => {
      renderPanel();
      const btn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(btn);

      const nameInput = screen.getByPlaceholderText(/query name/i);
      const levelSelect = screen.getByRole('combobox');

      fireEvent.change(nameInput, { target: { value: 'Errors Only' } });
      fireEvent.change(levelSelect, { target: { value: LogLevel.ERROR } });

      fireEvent.click(screen.getByText('Create'));

      const newQueries = onChange.mock.calls[0][0];
      const newQuery = newQueries.find((q) => q.name === 'Errors Only');
      expect(newQuery?.minLevel).toBe(LogLevel.ERROR);
    });

    it('includes the pattern in the created query', () => {
      renderPanel();
      const btn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(btn);

      const nameInput = screen.getByPlaceholderText(/query name/i);
      const patternInput = screen.getByPlaceholderText(/regex pattern/i);

      fireEvent.change(nameInput, { target: { value: 'Pattern Query' } });
      fireEvent.change(patternInput, { target: { value: 'timeout' } });

      fireEvent.click(screen.getByText('Create'));

      const newQueries = onChange.mock.calls[0][0];
      const newQuery = newQueries.find((q) => q.name === 'Pattern Query');
      expect(newQuery?.pattern).toBe('timeout');
    });
  });

  describe('delete query', () => {
    it('renders a delete button for each query', () => {
      renderPanel();
      const btn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(btn);

      const deleteBtns = screen.getAllByText('Delete');
      expect(deleteBtns).toHaveLength(2);
    });

    it('removes a query when Delete is clicked', () => {
      renderPanel();
      const panelBtn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(panelBtn);

      const deleteBtns = screen.getAllByText('Delete');
      fireEvent.click(deleteBtns[0]);

      expect(onChange).toHaveBeenCalledTimes(1);
      const newQueries = onChange.mock.calls[0][0];
      expect(newQueries).toHaveLength(1);
      expect(newQueries[0].id).toBe('q_2');
    });

    it('removes the correct query when Delete is clicked', () => {
      renderPanel();
      const panelBtn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(panelBtn);

      const deleteBtns = screen.getAllByText('Delete');
      fireEvent.click(deleteBtns[1]);

      const newQueries = onChange.mock.calls[0][0];
      expect(newQueries).toHaveLength(1);
      expect(newQueries[0].name).toBe('Errors Only');
    });
  });

  describe('export queries', () => {
    it('renders an Export JSON button', () => {
      renderPanel();
      const panelBtn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(panelBtn);
      expect(screen.getByText('Export JSON')).toBeInTheDocument();
    });

    it('exports queries as a JSON download when Export JSON is clicked', () => {
      renderPanel();
      const panelBtn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(panelBtn);

      // Mock Blob
      const blobSpy = vi.spyOn(window, 'Blob').mockImplementation(() => new Blob());
      // Mock URL.createObjectURL
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://test/abc');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      // Mock createElement
      const clickMock = vi.fn();
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(() => ({
        href: '',
        download: '',
        click: clickMock,
      }));

      const exportBtn = screen.getByText('Export JSON');
      fireEvent.click(exportBtn);

      // Verify Blob was created with JSON content
      expect(blobSpy).toHaveBeenCalledWith(
        expect.anything(),
        { type: 'application/json' }
      );

      // Verify URL.createObjectURL was called
      expect(createObjectURLSpy).toHaveBeenCalled();

      // Verify download link was created and clicked
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(clickMock).toHaveBeenCalled();

      blobSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      createElementSpy.mockRestore();
    });

    it('exports valid JSON that can be parsed back', () => {
      renderPanel();
      const panelBtn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(panelBtn);

      const exportBtn = screen.getByText('Export JSON');
      fireEvent.click(exportBtn);

      // The Blob was called with the JSON string as first argument
      const blobCall = (vi.mocked(window.Blob).mock.calls[0] as any)[0];
      const parsed = JSON.parse(blobCall);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed.find((q: SavedQuery) => q.id === 'q_1')).toBeTruthy();
      expect(parsed.find((q: SavedQuery) => q.id === 'q_2')).toBeTruthy();
    });
  });

  describe('import queries', () => {
    it('renders an Import JSON button', () => {
      renderPanel();
      const panelBtn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(panelBtn);
      expect(screen.getByText('Import JSON')).toBeInTheDocument();
    });

    it('imports queries from a JSON file', () => {
      renderPanel();
      const panelBtn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(panelBtn);

      const importLabel = screen.getByText('Import JSON');
      const fileInput = importLabel.querySelector('input[type="file"]') as HTMLInputElement;

      const importedQueries: SavedQuery[] = [
        {
          id: 'q_3',
          name: 'Imported Query',
          minLevel: LogLevel.DEBUG,
          createdAt: Date.now(),
          lastUsedAt: Date.now(),
          usageCount: 0,
        },
      ];

      const jsonStr = JSON.stringify(importedQueries, null, 2);
      const file = new File([jsonStr], 'queries.json', { type: 'application/json' });

      // Mock FileReader synchronously
      const mockReader = {
        result: jsonStr,
        readAsText: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        abort: vi.fn(),
      } as unknown as FileReader;

      vi.spyOn(window, 'FileReader').mockImplementation(() => mockReader);

      // Capture the onload handler
      let capturedOnload: ((ev: ProgressEvent) => void) | null = null;
      mockReader.addEventListener = vi.fn((name: string, handler: any) => {
        if (name === 'load') capturedOnload = handler;
      });

      fireEvent.change(fileInput, { target: { files: [file] } });

      // Manually trigger the onload callback (simulating file read completion)
      expect(mockReader.readAsText).toHaveBeenCalledWith(file);
      if (capturedOnload) {
        capturedOnload({} as ProgressEvent);
      }

      expect(onChange).toHaveBeenCalled();
      const newQueries = onChange.mock.calls[0][0];
      expect(newQueries).toHaveLength(3);
      expect(newQueries.find((q) => q.id === 'q_3')).toBeTruthy();
    });

    it('ignores invalid JSON on import', () => {
      renderPanel();
      const panelBtn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(panelBtn);

      const importLabel = screen.getByText('Import JSON');
      const fileInput = importLabel.querySelector('input[type="file"]') as HTMLInputElement;

      const invalidJson = 'not valid json {{{';
      const file = new File([invalidJson], 'bad.json', { type: 'application/json' });

      const mockReader = {
        result: invalidJson,
        readAsText: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        abort: vi.fn(),
      } as unknown as FileReader;

      vi.spyOn(window, 'FileReader').mockImplementation(() => mockReader);

      let capturedOnload: ((ev: ProgressEvent) => void) | null = null;
      mockReader.addEventListener = vi.fn((name: string, handler: any) => {
        if (name === 'load') capturedOnload = handler;
      });

      fireEvent.change(fileInput, { target: { files: [file] } });

      if (capturedOnload) {
        capturedOnload({} as ProgressEvent);
      }

      // Should not call onChange because the JSON is invalid
      expect(onChange).not.toHaveBeenCalled();
    });

    it('ignores non-array JSON on import', () => {
      renderPanel();
      const panelBtn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(panelBtn);

      const importLabel = screen.getByText('Import JSON');
      const fileInput = importLabel.querySelector('input[type="file"]') as HTMLInputElement;

      const nonArrayJson = JSON.stringify({ not: 'an array' });
      const file = new File([nonArrayJson], 'bad.json', { type: 'application/json' });

      const mockReader = {
        result: nonArrayJson,
        readAsText: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        abort: vi.fn(),
      } as unknown as FileReader;

      vi.spyOn(window, 'FileReader').mockImplementation(() => mockReader);

      let capturedOnload: ((ev: ProgressEvent) => void) | null = null;
      mockReader.addEventListener = vi.fn((name: string, handler: any) => {
        if (name === 'load') capturedOnload = handler;
      });

      fireEvent.change(fileInput, { target: { files: [file] } });

      if (capturedOnload) {
        capturedOnload({} as ProgressEvent);
      }

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('query list display', () => {
    it('displays each query name in the list', () => {
      renderPanel();
      const panelBtn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(panelBtn);

      expect(screen.getByText('Errors Only')).toBeInTheDocument();
      expect(screen.getByText('Warnings')).toBeInTheDocument();
    });

    it('displays query description when present', () => {
      renderPanel();
      const panelBtn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(panelBtn);

      expect(screen.getByText('Show only ERROR and above')).toBeInTheDocument();
    });

    it('displays the level filter when set', () => {
      renderPanel();
      const panelBtn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(panelBtn);

      expect(screen.getByText(/Level: ERROR/)).toBeInTheDocument();
    });

    it('displays usage count when greater than 0', () => {
      renderPanel();
      const panelBtn = screen.getByRole('button', { name: /saved queries/i });
      fireEvent.click(panelBtn);

      expect(screen.getByText(/Used 3×/)).toBeInTheDocument();
    });

    it('toggles the panel open and closed', () => {
      renderPanel();
      const panelBtn = screen.getByRole('button', { name: /saved queries/i });

      // Initially closed
      expect(screen.queryByText('Saved Queries')).not.toBeInTheDocument();

      // Open
      fireEvent.click(panelBtn);
      expect(screen.getByText('Saved Queries')).toBeInTheDocument();

      // Close
      const closeBtn = screen.getByRole('button', { name: /\u00d7/ });
      fireEvent.click(closeBtn);
      expect(screen.queryByText('Saved Queries')).not.toBeInTheDocument();
    });
  });
});
