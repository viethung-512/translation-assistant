# Tauri Integration

**Version**: 0.1.0

IPC commands, file I/O, and path handling.

---

## Commands Overview

Two Tauri commands expose file I/O to the React frontend.

### write_transcript

Saves transcript to disk atomically.

**TypeScript** (`src/tauri/transcript-fs.ts`):
```typescript
import { invoke } from '@tauri-apps/api/core';

export async function writeTranscript(
  filename: string,
  content: string
): Promise<void> {
  return await invoke('write_transcript', { filename, content });
}
```

**Usage**:
```typescript
await writeTranscript('transcript-2026-04-12T15-30-45.txt', `
[Source] Hello world
[Translation] Hola mundo

[Source] How are you?
[Translation] ¿Cómo estás?
`);
```

**Rust** (`src-tauri/src/commands/transcript.rs`):
```rust
#[tauri::command]
pub fn write_transcript(
  filename: String,
  content: String,
) -> Result<(), String> {
  let path = expand_documents_path(&filename)?;
  std::fs::write(&path, &content)
    .map_err(|e| format!("Failed to write: {}", e))?;
  Ok(())
}
```

**Error Handling**:
- `expand_documents_path` fails → permission denied, Documents dir not found
- `fs::write` fails → disk full, file permission denied
- Errors returned as `Result<(), String>` → user sees message in UI

---

### list_transcripts

Fetches transcript metadata sorted newest-first.

**TypeScript**:
```typescript
export interface TranscriptMetadata {
  filename: string;
  size: number;
  created: string; // ISO 8601 timestamp
  modified: string;
}

export async function listTranscripts(): Promise<TranscriptMetadata[]> {
  return await invoke('list_transcripts');
}
```

**Usage**:
```typescript
const transcripts = await listTranscripts();
transcripts.forEach((t) => {
  console.log(`${t.filename} (${t.size} bytes, modified: ${t.modified})`);
});
```

**Rust**:
```rust
#[tauri::command]
pub fn list_transcripts() -> Result<Vec<TranscriptMetadata>, String> {
  let path = expand_documents_path("")?;
  let entries = std::fs::read_dir(&path)
    .map_err(|e| format!("Cannot list: {}", e))?;
  
  let mut transcripts = vec![];
  for entry in entries {
    let entry = entry.map_err(|e| e.to_string())?;
    let metadata = entry.metadata().map_err(|e| e.to_string())?;
    transcripts.push(TranscriptMetadata {
      filename: entry.file_name().into_string().unwrap_or_default(),
      size: metadata.len(),
      created: metadata.created()?.duration_since(UNIX_EPOCH)?.as_secs(),
      modified: metadata.modified()?.duration_since(UNIX_EPOCH)?.as_secs(),
    });
  }
  
  // Sort newest first
  transcripts.sort_by(|a, b| b.modified.cmp(&a.modified));
  Ok(transcripts)
}
```

---

## Path Handling

All file operations sandboxed to `~/Documents/TranslationAssistant/`.

```rust
fn expand_documents_path(filename: &str) -> Result<PathBuf, String> {
  // Resolve user's Documents directory
  let docs = dirs::document_dir()
    .ok_or_else(|| "Documents directory not found".to_string())?;
  
  // App-specific subdirectory
  let app_dir = docs.join("TranslationAssistant");
  
  // Create directory if missing
  std::fs::create_dir_all(&app_dir)
    .map_err(|e| format!("Cannot create directory: {}", e))?;
  
  // Join filename (no path traversal allowed)
  let full_path = app_dir.join(filename);
  
  // Validate path is within app_dir (security check)
  if !full_path.starts_with(&app_dir) {
    return Err("Invalid path: traversal attempted".to_string());
  }
  
  Ok(full_path)
}
```

**Platforms**:
- **macOS**: `~/Documents/TranslationAssistant/`
- **Windows**: `C:\Users\{user}\Documents\TranslationAssistant\`
- **Linux**: `~/Documents/TranslationAssistant/`
- **iOS**: App Documents directory (via Tauri)
- **Android**: App cache directory (via Tauri)

---

## File Format

Transcripts saved as plain text:

```
[Source] Hello world
[Translation] Hola mundo

[Source] How are you?
[Translation] ¿Cómo estás?
```

**Benefits**:
- Human-readable
- Portable (no vendor lock-in)
- Easily searchable via text editors
- Can be imported into other apps

**Filename Format**: `transcript-YYYY-MM-DDTHH-MM-SS.txt`
- Example: `transcript-2026-04-12T15-30-45.txt`
- ISO 8601 format (sortable by name)

---

## IPC Type Safety

Commands use Rust types that serialize/deserialize to TypeScript:

```rust
#[derive(serde::Serialize, serde::Deserialize)]
pub struct TranscriptMetadata {
  pub filename: String,
  pub size: u64,
  pub created: u64, // Unix timestamp
  pub modified: u64,
}
```

```typescript
interface TranscriptMetadata {
  filename: string;
  size: number;
  created: number; // Unix timestamp (ms)
  modified: number;
}
```

---

## Error Handling

All Tauri commands return `Result<T, String>`. Errors display in ErrorBanner:

```typescript
try {
  await writeTranscript(filename, content);
  useSessionStore.setState({ error: null });
} catch (err) {
  const message = String(err);
  useSessionStore.setState({
    error: new Error(`Save failed: ${message}`),
  });
}
```

---

## Atomicity

`fs::write` is atomic on all supported platforms:

```rust
std::fs::write(&path, &content) // Atomic!
```

**Guarantees**: File either exists with full content, or doesn't exist. No partial writes.

---

## Permissions

Tauri capability system restricts file I/O:

```json
// src-tauri/capabilities/default.json
{
  "tauri:core:fs:allow-read-dir": ["Documents/TranslationAssistant/*"],
  "tauri:core:fs:allow-write": ["Documents/TranslationAssistant/*"]
}
```

**Restrictions**:
- Can only read/write in app directory
- Cannot execute files or access system directories
- Cannot read sensitive files (`.env`, credentials)

---

## Future Enhancements

**v0.2.0**:
- Add `delete_transcript(filename)` command
- Add `export_transcript(filename, format)` command (PDF, SRT)
- Implement local SQLite for indexed search

**v1.0+**:
- Cloud backup integration (optional)
- Transcript encryption at rest (Tauri Stronghold)

---

## References

- [System Architecture Overview](./overview.md)
- [Security Architecture](./security-architecture.md)
- [Codebase Summary — Tauri Integration](../codebase-summary.md#tauri-integration--srctauri)
