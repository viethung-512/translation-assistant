# Phase 04 — Update App.tsx + TranslationDisplay

**Status:** pending  
**Effort:** small  
**Depends on:** Phase 03 (hook contract finalized)

## Overview

Wire the new `useTranslationSession` return values into `App.tsx` and convert `TranslationDisplay` from a Zustand-reading component to a props-accepting one. No logic changes — only data source changes.

## Related Code Files

**Modify:**
- `src/App.tsx`
- `src/components/TranslationDisplay/translation-display.tsx`

**Unchanged:**
- `src/components/TranslationDisplay/transcript-line.tsx`
- `src/components/Controls/record-button.tsx`
- `src/components/Controls/status-badge.tsx`
- All other components

## Changes

### `src/components/TranslationDisplay/translation-display.tsx`

Convert from store-reader to props-receiver.

**Before:**
```ts
import { useSessionStore } from '@/store/session-store';

export function TranslationDisplay() {
  const { finalLines, interimOriginal, interimTranslated, recordingStatus } = useSessionStore();
  ...
}
```

**After:**
```ts
import type { TranscriptLine } from '@/tauri/transcript-fs';

interface Props {
  finalLines: TranscriptLine[];
  interimOriginal: string;
  interimTranslated: string;
  recordingStatus: 'idle' | 'recording' | 'stopping';
}

export function TranslationDisplay({ finalLines, interimOriginal, interimTranslated, recordingStatus }: Props) {
  // body unchanged
  ...
}
```

The component body is **identical** — only the data source changes.

---

### `src/App.tsx`

Three changes:
1. Remove `useSessionStore` + `useMicrophonePermission` imports
2. Read all session state from `useTranslationSession()` return value
3. Pass session state as props to `TranslationDisplay`

**Remove imports:**
```ts
// DELETE these:
import { useSessionStore } from '@/store/session-store';
import { useMicrophonePermission } from '@/hooks/use-microphone-permission';
```

**Replace store reads:**
```ts
// BEFORE:
const { startSession, stopSession } = useTranslationSession();
const recordingStatus = useSessionStore((s) => s.recordingStatus);
const connectionStatus = useSessionStore((s) => s.connectionStatus);
const errorMessage = useSessionStore((s) => s.errorMessage);
const setError = useSessionStore((s) => s.setError);
const { permissionState, needsPermission, setDenied } = useMicrophonePermission();

// AFTER:
const {
  startSession, stopSession,
  finalLines, interimOriginal, interimTranslated,
  recordingStatus, connectionStatus,
  error: errorMessage,
  permissionState, needsPermission,
} = useTranslationSession();
const setError = useCallback((msg: string | null) => { /* no-op — hook manages error state */ }, []);
```

> **Note on `setError`:** `App.tsx` calls `setError(null)` to dismiss the error banner. With SDK-managed error state, dismissal is a local `useState` override. Add:
> ```ts
> const [errorDismissed, setErrorDismissed] = useState(false);
> // Reset dismiss flag when a new error arrives
> useEffect(() => { if (errorMessage) setErrorDismissed(false); }, [errorMessage]);
> const displayError = errorDismissed ? null : errorMessage;
> ```
> Pass `displayError` to `<ErrorBanner>` and `setErrorDismissed(true)` to `onDismiss`.

**Update `handleRecordToggle`:**
```ts
// BEFORE:
const handleRecordToggle = async () => {
  if (recordingStatus === 'idle') {
    const ok = await startSession();
    if (!ok) setDenied();
  } else if (recordingStatus === 'recording') {
    stopSession();
  }
};

// AFTER:
const handleRecordToggle = async () => {
  if (recordingStatus === 'idle') {
    await startSession(); // errors surface via hook's error field
  } else if (recordingStatus === 'recording') {
    stopSession();
  }
};
```

**Update `<TranslationDisplay>` usage:**
```tsx
// BEFORE:
<TranslationDisplay />

// AFTER:
<TranslationDisplay
  finalLines={finalLines}
  interimOriginal={interimOriginal}
  interimTranslated={interimTranslated}
  recordingStatus={recordingStatus}
/>
```

**`<RecordButton>` and `<StatusBadge>` — no change needed:**
```tsx
<StatusBadge status={connectionStatus} />
<RecordButton
  isRecording={recordingStatus === 'recording'}
  isDisabled={recordingStatus === 'stopping' || connectionStatus === 'connecting'}
  onClick={handleRecordToggle}
/>
```

**Permission sheet — `permissionState` values:**

The SDK's `useMicrophonePermission` returns `status` as `'granted' | 'denied' | 'prompt' | 'not-determined'`. The existing sheet checks `permissionState === 'denied'` and `permissionState === 'unavailable'`. Update the conditions:

```tsx
// BEFORE:
{permissionState === 'denied' && (...)}
{permissionState === 'unavailable' && (...)}

// AFTER:
{permissionState === 'denied' && (...)}
{/* 'unavailable' → SDK exposes via unsupportedReason; treat 'not-determined' as needing prompt */}
{(permissionState === 'not-determined' || permissionState === 'prompt') && (
  // Show generic "microphone required" message
  <>
    <p style={{ fontSize: 17, fontWeight: 600, margin: '0 0 8px' }}>Microphone Required</p>
    <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.5 }}>
      Microphone access is required to use this app. Please allow access when prompted.
    </p>
  </>
)}
```

> **Verify during implementation:** Check exact `MicrophonePermissionStatus` values exported by `@soniox/react` after install. Adjust conditions to match.

## Todo

- [ ] Update `TranslationDisplay` — remove store import, add Props interface, receive props
- [ ] Update `App.tsx` — remove `useSessionStore` + `useMicrophonePermission` imports
- [ ] Update `App.tsx` — destructure all state from `useTranslationSession()`
- [ ] Add `errorDismissed` local state for banner dismiss
- [ ] Update `<TranslationDisplay>` JSX to pass props
- [ ] Update permission sheet conditions to match SDK `MicrophonePermissionStatus` values
- [ ] Simplify `handleRecordToggle` (remove `setDenied` call)
- [ ] Run `npx tsc --noEmit` — expect zero errors
- [ ] Manual smoke test: start/stop recording, verify transcript display and file save

## Success Criteria

- `npx tsc --noEmit` exits 0
- No imports of deleted files anywhere in `src/`
- App records, displays interim + final tokens, saves transcript on stop
- Permission sheet appears when mic is denied
- Error banner dismisses correctly
