# Phase 01 — Rust Audio Layer Removal

**Status:** pending  
**Effort:** small  
**Depends on:** nothing  

## Overview

Remove the Tauri native mic capture commands (`start_mic_capture`, `stop_mic_capture`, `check_mic_available`) and the `audio` module from the Rust backend. Audio capture moves to the SDK's `MicrophoneSource` (getUserMedia).

## Related Code Files

**Delete:**
- `src-tauri/src/audio/` (entire directory — `mic_capture.rs` + any siblings)
- `src-tauri/src/commands/audio.rs`

**Modify:**
- `src-tauri/src/lib.rs`
- `src-tauri/src/commands/mod.rs`
- `src-tauri/Cargo.toml`

## Implementation Steps

### 1. Delete Rust audio files

```bash
rm -rf src-tauri/src/audio/
rm src-tauri/src/commands/audio.rs
```

### 2. Update `src-tauri/src/commands/mod.rs`

Remove the `audio` module line.

**Before:**
```rust
pub mod audio;
pub mod platform;
pub mod transcript;
```

**After:**
```rust
pub mod platform;
pub mod transcript;
```

### 3. Update `src-tauri/src/lib.rs`

Remove the `audio` module, `MicState` import, audio command imports, `.manage(MicState::default())`, and the three audio commands from `invoke_handler`.

**Before:**
```rust
mod audio;
mod commands;

use audio::mic_capture::MicState;
use commands::audio::{check_mic_available, start_mic_capture, stop_mic_capture};
use commands::platform::host_os_id;
use commands::transcript::{delete_transcript, list_transcripts, read_transcript, write_transcript};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(MicState::default())
        .invoke_handler(tauri::generate_handler![
            write_transcript,
            list_transcripts,
            read_transcript,
            delete_transcript,
            host_os_id,
            start_mic_capture,
            stop_mic_capture,
            check_mic_available,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**After:**
```rust
mod commands;

use commands::platform::host_os_id;
use commands::transcript::{delete_transcript, list_transcripts, read_transcript, write_transcript};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            write_transcript,
            list_transcripts,
            read_transcript,
            delete_transcript,
            host_os_id,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 4. Update `src-tauri/Cargo.toml`

Remove the `cpal` dependency.

**Before:**
```toml
cpal = "0.15"
```

**After:** *(line removed)*

### 5. Verify Rust compiles

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

Expected: no errors.

## Todo

- [ ] Delete `src-tauri/src/audio/`
- [ ] Delete `src-tauri/src/commands/audio.rs`
- [ ] Update `src-tauri/src/commands/mod.rs` — remove `pub mod audio`
- [ ] Update `src-tauri/src/lib.rs` — remove audio mod, imports, `.manage()`, handler entries
- [ ] Update `src-tauri/Cargo.toml` — remove `cpal`
- [ ] Run `cargo check` and confirm clean

## Success Criteria

`cargo check --manifest-path src-tauri/Cargo.toml` exits 0.
