# Phase 02 — Tauri Backend (Secure Storage & Filesystem)

## Context Links
- Plan: `plans/260409-1858-ai-mobile-translator/plan.md`
- Phase 01: `phase-01-project-setup.md`
- Tauri FS docs: https://tauri.app/plugin/file-system/
- Stronghold docs: https://tauri.app/plugin/stronghold/

## Overview
- **Priority:** P1
- **Status:** Complete
- **Effort:** 2h
- **Blocked by:** Phase 01
- **Description:** Implement Rust Tauri commands for API key secure storage and transcript file operations. Create TypeScript invoke wrappers consumed by frontend.

## Key Insights
- Stronghold stores key-value pairs in encrypted vault — use `"api_key"` as the record key
- Stronghold vault file lives in `app_data_dir()` — persists across app restarts
- Transcripts go to `document_dir()/TranslationAssistant/` — visible to user in Files app on iOS
- All Tauri commands must be registered in `invoke_handler![]` macro
- TypeScript wrappers should use `@tauri-apps/api/core` `invoke()` — not direct REST
- Keep Rust commands thin — business logic stays in TypeScript

## Requirements

### Functional
- `save_api_key(key: String)` — encrypt and persist API key
- `get_api_key()` — retrieve decrypted API key (returns `Option<String>`)
- `delete_api_key()` — clear stored key
- `write_transcript(filename: String, content: String)` — write to documents dir
- `list_transcripts()` — return list of `{name, path, created_at}` objects

### Non-functional
- API key never returned to logs or console
- File writes are atomic (write to temp, rename)
- All commands return `Result<T, String>` for error propagation

## Related Code Files

### Modify
- `src-tauri/src/lib.rs` — register new commands
- `src-tauri/Cargo.toml` — already has plugins from phase 01

### Create
- `src-tauri/src/commands/storage.rs` — API key commands (stronghold)
- `src-tauri/src/commands/transcript.rs` — file system commands
- `src-tauri/src/commands/mod.rs` — re-export commands
- `src/tauri/secure-storage.ts` — TypeScript invoke wrappers for API key
- `src/tauri/transcript-fs.ts` — TypeScript invoke wrappers for FS

## Implementation Steps

1. **Create `src-tauri/src/commands/mod.rs`:**
   ```rust
   pub mod storage;
   pub mod transcript;
   ```

2. **Create `src-tauri/src/commands/storage.rs`** — stronghold API key ops:
   ```rust
   use tauri::State;
   use tauri_plugin_stronghold::stronghold::Stronghold;

   #[tauri::command]
   pub async fn save_api_key(
       stronghold: State<'_, Stronghold>,
       key: String,
   ) -> Result<(), String> {
       // insert into stronghold vault record "api_key"
   }

   #[tauri::command]
   pub async fn get_api_key(
       stronghold: State<'_, Stronghold>,
   ) -> Result<Option<String>, String> {
       // read from stronghold vault record "api_key"
   }

   #[tauri::command]
   pub async fn delete_api_key(
       stronghold: State<'_, Stronghold>,
   ) -> Result<(), String> {
       // remove record "api_key"
   }
   ```

3. **Create `src-tauri/src/commands/transcript.rs`** — filesystem ops:
   ```rust
   use tauri::Manager;
   use std::fs;

   #[tauri::command]
   pub async fn write_transcript(
       app: tauri::AppHandle,
       filename: String,
       content: String,
   ) -> Result<(), String> {
       let docs = app.path().document_dir()
           .map_err(|e| e.to_string())?;
       let dir = docs.join("TranslationAssistant");
       fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
       let path = dir.join(&filename);
       // write to temp file then rename for atomicity
       let tmp = dir.join(format!(".{filename}.tmp"));
       fs::write(&tmp, &content).map_err(|e| e.to_string())?;
       fs::rename(&tmp, &path).map_err(|e| e.to_string())
   }

   #[tauri::command]
   pub async fn list_transcripts(
       app: tauri::AppHandle,
   ) -> Result<Vec<serde_json::Value>, String> {
       // read dir, return [{name, path, created_at}]
   }
   ```

4. **Update `src-tauri/src/lib.rs`** to register commands:
   ```rust
   mod commands;
   use commands::{storage::*, transcript::*};

   // in invoke_handler:
   tauri::generate_handler![
       save_api_key, get_api_key, delete_api_key,
       write_transcript, list_transcripts
   ]
   ```

5. **Create `src/tauri/secure-storage.ts`:**
   ```typescript
   import { invoke } from '@tauri-apps/api/core';

   export const saveApiKey = (key: string) =>
     invoke<void>('save_api_key', { key });

   export const getApiKey = () =>
     invoke<string | null>('get_api_key');

   export const deleteApiKey = () =>
     invoke<void>('delete_api_key');
   ```

6. **Create `src/tauri/transcript-fs.ts`:**
   ```typescript
   import { invoke } from '@tauri-apps/api/core';

   export interface TranscriptMeta {
     name: string;
     path: string;
     createdAt: string;
   }

   export const writeTranscript = (filename: string, content: string) =>
     invoke<void>('write_transcript', { filename, content });

   export const listTranscripts = () =>
     invoke<TranscriptMeta[]>('list_transcripts');
   ```

7. **Verify:** `npm run tauri dev` — no Rust compile errors; test `invoke('get_api_key')` in browser console returns `null`

## Todo List

- [x] Create `src-tauri/src/commands/mod.rs`
- [x] Implement `storage.rs` (save/get/delete API key via stronghold)
- [x] Implement `transcript.rs` (write/list transcripts)
- [x] Register commands in `lib.rs`
- [x] Create `src/tauri/secure-storage.ts` TypeScript wrappers
- [x] Create `src/tauri/transcript-fs.ts` TypeScript wrappers
- [x] Verify Rust compiles; test invoke from browser console

## Success Criteria

- Rust compiles with no errors
- `invoke('save_api_key', { key: 'test' })` stores value
- `invoke('get_api_key')` returns stored value after app restart
- `invoke('write_transcript', { filename: 'test.txt', content: 'hello' })` creates file in documents dir

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Stronghold API may differ from docs | Check `tauri-plugin-stronghold` example in tauri-plugin repo |
| Document dir unavailable on simulator | Fall back to `app_data_dir()` during dev |
| Rust borrow/async issues with State | Use `Arc<Mutex<>>` wrapper if needed |

## Security Considerations
- API key stored in OS-backed encrypted store — never in plain text files
- No logging of key contents in any Rust command
- `get_api_key` only called at WS connection time, not stored in JS memory longer than needed

## Next Steps
→ Phase 03: Audio capture layer
→ Phase 04: Soniox provider (can start in parallel with phase 03)
