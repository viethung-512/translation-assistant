// Large circular record/stop button. Pulse animation via CSS class in index.html.
interface Props {
  isRecording: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

export function RecordButton({ isRecording, isDisabled, onClick }: Props) {
  const bg = isDisabled
    ? 'var(--text-muted)'
    : isRecording
      ? 'var(--danger)'
      : 'var(--accent)';

  const shadow = isDisabled
    ? 'none'
    : isRecording
      ? '0 4px 20px rgba(239,68,68,0.35)'
      : '0 4px 20px rgba(59,130,246,0.35)';

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      className={isRecording ? 'record-btn-pulse' : ''}
      style={{
        position: 'relative',
        width: 76,
        height: 76,
        borderRadius: '50%',
        background: bg,
        border: 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: shadow,
        // Explicit override — transitions handled per-element via global CSS
        transition: 'background 0.2s, box-shadow 0.2s',
        minWidth: 76,
        minHeight: 76,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {isRecording ? (
        // Stop — rounded square
        <span style={{ width: 22, height: 22, background: '#fff', borderRadius: 5, display: 'block' }} />
      ) : (
        // Mic icon
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="9" y="2" width="6" height="11" rx="3" fill="white" />
          <path d="M5 11a7 7 0 0 0 14 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="18" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="9" y1="22" x2="15" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
