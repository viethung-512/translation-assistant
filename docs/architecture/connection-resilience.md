# Connection Resilience

**Version**: 0.2.0 (SDK Migration)  
**Last Updated**: April 2026

Reconnection strategies, chunk buffering, and error recovery (now SDK-managed).

---

## Overview of Changes (v0.1 → v0.2)

**v0.1.0**: Custom `SonioxClient` class managed all reconnection logic.  
**v0.2.0**: @soniox/react SDK manages WebSocket connection, reconnection, and buffering internally.

| Responsibility       | v0.1.0                       | v0.2.0                  |
| -------------------- | ---------------------------- | ----------------------- |
| WebSocket connection | Custom `SonioxClient`        | SDK `useRecording` hook |
| Exponential backoff  | Custom implementation        | SDK (internal)          |
| Chunk buffering      | Custom `pendingChunks` array | SDK (internal)          |
| Error handling       | Custom error callbacks       | SDK callbacks           |

**Benefit**: ~150 LOC removed; SDK handles battle-tested resilience patterns.

---

## SDK-Managed Reconnection

The @soniox/react SDK internally handles all reconnection logic.

```
Connection drops
  ↓
SDK detects WebSocket close
  ↓
SDK applies exponential backoff (internal)
  ↓
SDK buffers audio chunks (internal)
  ↓
SDK reconnects automatically
  ↓
useRecording hook updates status
  ↓
useTranslationSession callback (onResult) called with new results
```

### From useTranslationSession

```typescript
const { languageA, languageB, autoDetect } = useSettingsStore();

const recording = useRecording({
  model: "stt-rt-v4",
  language_hints: autoDetect ? [languageA, languageB] : [languageA],
  language_hints_strict: !autoDetect,
  translation: {
    type: "two_way",
    language_a: languageA,
    language_b: languageB,
  },
  enable_language_identification: true,
  apiKey: async () => {
    // ... get API key
  },
  onResult: (result) => {
    // Receives results even after automatic reconnection
    // SDK ensures no loss of transcription state
    // Detects language automatically when enable_language_identification: true
  },
  onError: (err) => {
    // SDK surfaces errors that can't be recovered
    // (e.g., invalid API key, auth failure)
  },
});

// Hook exposes status
recording.status; // 'idle' | 'starting' | 'connecting' | 'recording' | 'stopping'
recording.error; // null or error if unrecoverable
```

---

## Error Classification

Different error types handled by SDK:

| Error                 | Recovery                             | User Feedback                         |
| --------------------- | ------------------------------------ | ------------------------------------- |
| Network timeout       | Auto-reconnect (exponential backoff) | Status shows "connecting"             |
| Server 5xx            | Auto-reconnect (exponential backoff) | Status shows "connecting"             |
| Connection drops      | Auto-reconnect (exponential backoff) | Status shows "connecting"             |
| Invalid API key       | No retry                             | Error banner: "API key invalid"       |
| Auth failure          | No retry                             | Error banner: "Authentication failed" |
| Mic permission denied | No retry                             | Error banner: "Permission denied"     |

---

## What Changed from v0.1.0

### Removed: Custom SonioxClient Class

**Old Code** (`src/providers/soniox/soniox-client.ts`):

```typescript
export class SonioxClient implements STTProvider {
  private ws: WebSocket | null = null;
  private retryCount = 0;
  private maxRetries = 10;
  private pendingChunks: Int16Array[] = [];

  // Exponential backoff logic
  private scheduleReconnect() {
    const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
    const jitter = Math.random() * 100;
    setTimeout(() => this.connect(), delay + jitter);
    this.retryCount++;
  }

  // Chunk buffering logic
  async send(chunk: Int16Array): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(chunk.buffer);
    } else {
      this.pendingChunks.push(chunk);
    }
  }

  // ... more connection handling
}
```

**Why Removed**: SDK now handles all of this internally; no need for custom implementation.

### Removed: Pending Chunk Buffer

**Old Code**:

```typescript
private pendingChunks: Int16Array[] = [];

// Flush on reconnect
private onConnected() {
  while (this.pendingChunks.length > 0) {
    const chunk = this.pendingChunks.shift();
    this.ws?.send(chunk!.buffer);
  }
}
```

**Now**: SDK manages chunk buffering internally; chunks are cached and replayed on reconnection.

### Removed: Preemptive 280-Minute Reconnection

**Old Code** (handled 300min Soniox stream limit):

```typescript
const STREAM_TIMEOUT_MS = 280 * 60 * 1000;

onConnected() {
  setTimeout(() => {
    console.log('[Soniox] Stream approaching limit; reconnecting');
    this.ws?.close();
    this.scheduleReconnect();
  }, STREAM_TIMEOUT_MS);
}
```

**Note**: Check SDK documentation to see if it handles this limit internally. If not, it may be reintroduced at the hook level.

---

## Connection Status Tracking

`useRecording` hook exposes status:

```typescript
// In useTranslationSession
const recording = useRecording({
  /* ... */
});

// Status values
recording.status === "idle"; // Not recording
recording.status === "starting"; // Initializing (getting permission)
recording.status === "connecting"; // Opening WebSocket
recording.status === "recording"; // Connected & streaming audio
recording.status === "stopping"; // Closing session

// useTranslationSession exposes friendly status
export function useTranslationSession() {
  function toConnectionStatus(
    state: string,
  ): "disconnected" | "connecting" | "connected" {
    if (state === "starting" || state === "connecting") return "connecting";
    if (state === "recording") return "connected";
    return "disconnected";
  }

  return {
    connectionStatus: toConnectionStatus(recording.status),
    // ...
  };
}
```

**Component Usage**:

```typescript
const { connectionStatus } = useTranslationSession();

return (
  <StatusBadge
    status={connectionStatus}
    // 'disconnected' → gray dot
    // 'connecting' → yellow pulse
    // 'connected' → green dot
  />
);
```

---

## Error Handling Flow

```
SDK WebSocket error occurs
  ↓
SDK applies internal reconnection logic
  ↓
If recoverable (network timeout, server error):
  SDK retries automatically
  useRecording.status shows 'connecting'
  ↓
  Connection restored
  useRecording.status = 'recording'
  ↓
Else if unrecoverable (invalid API key):
  SDK sets recording.error
  useTranslationSession surface error to component
  ↓
  Component shows ErrorBanner
```

**In useTranslationSession**:

```typescript
return {
  error: recordingError || permissionError,
  // ...
};
```

---

## Testing Resilience

### Manual Testing Scenarios

1. **Disconnect & Reconnect**:
   - Start recording
   - Kill network (airplane mode / disable WiFi)
   - Wait for "connecting" status
   - Restore network
   - Verify audio resumes without user action

2. **Long Recording (280+ minutes)**:
   - Start recording
   - Let run for 300+ minutes
   - Verify audio doesn't cut off
   - (Note: Check if SDK handles 280min preemptive reset)

3. **Invalid API Key**:
   - Change API key in settings to garbage value
   - Start recording
   - Verify error banner shows within 2–5 seconds
   - Cannot retry until key is fixed

4. **Microphone Unplugged**:
   - Start recording with external mic
   - Unplug mic mid-stream
   - Verify error or graceful fallback to system mic
   - (Behavior depends on browser/OS)

---

## Monitoring Recommendations

**Metrics to track** (future):

| Metric                      | Target | Tool                                        |
| --------------------------- | ------ | ------------------------------------------- |
| Connection uptime           | >99%   | Log reconnects per session                  |
| Reconnect latency (p95)     | <5s    | Measure time to 'connected'                 |
| Chunk loss during reconnect | 0%     | Compare chunks sent vs received             |
| Error rate                  | <1%    | Count unrecoverable errors per 100 sessions |

**Logging** (currently minimal):

```typescript
// SDK may log internally; app should also log for debugging:
console.log("[useTranslationSession] Recording started");
console.error("[useTranslationSession] Recording error:", error);
```

---

## Known Limitations

1. **No Pause/Resume**: Stopping always closes connection. Resume requires new session.
2. **No Session Recovery**: If app crashes, transcript is lost (not auto-saved).
3. **API Key Refresh**: No mechanism to rotate key mid-session; must stop & restart.

**Mitigation**: Auto-save draft transcripts to localStorage during recording (future enhancement).

---

## SDK Documentation

For detailed resilience behavior, refer to:

- [@soniox/react SDK Docs](https://github.com/soniox/soniox-sdk-js)
- [useRecording Hook API](https://github.com/soniox/soniox-sdk-js#userecording)

---

## References

- [System Architecture Overview](./overview.md)
- [Audio Pipeline](./audio-pipeline.md)
- [State Management](./state-management.md)
