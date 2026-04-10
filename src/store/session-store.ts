// Ephemeral per-recording session state. Reset on every new recording start.
import { create } from 'zustand';
import type { ConnectionStatus } from '@/providers/types';

export type RecordingStatus = 'idle' | 'recording' | 'stopping';

export interface TranscriptLine {
  originalText: string;
  translatedText: string;
  timestampMs: number;
}

interface SessionState {
  recordingStatus: RecordingStatus;
  connectionStatus: ConnectionStatus;
  // Live (non-final) token buffers for display
  interimOriginal: string;
  interimTranslated: string;
  finalLines: TranscriptLine[];
  sessionStartedAt: number | null;
  errorMessage: string | null;
  // Actions
  setRecordingStatus: (s: RecordingStatus) => void;
  setConnectionStatus: (s: ConnectionStatus) => void;
  appendToken: (
    text: string,
    isFinal: boolean,
    type: 'original' | 'translated',
    timestampMs: number
  ) => void;
  resetSession: () => void;
  setError: (msg: string | null) => void;
}

const initialState = {
  recordingStatus: 'idle' as RecordingStatus,
  connectionStatus: 'disconnected' as ConnectionStatus,
  interimOriginal: '',
  interimTranslated: '',
  finalLines: [] as TranscriptLine[],
  sessionStartedAt: null as number | null,
  errorMessage: null as string | null,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,

  setRecordingStatus: (s) => set({ recordingStatus: s }),
  setConnectionStatus: (s) => set({ connectionStatus: s }),

  appendToken: (text, isFinal, type, timestampMs) => {
    const state = get();
    if (type === 'original') {
      // Accumulate all original tokens; cleared when translated final commits the line
      set({ interimOriginal: state.interimOriginal + text });
    } else {
      if (!isFinal) {
        set({ interimTranslated: state.interimTranslated + text });
      } else {
        // Commit: pair accumulated original + final translated text as a new line
        set({
          interimOriginal: '',
          interimTranslated: '',
          finalLines: [
            ...state.finalLines,
            {
              originalText: state.interimOriginal,
              translatedText: state.interimTranslated + text,
              timestampMs,
            },
          ],
        });
      }
    }
  },

  resetSession: () =>
    set({ ...initialState, sessionStartedAt: Date.now() }),

  setError: (msg) => set({ errorMessage: msg }),
}));

/** Build a human-readable transcript string from finalized lines. */
export function buildTranscriptContent(
  lines: TranscriptLine[],
  sourceLang: string,
  targetLang: string,
  startedAt: number
): string {
  const date = new Date(startedAt).toISOString().replace('T', ' ').slice(0, 19);
  const header = `[${date}] Session: ${sourceLang.toUpperCase()} → ${targetLang.toUpperCase()}\n${'─'.repeat(50)}\n`;
  const body = lines
    .map((l) => {
      const t = new Date(l.timestampMs).toISOString().slice(11, 19);
      return `[${t}] ${l.translatedText}\n         ${l.originalText}`;
    })
    .join('\n');
  return header + body;
}
