// SonioxClient — WebSocket STT+translation provider.
// Handles connection lifecycle, binary audio streaming, token parsing, and exponential-backoff reconnect.
import type {
  STTProvider,
  ProviderConfig,
  TokenHandler,
  ErrorHandler,
  StatusHandler,
} from '../types';
import type { SonioxToken } from './soniox-types';

const WS_URL = 'wss://stt-rt.soniox.com/transcribe-websocket';
// Pre-emptive reconnect before the 300-min stream limit
const MAX_STREAM_MS = 280 * 60 * 1000;
const MAX_BACKOFF_MS = 30_000;

export class SonioxClient implements STTProvider {
  private ws: WebSocket | null = null;
  private tokenHandler: TokenHandler | null = null;
  private errorHandler: ErrorHandler | null = null;
  private statusHandler: StatusHandler | null = null;
  private config: ProviderConfig | null = null;
  // Audio chunks queued while reconnecting
  private pendingChunks: ArrayBuffer[] = [];
  private reconnectAttempts = 0;
  private streamTimer: ReturnType<typeof setTimeout> | null = null;
  private userDisconnected = false;

  onToken(h: TokenHandler): void { this.tokenHandler = h; }
  onError(h: ErrorHandler): void { this.errorHandler = h; }
  onStatus(h: StatusHandler): void { this.statusHandler = h; }

  async connect(config: ProviderConfig): Promise<void> {
    this.config = config;
    this.userDisconnected = false;
    return this.openSocket();
  }

  private openSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.statusHandler?.('connecting');
      const ws = new WebSocket(WS_URL);
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        ws.send(JSON.stringify(this.buildSonioxConfig()));
        this.ws = ws;
        this.reconnectAttempts = 0;
        this.statusHandler?.('connected');

        // Flush audio queued during reconnect window
        for (const chunk of this.pendingChunks) ws.send(chunk);
        this.pendingChunks = [];

        // Schedule pre-emptive reconnect at 280 min
        this.streamTimer = setTimeout(() => this.reconnect(), MAX_STREAM_MS);
        resolve();
      };

      ws.onmessage = (e: MessageEvent) => {
        try {
          const token = JSON.parse(e.data as string) as SonioxToken;
          if (!token.text) return;
          this.tokenHandler?.({
            text: token.text,
            isFinal: token.is_final,
            type: token.translation_status === 'translated' ? 'translated' : 'original',
            startMs: token.start_ms,
            endMs: token.end_ms,
          });
        } catch {
          // Binary ack or unknown message — ignore
        }
      };

      ws.onerror = () => {
        reject(new Error('WebSocket connection failed'));
      };

      ws.onclose = () => {
        this.statusHandler?.('disconnected');
        if (this.streamTimer) clearTimeout(this.streamTimer);
        if (!this.userDisconnected) this.scheduleReconnect();
      };
    });
  }

  sendAudio(chunk: ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(chunk);
    } else {
      this.pendingChunks.push(chunk);
    }
  }

  disconnect(): void {
    this.userDisconnected = true;
    if (this.streamTimer) clearTimeout(this.streamTimer);
    this.ws?.close(1000, 'User disconnected');
    this.ws = null;
    this.pendingChunks = [];
  }

  private scheduleReconnect(): void {
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, MAX_BACKOFF_MS);
    this.reconnectAttempts++;
    this.statusHandler?.('connecting');
    setTimeout(() => {
      this.openSocket().catch((e: Error) => this.errorHandler?.(e));
    }, delay);
  }

  private reconnect(): void {
    this.ws?.close(1000, 'Stream limit reached');
    this.ws = null;
    this.openSocket().catch((e: Error) => this.errorHandler?.(e));
  }

  private buildSonioxConfig() {
    return {
      api_key: this.config!.apiKey,
      model: 'stt-rt-preview',
      audio_format: { format: 's16le', sample_rate: 16000, num_channels: 1 },
      translation: { type: 'one_way' as const, target_language: this.config!.targetLanguage },
      enable_language_identification: false,
    };
  }
}
