# Phase 05 — State Management

## Context Links
- Plan: `plans/260409-1858-ai-mobile-translator/plan.md`
- Phase 03: `phase-03-audio-capture.md`
- Phase 04: `phase-04-soniox-provider.md`
- Zustand docs: https://zustand.docs.pmnd.rs/

## Overview
- **Priority:** P1
- **Status:** Complete
- **Effort:** 1.5h
- **Blocked by:** Phase 03, Phase 04
- **Description:** Define Zustand stores for session state (recording, tokens, transcript) and app settings (API key, languages, output mode). These are the single source of truth consumed by all UI components.

## Key Insights
- Two stores = clear separation: `session-store` (ephemeral per-recording) vs `settings-store` (persisted)
- Zustand v5 uses `create` from `zustand` — no `devtools` middleware needed for V1
- Settings store uses `zustand/middleware persist` with localStorage for language/mode prefs; API key comes from Tauri secure storage (not localStorage)
- Session store resets on each new recording start — call `resetSession()` in Controls
- Tokens accumulate in two parallel arrays: `originalTokens[]` and `translatedTokens[]`
- `interimText` holds the current non-final buffer for live display; `finalLines[]` holds finalized lines
- Transcript is built from `finalLines` — formatted string ready for file write

## Requirements

### Functional
- `settings-store`: holds `apiKey` (in-memory only), `sourceLanguage`, `targetLanguage`, `outputMode`
- `session-store`: holds recording status, connection status, token arrays, transcript lines
- Settings persisted to localStorage (except apiKey — loaded from Tauri on demand)
- Session fully reset on new recording start

### Non-functional
- Stores are React-hook accessible via `useSessionStore` / `useSettingsStore`
- No circular deps between stores

## Related Code Files

### Create
- `src/store/session-store.ts` — recording session state
- `src/store/settings-store.ts` — app configuration state

## Implementation Steps

1. **Create `src/store/session-store.ts`:**
   ```typescript
   import { create } from 'zustand';

   export type RecordingStatus = 'idle' | 'recording' | 'stopping';
   export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

   interface TranscriptLine {
     originalText: string;
     translatedText: string;
     timestampMs: number;
   }

   interface SessionState {
     recordingStatus: RecordingStatus;
     connectionStatus: ConnectionStatus;
     interimOriginal: string;    // non-final tokens accumulating
     interimTranslated: string;
     finalLines: TranscriptLine[];
     sessionStartedAt: number | null;
     errorMessage: string | null;
     // actions
     setRecordingStatus: (s: RecordingStatus) => void;
     setConnectionStatus: (s: ConnectionStatus) => void;
     appendToken: (text: string, isFinal: boolean, type: 'original' | 'translated', timestampMs: number) => void;
     resetSession: () => void;
     setError: (msg: string | null) => void;
   }

   export const useSessionStore = create<SessionState>((set, get) => ({
     recordingStatus: 'idle',
     connectionStatus: 'disconnected',
     interimOriginal: '',
     interimTranslated: '',
     finalLines: [],
     sessionStartedAt: null,
     errorMessage: null,

     setRecordingStatus: (s) => set({ recordingStatus: s }),
     setConnectionStatus: (s) => set({ connectionStatus: s }),

     appendToken: (text, isFinal, type, timestampMs) => {
       const state = get();
       if (type === 'original') {
         if (!isFinal) {
           set({ interimOriginal: state.interimOriginal + text });
         } else {
           // move interim to finalLines (translated will catch up via its own final token)
           set({ interimOriginal: '' });
         }
       } else {
         if (!isFinal) {
           set({ interimTranslated: state.interimTranslated + text });
         } else {
           const originalText = state.interimOriginal || text;
           set({
             interimTranslated: '',
             interimOriginal: '',
             finalLines: [...state.finalLines, { originalText, translatedText: text, timestampMs }],
           });
         }
       }
     },

     resetSession: () => set({
       recordingStatus: 'idle',
       connectionStatus: 'disconnected',
       interimOriginal: '',
       interimTranslated: '',
       finalLines: [],
       sessionStartedAt: null,
       errorMessage: null,
     }),

     setError: (msg) => set({ errorMessage: msg }),
   }));
   ```

2. **Create `src/store/settings-store.ts`:**
   ```typescript
   import { create } from 'zustand';
   import { persist } from 'zustand/middleware';

   export type OutputMode = 'text' | 'tts';

   interface SettingsState {
     apiKey: string;           // in-memory only — loaded from Tauri on mount
     sourceLanguage: string;   // BCP-47
     targetLanguage: string;
     outputMode: OutputMode;
     // actions
     setApiKey: (key: string) => void;
     setSourceLanguage: (lang: string) => void;
     setTargetLanguage: (lang: string) => void;
     setOutputMode: (mode: OutputMode) => void;
   }

   export const useSettingsStore = create<SettingsState>()(
     persist(
       (set) => ({
         apiKey: '',
         sourceLanguage: 'en',
         targetLanguage: 'vi',
         outputMode: 'text',
         setApiKey: (key) => set({ apiKey: key }),
         setSourceLanguage: (lang) => set({ sourceLanguage: lang }),
         setTargetLanguage: (lang) => set({ targetLanguage: lang }),
         setOutputMode: (mode) => set({ outputMode: mode }),
       }),
       {
         name: 'translation-assistant-settings',
         partialize: (state) => ({
           // exclude apiKey from localStorage — managed by Tauri secure storage
           sourceLanguage: state.sourceLanguage,
           targetLanguage: state.targetLanguage,
           outputMode: state.outputMode,
         }),
       }
     )
   );
   ```

3. **Transcript builder helper** (inline in `transcript-fs.ts` or session store):
   ```typescript
   export function buildTranscriptContent(
     lines: TranscriptLine[],
     sourceLang: string,
     targetLang: string,
     startedAt: number
   ): string {
     const date = new Date(startedAt).toISOString().replace('T', ' ').slice(0, 19);
     const header = `[${date}] Session: ${sourceLang.toUpperCase()} → ${targetLang.toUpperCase()}\n${'─'.repeat(50)}\n`;
     const body = lines.map((l) => {
       const t = new Date(l.timestampMs).toISOString().slice(11, 19);
       return `[${t}] ${l.originalText}\n         ${l.translatedText}`;
     }).join('\n');
     return header + body;
   }
   ```

## Todo List

- [x] Create `src/store/session-store.ts` with all state + actions
- [x] Create `src/store/settings-store.ts` with persist middleware (exclude apiKey)
- [x] Add `buildTranscriptContent` helper
- [x] Verify `persist` correctly excludes apiKey from localStorage

## Success Criteria

- `useSessionStore` accessible from any component; state updates propagate reactively
- `useSettingsStore` language/mode prefs survive page reload (localStorage)
- `apiKey` NOT present in localStorage after save
- `resetSession()` clears all session fields

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| `appendToken` called out-of-order (translated before original final) | Buffer interim separately; only commit line when translated final arrives |
| Zustand v5 breaking changes vs v4 | Use `create<T>()` pattern (v5 syntax); check migration guide |

## Security Considerations
- `apiKey` excluded from `partialize` — never written to localStorage
- Settings store hydration happens before Tauri API key load — `apiKey` starts as `''`

## Next Steps
→ Phase 06: TTS service reads from session store
→ Phase 07: UI components consume both stores
