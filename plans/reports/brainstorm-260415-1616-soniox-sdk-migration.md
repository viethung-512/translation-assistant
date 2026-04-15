# Feature Spec: Migrate to @soniox/react SDK

**Date:** 2026-04-15  
**Status:** Approved for planning

---

## Problem Statement

The app hand-rolls ~375 LOC of WebSocket management, reconnect backoff, audio capture, and token accumulation that the `@soniox/react` SDK now provides out of the box. This is maintenance burden with no upside.

**User story:** As a developer, I want to delete custom plumbing and rely on the official SDK so the app stays current with Soniox API changes automatically.

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Audio source | SDK `MicrophoneSource` (getUserMedia) | Drop Tauri mic path; iOS permission re-validated on device |
| Provider abstraction | Drop `STTProvider` interface | YAGNI — one provider, one SDK |
| Session state | Replace Zustand store with hook-local state | SDK owns the source of truth |
| Rust audio layer | Delete entirely | Git history is the safety net |

---

## Architecture

### Before
```
Rust cpal → mic-audio events → SonioxClient (manual WS) → session-store (Zustand) → UI
AudioCapture.ts (AudioWorklet/ScriptProcessorNode)
use-translation-session.ts (orchestration, 129 LOC)
```

### After
```
@soniox/react useRecording (SDK: getUserMedia + WS lifecycle)
  └── onResult callback → token accumulation (hook-local) → TtsService
use-translation-session.ts (orchestration, ~60 LOC)
  └── returns { startSession, stopSession, finalLines, interimOriginal, interimTranslated,
                recordingStatus, connectionStatus, error, permissionState, needsPermission }
App.tsx / TranslationDisplay — receive data as props (no Zustand for session state)
```

---

## Files Deleted

| File | LOC | Why |
|------|-----|-----|
| `src/providers/soniox/soniox-client.ts` | 154 | Replaced by `useRecording` WebSocket layer |
| `src/providers/soniox/soniox-types.ts` | 25 | Replaced by `@soniox/client` types |
| `src/providers/types.ts` | 30 | `STTProvider` abstraction dropped (YAGNI) |
| `src/audio/audio-capture.ts` | 132 | Replaced by SDK `MicrophoneSource` |
| `src/audio/pcm-worklet-processor.ts` | 40 | Same |
| `src/hooks/use-microphone-permission.ts` | 34 | Replaced by SDK `useMicrophonePermission` |
| `src/store/session-store.ts` | 99 | State moves into hook-local `useState`/`useRef` |
| `src-tauri/src/audio/` (dir) | ~100 | Tauri mic path dropped |
| `src-tauri/src/commands/audio.rs` | ~80 | Same |

**~694 LOC net deleted before writing new code.**

---

## Files Modified

### `package.json`
- Add `@soniox/react`, `@soniox/client`

### `src/hooks/use-translation-session.ts` (rewrite, ~65 LOC)

```ts
// Pseudocode — not implementation
const { apiKey, sourceLanguage, targetLanguage, outputMode } = useSettingsStore();
const ttsRef = useRef(new TtsService());

// Hook-local state replacing session-store
const [finalLines, setFinalLines] = useState<TranscriptLine[]>([]);
const [interimOriginal, setInterimOriginal] = useState('');
const [interimTranslated, setInterimTranslated] = useState('');
const interimOriginalRef = useRef('');   // mutable buffer; state for render trigger
const interimTranslatedRef = useRef('');

const { status, isPermissionGranted, check } = useMicrophonePermission();

const recording = useRecording({
  model: 'stt-rt-v4',
  language_hints: [sourceLanguage],
  translation: { type: 'one_way', target_language: targetLanguage },
  apiKey: async () => (useSettingsStore.getState().apiKey || await getApiKey()) ?? '',
  onResult: (result) => {
    result.tokens.forEach(token => accumulate(token));
  },
});

// Accumulate tokens into TranscriptLine[] (same pairing logic as current session-store)
function accumulate(token: RealtimeToken) { ... }

const startSession = () => { setFinalLines([]); setInterimOriginal(''); recording.start(); };
const stopSession = async () => {
  ttsRef.current.stop();
  await recording.stop();
  saveTranscript(finalLines);  // writeTranscript Tauri command unchanged
};

return {
  startSession, stopSession,
  finalLines, interimOriginal, interimTranslated,
  recordingStatus: deriveRecordingStatus(recording.state),
  connectionStatus: deriveConnectionStatus(recording.state),
  error: recording.error?.message ?? null,
  permissionState: status,
  needsPermission: status === 'denied' || status === 'prompt',
};
```

**Token accumulation** — the pairing logic from `session-store.appendToken` moves verbatim into `accumulate()` inside the hook. Same logic, no Zustand.

### `src/App.tsx`
- Remove `useSessionStore`, `useMicrophonePermission` imports
- Read all session state from `useTranslationSession()` return value
- Pass `finalLines`, `interimOriginal`, `interimTranslated`, `recordingStatus` as props to `TranslationDisplay`
- Pass `connectionStatus` to `StatusBadge`

### `src/components/TranslationDisplay/translation-display.tsx`
- Change from `useSessionStore()` reads to accepting props:
  ```ts
  interface Props {
    finalLines: TranscriptLine[];
    interimOriginal: string;
    interimTranslated: string;
    recordingStatus: 'idle' | 'recording' | 'stopping';
  }
  ```
- Logic unchanged, only data source changes

### `src/store/session-store.ts`
- Delete file; `buildTranscriptContent` + `TranscriptLine` type move to `src/tauri/transcript-fs.ts`

### `src-tauri/src/commands/mod.rs`
- Remove `audio` module registration

### `src-tauri/src/lib.rs`
- Remove `start_mic_capture`, `stop_mic_capture`, `check_mic_available` from `.invoke_handler()`

### `src-tauri/Cargo.toml`
- Remove `cpal` and any audio-capture dependencies

---

## Interface Contracts

### `TranscriptLine` (moved to `transcript-fs.ts`)
```ts
export interface TranscriptLine {
  originalText: string;
  translatedText: string;
  timestampMs: number;
}
```

### `buildTranscriptContent` (unchanged signature, moved file)
```ts
export function buildTranscriptContent(
  lines: TranscriptLine[],
  sourceLang: string,
  targetLang: string,
  startedAt: number
): string
```

### `useTranslationSession` return shape
```ts
{
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  finalLines: TranscriptLine[];
  interimOriginal: string;
  interimTranslated: string;
  recordingStatus: 'idle' | 'recording' | 'stopping';
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  error: string | null;
  permissionState: MicrophonePermissionStatus;  // SDK type
  needsPermission: boolean;
}
```

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| API key missing | Guard in `startSession`; set error message (same as current) |
| getUserMedia denied | SDK surfaces via `permissionState`; `needsPermission` triggers existing permission sheet |
| WebSocket error | SDK `error` field; surface via hook `error` return value |
| Transcript write fail | Silent `console.error` (same as current) |
| SDK reconnect | SDK handles automatically (exponential backoff built-in) |

---

## SDK State → App State Mapping

| App state | SDK source |
|-----------|-----------|
| `recordingStatus: 'idle'` | `recording.state === 'idle' \| 'stopped' \| 'canceled'` |
| `recordingStatus: 'recording'` | `recording.state === 'recording'` |
| `recordingStatus: 'stopping'` | `recording.state === 'stopping'` |
| `connectionStatus: 'connecting'` | `recording.state === 'starting' \| 'connecting'` |
| `connectionStatus: 'connected'` | `recording.state === 'recording'` |
| `connectionStatus: 'disconnected'` | all other states |

---

## Testing Strategy

1. `npx tsc --noEmit` — type-check after migration
2. `cargo check` — Rust still compiles without audio commands
3. Manual: start/stop recording on macOS dev build; confirm transcript saves
4. Manual: deny mic permission; confirm permission sheet appears
5. Manual: revoke then re-grant mic; confirm recovery

---

## Implementation Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| iOS getUserMedia still doesn't register in Settings > Privacy | Medium | Test on device early; fallback is reverting via git |
| SDK `onResult` token field names differ from assumed (`translation_status` vs `type`) | Low | Verify against SDK types during install |
| SDK requires `SonioxProvider` in tree (vs inline `apiKey` prop) | Low | Docs confirm inline `apiKey` prop works without provider |
| `useMicrophonePermission` from SDK has different state values than current hook | Low | Remap in hook return; UI only uses `needsPermission: boolean` |

---

## Success Criteria

- All hand-rolled Soniox/audio files deleted
- App records, translates, displays, and saves transcript identically to before
- No Zustand store for session state
- Rust build passes without audio commands
- TypeScript build passes with no errors

---

## Unresolved Questions

- Does the Soniox SDK's `useMicrophonePermission` expose a `'denied'` vs `'prompt'` distinction needed for the permission sheet's two message variants?
- Does `stop()` on `useRecording` await final tokens (equivalent to current 500ms drain), or do we need an explicit `finalize()` call before `stop()`?
