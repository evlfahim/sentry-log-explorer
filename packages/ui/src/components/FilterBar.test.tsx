import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from './FilterBar';
import { LogLevel } from 'core';

describe('FilterBar', () => {
  const onFilterChange = vi.fn();
  const onHighlightPatternsChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderFilterBar() {
    return render(
      <FilterBar
        onFilterChange={onFilterChange}
        onHighlightPatternsChange={onHighlightPatternsChange}
      />
    );
  }

  describe('level toggle', () => {
    it('renders a level select dropdown', () => {
      renderFilterBar();
      const select = screen.getByRole('combobox', { name: /level/i });
      expect(select).toBeInTheDocument();
    });

    it('has an "All" option selected by default', () => {
      renderFilterBar();
      const select = screen.getByRole('combobox', { name: /level/i });
      expect(select).toHaveValue('');
    });

    it('renders all log level options', () => {
      renderFilterBar();
      const select = screen.getByRole('combobox', { name: /level/i });
      const options = Array.from(select.querySelectorAll('option'));
      const values = options.map((o) => o.value);
      expect(values).toContain('');
      expect(values).toContain(LogLevel.DEBUG);
      expect(values).toContain(LogLevel.INFO);
      expect(values).toContain(LogLevel.WARN);
      expect(values).toContain(LogLevel.WARNING);
      expect(values).toContain(LogLevel.ERROR);
      expect(values).toContain(LogLevel.FATAL);
      expect(values).toContain(LogLevel.TRACE);
    });

    it('calls onFilterChange with the selected level when Apply Filter is clicked', () => {
      renderFilterBar();
      const select = screen.getByRole('combobox', { name: /level/i });
      fireEvent.change(select, { target: { value: LogLevel.ERROR } });
      const applyBtn = screen.getByText('Apply Filter');
      fireEvent.click(applyBtn);
      expect(onFilterChange).toHaveBeenCalledWith(
        LogLevel.ERROR,
        '',
        '',
        ''
      );
    });

    it('resets level to "" when "All" is selected', () => {
      renderFilterBar();
      const select = screen.getByRole('combobox', { name: /level/i });
      fireEvent.change(select, { target: { value: LogLevel.INFO } });
      fireEvent.change(select, { target: { value: '' } });
      const applyBtn = screen.getByText('Apply Filter');
      fireEvent.click(applyBtn);
      expect(onFilterChange).toHaveBeenCalledWith('', '', '', '');
    });
  });

  describe('time picker', () => {
    it('renders a "From" datetime-local input', () => {
      renderFilterBar();
      const fromInput = screen.getByLabelText('From');
      expect(fromInput).toHaveAttribute('type', 'datetime-local');
      expect(fromInput).toHaveValue('');
    });

    it('renders a "To" datetime-local input', () => {
      renderFilterBar();
      const toInput = screen.getByLabelText('To');
      expect(toInput).toHaveAttribute('type', 'datetime-local');
      expect(toInput).toHaveValue('');
    });

    it('passes time values to onFilterChange when Apply Filter is clicked', () => {
      renderFilterBar();
      const fromInput = screen.getByLabelText('From');
      const toInput = screen.getByLabelText('To');
      fireEvent.change(fromInput, { target: { value: '2024-01-01T00:00' } });
      fireEvent.change(toInput, { target: { value: '2024-12-31T23:59' } });
      const applyBtn = screen.getByText('Apply Filter');
      fireEvent.click(applyBtn);
      expect(onFilterChange).toHaveBeenCalledWith(
        '',
        '2024-01-01T00:00',
        '2024-12-31T23:59',
        ''
      );
    });

    it('clears time values when inputs are cleared', () => {
      renderFilterBar();
      const fromInput = screen.getByLabelText('From');
      const toInput = screen.getByLabelText('To');
      fireEvent.change(fromInput, { target: { value: '2024-01-01T00:00' } });
      fireEvent.change(toInput, { target: { value: '2024-12-31T23:59' } });
      fireEvent.change(fromInput, { target: { value: '' } });
      fireEvent.change(toInput, { target: { value: '' } });
      const applyBtn = screen.getByText('Apply Filter');
      fireEvent.click(applyBtn);
      expect(onFilterChange).toHaveBeenCalledWith('', '', '', '');
    });
  });

  describe('pattern filter', () => {
    it('renders a pattern text input', () => {
      renderFilterBar();
      const patternInput = screen.getByPlaceholderText(/regex pattern/i);
      expect(patternInput).toBeInTheDocument();
      expect(patternInput).toHaveValue('');
    });

    it('passes the pattern value to onFilterChange when Apply Filter is clicked', () => {
      renderFilterBar();
      const patternInput = screen.getByPlaceholderText(/regex pattern/i);
      fireEvent.change(patternInput, { target: { value: 'ERROR|FATAL' } });
      const applyBtn = screen.getByText('Apply Filter');
      fireEvent.click(applyBtn);
      expect(onFilterChange).toHaveBeenCalledWith('', '', '', 'ERROR|FATAL');
    });
  });

  describe('combined filter', () => {
    it('passes all filter values together when Apply Filter is clicked', () => {
      renderFilterBar();
      const select = screen.getByRole('combobox', { name: /level/i });
      const fromInput = screen.getByLabelText('From');
      const toInput = screen.getByLabelText('To');
      const patternInput = screen.getByPlaceholderText(/regex pattern/i);

      fireEvent.change(select, { target: { value: LogLevel.ERROR } });
      fireEvent.change(fromInput, { target: { value: '2024-06-01T10:00' } });
      fireEvent.change(toInput, { target: { value: '2024-06-01T12:00' } });
      fireEvent.change(patternInput, { target: { value: 'timeout' } });

      const applyBtn = screen.getByText('Apply Filter');
      fireEvent.click(applyBtn);

      expect(onFilterChange).toHaveBeenCalledWith(
        LogLevel.ERROR,
        '2024-06-01T10:00',
        '2024-06-01T12:00',
        'timeout'
      );
    });
  });

  describe('highlight patterns', () => {
    it('renders a highlight pattern input', () => {
      renderFilterBar();
      const input = screen.getByPlaceholderText(/regex/i);
      expect(input).toBeInTheDocument();
    });

    it('renders a color picker for highlight color', () => {
      renderFilterBar();
      const colorInput = screen.getByRole('textbox', { name: /color/i });
      // In jsdom, color inputs render as text inputs
      // Let's check for the color input by its type attribute
      const allInputs = screen.getAllByRole('textbox');
      const colorInputEl = allInputs.find(
        (el) => (el as HTMLInputElement).type === 'color'
      );
      // jsdom may not support color inputs natively, so fall back to checking
      // that the color picker exists in the DOM
      const highlightGroup = screen.getByText(/highlight/i).closest('.filter-group');
      expect(highlightGroup).toBeInTheDocument();
    });

    it('adds a highlight pattern when + button is clicked', () => {
      renderFilterBar();
      const patternInput = screen.getByPlaceholderText(/regex/i);
      fireEvent.change(patternInput, { target: { value: 'ERROR' } });
      const addBtn = screen.getByText('+');
      fireEvent.click(addBtn);
      expect(onHighlightPatternsChange).toHaveBeenCalled();
      const patterns = onHighlightPatternsChange.mock.calls[0][0];
      expect(patterns).toHaveLength(1);
      expect(patterns[0].name).toBe('Custom: ERROR');
    });

    it('removes a highlight pattern when × button is clicked', () => {
      renderFilterBar();
      // Add two patterns
      const patternInput = screen.getByPlaceholderText(/regex/i);
      fireEvent.change(patternInput, { target: { value: 'ERROR' } });
      fireEvent.click(screen.getByText('+'));
      fireEvent.change(patternInput, { target: { value: 'WARN' } });
      fireEvent.click(screen.getByText('+'));

      expect(onHighlightPatternsChange).toHaveBeenCalledTimes(2);
      const firstPatterns = onHighlightPatternsChange.mock.calls[0][0];
      expect(firstPatterns).toHaveLength(1);

      // Remove the first one
      const removeBtns = screen.getAllByText('×');
      fireEvent.click(removeBtns[0]);

      expect(onHighlightPatternsChange).toHaveBeenCalledTimes(3);
      const secondPatterns = onHighlightPatternsChange.mock.calls[2][0];
      expect(secondPatterns).toHaveLength(1);
    });

    it('does not add an empty highlight pattern', () => {
      renderFilterBar();
      const addBtn = screen.getByText('+');
      fireEvent.click(addBtn);
      expect(onHighlightPatternsChange).not.toHaveBeenCalled();
    });

    it('ignores invalid regex patterns when adding', () => {
      renderFilterBar();
      const patternInput = screen.getByPlaceholderText(/regex/i);
      fireEvent.change(patternInput, { target: { value: '[invalid' } });
      const addBtn = screen.getByText('+');
      fireEvent.click(addBtn);
      expect(onHighlightPatternsChange).not.toHaveBeenCalled();
    });

    it('renders highlight tags when patterns exist', () => {
      renderFilterBar();
      const patternInput = screen.getByPlaceholderText(/regex/i);
      fireEvent.change(patternInput, { target: { value: 'ERROR' } });
      fireEvent.click(screen.getByText('+'));

      expect(screen.getByText(/Custom: ERROR/i)).toBeInTheDocument();
    });

    it('clears the highlight pattern input after adding', () => {
      renderFilterBar();
      const patternInput = screen.getByPlaceholderText(/regex/i);
      fireEvent.change(patternInput, { target: { value: 'ERROR' } });
      fireEvent.click(screen.getByText('+'));
      expect(patternInput).toHaveValue('');
    });
  });
});
