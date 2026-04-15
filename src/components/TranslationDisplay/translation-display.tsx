// Scrollable translation view: live interim tokens + finalized transcript lines.
import { useEffect, useRef } from 'react';
import type { TranscriptLine } from '@/tauri/transcript-fs';
import { TranscriptLine as TranscriptLineComponent } from './transcript-line';

interface Props {
  finalLines: TranscriptLine[];
  interimOriginal: string;
  interimTranslated: string;
  recordingStatus: 'idle' | 'recording' | 'stopping';
}

export function TranslationDisplay({ finalLines, interimOriginal, interimTranslated, recordingStatus }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest line
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [finalLines.length]);

  const isEmpty = finalLines.length === 0 && !interimTranslated && !interimOriginal;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', display: 'flex', flexDirection: 'column' }}>
      {isEmpty ? (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: 15,
          textAlign: 'center',
          padding: 32,
          lineHeight: 1.6,
        }}>
          {recordingStatus === 'idle' ? 'Tap the button below to start translating' : 'Listening…'}
        </div>
      ) : (
        <>
          {finalLines.map((line, i) => (
            <TranscriptLineComponent key={i} line={line} />
          ))}

          {/* Live interim row — shown while speaking */}
          {(interimTranslated || interimOriginal) && (
            <div style={{ padding: '8px 0', opacity: 0.55 }}>
              {interimTranslated && (
                <p style={{ margin: '0 0 2px', fontSize: 16, fontStyle: 'italic', color: 'var(--text-primary)' }}>
                  {interimTranslated}
                </p>
              )}
              {interimOriginal && (
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
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
