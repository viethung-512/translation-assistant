# Feature Design Spec — Microphone Permission Fix + Session History

## Problem Statements

**P1 — Broken iOS mic permission:** App doesn't appear in iOS Settings > Privacy > Microphone. Root cause: `getUserMedia()` runs inside Tauri's WKWebView and its permission delegation doesn't reliably register the app with the native AVFoundation/AVAudioSession layer. The app must trigger the permission through the **native audio stack** for iOS to register it.

**P2 — No session history:** Transcripts are silently written to `~/Documents/TranslationAssistant/` but are invisible inside the app after recording stops.

---

## Part 1 — Microphone Permission Fix

### Root Cause (confirmed by reference)

The reference project (`my-translator`) uses **`cpal`** — a cross-platform Rust audio library — for mic capture instead of JavaScript's `getUserMedia()`. On iOS, `cpal` internally uses `AVAudioEngine/AVAudioSession`, which is the native path iOS watches for permission requests. When `cpal` opens a mic stream for the first time, iOS shows the native dialog and registers the app in Settings > Privacy > Microphone.

The current app routes audio through `getUserMedia()` in the WebView → `AudioWorklet` → PCM chunks passed to `SonioxClient`. This sidesteps the native permission path entirely on iOS.

### Fix: Move audio capture to Rust via `cpal`

Replace `AudioCapture` (JS/`getUserMedia`) with a Rust-side `cpal` mic capture module. PCM chunks are streamed to the frontend via Tauri events. The Soniox WebSocket client remains in JS — it just receives chunks differently.

#### New pipeline

```
Before:  getUserMedia (JS) → AudioWorklet → PCM → SonioxClient (JS WebSocket)
After:   cpal (Rust) → Tauri event "mic-audio" → SonioxClient (JS WebSocket, unchanged)
```

#### New Rust module — `src-tauri/src/audio/mic_capture.rs`

Responsibilities:
- Start a `cpal` input stream on the default mic device (F32 or I16, 16 kHz mono)
- Resample to 16 kHz if device doesn't support it natively
- Buffer ~100 ms of PCM, convert to s16le, emit as `mic-audio` Tauri event to frontend
- Hold stream in `Mutex<Option<MicStream>>` app state so start/stop is idempotent

```rust
// New Tauri commands
start_mic_capture(app)  -> Result<(), String>   // opens cpal stream, starts events
stop_mic_capture(app)   -> Result<(), String>   // drops stream, stops events
```

#### Modified JS — `use-translation-session.ts`

Replace `AudioCapture` usage with Tauri event listener:

```ts
// Instead of:  audioCapture.start(onChunk)
// Do:          invoke('start_mic_capture')
//              listen('mic-audio', e => sonioxClient.sendAudio(e.payload))

// Instead of:  audioCapture.stop()
// Do:          invoke('stop_mic_capture')
//              unlisten()
```

`AudioCapture` class (`audio-capture.ts`) is no longer used for iOS builds. Keep it in place (don't delete) — may be useful for future desktop features like system audio capture.

#### `use-microphone-permission.ts`

On iOS, `cpal` triggers the permission dialog the first time `start_mic_capture` is called. The JS permission hook can be simplified: instead of probing via `getUserMedia()` on mount (which is the broken path), call a lightweight Tauri command that checks `cpal` device availability:

```ts
// New command (no dialog — just checks if mic is accessible)
check_mic_available() -> "available" | "unavailable"
```

If `start_mic_capture` fails with a permission error, treat it as `denied` and show the Settings guidance sheet.

#### New Cargo dependency

```toml
cpal = { version = "0.15", features = [] }
```

#### Files changed — Permission fix

| File | Change |
|---|---|
| `src-tauri/Cargo.toml` | Add `cpal = "0.15"` |
| `src-tauri/src/audio/mic_capture.rs` | **Create** — cpal stream management |
| `src-tauri/src/audio/mod.rs` | **Create** — module declaration |
| `src-tauri/src/commands/audio.rs` | **Create** — `start_mic_capture`, `stop_mic_capture`, `check_mic_available` |
| `src-tauri/src/commands/mod.rs` | Add `pub mod audio` |
| `src-tauri/src/lib.rs` | Register 3 new commands + `MicState` app state |
| `src/hooks/use-translation-session.ts` | Replace `AudioCapture` with Tauri event listener |
| `src/hooks/use-microphone-permission.ts` | Simplify: check via `check_mic_available` instead of `getUserMedia` on mount |

#### Edge cases — Permission fix

| Scenario | Handling |
|---|---|
| No mic device found | `start_mic_capture` returns error → `denied` state in UI |
| Permission denied by user | `cpal` stream open fails → `denied` state |
| Device disconnected mid-recording | cpal stream error callback → emit `mic-error` event → `stopSession()` |
| macOS dev (no iOS) | `getUserMedia` path still works in browser; cpal path used only in Tauri builds |

---

## Part 2 — Session History

### Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Navigation model | Bottom sheet (no router) | Consistent with existing BottomSheet pattern |
| Actions | View + Copy + Delete + Share | Full lifecycle management |
| Content display | Translation-only, single column | Dual-panel cluttered on phone |

### New Rust Commands — `transcript.rs`

```rust
read_transcript(app, filename: String)   -> Result<String, String>
delete_transcript(app, filename: String) -> Result<(), String>
```

Both reuse existing `transcript_dir()` helper.

### New React Components

```
src/components/History/
  history-sheet.tsx   — BottomSheet wrapper; fetches list, manages expanded state
  session-item.tsx    — Row: formatted date + 80-char preview + expand/collapse
```

### Data Flow

```
User taps History icon (top bar)
  → HistorySheet opens
  → listTranscripts() → [{name, path, createdAt}] newest-first
  → render SessionItem rows

User taps a row
  → readTranscript(name) → full text displayed inline
  → [Copy] [Share] [Delete] action bar shown

Copy   → navigator.clipboard.writeText(content) → "Copied!" toast
Share  → tauri-plugin-share → native iOS share sheet  (clipboard fallback if unavailable)
Delete → confirm dialog → deleteTranscript(name) → list refresh
```

### UI Layout

```
History Sheet (list)              Session Item (expanded)
┌─────────────────────────┐       ┌─────────────────────────┐
│ Session History     [×] │       │ Apr 14 · 5:30 PM    [∧] │
├─────────────────────────┤       ├─────────────────────────┤
│ Apr 14 · 5:30 PM        │  →    │ Full text (scrollable,  │
│ "How are you today?…"   │       │  max 200px height)      │
├─────────────────────────┤       ├─────────────────────────┤
│ Apr 13 · 9:12 AM        │       │ [Copy]  [Share] [Delete]│
│ "The meeting is sche…"  │       └─────────────────────────┘
└─────────────────────────┘
     Empty: "No sessions yet"
```

### Share Mechanism

**Primary:** `tauri-plugin-share` (community Tauri v2, iOS/macOS native share sheet)
**Fallback:** `navigator.clipboard.writeText()` + "Copied to clipboard" toast

Do NOT use `tauri-plugin-opener` with `file://` paths for sharing — on iOS that opens a viewer, not the share sheet.

### Files changed — Session history

| File | Change |
|---|---|
| `src-tauri/src/commands/transcript.rs` | Add `read_transcript`, `delete_transcript` |
| `src-tauri/src/lib.rs` | Register 2 new commands |
| `src/tauri/transcript-fs.ts` | Add `readTranscript`, `deleteTranscript` wrappers |
| `src/App.tsx` | Add History icon button (top bar, left of theme toggle) |
| `src-tauri/Cargo.toml` | Add `tauri-plugin-share` |
| `package.json` | Add `@tauri-apps/plugin-share` |

---

## All New Dependencies

| Dependency | Where | Purpose |
|---|---|---|
| `cpal = "0.15"` | `Cargo.toml` | Native mic capture (fixes iOS permission) |
| `tauri-plugin-share` | `Cargo.toml` + `package.json` | iOS/macOS share sheet |

---

## Full Files Summary

**Create:**
- `src-tauri/src/audio/mic_capture.rs`
- `src-tauri/src/audio/mod.rs`
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

---

## Risks

| Risk | Mitigation |
|---|---|
| `cpal` resampling quality on iOS | Test on device; `cpal` supports 16 kHz natively on most iOS hardware |
| `tauri-plugin-share` stability | Clipboard fallback already designed in |
| cpal stream state across hot-reload (dev) | Guard with `Mutex`; stop before re-start |
| Delete is irreversible | Confirm dialog; no undo needed for MVP |

---

## Implementation Order

1. **Mic capture (Rust)** — `mic_capture.rs` + commands → compile-check on iOS target
2. **Frontend wiring** — update `use-translation-session.ts` + `use-microphone-permission.ts`
3. **Verify permission** — build iOS app, confirm it appears in Settings > Privacy > Microphone
4. **Transcript commands** — `read_transcript`, `delete_transcript`
5. **History UI** — `history-sheet.tsx`, `session-item.tsx`, icon in `App.tsx`
6. **Share** — integrate `tauri-plugin-share`

---

## Success Criteria

- App appears in iOS Settings > Privacy > Microphone on first launch
- Recording works end-to-end using the cpal pipeline
- User can browse past sessions, copy/share/delete each one
- No regressions on macOS dev builds
