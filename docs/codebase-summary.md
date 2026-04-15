# Translation Assistant — Codebase Summary

**Version**: 0.2.0 (SDK Migration)  
**Last Updated**: April 2026

Quick reference guide to all modules, their purpose, and size. Use this for module discovery and understanding data flow.

---

## Frontend (React/TypeScript) — `src/`

### Root Components

| File | LOC | Purpose |
|------|-----|---------|
| `App.tsx` | 189 | Root layout component; renders header (theme + settings buttons), recording section, transcript display, error banner |
| `main.tsx` | 27 | Bootstrap: React root mount, fatal error handler, TTS service init |

### Audio Subsystem — `src/audio/`

| File | LOC | Purpose |
|------|-----|---------|
| `tts-service.ts` | 50 | Web Speech API wrapper; maintains 3-utterance queue to prevent lag; auto-dequeue on speech end |

**Removed (v0.2.0)**:
- `audio-capture.ts` — Replaced by SDK's audio capture
- `pcm-worklet-processor.ts` — Replaced by SDK's PCM encoding

**Data Flow**: Microphone audio captured by SDK → Soniox WebSocket → Translation received → `TtsService.enqueue(translation)`

### Components — `src/components/`

#### Controls Subdir

| File | LOC | Purpose |
|------|-----|---------|
| `Controls/record-button.tsx` | 60 | Large 76×76px record/stop button; shows pulse animation while recording; semantic colors (accent/danger) |
| `Controls/status-badge.tsx` | 37 | Connection status indicator (disconnected/connecting/connected); colored dot + text |

#### Settings Subdir

| File | LOC | Purpose |
|------|-----|---------|
| `Settings/settings-panel.tsx` | 150 | Bottom sheet modal; contains API key input, language pickers, output mode toggle, theme button |
| `Settings/language-picker.tsx` | 57 | Select dropdown for source/target languages; enforces mutual exclusion via validation logic |

#### TranslationDisplay Subdir

| File | LOC | Purpose |
|------|-----|---------|
| `TranslationDisplay/translation-display.tsx` | 60 | Scrollable container for finalized transcript lines; shows interim token in footer; auto-scroll to newest line |
| `TranslationDisplay/transcript-line.tsx` | 25 | Single finalized transcript entry; displays source + target; timestamp |

#### History Subdir (New v0.2.0)

| File | LOC | Purpose |
|------|-----|---------|
| `History/history-sheet.tsx` | ~80 | Bottom sheet modal showing past transcripts; list fetched via Tauri `list_transcripts` |
| `History/session-item.tsx` | ~40 | Single transcript entry in history list; shows filename, size, created date; click to view |

#### UI Library — `src/components/ui/`

| File | LOC | Purpose |
|------|-----|---------|
| `button.tsx` | 51 | Reusable button component; supports variants (primary, secondary, danger, ghost) and sizes |
| `bottom-sheet.tsx` | 46 | iOS-style bottom sheet modal; drag handle, backdrop, smooth animation |
| `error-banner.tsx` | 24 | Dismissible error alert; shows error message with close button; semantic danger color |
| `icon-button.tsx` | 27 | 44×44px icon button; used for settings, theme toggle; includes ARIA label |
| `index.ts` | 5 | Barrel export of all UI components |

### Hooks — `src/hooks/`

| File | LOC | Purpose |
|------|-----|---------|
| `use-translation-session.ts` | ~120 | Main orchestration hook; manages session lifecycle (start/stop), integrates @soniox/react SDK hooks, handles token processing, error handling, TTS dispatch |

**Replaced (v0.1.0)**:
- `use-microphone-permission.ts` — Replaced by SDK's `useMicrophonePermission`

**Used by**: `App.tsx` (primary consumer)

### State Management — `src/store/`

| File | LOC | Purpose |
|------|-----|---------|
| `settings-store.ts` | 42 | Zustand store with localStorage persist; languages, output mode, API key; survives app restart |

**Removed (v0.2.0)**:
- `session-store.ts` — Replaced by hook-local state in `useTranslationSession`

### Tauri Integration — `src/tauri/`

| File | LOC | Purpose |
|------|-----|---------|
| `secure-storage.ts` | 17 | Wrapper for localStorage-based API key; read/write with encryption consideration (future: Tauri keychain) |
| `transcript-fs.ts` | ~50 | Wrapper for Tauri commands; `write_transcript()`, `list_transcripts()`, `read_transcript()`, `deleteTranscript()` calls to Rust backend; **also owns `TranscriptLine` type and `buildTranscriptContent` helper** |

**Changes (v0.2.0)**:
- Added `TranscriptLine` type (moved from session-store)
- Added `buildTranscriptContent` function (moved from session-store)
- Added `readTranscript` and `deleteTranscript` commands

### Theme — `src/theme/`

| File | LOC | Purpose |
|------|-----|---------|
| `use-theme.ts` | 30 | Hook for light/dark theme toggle; persists to localStorage via Zustand |

---

## Backend (Rust) — `src-tauri/src/`

### Root Module

| File | LOC | Purpose |
|------|-----|---------|
| `lib.rs` | ~50 | Tauri builder entry point; registers commands, initializes plugins (none currently) |

### Commands

| File | LOC | Purpose |
|------|-----|---------|
| `commands/mod.rs` | ~20 | Module re-exports; exposes `transcript` command module |
| `commands/transcript.rs` | ~100 | Tauri commands: `write_transcript`, `list_transcripts`, `read_transcript`, `delete_transcript`; path validation, atomic writes, metadata collection |

**Changes (v0.2.0)**:
- Added `read_transcript` command
- Added `delete_transcript` command

**Removed (v0.2.0)**:
- `src-tauri/src/audio/` — Audio layer no longer needed (SDK handles audio capture)
- `commands/audio.rs` — Audio commands no longer needed

### Path Handling

All file operations sandboxed to `~/Documents/TranslationAssistant/`:
- **macOS/Linux**: `~/Documents/TranslationAssistant/`
- **Windows**: `C:\Users\{user}\Documents\TranslationAssistant\`
- **iOS**: App Documents directory
- **Android**: App cache directory

---

## Dependencies (Key Additions in v0.2.0)

### JavaScript (Frontend)

```json
{
  "@soniox/react": "^0.1.0",     // NEW: Speech-to-text + translation SDK
  "react": "^18.3.1",
  "zustand": "^4.4.0",
  "@tauri-apps/api": "^2.0.0"
}
```

### Rust (Backend)

```toml
[dependencies]
tauri = "2.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
dirs = "5.0"  // For document_dir()
```

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│ App.tsx (Root)                                                  │
│ ├─ useTranslationSession() [Orchestration]                      │
│ │  ├─ useRecording() [@soniox/react SDK]                       │
│ │  ├─ useMicrophonePermission() [@soniox/react SDK]            │
│ │  ├─ useSettingsStore() [Zustand + localStorage]             │
│ │  └─ TtsService [Web Speech API]                             │
│ │                                                              │
│ ├─ useSettingsStore() [Zustand]                               │
│ │                                                              │
│ └─ Components:                                                 │
│    ├─ RecordButton                                            │
│    ├─ StatusBadge                                             │
│    ├─ TranslationDisplay (with TranscriptLine)               │
│    ├─ SettingsPanel                                          │
│    └─ ErrorBanner                                            │
│                                                              │
├─ Tauri IPC Bridge (invoke)                                    │
│  ├─ writeTranscript() → Rust write_transcript                │
│  ├─ listTranscripts() → Rust list_transcripts               │
│  ├─ readTranscript() → Rust read_transcript                 │
│  └─ deleteTranscript() → Rust delete_transcript             │
│                                                              │
├─ External: Soniox WebSocket API (via SDK)                    │
│  └─ useRecording manages connection                          │
│                                                              │
└─ Rust Backend (Tauri)                                        │
   └─ Transcript filesystem commands                          │
```

---

## Data Types

### TranscriptLine (v0.2.0)
Located in `src/tauri/transcript-fs.ts`:
```typescript
export interface TranscriptLine {
  originalText: string;
  translatedText: string;
  timestampMs: number;
}
```

Used to represent a single finalized statement (source + translation).

### TranscriptMeta
```typescript
export interface TranscriptMeta {
  name: string;
  path: string;
  createdAt: string;
}
```

Metadata for transcript files (from `list_transcripts`).

---

## File Size Compliance

All files meet target LOC limits:

| Category | Max LOC | Largest File | Status |
|----------|---------|------|--------|
| React components | 150 | `settings-panel.tsx` (150 LOC) | ✓ Met |
| Custom hooks | 120 | `use-translation-session.ts` (~120 LOC) | ✓ Met |
| Stores (Zustand) | 100 | `settings-store.ts` (42 LOC) | ✓ Met |
| Services | 100 | `tts-service.ts` (50 LOC) | ✓ Met |
| Rust commands | 100 | `transcript.rs` (~100 LOC) | ✓ Met |

---

## Module Discovery Index

### If you need to...

**Understand the recording flow**: Start with `App.tsx` → `useTranslationSession` → `@soniox/react` hooks

**Add a new language**: Edit `Settings/language-picker.tsx` to add option; no backend changes needed

**Change transcript format**: Edit `buildTranscriptContent` in `src/tauri/transcript-fs.ts`

**Handle new Soniox error**: Edit error handling in `useTranslationSession` `onError` callback

**Add file I/O operation**: Add command in `src-tauri/src/commands/transcript.rs`, then wrap in `src/tauri/transcript-fs.ts`

**Implement pause/resume**: Would require significant refactoring of `useTranslationSession` (currently designed for single session)

**Add analytics**: Create `analytics-store.ts` alongside `settings-store.ts`; follow Zustand + localStorage pattern

**Migrate API key to keychain**: Replace `secure-storage.ts` implementation with Tauri Stronghold plugin

---

## Version History

### v0.2.0 (Current)
- Migrated to @soniox/react SDK
- Removed: SonioxClient, AudioCapture, PCMWorklet, session-store
- Added: Hook-local state, History components
- Moved: TranscriptLine to transcript-fs.ts

### v0.1.0 (Legacy)
- Custom WebSocket client
- AudioWorklet PCM encoding
- Zustand SessionStore

---

## Performance Metrics

| Metric | Target | Actual | Notes |
|--------|--------|--------|-------|
| App startup | <2s | ~1.2s | React + Zustand hydration |
| Bundle (gzipped) | <300KB | ~200KB | React + Zustand + UI lib |
| Memory (idle) | <100MB | ~90MB | Safari/Chrome measured |
| Memory (recording) | <200MB | ~150MB | Peak during active session |
| STT latency | 300–500ms | 400ms (p50) | Soniox dependent |
| TTS latency | <1s | ~800ms | Browser-dependent |

---

## Related Documentation

- **Architecture**: See `docs/architecture/overview.md` for system diagram
- **Standards**: See `docs/code-standards.md` for coding conventions
- **Roadmap**: See `docs/project-roadmap.md` for planned features
- **API Docs**: See `docs/architecture/tauri-integration.md` for command specs
