# Architecture Overview

**Version**: 0.2.0 (SDK Migration + UI v2 Wireframe)  
**Last Updated**: April 20, 2026

System architecture diagram and high-level component breakdown. Migrated from hand-rolled WebSocket client and custom audio capture to @soniox/react SDK. Added static wireframe UI v2 under `src/v2/` with env-flag switching.

---

## UI Versions

| Version | Path      | Purpose                                  | Status    |
| ------- | --------- | ---------------------------------------- | --------- |
| **v1**  | `src/`    | Production app (real Soniox integration) | Active    |
| **v2**  | `src/v2/` | Static wireframe (6-screen preview)      | Wireframe |

**Switching**: Set `VITE_UI_VERSION=v2` in `.env.local`. Default is v1 (tree-shaken from v1 builds).

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
│  │ Orchestration Hook & State Management                   │   │
│  │ ├─ useTranslationSession (session lifecycle)            │   │
│  │ ├─ Hook-local state (finalLines, interimOriginal, etc)  │   │
│  │ └─ SettingsStore (persistent: API key, languages)       │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ @soniox/react SDK (Managed STT + Audio)                │   │
│  │ ├─ useRecording (WebSocket, audio capture, PCM encode) │   │
│  │ ├─ useMicrophonePermission (mic access handling)        │   │
│  │ └─ Handles reconnection & buffering internally          │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ TTS Service                                              │   │
│  │ └─ TTSService (Web Speech API queue)                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Tauri IPC Bridge                                         │   │
│  │ └─ Transcript I/O (write_transcript, list_transcripts)  │   │
│  └──────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    Tauri Backend (Rust 2021)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Commands (transcript.rs)                                │
│  │ ├─ write_transcript(filename, content) → atomic write   │   │
│  │ └─ list_transcripts() → metadata array                  │   │
│  └──────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      External Services                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Soniox WebSocket API (via @soniox/react SDK)            │   │
│  │ └─ Real-time STT + translation (WebSocket managed)      │   │
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
- `useTranslationSession` — Orchestration hook (manages SDK hooks + state)

**Responsibilities**:

- Render UI based on hook state + SettingsStore
- Dispatch user actions (record, stop, select language)
- Display real-time tokens and errors
- Trigger transcript save on recording end

---

### 2. State Management

**Purpose**: Manage application state across component tree

#### Hook-Local State (Ephemeral)

- **Lifetime**: Resets when recording stops
- **Location**: `useTranslationSession` hook
- **Contents**: finalLines, interimOriginal, interimTranslated
- **Used by**: Hook itself; exposed via return object to App

#### SettingsStore (Persistent via Zustand)

- **Lifetime**: Survives app restart via localStorage
- **Contents**: API key, language pair, output mode
- **Used by**: App initialization, settings panel, SDK setup

See [State Management](./state-management.md) for detailed design.

---

### 3. Audio & STT (Soniox SDK)

**Purpose**: Capture mic input, send PCM to Soniox, receive transcription + translation

**Components**:

- `useRecording` hook — Manages WebSocket connection, audio capture, PCM encoding, token callbacks (from @soniox/react)
- `useMicrophonePermission` hook — Handles mic permission UI/logic (from @soniox/react)
- `TTSService` — Queues translated text for voice synthesis (Web Speech API)

**Previous Custom Implementations (Removed)**:

- `AudioCapture` — Replaced by SDK's getUserMedia integration
- `PCMWorklet` — Replaced by SDK's PCM encoding
- `SonioxClient` — Replaced by SDK's WebSocket management

See [Audio Pipeline](./audio-pipeline.md) for detailed flow.

---

### 4. Tauri IPC Bridge

**Purpose**: Communicate with Rust backend for file I/O

**Commands**:

- `write_transcript(filename, content)` — Save transcript to disk
- `list_transcripts()` — Fetch transcript metadata

See [Tauri Integration](./tauri-integration.md) for command details.

---

### 5. Rust Backend

**Purpose**: File I/O operations (Tauri sandboxing layer)

**Modules**:

- `commands/transcript.rs` — Implements write_transcript + list_transcripts
- Handles path validation, directory creation, error reporting

**Removed**:

- `src-tauri/src/audio/` — No longer needed (SDK handles audio capture)

See [Tauri Integration](./tauri-integration.md) for implementation.

---

## Data Flow (Recording Session)

```
┌─────────────────────────────────────────────────────────────────┐
│ User clicks "Record"                                            │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ useTranslationSession.startRecording()                          │
│ ├─ Configure useRecording (languages, apiKey)                  │
│ └─ Configure useMicrophonePermission                           │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ SDK requests mic permission (handled by useMicrophonePermission)│
│ → User grants access → SDK starts audio capture                │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ SDK (useRecording) opens WebSocket to Soniox API               │
│ → Establishes connection, sends auth + config                 │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Hook state updates: { recordingStatus: 'recording', ... }      │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ SDK encodes microphone audio to PCM 16kHz mono (internal)      │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ SDK sends PCM chunks via WebSocket                             │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Soniox responds with interim/final transcription + translation │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ SDK callback (onResult) fires with result object               │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ useTranslationSession handler:                                  │
│ ├─ Update interimOriginal / interimTranslated (interim)        │
│ ├─ On final: create TranscriptLine, add to finalLines          │
│ └─ Trigger TtsService.enqueue(translation) if TTS enabled     │
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
│ useTranslationSession.stopRecording()                           │
│ ├─ SDK closes WebSocket & stops audio capture                  │
│ ├─ Build transcript content from finalLines                    │
│ └─ writeTranscript(filename, content)                          │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Tauri invoke('write_transcript', ...)                           │
│ → Rust backend atomically writes to ~/Documents/...            │
└──────────────────────┬──────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Hook state resets: finalLines[], interimOriginal = ''          │
│ → App ready for next recording                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Abstractions

### Removed: STTProvider Interface

**Old Design** (v0.1.0): Pluggable `STTProvider` interface allowed swapping Soniox for Google Cloud, AWS, etc.

**Current State** (v0.2.0): Soniox SDK now directly used via `useRecording` hook. Multi-provider support deferred to future release. If multi-provider support becomes needed, consider:

- Wrapper hooks (`useSonioxRecording`, `useGoogleRecording`) per provider
- Conditional hook instantiation based on settings
- Unified result type for token callbacks

---

## Design Decisions

### Why @soniox/react SDK (v0.2.0)?

- **Simplicity**: Reduces codebase by ~400 LOC (removed AudioCapture, PCMWorklet, SonioxClient)
- **Reliability**: SDK handles reconnection, chunk buffering, PCM encoding (battle-tested)
- **Maintenance**: No custom audio worklet or WebSocket code to maintain
- **Mobile Support**: SDK optimized for iOS/Android (Tauri constraint removed)

### Why Hook-Local State (not Zustand SessionStore)?

- **Simpler**: No store boilerplate; state lives where it's used
- **Sufficient**: Recording is single-instance; no concurrent sessions
- **Clear Ownership**: useTranslationSession clearly owns session lifecycle
- **Note**: If complex session features needed (e.g., pause/resume), migrate to store

### Why Zustand for Settings (not localStorage directly)?

- **Reactivity**: Selectors trigger re-renders on relevant changes only
- **Persistence**: Built-in `persist` middleware
- **Type Safety**: Full TypeScript support
- **Future**: Easy migration to Tauri Keychain (v1.0)

### Why Tauri (not Electron)?

- Lightweight binary (~150MB vs Electron ~200MB+)
- Built-in Rust backend for file I/O
- Better mobile support (iOS, Android)
- Security-focused (minimal permissions)

---

## Deployment Architecture

### Build Targets

| Platform | Target                   | Bundle Size | Runtime |
| -------- | ------------------------ | ----------- | ------- |
| macOS    | universal-apple-darwin   | ~150MB      | Native  |
| Windows  | x86_64-pc-windows-msvc   | ~120MB      | Native  |
| Linux    | x86_64-unknown-linux-gnu | ~110MB      | Native  |
| iOS      | aarch64-apple-ios        | ~80MB       | Native  |
| Android  | aarch64-linux-android    | ~90MB       | Native  |

All targets share same React/TypeScript frontend code.

---

## Performance Targets

| Metric             | Target    | Status                 |
| ------------------ | --------- | ---------------------- |
| STT latency        | 300–500ms | Met (Soniox dependent) |
| Memory (idle)      | <100MB    | Met (~90MB)            |
| Memory (recording) | <200MB    | Met (~100–200MB peak)  |
| Startup time       | <2s       | Met                    |
| Bundle (gzipped)   | <300KB    | Met (~200KB)           |

See [Performance & Scaling](./performance-scaling.md) for detailed analysis.

---

## Security Posture

| Concern                | Mitigation                                       |
| ---------------------- | ------------------------------------------------ |
| API key storage        | localStorage (v0.2.0) → platform keychain (v1.0) |
| Audio data persistence | Never saved; transcripts only                    |
| WebSocket hijacking    | TLS 1.3 only (wss://, managed by SDK)            |
| Tauri IPC injection    | Type-safe Rust commands; no shell execution      |

See [Security Architecture](./security-architecture.md) for detailed strategy.

---

## Migration Notes (v0.1 → v0.2)

**What Changed**:

- Removed: `src/providers/`, `src/audio/audio-capture.ts`, `src/audio/pcm-worklet-processor.ts`, `src/hooks/use-microphone-permission.ts`, `src/store/session-store.ts`
- Removed: `src-tauri/src/audio/`, `src-tauri/src/commands/audio.rs`
- Replaced: Custom WebSocket → SDK `useRecording` hook
- Replaced: Zustand SessionStore → Hook-local state
- Moved: `TranscriptLine` type & `buildTranscriptContent` → `src/tauri/transcript-fs.ts`

**What's the Same**:

- UI components unchanged
- SettingsStore unchanged
- Tauri transcript I/O unchanged
- TTS service unchanged
- File format unchanged

**Compatibility**: Full backward compatibility with existing transcripts on disk.

---

## Next Steps

1. **Understanding audio flow?** → [Audio Pipeline](./audio-pipeline.md)
2. **How state works now?** → [State Management](./state-management.md)
3. **Debugging connection issues?** → [Connection Resilience](./connection-resilience.md)
4. **Optimizing performance?** → [Performance & Scaling](./performance-scaling.md)
5. **Securing API keys?** → [Security Architecture](./security-architecture.md)

---

## References

- [Codebase Summary](../codebase-summary.md) — Module breakdown
- [Code Standards](../code-standards.md) — Coding conventions
- [System Architecture Index](./index.md) — All architecture docs
- [@soniox/react SDK Docs](https://github.com/soniox/soniox-sdk-js) — Official SDK reference
