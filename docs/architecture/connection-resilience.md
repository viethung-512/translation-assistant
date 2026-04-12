# Connection Resilience

**Version**: 0.1.0

Exponential backoff, preemptive reconnection, and chunk buffering strategies.

---

## Exponential Backoff

Reconnect attempts after failure use exponential backoff with jitter to avoid thundering herd.

**Schedule**:
```
Attempt 1: wait 1s     (2^0)
Attempt 2: wait 2s     (2^1)
Attempt 3: wait 4s     (2^2)
Attempt 4: wait 8s     (2^3)
Attempt 5: wait 16s    (2^4)
Attempt 6: wait 32s    (capped at 30s max)
Attempt 7+: wait 30s   (remains at max)
```

**Implementation**:

```typescript
private scheduleReconnect() {
  const delay = Math.min(
    1000 * Math.pow(2, this.retryCount),
    30000 // 30s max
  );
  const jitter = Math.random() * 100; // 0-100ms random delay
  
  setTimeout(() => this.connect(), delay + jitter);
  this.retryCount++;
}

// On successful connect, reset retry counter
private onConnected() {
  this.retryCount = 0; // Ready for next failure
}
```

**Benefits**:
- Prevents overwhelming server with reconnect requests
- Gives network time to recover
- Jitter spreads reconnect attempts across time (prevents herd effect)
- Max 30s cap ensures app doesn't wait indefinitely

---

## Chunk Buffering During Reconnect

If WebSocket closes mid-stream, PCM chunks are buffered. On reconnect, chunks are flushed.

```typescript
private pendingChunks: Int16Array[] = [];

async send(chunk: Int16Array): Promise<void> {
  if (this.ws?.readyState === WebSocket.OPEN) {
    this.ws.send(chunk.buffer);
  } else {
    // Buffer for reconnect
    this.pendingChunks.push(chunk);
  }
}

private onConnected() {
  // Flush pending chunks
  while (this.pendingChunks.length > 0) {
    const chunk = this.pendingChunks.shift();
    this.ws?.send(chunk!.buffer);
  }
  
  this.retryCount = 0;
}
```

**Scenario**:
```
WebSocket connected
  ↓
Audio chunks sent successfully (chunks 1-10)
  ↓
Network drops → WebSocket closes
  ↓
Chunks 11-15 arrive from AudioWorklet
  ↓
send(chunk11) detects !OPEN → buffers chunk11
send(chunk12) → buffers chunk12
... (chunks buffered in memory)
  ↓
Exponential backoff: wait 2s
  ↓
reconnect() succeeds
  ↓
Flush: send(chunk11), send(chunk12), ...
  ↓
Resume real-time streaming
```

**User Experience**: Transparent; no manual action required. Transcription may have brief gap but continues.

---

## Preemptive Reconnection at 280 Minutes

Soniox enforces 300min max stream duration. App reconnects preemptively at 280min.

```typescript
const STREAM_TIMEOUT_MS = 280 * 60 * 1000; // 280 minutes

onConnected() {
  // Schedule preemptive reconnect
  setTimeout(() => {
    console.log('[Soniox] Stream approaching limit (280min); reconnecting');
    this.ws?.close();
    this.scheduleReconnect(); // Will reconnect immediately (0ms delay)
  }, STREAM_TIMEOUT_MS);
}
```

**Scenario**:
```
User starts long recording (240min conference)
  ↓
At 280min mark: app closes WebSocket, reconnects
  ↓
Reconnect happens instantly (retryCount = 0, so delay = 0)
  ↓
New stream starts; audio resumes
  ↓
User never notices (seamless reconnection)
```

**Why 280min vs 300min?**
- 20min buffer accounts for clock skew and network latency
- Ensures reconnect completes before hard limit

---

## Error Classification

Different error types trigger different recovery strategies:

| Error | Retry | Backoff | User Feedback |
|-------|-------|---------|---------------|
| Invalid API key | No | — | "API key invalid; check Settings" |
| Network timeout | Yes | Exponential | "Reconnecting..." (auto-retry) |
| Server 5xx | Yes | Exponential | "Service unavailable; retrying..." |
| Mic permission denied | No | — | "Grant microphone permission" |
| Connection closes | Yes | Exponential | (transparent; buffer chunks) |

---

## Implementation Details

```typescript
export class SonioxClient implements STTProvider {
  private ws: WebSocket | null = null;
  private retryCount = 0;
  private maxRetries = 10; // Safety limit
  private pendingChunks: Int16Array[] = [];
  
  onError?: (error: Error) => void;
  
  async connect(): Promise<void> {
    try {
      this.ws = new WebSocket('wss://api.soniox.com/v1/listen');
      this.ws.onopen = () => this.onConnected();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onerror = (event) => this.handleError(event);
      this.ws.onclose = () => this.scheduleReconnect();
    } catch (err) {
      this.scheduleReconnect();
    }
  }
  
  private handleError(event: Event) {
    const error = new Error('WebSocket error');
    
    // Check if error is recoverable
    if (this.retryCount < this.maxRetries) {
      // Retry with backoff
      this.scheduleReconnect();
    } else {
      // Max retries exceeded; give up
      if (this.onError) {
        this.onError(new Error('Connection failed after 10 attempts'));
      }
    }
  }
  
  private scheduleReconnect() {
    if (this.retryCount >= this.maxRetries) {
      return; // Don't schedule more retries
    }
    
    const delay = Math.min(
      1000 * Math.pow(2, this.retryCount),
      30000
    );
    const jitter = Math.random() * 100;
    
    setTimeout(() => this.connect(), delay + jitter);
    this.retryCount++;
  }
  
  private onConnected() {
    // Send auth + config
    this.sendAuth();
    
    // Flush pending chunks
    while (this.pendingChunks.length > 0) {
      const chunk = this.pendingChunks.shift();
      this.ws?.send(chunk!.buffer);
    }
    
    // Reset retry counter
    this.retryCount = 0;
    
    // Schedule preemptive reconnect
    const STREAM_TIMEOUT_MS = 280 * 60 * 1000;
    setTimeout(() => {
      this.ws?.close();
      this.scheduleReconnect();
    }, STREAM_TIMEOUT_MS);
  }
  
  async send(chunk: Int16Array): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(chunk.buffer);
    } else {
      this.pendingChunks.push(chunk);
    }
  }
}
```

---

## Buffer Size Limits

Pending chunks are buffered in memory, but with reasonable limits:

```typescript
async send(chunk: Int16Array): Promise<void> {
  if (this.ws?.readyState === WebSocket.OPEN) {
    this.ws.send(chunk.buffer);
  } else {
    // Prevent unbounded buffer growth (e.g., if reconnect takes minutes)
    if (this.pendingChunks.length < 600) { // ~60 seconds of audio
      this.pendingChunks.push(chunk);
    } else {
      console.warn('[Soniox] Pending chunk buffer full; discarding old chunks');
      this.pendingChunks.shift(); // Drop oldest chunk
      this.pendingChunks.push(chunk); // Add new chunk
    }
  }
}
```

**Rationale**: 600 chunks × 100ms = 60s buffer. Reconnects usually complete within seconds, so this is safe.

---

## Monitoring & Observability

**Metrics to track** (future):
- Connection uptime (% connected)
- Reconnect frequency (per day)
- Backoff wait times (p50, p95, p99)
- Chunk loss rate (during buffering)

**Logging**:
```typescript
console.log('[Soniox] Connected');
console.log(`[Soniox] Reconnecting after ${delay}ms (attempt ${this.retryCount})`);
console.warn('[Soniox] Max reconnect attempts exceeded');
```

---

## Future Improvements

**v0.2.0+**:
- Configurable backoff strategy (exponential vs linear)
- Adaptive buffer sizing based on network conditions
- Metrics/telemetry dashboard
- User-facing "reconnecting..." UI with progress

---

## References

- [System Architecture Overview](./overview.md)
- [Soniox Provider](./soniox-provider.md)
- [Audio Pipeline](./audio-pipeline.md)
