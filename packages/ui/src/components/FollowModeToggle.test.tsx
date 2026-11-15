import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FollowModeToggle } from './FollowModeToggle';

describe('FollowModeToggle', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderToggle(followMode = false, followPaused = false) {
    return render(
      <FollowModeToggle
        followMode={followMode}
        followPaused={followPaused}
        onChange={onChange}
      />
    );
  }

  describe('rendering', () => {
    it('renders a follow button', () => {
      renderToggle();
      const btn = screen.getByRole('button', { name: /follow/i });
      expect(btn).toBeInTheDocument();
    });

    it('shows "⚪ Follow" when follow mode is off', () => {
      renderToggle(false);
      expect(screen.getByText('⚪ Follow')).toBeInTheDocument();
    });

    it('shows "🔴 Follow" when follow mode is on', () => {
      renderToggle(true);
      expect(screen.getByText('🔴 Follow')).toBeInTheDocument();
    });

    it('does not render a pause button when follow mode is off', () => {
      renderToggle(false);
      expect(screen.queryByText(/pause|resume/i)).toBeNull();
    });

    it('renders a pause button when follow mode is on and not paused', () => {
      renderToggle(true, false);
      expect(screen.getByText('⏸ Pause')).toBeInTheDocument();
    });

    it('renders a resume button when follow mode is on and paused', () => {
      renderToggle(true, true);
      expect(screen.getByText('▶ Resume')).toBeInTheDocument();
    });

    it('applies btn-active class when follow mode is on', () => {
      renderToggle(true);
      const followBtn = screen.getByRole('button', { name: /follow/i });
      expect(followBtn).toHaveClass('btn-active');
    });

    it('applies btn-secondary class when follow mode is off', () => {
      renderToggle(false);
      const followBtn = screen.getByRole('button', { name: /follow/i });
      expect(followBtn).toHaveClass('btn-secondary');
    });

    it('applies btn-warning class when follow mode is on and paused', () => {
      renderToggle(true, true);
      const pauseBtn = screen.getByRole('button', { name: /resume/i });
      expect(pauseBtn).toHaveClass('btn-warning');
    });

    it('applies btn-secondary class when follow mode is on but not paused', () => {
      renderToggle(true, false);
      const pauseBtn = screen.getByRole('button', { name: /pause/i });
      expect(pauseBtn).toHaveClass('btn-secondary');
    });
  });

  describe('toggle follow mode', () => {
    it('calls onChange with followMode=true when follow button is clicked while off', () => {
      renderToggle(false);
      const btn = screen.getByRole('button', { name: /follow/i });
      fireEvent.click(btn);
      expect(onChange).toHaveBeenCalledWith(true, false);
    });

    it('calls onChange with followMode=false when follow button is clicked while on', () => {
      renderToggle(true);
      const btn = screen.getByRole('button', { name: /follow/i });
      fireEvent.click(btn);
      expect(onChange).toHaveBeenCalledWith(false, false);
    });

    it('resets paused state to false when toggling follow mode on', () => {
      renderToggle(true, true);
      const btn = screen.getByRole('button', { name: /follow/i });
      fireEvent.click(btn);
      expect(onChange).toHaveBeenCalledWith(false, false);
    });

    it('resets paused state to false when toggling follow mode off', () => {
      renderToggle(true, true);
      const btn = screen.getByRole('button', { name: /follow/i });
      fireEvent.click(btn);
      expect(onChange).toHaveBeenCalledWith(false, false);
    });
  });

  describe('toggle pause', () => {
    it('calls onChange with followPaused=true when pause button is clicked', () => {
      renderToggle(true, false);
      const btn = screen.getByRole('button', { name: /pause/i });
      fireEvent.click(btn);
      expect(onChange).toHaveBeenCalledWith(true, true);
    });

    it('calls onChange with followPaused=false when resume button is clicked', () => {
      renderToggle(true, true);
      const btn = screen.getByRole('button', { name: /resume/i });
      fireEvent.click(btn);
      expect(onChange).toHaveBeenCalledWith(true, false);
    });

    it('does nothing when pause button is clicked but follow mode is off', () => {
      renderToggle(false);
      // No pause button should be rendered, so clicking nothing
      const pauseBtn = screen.queryByRole('button', { name: /pause/i });
      expect(pauseBtn).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('follow mode toggle when paused', () => {
    it('turns off follow mode and resets pause when follow button is clicked while paused', () => {
      renderToggle(true, true);
      const btn = screen.getByRole('button', { name: /follow/i });
      fireEvent.click(btn);
      expect(onChange).toHaveBeenCalledWith(false, false);
    });
  });
});
