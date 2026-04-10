// Single finalized translation line: translated text (primary) + original (secondary).
import React from 'react';
import type { TranscriptLine as TranscriptLineData } from '@/store/session-store';

interface Props {
  line: TranscriptLineData;
}

function TranscriptLineComponent({ line }: Props) {
  const time = new Date(line.timestampMs).toISOString().slice(11, 19);

  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
      <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 500, color: '#111827', lineHeight: 1.4 }}>
        {line.translatedText}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.3 }}>
        <span style={{ marginRight: 8 }}>{time}</span>
        {line.originalText}
      </p>
    </div>
  );
}

export const TranscriptLine = React.memo(TranscriptLineComponent);
