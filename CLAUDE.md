# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend dev server only
npm run dev

# Desktop dev (Rust + frontend hot-reload)
npm run tauri dev

# iOS dev on physical device (Tauri sets TAURI_DEV_HOST automatically)
npm run tauri ios dev

# iOS release build
npm run tauri ios build

# Type check (no emit)
npx tsc --noEmit

# Rust compile check
cargo check --manifest-path src-tauri/Cargo.toml
```

There are no tests at this time. There is no linter configured beyond TypeScript's own type checking.

## Architecture

This is a **Tauri v2 + React + Rust** app that streams microphone audio to the Soniox WebSocket API for real-time speech-to-text + translation, then displays and optionally speaks the translated text.

### Data flow

```
Mic → AudioCapture → SonioxClient (WebSocket) → SessionStore → TranslationDisplay
                                                             ↘ TtsService (Web Speech API)
```

### Layer breakdown

**Audio layer** (`src/audio/`)

- `audio-capture.ts` — `AudioCapture` class. Uses `AudioWorklet` when available; falls back to deprecated `ScriptProcessorNode` for older WebViews. Emits PCM s16le 16 kHz mono chunks (~100 ms each). The worklet processor file (`pcm-worklet-processor.ts`) is loaded via `new URL('./pcm-worklet-processor.ts', import.meta.url)` — Vite handles bundling it as a separate asset.
- `tts-service.ts` — `TtsService` wraps Web Speech API `SpeechSynthesis`. Drops utterances if queue ≥ 3 to prevent pile-up.

**Provider layer** (`src/providers/`)

- `types.ts` — `STTProvider` interface. All providers implement `connect/sendAudio/disconnect/onToken/onError/onStatus`. Adding a new provider (e.g. Deepgram) only requires implementing this interface.
- `soniox/soniox-client.ts` — WebSocket client with exponential backoff reconnect (1 s → max 30 s), pre-emptive reconnect before the 280-min stream limit, and a pending chunk queue during reconnection.

**State** (`src/store/`)

- `session-store.ts` — Ephemeral per-recording state (reset on each `startSession`). Key logic: original tokens accumulate in `interimOriginal`; when a translated _final_ token arrives, both buffers are committed as a `TranscriptLine` and cleared.
- `settings-store.ts` — Persistent settings (Zustand `persist` → `localStorage`): `sourceLanguage`, `targetLanguage`, `outputMode`. The `apiKey` field is in-memory only (populated from `localStorage` on mount via `getApiKey()`).

**Tauri bridge** (`src/tauri/`)

- `secure-storage.ts` — `saveApiKey / getApiKey / deleteApiKey` backed by `localStorage`.
- `transcript-fs.ts` — Invokes the Rust commands `write_transcript` / `list_transcripts`. Transcripts are saved to `~/Documents/TranslationAssistant/` with ISO timestamp filenames.

**Orchestration** (`src/hooks/use-translation-session.ts`)

- The single hook that wires all four layers. It is the only place that holds references to `AudioCapture`, `SonioxClient`, and `TtsService` simultaneously. `startSession` / `stopSession` are the entry points.

**Rust backend** (`src-tauri/src/`)

- `lib.rs` — Tauri builder entry point. No plugins currently registered.
- `commands/transcript.rs` — Two `#[tauri::command]` functions: `write_transcript` (atomic tmp-then-rename write) and `list_transcripts` (sorted by creation time). Both resolve paths relative to the platform document directory.

### iOS-specific notes

- `NSMicrophoneUsageDescription` is set in `Info.plist` and `project.yml`.
- `index.html` uses `viewport-fit=cover` and a CSS reset (`html, body, #root { height: 100% }`). The root layout uses `height: 100%` (not `100dvh`) for iOS < 15.4 compatibility.
- API key is stored in `localStorage` (not Keychain / Stronghold) — intentional decision to avoid native plugin complexity on mobile.
- Physical device dev builds: run `tauri ios dev` (Tauri CLI sets `TAURI_DEV_HOST` automatically; the Vite server binds to that host).

### Path alias

`@/` maps to `src/` (configured in both `tsconfig.json` and `vite.config.ts`).

## Icon conventions

All SVG icons live in `src/components/icons/index.tsx`. **Before writing any inline `<svg>` element:**

1. Check `components/icons/index.tsx` for an existing icon that fits.
2. Only create a new export there if nothing suitable exists — never define local SVG functions inside component files.
