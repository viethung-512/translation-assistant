# Translation Assistant — Codebase Summary

**Version**: 0.1.0  
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
| `audio-capture.ts` | 112 | Manages microphone access via `getUserMedia`; creates and manages AudioWorklet; emits 100ms PCM chunks via callback |
| `tts-service.ts` | 50 | Web Speech API wrapper; maintains 3-utterance queue to prevent lag; auto-dequeue on speech end |
| `pcm-worklet-processor.ts` | 41 | AudioWorklet processor; converts Float32 samples to signed 16-bit PCM; emits chunks to handler |

**Data Flow**: `getUserMedia` → AudioWorklet → `emit(pcmChunk)` callback → Soniox WebSocket

### Components — `src/components/`

#### Controls Subdir

| File | LOC | Purpose |
|------|-----|---------|
| `Controls/record-button.tsx` | 60 | Large 76×76px record/stop button; shows pulse animation while recording; semantic colors (accent/danger) |
| `Controls/status-badge.tsx` | 37 | Connection status indicator (disconnected/connecting/live/error); colored dot + text |

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
| `use-translation-session.ts` | 112 | Main orchestration hook; manages session lifecycle (start/stop), connection state, token subscriptions, error handling, TTS dispatch |

**Used by**: `App.tsx` (primary consumer)

### State Management — `src/store/`

| File | LOC | Purpose |
|------|-----|---------|
| `session-store.ts` | 100 | Zustand store; ephemeral session state (recording/stopped, connected, interim/final tokens, error); resets on stop |
| `settings-store.ts` | 42 | Zustand store with localStorage persist; languages, output mode, API key; survives app restart |

### Providers (STT Abstraction) — `src/providers/`

| File | LOC | Purpose |
|------|-----|---------|
| `types.ts` | 31 | `STTProvider` interface; token callback signatures; defines contract for swappable providers |

#### Soniox Implementation

| File | LOC | Purpose |
|------|-----|---------|
| `soniox/soniox-client.ts` | 128 | WebSocket client; handles connection, authentication, audio send, response parsing, reconnection with exponential backoff, preemptive reset at 280min |
| `soniox/soniox-types.ts` | 26 | TypeScript types for Soniox API request/response payloads |

### Tauri Integration — `src/tauri/`

| File | LOC | Purpose |
|------|-----|---------|
| `secure-storage.ts` | 17 | Wrapper for localStorage-based API key; read/write with encryption consideration (future: Tauri keychain) |
| `transcript-fs.ts` | 15 | Wrapper for Tauri commands; `write_transcript()` and `list_transcripts()` calls to Rust backend |

### Theme — `src/theme/`

| File | LOC | Purpose |
|------|-----|---------|
| `use-theme.ts` | 28 | Hook to access/toggle theme (light/dark); manages `data-theme` attribute on `<html>`; reads from localStorage |

### Styling

| File | LOC | Purpose |
|------|-----|---------|
| `tailwind.css` | ~50 | Global styles; CSS custom properties for tokens; keyframe animations (pulse-ring, sheet-slide) |

### Configuration

| File | LOC | Purpose |
|------|-----|---------|
| `index.html` | ~30 | Entry point; meta tags, unsafe-inline styles for safe-area insets, root div |
| `vite.config.ts` | ~15 | Vite build config; React plugin, alias (`@/`), port 1420 |
| `tsconfig.json` | ~25 | TypeScript config; ES2020 target, JSX, path alias |
| `tailwind.config.js` | ~20 | Tailwind config; theme tokens (light/dark variants), custom plugins |

---

## Backend (Rust 2021) — `src-tauri/`

### Rust Source — `src-tauri/src/`

| File | LOC | Purpose |
|------|-----|---------|
| `main.rs` | 6 | Entry point; calls builder in `lib.rs` |
| `lib.rs` | 10 | App builder; registers commands; sets up Tauri runtime |

#### Commands — `src-tauri/src/commands/`

| File | LOC | Purpose |
|------|-----|---------|
| `mod.rs` | 1 | Module declaration |
| `transcript.rs` | 77 | Two commands: `write_transcript(filename, content)` → atomic file write to `~/Documents/TranslationAssistant/`; `list_transcripts()` → metadata array sorted newest-first |

### Configuration & Dependencies

| File | Purpose |
|------|---------|
| `Cargo.toml` | Rust dependencies (tauri, serde, tokio); platform-specific features |
| `tauri.conf.json` | App config; window size (800×600), CSP (`null`), capabilities (core:default), platform overrides |
| `capabilities/default.json` | Capability set; grants core commands (write, read filesystem) |

---

## Documentation — `docs/`

| File | Purpose | LOC |
|------|---------|-----|
| `project-overview-pdr.md` | Product vision, user personas, functional/non-functional requirements, roadmap, success metrics | ~450 |
| `codebase-summary.md` | This file; module reference | ~300 |
| `code-standards.md` | Naming conventions, patterns, file size limits, error handling | ~350 |
| `system-architecture.md` | Audio pipeline, state flow, provider pattern, connection resilience | ~400 |
| `project-roadmap.md` | Release timeline, future phases, feature prioritization | ~250 |
| `design-system/design-principles.md` | Theme tokens, responsive layout, typography, accessibility | 138 |

---

## Project Configuration Root

| File | Purpose |
|------|---------|
| `package.json` | npm dependencies; scripts (dev, build, tauri) |
| `README.md` | Quick start, architecture overview, troubleshooting |
| `.env.local` (user-created) | Soniox API key (not committed) |

---

## Data Flow Summary

### Recording Session

```
User clicks "Record"
  ↓
useTranslationSession.start()
  ↓
AudioCapture.start() + SonioxClient.connect()
  ↓
AudioWorklet emits PCM chunks (100ms)
  ↓
SonioxClient sends to WebSocket
  ↓
Soniox responds with tokens (interim + final)
  ↓
SessionStore updates (interim_token, final_tokens)
  ↓
React re-renders (TranslationDisplay, StatusBadge)
  ↓
TTS enqueues finalized lines (if enabled)
  ↓
User clicks "Stop"
  ↓
Tauri writes transcript to ~/Documents/TranslationAssistant/
  ↓
SessionStore resets
```

### Settings Flow

```
User opens Settings (bottom sheet)
  ↓
SettingsStore.getApiKey() → display current value
  ↓
User edits language, output mode, or API key
  ↓
SettingsStore.set() → localStorage persists
  ↓
Settings close; next session uses new settings
```

---

## Key Interfaces

### STTProvider (src/providers/types.ts)

```typescript
interface STTProvider {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(chunk: Int16Array): Promise<void>;
  onInterimToken?: (token: string) => void;
  onFinalToken?: (token: string, translation: string) => void;
  onError?: (error: Error) => void;
  isConnected(): boolean;
}
```

### SessionStore State

```typescript
{
  recording: boolean;
  connected: boolean;
  interimToken: string;
  finalTokens: Array<{ source: string; translation: string; timestamp: Date }>;
  error: Error | null;
  reset(): void;
}
```

### SettingsStore State

```typescript
{
  apiKey: string;
  sourceLang: string;
  targetLang: string;
  outputMode: 'text' | 'tts';
  set(key, value): void;
}
```

---

## Module Statistics

| Layer | Count | Avg LOC | Total LOC |
|-------|-------|---------|-----------|
| React Components | 11 | 50 | 550 |
| Hooks | 1 | 112 | 112 |
| Stores (Zustand) | 2 | 71 | 142 |
| Audio | 3 | 68 | 204 |
| Providers (STT) | 3 | 62 | 186 |
| Tauri Integration | 2 | 16 | 32 |
| Theme | 1 | 28 | 28 |
| **Frontend Total** | **23** | **57** | **1,256** |
| **Rust Backend** | **3** | 31 | **94** |
| **Grand Total** | **26** | **48** | **1,350** |

---

## Dependency Graph (High-Level)

```
App.tsx (root)
  ├── use-translation-session.ts (orchestration)
  │   ├── SessionStore
  │   ├── SettingsStore
  │   ├── AudioCapture
  │   ├── SonioxClient
  │   └── TTSService
  ├── RecordButton.tsx
  ├── StatusBadge.tsx
  ├── TranslationDisplay.tsx
  ├── SettingsPanel.tsx
  │   ├── LanguagePicker.tsx
  │   └── Button.tsx (UI)
  └── ErrorBanner.tsx

SonioxClient
  └── types.ts (STTProvider interface)

AudioCapture
  └── PCMWorkletProcessor.ts

SettingsPanel
  └── SecureStorage.ts

Tauri Commands (Rust)
  ├── write_transcript
  └── list_transcripts
```

---

## File Size Compliance

All files comply with the 200 LOC max-size guideline except:
- `settings-panel.tsx` (150 LOC) — Near limit but cohesive; consider split if more features added
- `use-translation-session.ts` (112 LOC) — Single responsibility; appropriate size

---

## Next Steps for Developers

1. **Understanding the app**: Start with `App.tsx` and `use-translation-session.ts`
2. **Adding a language**: Update Soniox config in `soniox-client.ts`; add to `language-picker.tsx`
3. **Implementing a new provider**: Create `providers/your-provider/` following `STTProvider` interface
4. **Modifying state**: Edit relevant store (`session-store.ts` or `settings-store.ts`)
5. **Styling changes**: Update `tailwind.css` tokens or component classes
6. **File I/O**: Add Rust command in `src-tauri/src/commands/transcript.rs`

---

## Cross-Reference

- Full architecture details: See [System Architecture](./system-architecture.md)
- Coding standards: See [Code Standards](./code-standards.md)
- Design tokens: See [Design System](./design-system/design-principles.md)
