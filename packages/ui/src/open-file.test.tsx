import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App';

describe('open-file', () => {
  it('renders the Open File button', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /open file/i })).toBeInTheDocument();
  });

  it('shows empty state when no file is loaded', () => {
    render(<App />);
    expect(screen.getByText(/no log file loaded/i)).toBeInTheDocument();
  });

  it('triggers file input when Open File button is clicked', () => {
    render(<App />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', '.log,.txt,.csv,.json');
  });

  it('renders the app header with title', () => {
    render(<App />);
    expect(screen.getByText('Sentry Log Explorer')).toBeInTheDocument();
  });

  it('renders the filter bar', () => {
    render(<App />);
    const filterBar = document.querySelector('.filter-bar');
    expect(filterBar).toBeInTheDocument();
  });

  it('renders follow mode toggle', () => {
    render(<App />);
    const followToggle = document.querySelector('.follow-mode-toggle');
    expect(followToggle).toBeInTheDocument();
  });

  it('renders saved queries panel', () => {
    render(<App />);
    const savedQueriesPanel = document.querySelector('.saved-queries-panel');
    expect(savedQueriesPanel).toBeInTheDocument();
  });

  it('renders log list after file is opened', async () => {
    render(<App />);

    const logContent = '2024-01-01 10:00:00 INFO Starting application\n2024-01-01 10:00:01 ERROR Connection failed\n2024-01-01 10:00:02 WARN Retrying';
    const file = new File([logContent], 'test.log', { type: 'text/plain' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.queryByText(/no log file loaded/i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Starting application')).toBeInTheDocument();
    });
  });

  it('displays line numbers in the log list', async () => {
    render(<App />);

    const logContent = '2024-01-01 10:00:00 INFO Line one\n2024-01-01 10:00:01 ERROR Line two';
    const file = new File([logContent], 'test.log', { type: 'text/plain' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('shows file name in header after loading', async () => {
    render(<App />);

    const logContent = '2024-01-01 10:00:00 INFO Test message';
    const file = new File([logContent], 'myapp.log', { type: 'text/plain' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('myapp.log')).toBeInTheDocument();
    });
  });

  it('renders level badges with correct colors', async () => {
    render(<App />);

    const logContent = '2024-01-01 10:00:00 INFO Info message\n2024-01-01 10:00:01 ERROR Error message\n2024-01-01 10:00:02 WARN Warn message';
    const file = new File([logContent], 'test.log', { type: 'text/plain' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('INFO')).toBeInTheDocument();
      expect(screen.getByText('ERROR')).toBeInTheDocument();
      expect(screen.getByText('WARN')).toBeInTheDocument();
    });
  });

  it('renders footer with line count after loading', async () => {
    render(<App />);

    const logContent = 'Line 1\nLine 2\nLine 3';
    const file = new File([logContent], 'test.log', { type: 'text/plain' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/showing \d+ of \d+ lines/i)).toBeInTheDocument();
    });
  });

  it('handles file with special characters in name', async () => {
    render(<App />);

    const logContent = 'Test log content';
    const file = new File([logContent], 'my-app (v2.0).log', { type: 'text/plain' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('my-app (v2.0).log')).toBeInTheDocument();
    });
  });

  it('renders log rows with correct CSS classes', async () => {
    render(<App />);

    const logContent = '2024-01-01 10:00:00 INFO Test message';
    const file = new File([logContent], 'test.log', { type: 'text/plain' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const logRow = screen.getByText('Test message').closest('.log-row');
      expect(logRow).toBeInTheDocument();
      expect(logRow).toHaveAttribute('data-line', '1');
    });
  });

  it('renders log rows with level color styling', async () => {
    render(<App />);

    const logContent = '2024-01-01 10:00:00 ERROR Something broke';
    const file = new File([logContent], 'test.log', { type: 'text/plain' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const levelEl = screen.getByText('ERROR');
      expect(levelEl).toHaveStyle({ color: '#d32f2f' });
    });
  });

  it('renders log row content with HTML-escaped text', async () => {
    render(<App />);

    const logContent = '<script>alert("xss")</script>';
    const file = new File([logContent], 'test.log', { type: 'text/plain' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const row = screen.getByText(/alert/).closest('.log-row');
      expect(row).toBeInTheDocument();
      expect(row?.querySelector('script')).toBeNull();
    });
  });

  it('renders empty file content gracefully', async () => {
    render(<App />);

    const file = new File([''], 'empty.log', { type: 'text/plain' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.queryByText(/no log file loaded/i)).not.toBeInTheDocument();
    });
  });

  it('renders all log lines when file is loaded', async () => {
    render(<App />);

    const lines = [
      '2024-01-01 10:00:00 INFO Line one',
      '2024-01-01 10:00:01 INFO Line two',
      '2024-01-01 10:00:02 INFO Line three',
      '2024-01-01 10:00:03 INFO Line four',
      '2024-01-01 10:00:04 INFO Line five',
    ];
    const logContent = lines.join('\n');
    const file = new File([logContent], 'test.log', { type: 'text/plain' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Line one')).toBeInTheDocument();
      expect(screen.getByText('Line two')).toBeInTheDocument();
      expect(screen.getByText('Line three')).toBeInTheDocument();
      expect(screen.getByText('Line four')).toBeInTheDocument();
      expect(screen.getByText('Line five')).toBeInTheDocument();
    });
  });

  it('renders the log list container with correct class', async () => {
    render(<App />);

    const logContent = 'Test log';
    const file = new File([logContent], 'test.log', { type: 'text/plain' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const container = document.querySelector('.log-list-container');
      expect(container).toBeInTheDocument();
    });
  });

  it('renders the log list viewport', async () => {
    render(<App />);

    const logContent = 'Test log';
    const file = new File([logContent], 'test.log', { type: 'text/plain' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const viewport = document.querySelector('.log-list-viewport');
      expect(viewport).toBeInTheDocument();
    });
  });
});
