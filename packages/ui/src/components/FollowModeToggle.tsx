interface FollowModeToggleProps {
  followMode: boolean;
  followPaused: boolean;
  onChange: (followMode: boolean, paused: boolean) => void;
}

export function FollowModeToggle({ followMode, followPaused, onChange }: FollowModeToggleProps) {
  const toggleFollow = () => {
    onChange(!followMode, false);
  };

  const togglePause = () => {
    if (followMode) {
      onChange(followMode, !followPaused);
    }
  };

  return (
    <div className="follow-mode-toggle">
      <button
        className={`btn ${followMode ? 'btn-active' : 'btn-secondary'}`}
        onClick={toggleFollow}
      >
        {followMode ? '🔴 Follow' : '⚪ Follow'}
      </button>
      {followMode && (
        <button
          className={`btn ${followPaused ? 'btn-warning' : 'btn-secondary'}`}
          onClick={togglePause}
        >
          {followPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
      )}
    </div>
  );
}
