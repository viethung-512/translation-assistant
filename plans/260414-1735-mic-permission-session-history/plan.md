---
title: Mic Permission Fix + Session History
status: pending
created: 2026-04-14
spec: ../reports/brainstorm-260414-1735-session-history.md
---

# Plan: Mic Permission Fix + Session History

## Goal

1. **Fix iOS mic permission** — app doesn't appear in Settings > Privacy > Microphone because `getUserMedia()` in WKWebView bypasses the native AVFoundation permission path. Fix: replace JS audio capture with Rust `cpal`, which uses `AVAudioEngine/AVAudioSession` natively.
2. **Session history** — bottom sheet to browse, copy, share, and delete past transcript sessions.

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Rust cpal mic capture](phase-01-rust-cpal-mic-capture.md) | pending | Medium |
| 2 | [Frontend wiring](phase-02-frontend-wiring.md) | pending | Small |
| 3 | [Transcript read/delete commands](phase-03-transcript-commands.md) | pending | Small |
| 4 | [History UI](phase-04-history-ui.md) | pending | Medium |
| 5 | [Share integration](phase-05-share-integration.md) | pending | Small |

## Dependencies

```
Phase 1 → Phase 2 → (Phase 3, Phase 4 can run in parallel) → Phase 5
```

Phase 1 must be verified on a physical iOS device (confirm app appears in Privacy settings) before Phase 2 wires it to the live recording flow.

## New Dependencies

| Package | Where | Purpose |
|---------|-------|---------|
| `cpal = "0.15"` | `Cargo.toml` | Native mic capture |
| `tauri-plugin-share` | `Cargo.toml` + `package.json` | iOS/macOS share sheet |

## Files Touched

**Create:**
- `src-tauri/src/audio/mod.rs`
- `src-tauri/src/audio/mic_capture.rs`
- `src-tauri/src/commands/audio.rs`
- `src/components/History/history-sheet.tsx`
- `src/components/History/session-item.tsx`

**Modify:**
- `src-tauri/Cargo.toml`
- `src-tauri/src/commands/mod.rs`
- `src-tauri/src/lib.rs`
- `src-tauri/src/commands/transcript.rs`
- `src/tauri/transcript-fs.ts`
- `src/hooks/use-translation-session.ts`
- `src/hooks/use-microphone-permission.ts`
- `src/App.tsx`
- `package.json`
