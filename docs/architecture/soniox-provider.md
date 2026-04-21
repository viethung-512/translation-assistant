# Soniox Provider

**Version**: 0.1.0

WebSocket client implementation for real-time speech-to-text and translation.

---

## Connection Lifecycle

```
Session Start
  ↓
SonioxClient.connect()
  ├─ Establish wss://api.soniox.com/v1/listen
  ├─ Send authentication (Bearer token)
  └─ Configure source/target languages
  ↓
Connected → ready to send audio
  ↓
For each 100ms PCM chunk:
  Send binary frame via WebSocket
  Receive JSON token response
  Dispatch callbacks (interim, final, error)
  ↓
Session Stop
  ├─ Send end-of-stream marker
  └─ Close WebSocket
```

---

## WebSocket Messages

### Client → Server (Audio)

Binary frames containing Int16 PCM data:

```
[1600 samples × 2 bytes per sample] = 3200 bytes per 100ms chunk
```

### Client → Server (Config)

Initial configuration sent on connect:

```json
{
  "config": {
    "language": {
      "source_language": "en",
      "target_language": "es"
    }
  },
  "audio_format": {
    "encoding": "PCM_S16LE",
    "sample_rate_hertz": 16000
  }
}
```

### Server → Client (Tokens)

JSON response on each token:

```json
{
  "result": {
    "interim_transcription": "Hello wo",
    "final_transcription": "Hello",
    "interim_translation": "Hola m",
    "final_translation": "Hola"
  }
}
```

---

## Implementation

```typescript
export class SonioxClient implements STTProvider {
  private ws: WebSocket | null = null;
  private retryCount = 0;
  private maxRetries = 10; // 2^10 = 1024s max backoff
  private pendingChunks: Int16Array[] = [];

  onInterimToken?: (token: string) => void;
  onFinalToken?: (token: string, translation: string) => void;
  onError?: (error: Error) => void;

  async connect(): Promise<void> {
    try {
      this.ws = new WebSocket("wss://api.soniox.com/v1/listen");
      this.ws.binaryType = "arraybuffer";

      this.ws.onopen = () => this.onConnected();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onerror = (event) => this.handleError(event);
      this.ws.onclose = () => this.scheduleReconnect();
    } catch (err) {
      this.scheduleReconnect();
    }
  }

  private onConnected() {
    this.sendAuth();
    this.retryCount = 0;

    // Flush pending chunks
    while (this.pendingChunks.length > 0) {
      const chunk = this.pendingChunks.shift();
      this.ws?.send(chunk!.buffer);
    }
  }

  private handleMessage(event: MessageEvent) {
    const message = JSON.parse(event.data);
    const interim = message.result?.interim_transcription;
    const final = message.result?.final_transcription;
    const translation = message.result?.final_translation;

    if (interim && this.onInterimToken) {
      this.onInterimToken(interim);
    }

    if (final && translation && this.onFinalToken) {
      this.onFinalToken(final, translation);
    }
  }

  async send(chunk: Int16Array): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(chunk.buffer);
    } else {
      // Buffer for reconnect
      this.pendingChunks.push(chunk);
    }
  }

  private scheduleReconnect() {
    const delay = Math.min(
      1000 * Math.pow(2, this.retryCount),
      30000, // 30s max
    );
    const jitter = Math.random() * 100;
    setTimeout(() => this.connect(), delay + jitter);
    this.retryCount++;
  }

  async disconnect(): Promise<void> {
    this.ws?.close();
    this.ws = null;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private sendAuth() {
    const apiKey = useSettingsStore.getState().apiKey;
    const authMsg = {
      auth: { api_key: apiKey },
      config: {
        language: {
          source_language: useSettingsStore.getState().sourceLang,
          target_language: useSettingsStore.getState().targetLang,
        },
      },
    };
    this.ws?.send(JSON.stringify(authMsg));
  }

  private handleError(event: Event) {
    const error = new Error("Soniox WebSocket error");
    if (this.onError) this.onError(error);
  }
}
```

---

## Error Scenarios

| Scenario                    | Action                                                      |
| --------------------------- | ----------------------------------------------------------- |
| Invalid API key             | Show error banner; do not retry                             |
| Network timeout             | Exponential backoff (2^n, max 30s)                          |
| Server 5xx                  | Retry with backoff                                          |
| Connection drops mid-stream | Auto-reconnect; buffer chunks                               |
| Stream exceeds 300min       | Pre-emptive reconnect at 280min (see Connection Resilience) |

---

## API Key Handling

API key sent in initial WebSocket message:

```json
{
  "auth": {
    "api_key": "sk-..."
  }
}
```

**Storage**: Retrieved from SettingsStore (localStorage in v0.1.0, keychain in v1.0+).

---

## Authentication Flow

1. User enters API key in Settings panel
2. SettingsStore persists to localStorage
3. On SonioxClient.connect(): retrieve key from SettingsStore
4. Send key in auth message within 100ms of WebSocket open
5. Soniox validates; rejects if invalid (returns error via onError callback)

---

## Concurrency Handling

Single WebSocket connection per app instance (no concurrent sessions).

**Thread Safety**:

- WebSocket callbacks run on browser event loop
- State updates via Zustand (atomic)
- Audio chunks buffered in pendingChunks array (FIFO)

---

## Future Multi-Provider Support

To support additional providers (Google Cloud, AWS):

1. Implement `STTProvider` interface (already defined)
2. Create new client class (e.g., `GoogleCloudClient`, `AwsTranscribeClient`)
3. Update SettingsStore with provider selection
4. In `useTranslationSession`, instantiate appropriate provider based on settings

**Example** (future):

```typescript
const provider =
  settings.provider === "soniox" ? new SonioxClient() : new GoogleCloudClient();
await provider.connect();
```

---

## Monitoring

**Metrics to track** (future):

- Connection uptime (% connected)
- Token latency (p50, p95, p99)
- Error rate by type
- API quota usage

---

## References

- [System Architecture Overview](./overview.md)
- [Connection Resilience](./connection-resilience.md)
- [STTProvider Interface](../codebase-summary.md#key-interfaces)
