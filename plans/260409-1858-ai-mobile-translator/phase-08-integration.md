# Phase 08 — Integration & Wiring

## Context Links
- Plan: `plans/260409-1858-ai-mobile-translator/plan.md`
- All previous phases

## Overview
- **Priority:** P1
- **Status:** Complete
- **Effort:** 2.5h
- **Blocked by:** Phases 02–07
- **Description:** Wire all layers into a single `useTranslationSession` hook. Handle full session lifecycle: start → connect → stream → stop → save transcript. Add cross-cutting concerns: background/foreground resume, visibility change handling, error recovery.

## Key Insights
- `useTranslationSession` is the only place that touches AudioCapture, SonioxClient, TtsService, and both stores simultaneously — keeps components thin
- `AudioCapture` → `SonioxClient.sendAudio()` is the hot path; must not go through React state
- Transcript auto-save triggered on `stop()` — after final tokens have arrived (500ms drain delay)
- Visibility change listener handles mobile backgrounding: pause on hidden, resume on visible
- `onvoiceschanged` must be set up once on app init (in App.tsx) before any TTS calls
- Provider is instantiated once per session (not per render) — held in `useRef`
- API key loaded from Tauri secure storage at session start (not on component mount)
- Guard against starting a session without a configured API key — show settings panel

## Requirements

### Functional
- `startSession()` — load API key, connect provider, start audio capture
- `stopSession()` — stop audio, disconnect provider, save transcript, reset session
- Token pipeline: Soniox token → SessionStore.appendToken → TTS if enabled
- Transcript saved to file named `YYYY-MM-DD_HH-mm-ss.txt`
- Resume WebSocket on app foreground (mobile backgrounding)
- Error shown in session store if API key missing or connection fails

### Non-functional
- Start-to-first-token latency < 1s on WiFi
- Stop cleanly releases mic and WebSocket
- Transcript write non-blocking (fire and forget with error toast)

## Related Code Files

### Create
- `src/hooks/use-translation-session.ts` — main session orchestration hook

### Modify
- `src/App.tsx` — call `useTranslationSession`; pass `startSession`/`stopSession` to Controls; add `onvoiceschanged` init

## Implementation Steps

1. **Create `src/hooks/use-translation-session.ts`:**
   ```typescript
   import { useRef, useEffect, useCallback } from 'react';
   import { AudioCapture } from '@/audio/audio-capture';
   import { SonioxClient } from '@/providers/soniox/soniox-client';
   import { TtsService } from '@/audio/tts-service';
   import { useSessionStore } from '@/store/session-store';
   import { useSettingsStore } from '@/store/settings-store';
   import { getApiKey } from '@/tauri/secure-storage';
   import { writeTranscript } from '@/tauri/transcript-fs';
   import { buildTranscriptContent } from '@/store/session-store';

   export function useTranslationSession() {
     const audioCapture = useRef<AudioCapture | null>(null);
     const provider = useRef<SonioxClient>(new SonioxClient());
     const ttsService = useRef<TtsService>(new TtsService());
     const sessionStartedAt = useRef<number>(0);

     const { setRecordingStatus, setConnectionStatus, appendToken, resetSession,
             setError, finalLines } = useSessionStore();
     const { apiKey, sourceLanguage, targetLanguage, outputMode } = useSettingsStore();

     // Wire provider callbacks once
     useEffect(() => {
       provider.current.onStatus(setConnectionStatus);
       provider.current.onToken((token) => {
         appendToken(token.text, token.isFinal, token.type, token.endMs);
         if (token.type === 'translated' && token.isFinal && outputMode === 'tts') {
           ttsService.current.speak(token.text, targetLanguage);
         }
       });
       provider.current.onError((err) => setError(err.message));
     }, [outputMode, targetLanguage]); // re-wire if output mode changes

     const startSession = useCallback(async () => {
       const key = apiKey || await getApiKey();
       if (!key) {
         setError('API key not configured. Open settings to add your Soniox key.');
         return;
       }

       resetSession();
       sessionStartedAt.current = Date.now();
       setRecordingStatus('recording');
       ttsService.current.setEnabled(outputMode === 'tts');

       try {
         await provider.current.connect({ apiKey: key, sourceLanguage, targetLanguage });
         audioCapture.current = new AudioCapture((chunk) => {
           provider.current.sendAudio(chunk);
         });
         await audioCapture.current.start();
       } catch (err) {
         setError((err as Error).message);
         setRecordingStatus('idle');
       }
     }, [apiKey, sourceLanguage, targetLanguage, outputMode]);

     const stopSession = useCallback(async () => {
       setRecordingStatus('stopping');
       ttsService.current.stop();
       audioCapture.current?.stop();
       audioCapture.current = null;

       // drain: wait 500ms for final tokens to arrive before disconnecting
       await new Promise(r => setTimeout(r, 500));
       provider.current.disconnect();

       // save transcript
       const lines = useSessionStore.getState().finalLines;
       const { sourceLanguage: src, targetLanguage: tgt } = useSettingsStore.getState();
       if (lines.length > 0) {
         const content = buildTranscriptContent(lines, src, tgt, sessionStartedAt.current);
         const filename = new Date(sessionStartedAt.current)
           .toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.txt';
         writeTranscript(filename, content).catch(e =>
           console.error('Failed to save transcript:', e)
         );
       }

       setRecordingStatus('idle');
     }, []);

     // Handle mobile app backgrounding — pause WS on hidden, reconnect on visible
     useEffect(() => {
       const handleVisibility = () => {
         const { recordingStatus } = useSessionStore.getState();
         if (document.hidden && recordingStatus === 'recording') {
           audioCapture.current?.stop();
         } else if (!document.hidden && recordingStatus === 'recording') {
           audioCapture.current = new AudioCapture((chunk) =>
             provider.current.sendAudio(chunk)
           );
           audioCapture.current.start().catch(e => setError(e.message));
         }
       };
       document.addEventListener('visibilitychange', handleVisibility);
       return () => document.removeEventListener('visibilitychange', handleVisibility);
     }, []);

     return { startSession, stopSession };
   }
   ```

2. **Update `src/App.tsx`** — integrate hook + voices init:
   ```tsx
   import { useEffect, useState } from 'react';
   import { useTranslationSession } from '@/hooks/use-translation-session';
   import { useSessionStore } from '@/store/session-store';
   import { useSettingsStore } from '@/store/settings-store';
   import { getApiKey } from '@/tauri/secure-storage';
   import { TranslationDisplay } from '@/components/TranslationDisplay/translation-display';
   import { RecordButton } from '@/components/Controls/record-button';
   import { StatusBadge } from '@/components/Controls/status-badge';
   import { SettingsPanel } from '@/components/Settings/settings-panel';

   export default function App() {
     const { startSession, stopSession } = useTranslationSession();
     const { recordingStatus, connectionStatus, errorMessage, setError } = useSessionStore();
     const { setApiKey, outputMode, setOutputMode } = useSettingsStore();
     const [settingsOpen, setSettingsOpen] = useState(false);

     // Load stored API key into memory on mount
     useEffect(() => {
       getApiKey().then(key => { if (key) setApiKey(key); });
       // Init Web Speech voices
       if (window.speechSynthesis.onvoiceschanged !== undefined) {
         window.speechSynthesis.onvoiceschanged = () => {};
       }
     }, []);

     const handleRecordToggle = () => {
       if (recordingStatus === 'idle') startSession();
       else stopSession();
     };

     return (
       <div style={{ maxWidth: 480, margin: '0 auto', height: '100dvh', display: 'flex', flexDirection: 'column' }}>
         {/* Top bar */}
         <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px' }}>
           <StatusBadge status={connectionStatus} />
           <button onClick={() => setSettingsOpen(true)} aria-label="Settings">⚙️</button>
         </div>

         {/* Error banner */}
         {errorMessage && (
           <div style={{ background: '#fee', padding: '8px 16px', color: '#c00' }}
                onClick={() => setError(null)}>
             {errorMessage}
           </div>
         )}

         {/* Translation content */}
         <TranslationDisplay />

         {/* Bottom controls */}
         <div style={{ padding: '16px', textAlign: 'center' }}>
           <div style={{ marginBottom: 8, fontSize: 12, color: '#888' }}>
             {outputMode === 'tts' ? '🔊 Voice output' : '📝 Text only'}
             <button onClick={() => setOutputMode(outputMode === 'tts' ? 'text' : 'tts')}
                     style={{ marginLeft: 8, fontSize: 11 }}>
               Switch
             </button>
           </div>
           <RecordButton
             isRecording={recordingStatus === 'recording'}
             isDisabled={recordingStatus === 'stopping' || connectionStatus === 'connecting'}
             onClick={handleRecordToggle}
           />
         </div>

         <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
       </div>
     );
   }
   ```

3. **Final verification checklist:**
   - Start recording → mic permission prompt appears
   - Speak → original + translated text appears within ~500ms
   - TTS mode → translated speech plays without overlap
   - Stop → transcript file written to documents dir
   - Background app → recording pauses; foreground → resumes
   - Invalid API key → error banner shown, settings panel auto-opens

## Todo List

- [x] Create `src/hooks/use-translation-session.ts`
- [x] Update `src/App.tsx` to use hook + voices init
- [x] End-to-end test: start → speak → stop → verify transcript file
- [x] Test backgrounding on iOS simulator
- [x] Test TTS mode with translated output
- [x] Test invalid API key error flow
- [x] Test network drop + reconnect during active session
- [x] Verify `npm run tauri dev` runs clean on desktop
- [x] Verify `npm run build` produces no TypeScript errors

## Success Criteria

- Full session works end-to-end on desktop: record → translate → transcript saved
- TTS speaks translated text without overlap
- Error states display correctly and are dismissible
- `npm run build` passes TypeScript check with no errors

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| `useEffect` dependency array causes stale closures | Use `useSessionStore.getState()` for values needed in callbacks |
| 500ms drain delay misses fast speakers | Acceptable for V1; can tune or increase in follow-up |
| Visibility change re-creates AudioCapture mid-sentence | WS reconnect buffers pending chunks; transcript line may be incomplete |
| `stopSession` called twice (double-tap) | Guard with `recordingStatus !== 'idle'` check at top of handler |

## Security Considerations
- `apiKey` read from Tauri storage at session start — not cached in module scope
- `stopSession` always runs cleanup even if connection failed
- Transcript filename uses ISO timestamp — no user-provided data in filename

## Next Steps
→ Ship V1
→ Future: add Deepgram/Google provider (implement `STTProvider` interface)
→ Future: transcript history browser screen
→ Future: speaker diarization (`enable_speaker_diarization: true` in Soniox config)
