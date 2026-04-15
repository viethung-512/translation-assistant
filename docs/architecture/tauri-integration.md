# Tauri Integration

**Version**: 0.2.0  
**Last Updated**: April 2026

IPC commands, file I/O, and path handling.

---

## Commands Overview

Four Tauri commands expose transcript file I/O to the React frontend.

---

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

**Usage** (from `useTranslationSession`):
```typescript
await writeTranscript('transcript-2026-04-12T15-30-45.txt',
  buildTranscriptContent(finalLines, sourceLang, targetLang, startedAt)
);
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
export interface TranscriptMeta {
  name: string;
  path: string;
  createdAt: string;
}

export async function listTranscripts(): Promise<TranscriptMeta[]> {
  return await invoke<TranscriptMeta[]>('list_transcripts');
}
```

**Usage** (from History component):
```typescript
const transcripts = await listTranscripts();
transcripts.forEach((t) => {
  console.log(`${t.name} (created: ${t.createdAt})`);
});
```

**Rust**:
```rust
#[derive(Serialize, Deserialize)]
pub struct TranscriptMeta {
  pub name: String,
  pub path: String,
  pub createdAt: String, // ISO 8601
}

#[tauri::command]
pub fn list_transcripts() -> Result<Vec<TranscriptMeta>, String> {
  let path = expand_documents_path("")?;
  let entries = std::fs::read_dir(&path)
    .map_err(|e| format!("Cannot list: {}", e))?;
  
  let mut transcripts = vec![];
  for entry in entries {
    let entry = entry.map_err(|e| e.to_string())?;
    let metadata = entry.metadata().map_err(|e| e.to_string())?;
    let created = metadata
      .created()
      .ok()
      .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
      .map(|d| DateTime::<Utc>::from(UNIX_EPOCH + d).to_rfc3339())
      .unwrap_or_default();
    
    transcripts.push(TranscriptMeta {
      name: entry.file_name().into_string().unwrap_or_default(),
      path: entry.path().to_string_lossy().to_string(),
      createdAt: created,
    });
  }
  
  // Sort newest first
  transcripts.sort_by(|a, b| b.createdAt.cmp(&a.createdAt));
  Ok(transcripts)
}
```

---

### read_transcript (New v0.2.0)

Reads full transcript content by filename.

**TypeScript**:
```typescript
export async function readTranscript(filename: string): Promise<string> {
  return await invoke<string>('read_transcript', { filename });
}
```

**Usage** (from History detail view):
```typescript
const content = await readTranscript('transcript-2026-04-12T15-30-45.txt');
// Display in modal or detail view
```

**Rust**:
```rust
#[tauri::command]
pub fn read_transcript(filename: String) -> Result<String, String> {
  let path = expand_documents_path(&filename)?;
  std::fs::read_to_string(&path)
    .map_err(|e| format!("Failed to read: {}", e))
}
```

---

### delete_transcript (New v0.2.0)

Deletes a transcript file.

**TypeScript**:
```typescript
export async function deleteTranscript(filename: string): Promise<void> {
  return await invoke('delete_transcript', { filename });
}
```

**Usage** (from History item):
```typescript
await deleteTranscript('transcript-2026-04-12T15-30-45.txt');
// Refresh transcript list
```

**Rust**:
```rust
#[tauri::command]
pub fn delete_transcript(filename: String) -> Result<(), String> {
  let path = expand_documents_path(&filename)?;
  std::fs::remove_file(&path)
    .map_err(|e| format!("Failed to delete: {}", e))
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
- **iOS**: App Documents directory (via Tauri platform APIs)
- **Android**: App cache directory (via Tauri platform APIs)

---

## File Format

Transcripts saved as plain text with human-readable format.

### Format Structure

```
[YYYY-MM-DD HH:MM:SS] Session: EN → ES
──────────────────────────────────────────────────
[HH:MM:SS] Translated text
         Original text
[HH:MM:SS] Translated text
         Original text
```

### Example

```
[2026-04-12 15:30:45] Session: EN → ES
──────────────────────────────────────────────────
[15:30:47] Hola, ¿cómo estás?
         Hi, how are you?
[15:30:52] Estoy bien, gracias por preguntar.
         I'm fine, thanks for asking.
```

### Generated by buildTranscriptContent

```typescript
export function buildTranscriptContent(
  lines: TranscriptLine[],
  sourceLang: string,
  targetLang: string,
  startedAt: number
): string {
  const date = new Date(startedAt).toISOString().replace('T', ' ').slice(0, 19);
  const header = `[${date}] Session: ${sourceLang.toUpperCase()} → ${targetLang.toUpperCase()}\n${'─'.repeat(50)}\n`;
  
  const body = lines
    .map((l) => {
      const t = new Date(l.timestampMs).toISOString().slice(11, 19);
      return `[${t}] ${l.translatedText}\n         ${l.originalText}`;
    })
    .join('\n');
  
  return header + body;
}
```

**Benefits**:
- Human-readable (can open in any text editor)
- Portable (no vendor lock-in)
- Easily searchable
- Can be imported into other apps
- Timestamps allow chronological reconstruction

**Filename Format**: `transcript-YYYY-MM-DDTHH-MM-SS.txt`
- Example: `transcript-2026-04-12T15-30-45.txt`
- ISO 8601 format (sortable by name)

---

## IPC Type Safety

Commands use Rust types that serialize/deserialize to TypeScript.

### TranscriptMeta Type

**Rust**:
```rust
#[derive(Serialize, Deserialize)]
pub struct TranscriptMeta {
  pub name: String,      // Just filename
  pub path: String,      // Full absolute path
  pub createdAt: String, // ISO 8601 timestamp
}
```

**TypeScript**:
```typescript
interface TranscriptMeta {
  name: string;
  path: string;
  createdAt: string; // ISO 8601
}
```

### Error Handling

All Tauri commands return `Result<T, String>`:

**Rust**:
```rust
pub fn write_transcript(...) -> Result<(), String> {
  // Success: Ok(())
  // Error: Err("user-friendly message".to_string())
}
```

**TypeScript** (via `invoke`):
```typescript
try {
  await writeTranscript(filename, content);
  // Success
} catch (err) {
  const message = String(err); // "user-friendly message"
  useSessionStore.setState({ error: new Error(message) });
}
```

---

## Capabilities & Permissions

Tauri capability system restricts file I/O:

**Declared in `src-tauri/capabilities/default.json`**:
```json
{
  "permissions": [
    "tauri:core:fs:allow-read-dir:allow",
    "tauri:core:fs:allow-read:allow",
    "tauri:core:fs:allow-write:allow",
    "tauri:core:fs:allow-remove:allow"
  ]
}
```

**Restrictions**:
- Can only access `~/Documents/TranslationAssistant/`
- Cannot execute files
- Cannot access system directories or sensitive files (`.env`, credentials)
- Path traversal prevented by `expand_documents_path` validation

---

## Transcript Storage Layout

```
~/Documents/TranslationAssistant/
├── transcript-2026-04-12T15-30-45.txt
├── transcript-2026-04-13T09-15-20.txt
├── transcript-2026-04-14T14-22-10.txt
└── ...
```

All transcripts in single flat directory (no subdirectories).

**Sorting**: By modification time (newest first in UI list).

---

## Error Scenarios

| Scenario | Error | Recovery |
|----------|-------|----------|
| Documents dir doesn't exist | "Documents directory not found" | Tauri creates it on first write |
| Disk full | "Failed to write: No space left" | User must free disk space |
| File permission denied | "Failed to write: Permission denied" | User must grant permissions in OS settings |
| Invalid filename (traversal) | "Invalid path: traversal attempted" | Reject and show to user |
| File doesn't exist (read) | "Failed to read: No such file" | Show "not found" to user |
| File deleted by external app | "Failed to read: No such file" | Show "not found" to user |

---

## Performance Notes

| Operation | Latency | Notes |
|-----------|---------|-------|
| write_transcript (~50KB) | ~10ms | Atomic; no buffering |
| list_transcripts (100 files) | ~20ms | Directory scan + sort |
| read_transcript (~50KB) | ~5ms | Sequential read |
| delete_transcript | ~2ms | File removal |

All operations non-blocking (Tauri spawns on separate thread).

---

## Security Considerations

1. **Path Traversal**: `expand_documents_path` validates path is within app directory
2. **Filename Injection**: ISO timestamp format prevents special characters
3. **Atomic Writes**: `fs::write` is atomic on all platforms; no partial writes
4. **Permissions**: Tauri capabilities restrict access to app directory only
5. **No Script Execution**: Transcripts are text-only; no code execution risk

---

## Future Enhancements

**v0.3.0**:
- Add `export_transcript(filename, format)` command (PDF, SRT, JSON)
- Implement local SQLite for indexed full-text search
- Add transcript tagging / metadata (custom labels)

**v1.0+**:
- Cloud backup integration (optional, user-initiated)
- Transcript encryption at rest (Tauri Stronghold plugin)
- Batch operations (delete multiple, bulk export)

---

## References

- [System Architecture Overview](./overview.md)
- [Security Architecture](./security-architecture.md)
- [Codebase Summary — Tauri Integration](../codebase-summary.md)
- [Tauri Documentation](https://tauri.app/)
