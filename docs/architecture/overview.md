# Architecture Overview

**Version**: 0.1.0  
**Last Updated**: April 2026

System architecture diagram and high-level component breakdown.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Tauri Desktop/Mobile App                  │
├─────────────────────────────────────────────────────────────────┤
│                     React 18 Frontend (TypeScript)                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ React Components (Controls, Display, Settings, UI)       │   │
│  │ ├─ RecordButton, StatusBadge, TranslationDisplay        │   │
│  │ └─ SettingsPanel (API key, languages, output mode)      │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ State Management (Zustand)                               │   │
│  │ ├─ SessionStore (ephemeral: recording, tokens, errors)  │   │
│  │ └─ SettingsStore (persistent: API key, languages)       │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Audio Subsystem                                          │   │
│  │ ├─ AudioCapture (getUserMedia → AudioWorklet)           │   │
│  │ ├─ PCMWorklet (Float32 → Int16 conversion)              │   │
│  │ └─ TTSService (Web Speech API queue)                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ STT Provider (Soniox)                                    │   │
│  │ ├─ SonioxClient (WebSocket, auth, reconnection)         │   │
│  │ └─ Token callbacks (interim, final, error)              │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Tauri IPC Bridge                                         │   │
│  │ └─ Transcript I/O (write_transcript, list_transcripts)  │   │
│  └──────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    Tauri Backend (Rust 2021)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Commands (transcript.rs)                                │   │
│  │ ├─ write_transcript(filename, content) → atomic write   │   │
│  │ └─ list_transcripts() → metadata array                  │   │
│  └──────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      External Services                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Soniox WebSocket API (wss://api.soniox.com/v1/listen)   │   │
│  │ ├─ Real-time STT (16kHz PCM in, transcription out)     │   │
│  │ └─ Translation (source lang → target lang)              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer Breakdown

### 1. React Frontend

**Purpose**: User-facing UI and state management

**Key Modules**:
- `App.tsx` — Root layout component
- `RecordButton`, `StatusBadge`, `TranslationDisplay` — Core UI
- `SettingsPanel` — Configuration UI
- `useTranslationSession` — Orchestration hook

**Responsibilities**:
- Render UI based on SessionStore + SettingsStore state
- Dispatch user actions (record, stop, select language)
- Display real-time tokens and errors
- Trigger transcript save on recording end

---

### 2. State Management (Zustand)

**Purpose**: Manage application state across component tree

**Two Stores**:

#### SessionStore (Ephemeral)
- **Lifetime**: Resets when recording stops
- **Contents**: recording status, connection state, tokens, errors
- **Used by**: Components, hooks, providers

#### SettingsStore (Persistent)
- **Lifetime**: Survives app restart via localStorage
- **Contents**: API key, language pair, output mode
- **Used by**: App initialization, settings panel, provider setup

See [State Management](./state-management.md) for detailed design.

---

### 3. Audio Subsystem

**Purpose**: Capture microphone input and convert to PCM format

**Components**:
- `AudioCapture` — Gets user mic permission, creates AudioContext/AudioWorklet
- `PCMWorklet` — Runs in Web Audio API thread; converts Float32 to Int16
- `TTSService` — Queues text for voice synthesis

See [Audio Pipeline](./audio-pipeline.md) for detailed flow.

---

### 4. STT Provider (Soniox)

**Purpose**: Send audio to Soniox API, receive tokens, handle errors

**Components**:
- `SonioxClient` — WebSocket client with auth, chunk buffering, reconnection
- Implements `STTProvider` interface for future multi-provider support

See [Soniox Provider](./soniox-provider.md) for detailed implementation.

---

### 5. Tauri IPC Bridge

**Purpose**: Communicate with Rust backend for file I/O

**Commands**:
- `write_transcript(filename, content)` — Save transcript to disk
- `list_transcripts()` — Fetch transcript metadata

See [Tauri Integration](./tauri-integration.md) for command details.

---

### 6. Rust Backend

**Purpose**: File I/O operations (Tauri sandboxing layer)

**Modules**:
- `commands/transcript.rs` — Implements write_transcript + list_transcripts
- Handles path validation, directory creation, error reporting

See [Tauri Integration](./tauri-integration.md) for implementation.

---

## Data Flow (Recording Session)

```
┌─────────────────────────────────────────────────────────────────┐
│ User clicks "Record"                                            │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ useTranslationSession.start()                                   │
│ ├─ AudioCapture.start()                                        │
│ └─ SonioxClient.connect()                                       │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ SessionStore.setRecording(true)                                 │
│ SessionStore.setConnected(true)                                 │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ AudioWorklet emits PCM chunks (100ms, 1600 bytes)              │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ SonioxClient sends chunk via WebSocket                          │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Soniox responds with token (interim or final)                   │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ SonioxClient callback fires:                                     │
│ ├─ onInterimToken(token) → SessionStore.setInterimToken()     │
│ └─ onFinalToken(src, trans) → SessionStore.addFinalToken()    │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ React re-renders:                                               │
│ ├─ TranslationDisplay updates with finalized line             │
│ ├─ Interim token shown in footer                              │
│ └─ TTSService.enqueue(translation) if TTS enabled             │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ User clicks "Stop"                                              │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ useTranslationSession.stop()                                    │
│ ├─ AudioCapture.stop()                                         │
│ ├─ SonioxClient.disconnect()                                   │
│ └─ writeTranscript(filename, finalTokens)                      │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Tauri invoke('write_transcript', ...)                           │
│ → Rust backend atomically writes to ~/Documents/...            │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ SessionStore.reset()                                            │
│ → Clear tokens, errors; app ready for next recording            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Abstractions

### STTProvider Interface

```typescript
interface STTProvider {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(chunk: Int16Array): Promise<void>;
  isConnected(): boolean;
  
  // Callbacks
  onInterimToken?: (token: string) => void;
  onFinalToken?: (token: string, translation: string) => void;
  onError?: (error: Error) => void;
}
```

**Purpose**: Define contract for pluggable speech recognition providers. Currently only Soniox, but extensible for Google Cloud, AWS, offline models in v0.2.0+.

---

## Design Decisions

### Why AudioWorklet (not ScriptProcessorNode)?

- AudioWorklet runs off main thread → better performance
- Lower latency (sample-accurate processing)
- ScriptProcessorNode deprecated; future-proof

### Why Zustand (not Redux)?

- Lightweight (5KB vs Redux 50KB+)
- Simple API (setState, no boilerplate)
- Persist middleware built-in
- Good for cross-platform apps

### Why Soniox (not Google/AWS)?

- Real-time streaming (not polling)
- High accuracy for accents
- Startup-friendly pricing
- Simple WebSocket API

### Why Tauri (not Electron)?

- Lightweight binary (~150MB vs Electron ~200MB+)
- Built-in Rust backend for file I/O
- Better mobile support (iOS, Android)
- Security-focused (minimal permissions)

---

## Deployment Architecture

### Build Targets

| Platform | Target | Bundle Size | Runtime |
|----------|--------|-------------|---------|
| macOS | universal-apple-darwin | ~150MB | Native |
| Windows | x86_64-pc-windows-msvc | ~120MB | Native |
| Linux | x86_64-unknown-linux-gnu | ~110MB | Native |
| iOS | aarch64-apple-ios | ~80MB | Native |
| Android | aarch64-linux-android | ~90MB | Native |

All targets share same React/TypeScript frontend code.

---

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| STT latency | 300–500ms | Met (Soniox dependent) |
| Memory (idle) | <100MB | Met (~90MB) |
| Memory (recording) | <200MB | Met (~100–200MB peak) |
| Startup time | <2s | Met |
| Bundle (gzipped) | <300KB | Met (~200KB) |

See [Performance & Scaling](./performance-scaling.md) for detailed analysis.

---

## Security Posture

| Concern | Mitigation |
|---------|-----------|
| API key storage | localStorage (v0.1.0) → platform keychain (v1.0) |
| Audio data persistence | Never saved; transcripts only |
| WebSocket hijacking | TLS 1.3 only (wss://) |
| Tauri IPC injection | Type-safe Rust commands; no shell execution |

See [Security Architecture](./security-architecture.md) for detailed strategy.

---

## Next Steps

1. **Understanding audio flow?** → [Audio Pipeline](./audio-pipeline.md)
2. **Implementing multi-provider?** → [Soniox Provider](./soniox-provider.md)
3. **Debugging connection issues?** → [Connection Resilience](./connection-resilience.md)
4. **Optimizing performance?** → [Performance & Scaling](./performance-scaling.md)
5. **Securing API keys?** → [Security Architecture](./security-architecture.md)

---

## References

- [Codebase Summary](../codebase-summary.md) — Module breakdown
- [Code Standards](../code-standards.md) — Coding conventions
- [System Architecture Index](./index.md) — All architecture docs
