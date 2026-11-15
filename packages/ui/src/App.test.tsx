import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Integration test: App wires FileOpenDialog -> FileReader -> LogParser (real core) -> LogList.

const LOG_CONTENT = [
  '2024-01-01 10:00:00 INFO Hello world',
  '2024-01-01 10:00:01 WARN Disk almost full',
  '2024-01-01 10:00:02 ERROR Something failed',
].join('\n');

function getFileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('.file-open-dialog input[type="file"]');
  expect(input).not.toBeNull();
  return input as HTMLInputElement;
}

function openFile(container: HTMLElement, file: File) {
  fireEvent.change(getFileInput(container), { target: { files: [file] } });
}

describe('App integration: FileOpenDialog -> LogList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the file open dialog and an empty log list before a file is opened', () => {
    const { container } = render(<App />);

    expect(screen.getByRole('button', { name: /open file/i })).toBeInTheDocument();
    expect(getFileInput(container)).toHaveAttribute('accept', '.log,.txt,.csv,.json');
    expect(screen.getByText(/no log file loaded/i)).toBeInTheDocument();
    expect(container.querySelectorAll('.log-row')).toHaveLength(0);
  });

  it('clicking "Open File" opens the native file picker', () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /open file/i }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('selecting a file in the dialog renders the log list with one LogRow per line', async () => {
    const { container } = render(<App />);

    openFile(container, new File([LOG_CONTENT], 'app.log', { type: 'text/plain' }));

    await waitFor(() => {
      expect(container.querySelectorAll('.log-row')).toHaveLength(3);
    });

    expect(screen.queryByText(/no log file loaded/i)).not.toBeInTheDocument();
    expect(container.querySelector('.log-list-container')).toBeInTheDocument();
    expect(container.querySelector('.file-name')).toHaveTextContent('app.log');

    const rows = container.querySelectorAll('.log-row');
    expect(rows[0]).toHaveAttribute('data-line', '1');
    expect(rows[2]).toHaveAttribute('data-line', '3');
    expect(rows[0].querySelector('.log-row-level')).toHaveTextContent('INFO');
    expect(rows[0].querySelector('.log-row-content')).toHaveTextContent('Hello world');
    expect(rows[2].querySelector('.log-row-level')).toHaveTextContent('ERROR');
    expect(rows[2].querySelector('.log-row-content')).toHaveTextContent('Something failed');
    expect(screen.getByText(/showing 3 of 3 lines/i)).toBeInTheDocument();
  });

  it('opening a second file replaces the rendered lines', async () => {
    const { container } = render(<App />);

    openFile(container, new File([LOG_CONTENT], 'first.log', { type: 'text/plain' }));
    await waitFor(() => {
      expect(container.querySelectorAll('.log-row')).toHaveLength(3);
    });

    openFile(container, new File(['2024-01-02 09:00:00 INFO Only line\n'], 'second.log', { type: 'text/plain' }));
    await waitFor(() => {
      expect(container.querySelectorAll('.log-row')).toHaveLength(1);
    });

    expect(container.querySelector('.file-name')).toHaveTextContent('second.log');
    expect(container.querySelector('.log-row-content')).toHaveTextContent('Only line');
    expect(screen.getByText(/showing 1 of 1 lines/i)).toBeInTheDocument();
  });

  it('opening an empty file shows the loaded-but-empty state', async () => {
    const { container } = render(<App />);

    openFile(container, new File([''], 'empty.log', { type: 'text/plain' }));

    await waitFor(() => {
      expect(screen.getByText(/file is empty/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/no log file loaded/i)).not.toBeInTheDocument();
    expect(container.querySelectorAll('.log-row')).toHaveLength(0);
  });

  it('shows an error banner and no log rows when the file cannot be read', async () => {
    vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
      this.onerror?.call(this, new ProgressEvent('error') as ProgressEvent<FileReader>);
    });
    const { container } = render(<App />);

    openFile(container, new File(['whatever'], 'broken.log', { type: 'text/plain' }));

    await waitFor(() => {
      expect(container.querySelector('.error-banner')).toHaveTextContent('Failed to read file');
    });
    expect(screen.getByText(/no log file loaded/i)).toBeInTheDocument();
    expect(container.querySelectorAll('.log-row')).toHaveLength(0);
  });
});
