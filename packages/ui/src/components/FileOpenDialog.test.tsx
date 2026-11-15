import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileOpenDialog } from './FileOpenDialog';

describe('FileOpenDialog', () => {
  it('renders the Open File button', () => {
    const { container } = render(<FileOpenDialog onFileOpen={vi.fn()} />);
    const button = screen.getByRole('button', { name: /open file/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Open File');
  });

  it('renders a hidden file input element', () => {
    const { container } = render(<FileOpenDialog onFileOpen={vi.fn()} />);
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it('file input has correct accept attribute', () => {
    const { container } = render(<FileOpenDialog onFileOpen={vi.fn()} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toHaveAttribute('accept', '.log,.txt,.csv,.json');
  });

  it('file input is hidden via style', () => {
    const { container } = render(<FileOpenDialog onFileOpen={vi.fn()} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput.style.display).toBe('none');
  });

  it('calls onFileOpen with the selected file when file is chosen', () => {
    const onFileOpen = vi.fn();
    const { container } = render(<FileOpenDialog onFileOpen={onFileOpen} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    const testFile = new File(['test content'], 'test.log', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    expect(onFileOpen).toHaveBeenCalledTimes(1);
    expect(onFileOpen).toHaveBeenCalledWith(testFile);
  });

  it('does not call onFileOpen when no file is selected', () => {
    const onFileOpen = vi.fn();
    const { container } = render(<FileOpenDialog onFileOpen={onFileOpen} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: null } });

    expect(onFileOpen).not.toHaveBeenCalled();
  });

  it('button click triggers file input click', () => {
    const { container } = render(<FileOpenDialog onFileOpen={vi.fn()} />);
    const button = screen.getByRole('button', { name: /open file/i });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    const clickSpy = vi.spyOn(fileInput, 'click');
    fireEvent.click(button);

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('button is disabled when disabled prop is true', () => {
    render(<FileOpenDialog onFileOpen={vi.fn()} disabled />);
    const button = screen.getByRole('button', { name: /open file/i });
    expect(button).toBeDisabled();
  });

  it('button is enabled when disabled prop is false', () => {
    render(<FileOpenDialog onFileOpen={vi.fn()} disabled={false} />);
    const button = screen.getByRole('button', { name: /open file/i });
    expect(button).not.toBeDisabled();
  });

  it('resets file input value after selection', () => {
    const onFileOpen = vi.fn();
    const { container } = render(<FileOpenDialog onFileOpen={onFileOpen} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    const testFile = new File(['test content'], 'test.log', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    expect(fileInput.value).toBe('');
  });
});
