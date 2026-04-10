// Large circular record/stop button with pulsing animation when active.

interface Props {
  isRecording: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

export function RecordButton({ isRecording, isDisabled, onClick }: Props) {
  const bgColor = isDisabled ? '#d1d5db' : isRecording ? '#ef4444' : '#3b82f6';

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0;   }
        }
        .record-btn-pulse::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #ef4444;
          animation: pulse-ring 1.2s ease-out infinite;
        }
      `}</style>

      <button
        onClick={onClick}
        disabled={isDisabled}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        className={isRecording ? 'record-btn-pulse' : ''}
        style={{
          position: 'relative',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: bgColor,
          border: 'none',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isDisabled ? 'none' : '0 4px 14px rgba(0,0,0,0.2)',
          transition: 'background 0.2s, box-shadow 0.2s',
          minWidth: 80,
          minHeight: 80,
        }}
      >
        {isRecording ? (
          // Stop icon — filled square
          <span
            style={{
              width: 24,
              height: 24,
              background: '#fff',
              borderRadius: 4,
              display: 'block',
            }}
          />
        ) : (
          // Mic icon — SVG inline
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="11" rx="3" fill="white" />
            <path
              d="M5 11a7 7 0 0 0 14 0"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line x1="12" y1="18" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="9" y1="22" x2="15" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </>
  );
}
