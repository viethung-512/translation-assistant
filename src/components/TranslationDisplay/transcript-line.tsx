// Single finalized translation line: translated text (primary) + original (secondary).
import React from 'react';
import type { TranscriptLine as TranscriptLineData } from '@/tauri/transcript-fs';

interface Props {
  line: TranscriptLineData;
}

function TranscriptLineComponent({ line }: Props) {
  const time = new Date(line.timestampMs).toISOString().slice(11, 19);

  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
      <p style={{ margin: '0 0 3px', fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.45 }}>
        {line.translatedText}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.3, display: 'flex', gap: 8 }}>
        <span>{time}</span>
        <span>{line.originalText}</span>
      </p>
    </div>
  );
}

export const TranscriptLine = React.memo(TranscriptLineComponent);
