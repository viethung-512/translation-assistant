# Phase 01 — Project Setup & Dependencies

## Context Links
- Brainstorm: `plans/reports/brainstorm-260409-1858-ai-mobile-translator.md`
- Tauri config: `src-tauri/tauri.conf.json`
- Cargo: `src-tauri/Cargo.toml`
- Package: `package.json`

## Overview
- **Priority:** P1
- **Status:** Complete
- **Effort:** 2h
- **Description:** Install all required dependencies, configure Tauri v2 for mobile (mic permissions, capabilities), set up TypeScript path aliases and project structure.

## Key Insights
- Tauri v2 mobile support requires `tauri-plugin-microphone` for iOS/Android mic permission handling
- `tauri-plugin-stronghold` provides encrypted key-value storage for the API key
- `tauri-plugin-fs` needed for transcript file writes
- iOS WKWebView supports `getUserMedia` since iOS 14.3 — no Rust mic bridging needed; WebView handles it
- Android WebView needs `android.permission.RECORD_AUDIO` in manifest
- Zustand v5 is current stable (replaces v4 patterns)
- AudioWorklet requires HTTPS or localhost context — Tauri dev server is localhost, fine

## Requirements

### Functional
- Mic permission granted on iOS and Android via Tauri config
- App can write files to Documents directory on all platforms
- API key persisted securely across app restarts
- TypeScript path aliases configured (`@/` → `src/`)

### Non-functional
- Build must succeed for desktop (tauri dev) at end of this phase
- No unused boilerplate code left in src/

## Related Code Files

### Modify
- `src-tauri/Cargo.toml` — add Tauri plugins
- `src-tauri/tauri.conf.json` — add capabilities, bundle permissions
- `src-tauri/src/lib.rs` — remove greet command, add plugin registrations
- `package.json` — add frontend deps
- `tsconfig.json` — add path aliases

### Create
- `src-tauri/capabilities/default.json` — define app capabilities
- `src-tauri/gen/android/app/src/main/AndroidManifest.xml` patch — RECORD_AUDIO permission (only after `tauri android init`)
- `vite.config.ts` — update with path alias resolve
- `src/` folder structure (empty files/dirs for subsequent phases)

### Delete
- `src/App.css` — replace with proper component styles
- `src/App.tsx` — replace entirely in phase 07

## Implementation Steps

1. **Install Rust plugins** — add to `src-tauri/Cargo.toml`:
   ```toml
   tauri-plugin-stronghold = "2"
   tauri-plugin-fs = "2"
   ```

2. **Install frontend deps:**
   ```bash
   npm install zustand
   npm install --save-dev @types/wicg-file-system-access
   ```

3. **Register plugins in `src-tauri/src/lib.rs`:**
   ```rust
   .plugin(tauri_plugin_stronghold::Builder::new(|password| {
       // derive key from app identifier
       let config = argon2::Config::default();
       let salt = b"translation-assistant-salt-v1";
       argon2::hash_raw(password, salt, &config).expect("failed to hash")
   }).build())
   .plugin(tauri_plugin_fs::init())
   ```

4. **Create `src-tauri/capabilities/default.json`** with permissions:
   ```json
   {
     "identifier": "default",
     "description": "Default app capabilities",
     "platforms": ["macOS", "windows", "linux", "iOS", "android"],
     "permissions": [
       "core:default",
       "stronghold:default",
       "fs:default",
       "fs:allow-app-write",
       "fs:allow-document-write",
       "fs:allow-document-read"
     ]
   }
   ```

5. **Configure `tauri.conf.json`** — add `capabilities: ["default"]` under `app`

6. **iOS mic permission** — add `NSMicrophoneUsageDescription` to `src-tauri/gen/apple/translation_assistant_iOS/Info.plist`:
   ```xml
   <key>NSMicrophoneUsageDescription</key>
   <string>Microphone access is required to capture and translate meeting audio.</string>
   ```
   Note: run `tauri ios init` first to generate iOS project

7. **TypeScript path alias** — update `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": { "@/*": ["src/*"] }
     }
   }
   ```
   Update `vite.config.ts`:
   ```ts
   import path from 'path'
   resolve: { alias: { '@': path.resolve(__dirname, 'src') } }
   ```

8. **Create src folder structure** (empty index files):
   ```
   src/
   ├── providers/
   │   └── soniox/
   ├── audio/
   ├── store/
   ├── components/
   │   ├── TranslationDisplay/
   │   ├── Controls/
   │   └── Settings/
   └── tauri/
   ```

9. **Verify:** `npm run tauri dev` — app launches on desktop without errors

## Todo List

- [x] Add `tauri-plugin-stronghold` and `tauri-plugin-fs` to Cargo.toml
- [x] Install frontend deps (zustand)
- [x] Register plugins in lib.rs (remove greet boilerplate)
- [x] Create capabilities/default.json
- [x] Add capabilities to tauri.conf.json
- [x] Configure TypeScript/Vite path aliases
- [x] Create src folder structure
- [x] Verify desktop build succeeds

## Success Criteria

- `npm run tauri dev` launches without compile errors
- `npm run build && npx tsc --noEmit` passes without errors
- Folder structure matches the architecture plan

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| `tauri-plugin-stronghold` requires argon2 — adds build dep | Add `argon2` to Cargo.toml, use simple config for V1 |
| iOS/Android init commands modify file tree heavily | Run init before file edits; document order of ops |
| Capabilities API changed between Tauri v2 betas | Use `"$schema": "https://schema.tauri.app/config/2"` for validation |

## Security Considerations
- Stronghold password must be derived, not hardcoded — use app identifier + salt
- Never log the API key

## Next Steps
→ Phase 02: Implement Tauri Rust backend commands
