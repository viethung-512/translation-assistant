# Brainstorm Report: AI Mobile Translator App

**Date:** 2026-04-09  
**Status:** Agreed — proceeding to plan

---

## Problem Statement

Build a cross-platform (mobile + desktop) AI translator app. User attends meetings (online/offline), app listens via mic and translates speech in real-time to selected language. V1 supports Soniox provider only.

---

## Requirements

- **Platform:** Tauri v2 (React + Rust) — iOS, Android, Desktop
- **Audio flow:** Device mic → Soniox WebSocket → real-time STT + translation
- **Output:** Text display (default) or TTS — user selects; both auto-save transcript
- **API key:** User enters own Soniox key, stored in Tauri secure storage
- **Provider architecture:** Interface-based, V1 = Soniox only

---

## Soniox API (validated)

- **WebSocket:** `wss://stt-rt.soniox.com/transcribe-websocket`
- **Model:** `stt-rt-preview`
- **Config:** `api_key` + `translation: { type: "one_way", target_language: "<code>" }`
- **Audio:** PCM s16le, 16kHz, 1 channel (or `"auto"`)
- **Tokens:** `text`, `is_final`, `translation_status`, `start_ms/end_ms`
- **Limits:** 300 min/stream, 60+ languages, any translation pair

---

## Architecture

```
Device Mic (getUserMedia)
  → AudioWorklet (PCM s16le, 16kHz, mono, ~100ms chunks)
  → SonioxProvider (WebSocket)
  → Token stream
  → SessionStore (Zustand)
  → TranslationDisplay (subtitle) + TTSService (Web Speech API)
  → TranscriptWriter (Tauri FS command)
```

Tauri Rust backend handles:
- Secure API key storage (Tauri stronghold or OS keychain)
- File system: write/list transcript files

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Tauri v2 | Keep scaffold, WebView audio works on iOS 14.3+ / Android |
| Audio API | AudioWorklet + ScriptProcessorNode fallback | Modern, off-main-thread, fallback for old WebViews |
| STT + Translation | Soniox single WebSocket | One call, low latency, 60+ languages |
| TTS | Web Speech API | Free, built-in, zero cost, works in WebView |
| API key storage | Tauri secure storage | Never exposed in JS/WebView memory |
| State management | Zustand | Lightweight, fits streaming token updates |
| Provider pattern | Interface-based | Easy to add Deepgram/Google in future |

---

## Folder Structure

```
src/
├── providers/
│   ├── types.ts                 # STTProvider interface + shared types
│   └── soniox/
│       ├── soniox-client.ts     # WebSocket + Soniox protocol
│       └── soniox-types.ts      # Token, config types
├── audio/
│   ├── audio-capture.ts         # getUserMedia + AudioContext setup
│   ├── pcm-worklet.ts           # AudioWorklet processor code
│   └── tts-service.ts           # Web Speech API wrapper
├── store/
│   ├── session-store.ts         # Recording state, tokens, transcript
│   └── settings-store.ts        # API key, languages, output mode
├── components/
│   ├── TranslationDisplay/      # Subtitle view, token rendering
│   ├── Controls/                # Record button, mode toggle
│   └── Settings/                # API key input, language picker
└── tauri/
    ├── secure-storage.ts        # Tauri invoke wrappers for API key
    └── transcript-fs.ts         # File write/list via Tauri FS
```

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| iOS WebView mic on background | High | Show warning banner; iOS limitation |
| Network drop mid-session | Medium | Exponential backoff reconnect, preserve transcript |
| AudioWorklet unavailable | Low | ScriptProcessorNode fallback |
| Soniox 300-min limit | Low | Auto-reconnect at 280 min |
| TTS lag | Medium | Queue TTS, drop stale items if queue > 3s |

---

## Success Criteria

- App captures mic and streams to Soniox with < 500ms first-token latency
- Translated text appears in real-time alongside original transcript
- TTS mode speaks translated text without audio overlap
- Session transcript auto-saved to device filesystem on stop
- API key survives app restart (secure storage)
- Works on iOS 14.3+, Android 9+, and desktop

---

## Next Steps

→ Create detailed phased implementation plan via `/plan`
