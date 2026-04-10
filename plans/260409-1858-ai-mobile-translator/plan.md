---
title: "AI Mobile Translator App — V1"
description: "Real-time streaming speech translation via Soniox, cross-platform Tauri v2 app (iOS/Android/Desktop)"
status: pending
priority: P1
effort: 19h
issue:
branch: main
tags: [feature, frontend, backend, audio, mobile]
created: 2026-04-09
---

# AI Mobile Translator App — V1

## Overview

Cross-platform real-time translator: captures mic audio, streams to Soniox WebSocket (STT + translation in one call), displays translated subtitles and/or speaks them via TTS. Auto-saves full session transcript.

**Stack:** Tauri v2 · React + TypeScript · Zustand · Web Audio API · Web Speech API · Rust backend

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Project Setup & Dependencies | Complete | 2h | [phase-01](./phase-01-project-setup.md) |
| 2 | Tauri Backend (Storage + FS) | Complete | 2h | [phase-02](./phase-02-tauri-backend.md) |
| 3 | Audio Capture Layer | Complete | 3h | [phase-03](./phase-03-audio-capture.md) |
| 4 | Soniox Provider | Complete | 3h | [phase-04](./phase-04-soniox-provider.md) |
| 5 | State Management | Complete | 1.5h | [phase-05](./phase-05-state-management.md) |
| 6 | TTS Service | Complete | 1h | [phase-06](./phase-06-tts-service.md) |
| 7 | UI Components | Complete | 4h | [phase-07](./phase-07-ui-components.md) |
| 8 | Integration & Wiring | Complete | 2.5h | [phase-08](./phase-08-integration.md) |

**Total: ~19h**

## Key Dependencies

- `tauri-plugin-stronghold` — encrypted API key storage (Rust)
- `tauri-plugin-fs` — transcript file write
- `zustand` — client state
- Soniox WebSocket API (`wss://stt-rt.soniox.com/transcribe-websocket`)
- Web Audio API (AudioWorklet + getUserMedia)
- Web Speech API (speechSynthesis)

## Architecture Summary

```
Mic → AudioWorklet (PCM s16le 16kHz) → SonioxClient (WS)
                                              ↓
                                       SessionStore (Zustand)
                                         ↙        ↘
                              TranslationDisplay   TTSService
                                                      ↓
                                              Web Speech API
                              TranscriptWriter (Tauri FS)
```

## Brainstorm Reference

`plans/reports/brainstorm-260409-1858-ai-mobile-translator.md`
