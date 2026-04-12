# Translation Assistant

A cross-platform desktop and mobile app for real-time speech-to-text translation powered by Soniox WebSocket API. Built with Tauri v2, React 18, and TypeScript.

**Version**: 0.1.0  
**App ID**: `com.ngoviethung.translation-assistant.app`  
**Platforms**: macOS, Windows, Linux, iOS, Android

---

## Features

- **Real-time STT Translation** — Live speech-to-text using Soniox WebSocket API with streaming token display
- **Audio Capture** — AudioWorklet-based mic capture (16kHz, s16le) with ScriptProcessorNode fallback
- **TTS Voice Output** — Web Speech API integration with intelligent queue management
- **Transcript Management** — Atomic file writes to disk; list and view historical transcripts
- **15+ Languages** — Source and target language selection with mutual exclusion (source ≠ target)
- **Output Modes** — Text-only or TTS voice delivery
- **Connection Resilience** — Exponential backoff reconnection, pre-emptive stream reset before 300min limit, chunk buffering during reconnects
- **Theme System** — Light/dark mode with localStorage persistence; respects `prefers-color-scheme`
- **Mobile-optimized UI** — 44×44px touch targets, safe-area awareness, bottom sheet settings panel
- **Accessibility** — ARIA labels, keyboard navigation, semantic HTML

---

## Quick Start

### Prerequisites

- **Node.js** 16+ and npm/yarn
- **Rust** 1.70+ (for Tauri backend)
- **Tauri CLI** 2.x: `npm install -g @tauri-apps/cli@next`

### Installation

```bash
cd /Users/ngoviethung/SourceCode/only-me/translation-assistant
npm install
```

### Development

```bash
npm run dev
```

Starts Vite dev server on port 1420 and opens Tauri window. Hot-reload enabled.

### Build

```bash
npm run build
```

Compiles TypeScript, bundles React app via Vite, packages for all target platforms.

### Platform-Specific Builds

```bash
npm run tauri build -- --target universal-apple-darwin  # macOS universal
npm run tauri build -- --target x86_64-pc-windows-msvc   # Windows
npm run tauri build -- --target x86_64-unknown-linux-gnu  # Linux
```

---

## Configuration

### Environment Variables

Create `.env.local` in the project root (not committed to git):

```env
SONIOX_API_KEY=your-api-key-here
```

**Note**: The app also supports in-app API key entry via Settings panel, stored in secure localStorage.

### Tauri Config

Location: `src-tauri/tauri.conf.json`

Key settings:
- **Window**: 800×600 fixed size
- **CSP**: Disabled (`null`) for AudioWorklet and Web Audio API
- **Capabilities**: `core:default` only
- **Build target**: Configurable per platform

---

## Architecture

### Audio Pipeline

```
Microphone (getUserMedia)
  ↓
PCM AudioWorklet (16kHz, s16le, 100ms chunks)
  ↓
Soniox WebSocket Client (real-time streaming)
  ↓
Session Store (Zustand)
  ↓
UI + TTS Output + Transcript Write
```

### State Management

- **SessionStore** (ephemeral): Recording status, WebSocket connection state, interim/final tokens, errors. Resets on recording stop.
- **SettingsStore** (persistent): Languages, output mode, API key. Survives app restart via `localStorage`.

### Provider Pattern

Abstracted `STTProvider` interface allows future multi-provider support (currently Soniox only). Token callbacks decouple provider lifecycle from React components.

### Tauri Backend (Rust 2021)

Two commands:
1. `write_transcript(filename: string, content: string)` — Atomic file write to `~/Documents/TranslationAssistant/`
2. `list_transcripts()` — Returns metadata array (filename, size, created, modified) sorted newest-first

---

## Project Structure

```
translation-assistant/
├── src/                           # React frontend (TypeScript)
│   ├── audio/                     # Audio capture and TTS
│   ├── components/                # React components (Controls, Settings, UI)
│   ├── hooks/                     # Custom React hooks
│   ├── providers/                 # STT provider abstraction (Soniox)
│   ├── store/                     # Zustand stores (Session, Settings)
│   ├── tauri/                     # Tauri IPC wrappers
│   ├── theme/                     # Theme system
│   ├── App.tsx                    # Root component
│   └── main.tsx                   # Bootstrap + error boundary
├── src-tauri/                     # Tauri backend (Rust)
│   ├── src/
│   │   ├── main.rs                # Entry point
│   │   ├── lib.rs                 # App init + command registration
│   │   └── commands/              # Transcript I/O commands
│   ├── tauri.conf.json            # Platform config
│   └── Cargo.toml                 # Rust dependencies
├── docs/                          # Documentation
│   ├── design-system/             # Design system docs
│   ├── project-overview-pdr.md    # Product requirements
│   ├── codebase-summary.md        # File-by-file reference
│   ├── code-standards.md          # Coding conventions
│   ├── system-architecture.md     # Architecture deep-dive
│   └── project-roadmap.md         # Release roadmap
├── plans/                         # Implementation plans (historical)
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## Documentation

- **[Project Overview & PDR](./docs/project-overview-pdr.md)** — Product vision, user personas, goals, non-functional requirements
- **[Codebase Summary](./docs/codebase-summary.md)** — Quick reference of all modules
- **[Code Standards](./docs/code-standards.md)** — Naming, file size, patterns, state management, error handling
- **[System Architecture](./docs/system-architecture.md)** — Detailed architecture, data flow, connection resilience
- **[Design System](./docs/design-system/design-principles.md)** — Theme tokens, layout, typography, animations
- **[Project Roadmap](./docs/project-roadmap.md)** — Current status, planned features, release schedule

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.6.2 | Type safety |
| Tauri | 2.x | Desktop/mobile runtime |
| Zustand | 5.0.12 | State management |
| Tailwind CSS | 3.4.19 | Styling |
| Vite | 6.0.3 | Build tool |

---

## API Integration

### Soniox WebSocket

The app connects to Soniox real-time streaming API:

```typescript
wss://api.soniox.com/v1/listen
```

**Authentication**: Bearer token in WebSocket handshake  
**Streaming**: Sends 16-bit signed PCM audio (16kHz) in 100ms chunks  
**Response**: JSON tokens with interim and final transcriptions in real-time

See [Soniox Provider Documentation](./docs/system-architecture.md#soniox-provider) for connection details.

---

## Development Workflow

### Adding a Feature

1. Update relevant store (Zustand) if state needed
2. Create/update components in `src/components/`
3. Add Rust command in `src-tauri/src/commands/` if file I/O needed
4. Update documentation in `docs/`

### Running Tests

Currently no automated tests. Refer to [Code Standards](./docs/code-standards.md#testing) for manual QA checklist.

### Pre-commit Checks

- TypeScript compilation: `npm run build`
- No console errors in dev mode
- Design system colors tested in both light/dark themes

---

## Security

- **API Keys**: Stored in secure localStorage; consider Tauri `keychain` plugin for production
- **Audio Data**: Not persisted beyond current session (transcripts save as text only)
- **Transcripts**: Saved to local disk only; no cloud sync
- **CSP**: Disabled (`null`) to allow AudioWorklet and WebAudio; served from Tauri only

---

## Performance

- **Audio Capture**: AudioWorklet (non-blocking) with 100ms chunk size
- **WebSocket**: Persistent connection with exponential backoff (2^n, max 30s)
- **Rendering**: React lazy + Zustand for fine-grained reactivity
- **Bundle Size**: ~200KB gzipped (React + Zustand + UI)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Microphone permission denied | Grant in OS settings; reload app |
| WebSocket connection fails | Check API key; verify network connectivity |
| TTS not playing | Enable audio output; check browser speaker permissions |
| Theme not persisting | Check localStorage support in browser |

---

## Support

For bugs, feature requests, or questions:
- Check [Project Roadmap](./docs/project-roadmap.md) for planned features
- Refer to [System Architecture](./docs/system-architecture.md) for technical details
- See [Code Standards](./docs/code-standards.md) for development guidelines

---

## License

Copyright 2026 Ngo Viet Hung. All rights reserved.
