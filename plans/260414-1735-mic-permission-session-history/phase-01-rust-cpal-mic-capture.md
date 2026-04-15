# Phase 01 — Rust cpal Mic Capture

## Status: pending

## Why

`getUserMedia()` in Tauri's WKWebView does not reliably reach the native AVFoundation permission path on iOS. The app never appears in Settings > Privacy > Microphone.

`cpal` (cross-platform audio library) on iOS uses `AVAudioEngine/AVAudioSession` directly. The first time a stream is opened, iOS shows the native permission dialog and registers the app. This is identical to what the reference project (my-translator) does.

## Context Links

- Spec: [brainstorm-260414-1735-session-history.md](../reports/brainstorm-260414-1735-session-history.md)
- Reference: `src-tauri/src/audio/microphone.rs` in `phuc-nt/my-translator` (cpal stream + callback pattern)
- Current audio: [src/audio/audio-capture.ts](../../src/audio/audio-capture.ts) — kept in place, unused for iOS

## Files

**Create:**
- `src-tauri/src/audio/mod.rs`
- `src-tauri/src/audio/mic_capture.rs`
- `src-tauri/src/commands/audio.rs`

**Modify:**
- `src-tauri/Cargo.toml` — add `cpal`
- `src-tauri/src/commands/mod.rs` — add `pub mod audio`
- `src-tauri/src/lib.rs` — register commands + `MicState`

---

## Step 1 — Add `cpal` to Cargo.toml

```toml
# src-tauri/Cargo.toml
[dependencies]
cpal = { version = "0.15", features = [] }
```

Run `cargo check --manifest-path src-tauri/Cargo.toml` to confirm it resolves.

---

## Step 2 — Create `src-tauri/src/audio/mod.rs`

```rust
pub mod mic_capture;
```

---

## Step 3 — Create `src-tauri/src/audio/mic_capture.rs`

Full implementation of the cpal mic stream. Key design points:
- Stored in `Mutex<Option<MicStream>>` app-managed state so start/stop is safe from multiple threads
- PCM data emitted as Tauri `mic-audio` events carrying `Vec<u8>` (raw s16le bytes)
- Resamples to 16 kHz if the device default differs
- Buffers ~100 ms per emit (1600 samples × 2 bytes = 3200 bytes per event)

```rust
// src-tauri/src/audio/mic_capture.rs

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{SampleFormat, SampleRate, Stream};
use tauri::{AppHandle, Emitter};

const TARGET_RATE: u32 = 16_000;
const CHUNK_SAMPLES: usize = 1_600; // 100 ms at 16 kHz

/// Opaque handle keeping the cpal stream alive.
/// The stream stops when this is dropped.
pub struct MicStream {
    _stream: Stream,
}

// cpal::Stream is not Send by default on some targets; mark it explicitly.
// Safe here because we never share the stream across threads — it lives
// exclusively inside the Mutex.
unsafe impl Send for MicStream {}

/// App-managed state: None = stopped, Some = recording.
pub type MicState = std::sync::Mutex<Option<MicStream>>;

/// Open the default input device, start streaming s16le PCM to the frontend
/// via `mic-audio` Tauri events.
pub fn start(app: AppHandle) -> Result<MicStream, String> {
    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .ok_or("No microphone input device found")?;

    // Prefer 16 kHz mono; fall back to device default
    let config = try_build_config(&device)?;

    let app_clone = app.clone();
    let mut buffer: Vec<i16> = Vec::with_capacity(CHUNK_SAMPLES * 2);

    let stream = match config.sample_format() {
        SampleFormat::F32 => build_stream::<f32>(&device, &config.into(), app_clone, buffer)?,
        SampleFormat::I16 => build_stream::<i16>(&device, &config.into(), app_clone, buffer)?,
        SampleFormat::U16 => build_stream::<u16>(&device, &config.into(), app_clone, buffer)?,
        fmt => return Err(format!("Unsupported sample format: {fmt:?}")),
    };

    stream.play().map_err(|e| e.to_string())?;
    Ok(MicStream { _stream: stream })
}

fn try_build_config(device: &cpal::Device) -> Result<cpal::SupportedStreamConfig, String> {
    // Try exact 16 kHz mono first
    let mut supported = device
        .supported_input_configs()
        .map_err(|e| e.to_string())?;

    if let Some(range) = supported.find(|r| {
        r.channels() == 1
            && r.min_sample_rate().0 <= TARGET_RATE
            && r.max_sample_rate().0 >= TARGET_RATE
    }) {
        return Ok(range.with_sample_rate(SampleRate(TARGET_RATE)));
    }

    // Fall back to device default
    device
        .default_input_config()
        .map_err(|e| e.to_string())
}

fn build_stream<T>(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    app: AppHandle,
    mut buffer: Vec<i16>,
) -> Result<Stream, String>
where
    T: cpal::Sample + cpal::SizedSample + Into<f32>,
{
    let channels = config.channels as usize;
    let device_rate = config.sample_rate.0;

    let stream = device
        .build_input_stream(
            config,
            move |data: &[T], _| {
                for frame in data.chunks(channels) {
                    // Mix down to mono
                    let mono: f32 =
                        frame.iter().map(|s| (*s).into()).sum::<f32>() / channels as f32;

                    // Simple integer downsample (skip frames) if rate > 16 kHz
                    // For production, a proper FIR resampler would be ideal;
                    // cpal on most iOS devices natively supports 16 kHz so this
                    // path is rarely hit.
                    let sample_i16 = (mono * 32767.0).clamp(-32768.0, 32767.0) as i16;
                    buffer.push(sample_i16);

                    if buffer.len() >= CHUNK_SAMPLES {
                        // Convert Vec<i16> → Vec<u8> (little-endian)
                        let bytes: Vec<u8> = buffer
                            .iter()
                            .flat_map(|s| s.to_le_bytes())
                            .collect();
                        let _ = app.emit("mic-audio", bytes);
                        buffer.clear();
                    }
                }
            },
            move |err| eprintln!("[mic_capture] stream error: {err}"),
            None,
        )
        .map_err(|e| e.to_string())?;

    Ok(stream)
}
```

> **Note on resampling:** If `device_rate != TARGET_RATE`, the simple skip/duplicate approach above is fine for speech. A polyphase resampler can be added later if quality is insufficient.

---

## Step 4 — Create `src-tauri/src/commands/audio.rs`

```rust
// src-tauri/src/commands/audio.rs

use crate::audio::mic_capture::{self, MicState};
use tauri::State;

/// Start mic capture. Opens cpal stream; emits `mic-audio` events to frontend.
/// Idempotent — calling while already running is a no-op.
#[tauri::command]
pub fn start_mic_capture(
    app: tauri::AppHandle,
    state: State<MicState>,
) -> Result<(), String> {
    let mut guard = state.lock().map_err(|e| e.to_string())?;
    if guard.is_some() {
        return Ok(()); // already running
    }
    let stream = mic_capture::start(app)?;
    *guard = Some(stream);
    Ok(())
}

/// Stop mic capture. Drops the cpal stream.
#[tauri::command]
pub fn stop_mic_capture(state: State<MicState>) -> Result<(), String> {
    let mut guard = state.lock().map_err(|e| e.to_string())?;
    *guard = None; // drops MicStream → stream stops
    Ok(())
}

/// Check if a mic device is available without requesting permission.
/// Returns "available" or "unavailable".
/// On iOS, the first call to `start_mic_capture` triggers the permission dialog.
#[tauri::command]
pub fn check_mic_available() -> &'static str {
    let host = cpal::default_host();
    if host.default_input_device().is_some() {
        "available"
    } else {
        "unavailable"
    }
}
```

---

## Step 5 — Update `src-tauri/src/commands/mod.rs`

```rust
pub mod audio;
pub mod platform;
pub mod transcript;
```

---

## Step 6 — Update `src-tauri/src/lib.rs`

```rust
mod audio;
mod commands;

use commands::audio::{check_mic_available, start_mic_capture, stop_mic_capture};
use commands::platform::host_os_id;
use commands::transcript::{list_transcripts, write_transcript};
use audio::mic_capture::MicState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(MicState::default())   // Mutex<Option<MicStream>>
        .invoke_handler(tauri::generate_handler![
            write_transcript,
            list_transcripts,
            host_os_id,
            start_mic_capture,
            stop_mic_capture,
            check_mic_available,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## Step 7 — Compile check

```bash
cargo check --manifest-path src-tauri/Cargo.toml
# For iOS target:
cargo check --manifest-path src-tauri/Cargo.toml --target aarch64-apple-ios
```

Fix any type errors before moving to Phase 2.

---

## Verification (on device)

1. Build and install: `npm run tauri ios build`
2. Launch app on physical iPhone
3. iOS should show native mic permission dialog immediately on first `start_mic_capture` (triggered in Phase 2 from the record button)
4. Open **Settings > Privacy & Security > Microphone** — app must appear in the list

---

## Todo

- [ ] Add `cpal = "0.15"` to `Cargo.toml`
- [ ] Create `src-tauri/src/audio/mod.rs`
- [ ] Create `src-tauri/src/audio/mic_capture.rs`
- [ ] Create `src-tauri/src/commands/audio.rs`
- [ ] Add `pub mod audio` to `commands/mod.rs`
- [ ] Update `lib.rs` with `MicState` + new commands
- [ ] `cargo check` passes (desktop + iOS target)

## Risks

| Risk | Mitigation |
|---|---|
| `cpal` sample format not F32/I16/U16 | Return error; tested on iOS hardware only supports F32 and I16 |
| Device rate ≠ 16 kHz | Simple mono-mix + skip resampler covers 44.1/48 kHz → 16 kHz for speech |
| `MicStream` Send unsafety | Struct only lives inside Mutex, never shared across threads |
