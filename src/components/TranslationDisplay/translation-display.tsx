// Scrollable translation view: live interim tokens + finalized transcript lines.
import { useEffect, useRef } from 'react';
import { useSessionStore } from '@/store/session-store';
import { TranscriptLine } from './transcript-line';

export function TranslationDisplay() {
  const { finalLines, interimOriginal, interimTranslated, recordingStatus } = useSessionStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest line
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [finalLines.length]);

  const isEmpty = finalLines.length === 0 && !interimTranslated && !interimOriginal;

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {isEmpty ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: 15,
            textAlign: 'center',
            padding: 32,
          }}
        >
          {recordingStatus === 'idle'
            ? 'Tap the button below to start translating'
            : 'Listening…'}
        </div>
      ) : (
        <>
          {finalLines.map((line, i) => (
            <TranscriptLine key={i} line={line} />
          ))}

          {/* Live interim row — shown while speaking */}
          {(interimTranslated || interimOriginal) && (
            <div style={{ padding: '8px 0', opacity: 0.5 }}>
              {interimTranslated && (
                <p style={{ margin: '0 0 2px', fontSize: 16, fontStyle: 'italic', color: '#374151' }}>
                  {interimTranslated}
                </p>
              )}
              {interimOriginal && (
                <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
                  {interimOriginal}
                </p>
              )}
            </div>
          )}
        </>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
