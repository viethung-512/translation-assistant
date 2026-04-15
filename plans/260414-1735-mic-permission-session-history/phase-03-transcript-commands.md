# Phase 03 — Transcript Read/Delete Commands

## Status: pending
## Depends on: Phase 01 (can run in parallel with Phase 02)

## Goal

Add two Rust commands (`read_transcript`, `delete_transcript`) and their TypeScript wrappers so the History UI can load and manage past sessions.

## Files

**Modify:**
- `src-tauri/src/commands/transcript.rs`
- `src-tauri/src/lib.rs`
- `src/tauri/transcript-fs.ts`

---

## Step 1 — Add commands to `transcript.rs`

Append to the existing file after `list_transcripts`:

```rust
/// Read full text content of a single transcript file.
#[tauri::command]
pub async fn read_transcript(
    app: tauri::AppHandle,
    filename: String,
) -> Result<String, String> {
    let path = transcript_dir(&app)?.join(&filename);
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// Delete a transcript file. Irreversible — caller must confirm before invoking.
#[tauri::command]
pub async fn delete_transcript(
    app: tauri::AppHandle,
    filename: String,
) -> Result<(), String> {
    let path = transcript_dir(&app)?.join(&filename);
    // Guard: only delete files inside the transcript dir (no path traversal)
    if !path.starts_with(transcript_dir(&app)?) {
        return Err("Invalid filename".to_string());
    }
    fs::remove_file(&path).map_err(|e| e.to_string())
}
```

**Security note:** The `starts_with` check prevents path traversal (e.g. `filename = "../../etc/passwd"`). Always validate before `remove_file`.

---

## Step 2 — Register in `lib.rs`

Add to the imports and `generate_handler!` macro:

```rust
use commands::transcript::{delete_transcript, list_transcripts, read_transcript, write_transcript};

// In generate_handler!:
read_transcript,
delete_transcript,
```

---

## Step 3 — Add TypeScript wrappers to `transcript-fs.ts`

```typescript
export const readTranscript = (filename: string): Promise<string> =>
  invoke<string>('read_transcript', { filename });

export const deleteTranscript = (filename: string): Promise<void> =>
  invoke<void>('delete_transcript', { filename });
```

---

## Step 4 — Compile check

```bash
cargo check --manifest-path src-tauri/Cargo.toml
npx tsc --noEmit
```

---

## Todo

- [ ] Add `read_transcript` to `transcript.rs`
- [ ] Add `delete_transcript` to `transcript.rs` (with path traversal guard)
- [ ] Register both commands in `lib.rs`
- [ ] Add `readTranscript` + `deleteTranscript` to `transcript-fs.ts`
- [ ] Both compile checks pass
