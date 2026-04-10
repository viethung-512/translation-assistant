# Phase 04 — Soniox Provider

## Context Links
- Plan: `plans/260409-1858-ai-mobile-translator/plan.md`
- Brainstorm: `plans/reports/brainstorm-260409-1858-ai-mobile-translator.md`
- Soniox WS API: https://soniox.com/docs/stt/api-reference/websocket-api
- Soniox translation: https://soniox.com/docs/stt/rt/real-time-translation

## Overview
- **Priority:** P1
- **Status:** Complete
- **Effort:** 3h
- **Blocked by:** Phase 01
- **Can run in parallel with:** Phase 03
- **Description:** Implement the STTProvider interface and SonioxClient WebSocket implementation. Handles connection lifecycle, audio streaming, token parsing, and reconnection.

## Key Insights
- WebSocket URL: `wss://stt-rt.soniox.com/transcribe-websocket`
- First message must be JSON config (api_key, model, audio_format, translation)
- Subsequent messages are raw binary audio chunks (ArrayBuffer)
- Responses are JSON token objects: `{ text, is_final, translation_status, start_ms, end_ms }`
- `translation_status`: `"original"` = source language, `"translated"` = target language
- Model: `"stt-rt-preview"` (current real-time model)
- Audio format: `{ "format": "s16le", "sample_rate": 16000, "num_channels": 1 }`
- Stream limit: 300 min — auto-reconnect at 280 min
- Exponential backoff for reconnect: 1s → 2s → 4s → 8s → max 30s
- Provider interface enables future providers (Deepgram, Google, etc.) without touching UI

## Requirements

### Functional
- `connect(config)` — opens WebSocket, sends config message
- `sendAudio(chunk: ArrayBuffer)` — sends binary audio
- `disconnect()` — closes WebSocket cleanly
- Token events emitted: `original` text and `translated` text separately
- Auto-reconnect on unexpected close (not on user-initiated disconnect)
- Auto-reconnect at 280min stream limit

### Non-functional
- WebSocket errors surface as typed errors (not generic strings)
- No audio chunks lost during reconnection (queue and flush)
- Provider is framework-agnostic (no React deps)

## Related Code Files

### Create
- `src/providers/types.ts` — STTProvider interface + shared types
- `src/providers/soniox/soniox-types.ts` — Soniox-specific types
- `src/providers/soniox/soniox-client.ts` — WebSocket client implementation

## Implementation Steps

1. **Create `src/providers/types.ts`** — provider contract:
   ```typescript
   export interface TranslationToken {
     text: string;
     isFinal: boolean;
     type: 'original' | 'translated';
     startMs: number;
     endMs: number;
   }

   export interface ProviderConfig {
     apiKey: string;
     sourceLanguage: string;   // BCP-47, e.g. "en"
     targetLanguage: string;   // BCP-47, e.g. "vi"
   }

   export type TokenHandler = (token: TranslationToken) => void;
   export type ErrorHandler = (error: Error) => void;
   export type StatusHandler = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;

   export interface STTProvider {
     connect(config: ProviderConfig): Promise<void>;
     sendAudio(chunk: ArrayBuffer): void;
     disconnect(): void;
     onToken(handler: TokenHandler): void;
     onError(handler: ErrorHandler): void;
     onStatus(handler: StatusHandler): void;
   }
   ```

2. **Create `src/providers/soniox/soniox-types.ts`:**
   ```typescript
   export interface SonioxConfig {
     api_key: string;
     model: string;
     audio_format: { format: string; sample_rate: number; num_channels: number };
     translation: { type: 'one_way'; target_language: string };
     enable_language_identification: boolean;
   }

   export interface SonioxToken {
     text: string;
     is_final: boolean;
     translation_status: 'original' | 'translated' | null;
     start_ms: number;
     end_ms: number;
     speaker?: string;
   }
   ```

3. **Create `src/providers/soniox/soniox-client.ts`:**
   ```typescript
   import type { STTProvider, ProviderConfig, TokenHandler, ErrorHandler, StatusHandler } from '../types';
   import type { SonioxToken } from './soniox-types';

   const WS_URL = 'wss://stt-rt.soniox.com/transcribe-websocket';
   const MAX_STREAM_MS = 280 * 60 * 1000; // 280 min
   const MAX_BACKOFF_MS = 30_000;

   export class SonioxClient implements STTProvider {
     private ws: WebSocket | null = null;
     private tokenHandler: TokenHandler | null = null;
     private errorHandler: ErrorHandler | null = null;
     private statusHandler: StatusHandler | null = null;
     private config: ProviderConfig | null = null;
     private pendingChunks: ArrayBuffer[] = [];
     private reconnectAttempts = 0;
     private streamTimer: ReturnType<typeof setTimeout> | null = null;
     private userDisconnected = false;

     onToken(h: TokenHandler) { this.tokenHandler = h; }
     onError(h: ErrorHandler) { this.errorHandler = h; }
     onStatus(h: StatusHandler) { this.statusHandler = h; }

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
           // flush any pending chunks
           for (const chunk of this.pendingChunks) ws.send(chunk);
           this.pendingChunks = [];
           // schedule pre-emptive reconnect at 280 min
           this.streamTimer = setTimeout(() => this.reconnect(), MAX_STREAM_MS);
           resolve();
         };

         ws.onmessage = (e) => {
           try {
             const token: SonioxToken = JSON.parse(e.data as string);
             if (!token.text) return;
             this.tokenHandler?.({
               text: token.text,
               isFinal: token.is_final,
               type: token.translation_status === 'translated' ? 'translated' : 'original',
               startMs: token.start_ms,
               endMs: token.end_ms,
             });
           } catch {
             // binary ack or unknown message — ignore
           }
         };

         ws.onerror = () => reject(new Error('WebSocket connection failed'));

         ws.onclose = (e) => {
           this.statusHandler?.('disconnected');
           clearTimeout(this.streamTimer!);
           if (!this.userDisconnected) this.scheduleReconnect();
         };
       });
     }

     sendAudio(chunk: ArrayBuffer): void {
       if (this.ws?.readyState === WebSocket.OPEN) {
         this.ws.send(chunk);
       } else {
         this.pendingChunks.push(chunk); // buffer during reconnect
       }
     }

     disconnect(): void {
       this.userDisconnected = true;
       clearTimeout(this.streamTimer!);
       this.ws?.close(1000, 'User disconnected');
       this.ws = null;
       this.pendingChunks = [];
     }

     private scheduleReconnect(): void {
       const delay = Math.min(1000 * 2 ** this.reconnectAttempts, MAX_BACKOFF_MS);
       this.reconnectAttempts++;
       this.statusHandler?.('connecting');
       setTimeout(() => this.openSocket().catch(e => this.errorHandler?.(e)), delay);
     }

     private reconnect(): void {
       this.ws?.close(1000, 'Stream limit reached');
       this.ws = null;
       this.openSocket().catch(e => this.errorHandler?.(e));
     }

     private buildSonioxConfig() {
       return {
         api_key: this.config!.apiKey,
         model: 'stt-rt-preview',
         audio_format: { format: 's16le', sample_rate: 16000, num_channels: 1 },
         translation: { type: 'one_way', target_language: this.config!.targetLanguage },
         enable_language_identification: false,
       };
     }
   }
   ```

4. **Verify:** Unit-testable in isolation — mock WebSocket and confirm:
   - Config message sent on open
   - Pending chunks flushed after reconnect
   - Token handler called with correct `type` field

## Todo List

- [x] Create `src/providers/types.ts` (STTProvider interface)
- [x] Create `src/providers/soniox/soniox-types.ts`
- [x] Create `src/providers/soniox/soniox-client.ts` (full WS client)
- [x] Verify reconnect logic with manual network drop test
- [x] Verify token type mapping (`original` vs `translated`)

## Success Criteria

- `SonioxClient.connect()` with valid API key opens WebSocket without error
- Audio chunks sent via `sendAudio()` trigger token callbacks within 500ms
- Disconnect cleanly stops all callbacks
- Simulated network drop triggers reconnect with backoff

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Soniox API key invalid → ws closes immediately | Parse close code; emit typed `AuthError` |
| `translation_status` field missing on some tokens | Guard with `?? 'original'` fallback |
| Stream limit hit mid-sentence | Accept partial final token; note in transcript |
| Mobile WebView closes WS on background | Detected via `onclose`; reconnect on foreground resume (add visibility change listener in phase 08) |

## Security Considerations
- API key sent only in first JSON config message over WSS (TLS)
- Key retrieved from Tauri secure storage at connect time, not stored in module scope
- `pendingChunks` cleared on `disconnect()` — no audio data lingering in memory

## Next Steps
→ Phase 05: SessionStore wires AudioCapture → SonioxClient
