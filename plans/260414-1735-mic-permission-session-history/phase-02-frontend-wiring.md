# Phase 02 — Frontend Wiring

## Status: pending
## Depends on: Phase 01 (cpal commands must compile)

## Goal

Replace `AudioCapture` (JS `getUserMedia` + `AudioWorklet`) with Tauri event listener receiving `mic-audio` events from the Rust cpal stream. Update permission hook to use `check_mic_available` instead of probing via `getUserMedia`.

## Files

**Modify:**
- `src/hooks/use-translation-session.ts`
- `src/hooks/use-microphone-permission.ts`

---

## Step 1 — Update `use-translation-session.ts`

The only change is swapping `AudioCapture` for Tauri invoke + event listener. Everything else (SonioxClient, SessionStore, TtsService, file save) stays identical.

```typescript
// src/hooks/use-translation-session.ts
import { useRef, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { SonioxClient } from '@/providers/soniox/soniox-client';
import { TtsService } from '@/audio/tts-service';
import { useSessionStore } from '@/store/session-store';
import { useSettingsStore } from '@/store/settings-store';
import { getApiKey } from '@/tauri/secure-storage';
import { writeTranscript } from '@/tauri/transcript-fs';
import { buildTranscriptContent } from '@/store/session-store';

export function useTranslationSession() {
  const provider = useRef(new SonioxClient());
  const ttsService = useRef(new TtsService());
  const unlistenMic = useRef<UnlistenFn | null>(null);
  const sessionStartedAt = useRef(0);

  const setRecordingStatus = useSessionStore((s) => s.setRecordingStatus);
  const setConnectionStatus = useSessionStore((s) => s.setConnectionStatus);
  const appendToken = useSessionStore((s) => s.appendToken);
  const resetSession = useSessionStore((s) => s.resetSession);
  const setError = useSessionStore((s) => s.setError);

  const outputMode = useSettingsStore((s) => s.outputMode);
  const targetLanguage = useSettingsStore((s) => s.targetLanguage);

  // Wire provider callbacks
  useEffect(() => {
    provider.current.onStatus(setConnectionStatus);
    provider.current.onToken((token) => {
      appendToken(token.text, token.isFinal, token.type, token.endMs);
      if (token.type === 'translated' && token.isFinal && outputMode === 'tts') {
        ttsService.current.speak(token.text, targetLanguage);
      }
    });
    provider.current.onError((err) => setError(err.message));
  }, [outputMode, targetLanguage, setConnectionStatus, appendToken, setError]);

  const startSession = useCallback(async () => {
    const storedKey = await getApiKey();
    const { apiKey, sourceLanguage, targetLanguage: tgtLang } = useSettingsStore.getState();
    const key = apiKey || storedKey;

    if (!key) {
      setError('API key not configured. Open settings to add your Soniox key.');
      return;
    }

    resetSession();
    sessionStartedAt.current = Date.now();
    setRecordingStatus('recording');
    ttsService.current.setEnabled(outputMode === 'tts');

    try {
      await provider.current.connect({ apiKey: key, sourceLanguage, targetLanguage: tgtLang });

      // Listen for PCM chunks emitted by the Rust cpal stream
      unlistenMic.current = await listen<number[]>('mic-audio', (event) => {
        const bytes = new Uint8Array(event.payload);
        provider.current.sendAudio(bytes.buffer);
      });

      // Start the native mic stream — triggers iOS permission dialog on first run
      await invoke('start_mic_capture');
    } catch (err) {
      unlistenMic.current?.();
      unlistenMic.current = null;
      setError((err as Error).message);
      setRecordingStatus('idle');
    }
  }, [outputMode, resetSession, setRecordingStatus, setError]);

  const stopSession = useCallback(async () => {
    setRecordingStatus('stopping');
    ttsService.current.stop();

    // Stop native stream first, then unlisten
    await invoke('stop_mic_capture').catch(() => {});
    unlistenMic.current?.();
    unlistenMic.current = null;

    // Drain: allow final tokens to arrive before disconnecting
    await new Promise<void>((r) => setTimeout(r, 500));
    provider.current.disconnect();

    const { finalLines } = useSessionStore.getState();
    const { sourceLanguage, targetLanguage: tgtLang } = useSettingsStore.getState();
    if (finalLines.length > 0) {
      const content = buildTranscriptContent(finalLines, sourceLanguage, tgtLang, sessionStartedAt.current);
      const filename =
        new Date(sessionStartedAt.current).toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.txt';
      writeTranscript(filename, content).catch((e: unknown) =>
        console.error('Failed to save transcript:', e)
      );
    }

    setRecordingStatus('idle');
  }, [setRecordingStatus]);

  // Pause/resume on app backgrounding
  useEffect(() => {
    const handleVisibility = () => {
      const { recordingStatus } = useSessionStore.getState();
      if (document.hidden && recordingStatus === 'recording') {
        invoke('stop_mic_capture').catch(() => {});
        unlistenMic.current?.();
        unlistenMic.current = null;
      } else if (!document.hidden && recordingStatus === 'recording') {
        listen<number[]>('mic-audio', (event) => {
          const bytes = new Uint8Array(event.payload);
          provider.current.sendAudio(bytes.buffer);
        }).then((fn) => {
          unlistenMic.current = fn;
        });
        invoke('start_mic_capture').catch((e: Error) => setError(e.message));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [setError]);

  return { startSession, stopSession };
}
```

**Key changes vs original:**
- Removed `AudioCapture` import and `audioCapture` ref entirely
- Added `unlistenMic` ref holding the Tauri event unlisten function
- `startSession`: `listen('mic-audio', ...)` then `invoke('start_mic_capture')`
- `stopSession`: `invoke('stop_mic_capture')` then `unlistenMic.current?.()`
- Visibility handler updated to use invoke/listen pattern

---

## Step 2 — Update `use-microphone-permission.ts`

Remove the `getUserMedia` probe on mount (the broken iOS path). Use `check_mic_available` to detect device presence; actual permission dialog fires on first `start_mic_capture` call from `useTranslationSession`.

```typescript
// src/hooks/use-microphone-permission.ts
// Tracks microphone permission state.
// On iOS, the native permission dialog is triggered by the first start_mic_capture
// call (cpal/AVAudioSession), not by this hook. This hook only checks availability
// and reflects denied state when start_mic_capture fails.

import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export type MicPermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

export function useMicrophonePermission() {
  const [state, setState] = useState<MicPermissionState>('idle');

  // Check device availability on mount (no dialog triggered here)
  useEffect(() => {
    invoke<string>('check_mic_available')
      .then((result) => {
        setState(result === 'available' ? 'granted' : 'unavailable');
      })
      .catch(() => {
        // Tauri not available (e.g. browser dev) — assume available
        setState('granted');
      });
  }, []);

  // Called externally if start_mic_capture returns a permission error
  const setDenied = useCallback(() => setState('denied'), []);
  const setGranted = useCallback(() => setState('granted'), []);

  const isPermissionGranted = state === 'granted';
  const needsPermission = state === 'denied' || state === 'unavailable';

  return { permissionState: state, isPermissionGranted, needsPermission, setDenied, setGranted };
}
```

**What changed:**
- Removed `getUserMedia` probe entirely
- `requestPermission` removed — permission flows through `start_mic_capture` in the session hook
- Added `setDenied` / `setGranted` callbacks for `useTranslationSession` to call if `start_mic_capture` fails/succeeds
- `needsPermission` now only true if explicitly denied or unavailable (not on `idle`/`requesting`)

---

## Step 3 — Wire `setDenied` into `useTranslationSession`

In `startSession`, if `invoke('start_mic_capture')` throws with a permission error message, call `setDenied()`. Pass it in as a parameter or via a shared ref:

```typescript
// In App.tsx, pass setDenied to useTranslationSession:
const { setDenied } = useMicrophonePermission();
// useTranslationSession receives it as an option or via the store
```

Simplest approach: export `setDenied` from the hook and call it from the session's catch block in `App.tsx` where both hooks are available.

---

## Step 4 — TypeScript compile check

```bash
npx tsc --noEmit
```

---

## Todo

- [ ] Update `use-translation-session.ts` — replace `AudioCapture` with Tauri events
- [ ] Update `use-microphone-permission.ts` — replace `getUserMedia` with `check_mic_available`
- [ ] Wire `setDenied` so permission sheet shows on cpal error
- [ ] `npx tsc --noEmit` passes

## Risks

| Risk | Mitigation |
|---|---|
| `listen<number[]>` payload type — Tauri emits `Vec<u8>` as JSON array of numbers | Cast with `new Uint8Array(event.payload)` as shown |
| Browser dev (no Tauri) — `invoke` throws | `catch(() => setState('granted'))` fallback in permission hook; dev builds can still use AudioCapture manually |
| `start_mic_capture` fails silently | Log the error; show in ErrorBanner via `setError` |
