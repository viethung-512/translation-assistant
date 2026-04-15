# Phase 05 — Share Integration

## Status: pending
## Depends on: Phase 04 (HistorySheet already calls share)

## Goal

Install `tauri-plugin-share` so the Share button in the history sheet opens the native iOS/macOS share sheet instead of falling back to clipboard.

## Files

**Modify:**
- `src-tauri/Cargo.toml`
- `src-tauri/src/lib.rs`
- `package.json`

---

## Step 1 — Install JS package

```bash
npm install @tauri-apps/plugin-share
```

---

## Step 2 — Add Rust dependency to `Cargo.toml`

```toml
tauri-plugin-share = "2"
```

---

## Step 3 — Register plugin in `lib.rs`

```rust
.plugin(tauri_plugin_share::init())
```

Full `run()` after change:

```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_share::init())
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

---

## Step 4 — Add capability permission

Tauri v2 requires explicit capability declarations. Create or update `src-tauri/capabilities/mobile.json`:

```json
{
  "$schema": "../gen/schemas/mobile-schema.json",
  "identifier": "mobile",
  "description": "Mobile capabilities",
  "platforms": ["iOS", "android"],
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default",
    "share:default"
  ]
}
```

If `mobile.json` doesn't exist yet, check `src-tauri/capabilities/` for the existing file and add `"share:default"` to its permissions array.

---

## Step 5 — Compile + type check

```bash
cargo check --manifest-path src-tauri/Cargo.toml
npx tsc --noEmit
```

Both must pass with zero errors.

---

## Step 6 — Verify share on device

1. Build: `npm run tauri ios build`
2. Open app → History icon → expand a session → tap **Share**
3. Native iOS share sheet should appear with the transcript text
4. If share sheet doesn't appear, check Xcode console for permission errors

---

## Fallback behaviour (already in place from Phase 04)

`history-sheet.tsx` uses a dynamic import for the share plugin:

```ts
const { share } = await import('@tauri-apps/plugin-share');
await share({ text: content });
```

If the plugin throws (e.g. on macOS where share isn't supported), it falls through to `navigator.clipboard.writeText()`. No extra code needed.

---

## Todo

- [ ] `npm install @tauri-apps/plugin-share`
- [ ] Add `tauri-plugin-share = "2"` to `Cargo.toml`
- [ ] Register `.plugin(tauri_plugin_share::init())` in `lib.rs`
- [ ] Add `"share:default"` to capabilities file
- [ ] `cargo check` + `tsc --noEmit` pass
- [ ] Share sheet opens on physical iOS device

## Risks

| Risk | Mitigation |
|---|---|
| `tauri-plugin-share` not published for v2 yet | Check crates.io; if unavailable, clipboard fallback is already wired — skip this phase |
| Capability schema path differs per project | Check `src-tauri/capabilities/` first; adapt path accordingly |
| Share on macOS behaves differently | Dynamic import catches any error; clipboard fallback triggers |
