# Phase 03 — Rewrite use-translation-session.ts

**Status:** pending  
**Effort:** medium  
**Depends on:** Phase 02 (SDK installed, old files deleted)

## Overview

Replace the orchestration hook with one built on `useRecording` + `useMicrophonePermission` from `@soniox/react`. Token accumulation logic (original/translated pairing) moves from `session-store.ts` into hook-local refs. All session state is returned from the hook — no Zustand store.

## Related Code Files

**Rewrite:**
- `src/hooks/use-translation-session.ts`

**Read (unchanged, just import paths matter):**
- `src/audio/tts-service.ts` — TTS stays as-is
- `src/tauri/transcript-fs.ts` — `writeTranscript`, `TranscriptLine`, `buildTranscriptContent` now exported here (from Phase 02)
- `src/store/settings-store.ts` — `useSettingsStore`, `getApiKey` — unchanged

## Hook Contract (return shape)

```ts
{
  // Actions
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;

  // Live display state (replaces useSessionStore reads in App.tsx + TranslationDisplay)
  finalLines: TranscriptLine[];
  interimOriginal: string;
  interimTranslated: string;

  // Status (mapped from recording.state)
  recordingStatus: 'idle' | 'recording' | 'stopping';
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  error: string | null;

  // Permission (replaces useMicrophonePermission hook in App.tsx)
  permissionState: string;   // SDK MicrophonePermissionStatus values
  needsPermission: boolean;  // true when denied or prompt
}
```

## Implementation

Full rewrite of `src/hooks/use-translation-session.ts`:

```ts
// Orchestrates recording session using @soniox/react SDK.
// Replaces: SonioxClient, AudioCapture, session-store, use-microphone-permission.
import { useRef, useState, useCallback } from 'react';
import { useRecording, useMicrophonePermission } from '@soniox/react';
import type { RealtimeToken } from '@soniox/client';
import { TtsService } from '@/audio/tts-service';
import { useSettingsStore } from '@/store/settings-store';
import { getApiKey } from '@/tauri/secure-storage';
import { writeTranscript, buildTranscriptContent } from '@/tauri/transcript-fs';
import type { TranscriptLine } from '@/tauri/transcript-fs';

// Map SDK recording state to legacy app status values
function toRecordingStatus(state: string): 'idle' | 'recording' | 'stopping' {
  if (state === 'recording') return 'recording';
  if (state === 'stopping') return 'stopping';
  return 'idle';
}

function toConnectionStatus(state: string): 'disconnected' | 'connecting' | 'connected' {
  if (state === 'starting' || state === 'connecting') return 'connecting';
  if (state === 'recording') return 'connected';
  return 'disconnected';
}

export function useTranslationSession() {
  const { outputMode, sourceLanguage, targetLanguage } = useSettingsStore();
  const ttsRef = useRef(new TtsService());
  const sessionStartedAt = useRef(0);

  // Hook-local accumulation state (replaces session-store)
  const [finalLines, setFinalLines] = useState<TranscriptLine[]>([]);
  const [interimOriginal, setInterimOriginal] = useState('');
  const [interimTranslated, setInterimTranslated] = useState('');
  // Mutable refs for accumulation inside onResult (avoids stale closure on state)
  const interimOriginalRef = useRef('');
  const interimTranslatedRef = useRef('');

  const { status: permissionStatus } = useMicrophonePermission({ autoCheck: true });

  const recording = useRecording({
    model: 'stt-rt-v4',
    language_hints: [sourceLanguage],
    language_hints_strict: true,
    translation: { type: 'one_way', target_language: targetLanguage },
    apiKey: async () => {
      const stored = await getApiKey();
      const mem = useSettingsStore.getState().apiKey;
      const key = mem || stored;
      if (!key) throw new Error('API key not configured. Open settings to add your Soniox key.');
      return key;
    },
    onResult: (result) => {
      result.tokens.forEach((token: RealtimeToken) => {
        const isOriginal = token.translation_status === 'original' || token.translation_status === 'none';
        const isTranslation = token.translation_status === 'translation';

        if (isOriginal) {
          interimOriginalRef.current += token.text;
          setInterimOriginal(interimOriginalRef.current);
        } else if (isTranslation) {
          if (!token.is_final) {
            interimTranslatedRef.current += token.text;
            setInterimTranslated(interimTranslatedRef.current);
          } else {
            // Commit line: pair accumulated original with final translated text
            const line: TranscriptLine = {
              originalText: interimOriginalRef.current,
              translatedText: interimTranslatedRef.current + token.text,
              timestampMs: token.end_ms ?? Date.now(),
            };
            setFinalLines((prev) => [...prev, line]);
            interimOriginalRef.current = '';
            interimTranslatedRef.current = '';
            setInterimOriginal('');
            setInterimTranslated('');

            // TTS on final translated token
            if (outputMode === 'tts') {
              ttsRef.current.speak(token.text, targetLanguage);
            }
          }
        }
      });
    },
  });

  const startSession = useCallback(async () => {
    setFinalLines([]);
    setInterimOriginal('');
    setInterimTranslated('');
    interimOriginalRef.current = '';
    interimTranslatedRef.current = '';
    sessionStartedAt.current = Date.now();
    ttsRef.current.setEnabled(outputMode === 'tts');
    await recording.start();
  }, [outputMode, recording]);

  const stopSession = useCallback(async () => {
    ttsRef.current.stop();
    await recording.stop(); // SDK drains pending tokens before resolving

    // Save transcript if any lines were finalized
    const lines = finalLines; // capture current state
    const { sourceLanguage: src, targetLanguage: tgt } = useSettingsStore.getState();
    if (lines.length > 0) {
      const content = buildTranscriptContent(lines, src, tgt, sessionStartedAt.current);
      const filename =
        new Date(sessionStartedAt.current).toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.txt';
      writeTranscript(filename, content).catch((e: unknown) =>
        console.error('Failed to save transcript:', e)
      );
    }
  }, [recording, finalLines]);

  return {
    startSession,
    stopSession,
    finalLines,
    interimOriginal,
    interimTranslated,
    recordingStatus: toRecordingStatus(recording.state),
    connectionStatus: toConnectionStatus(recording.state),
    error: recording.error?.message ?? null,
    permissionState: permissionStatus,
    needsPermission: permissionStatus === 'denied' || permissionStatus === 'prompt',
  };
}
```

## Notes

### Token accumulation
Same pairing logic as the deleted `session-store.appendToken`. Original tokens accumulate in `interimOriginalRef`; when a `translation` final token arrives, both buffers commit as a `TranscriptLine` and clear.

### `translation_status` values
The SDK's `RealtimeToken.translation_status` is `"none" | "original" | "translation"`. Tokens with `"none"` are treated as original (no translation active for that segment).

### `recording.stop()` drain
The SDK's `stop()` returns a `Promise<void>` that resolves after final tokens are flushed — equivalent to the old 500ms manual drain. No explicit `finalize()` call needed unless testing shows final tokens are dropped.

### `apiKey` callback
Called per-connection. Throws on missing key — SDK surfaces the error via `recording.error`, which is returned as `error` from this hook.

### TTS
`ttsService.setEnabled()` is called at `startSession` time to pick up the current `outputMode`. TTS fires only on final `translation` tokens — same behaviour as before.

## Todo

- [ ] Rewrite `src/hooks/use-translation-session.ts` per the implementation above
- [ ] Verify `@soniox/react` exports `useRecording`, `useMicrophonePermission` (check after `npm install`)
- [ ] Verify `RealtimeToken.translation_status` field name in installed SDK types
- [ ] Verify `recording.state` string values match the mapper functions
- [ ] Run `npx tsc --noEmit` — expect only errors from App.tsx + TranslationDisplay (fixed in Phase 04)

## Success Criteria

- `src/hooks/use-translation-session.ts` compiles in isolation (no red imports from deleted files)
- Hook exports the contract shape described above
- No reference to `SonioxClient`, `AudioCapture`, `useSessionStore`, Tauri `invoke('start_mic_capture')`, or `listen('mic-audio')`

## Risk

**`translation_status` field may differ in installed SDK version.** Verify with:
```bash
grep -r "translation_status" node_modules/@soniox/client/dist/ 2>/dev/null | head -5
```
If field name differs, update the `isOriginal`/`isTranslation` checks accordingly.
