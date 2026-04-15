# Phase 02 — Delete TS Files + Install SDK

**Status:** pending  
**Effort:** small  
**Depends on:** nothing (parallel with Phase 01)

## Overview

Install `@soniox/react` + `@soniox/client`, delete the hand-rolled TS files they replace, and move shared types to their new home.

## Files Deleted

| File | Replaced By |
|------|-------------|
| `src/providers/soniox/soniox-client.ts` | `useRecording` from `@soniox/react` |
| `src/providers/soniox/soniox-types.ts` | Types from `@soniox/client` |
| `src/providers/types.ts` | Dropped (YAGNI — single provider) |
| `src/audio/audio-capture.ts` | SDK `MicrophoneSource` |
| `src/audio/pcm-worklet-processor.ts` | SDK `MicrophoneSource` |
| `src/hooks/use-microphone-permission.ts` | `useMicrophonePermission` from `@soniox/react` |
| `src/store/session-store.ts` | Hook-local state in Phase 03 |

## Files Modified

| File | Change |
|------|--------|
| `src/tauri/transcript-fs.ts` | Absorb `TranscriptLine` type + `buildTranscriptContent` from deleted `session-store.ts` |

## Implementation Steps

### 1. Install SDK packages

```bash
npm install @soniox/react @soniox/client
```

### 2. Delete replaced files

```bash
rm src/providers/soniox/soniox-client.ts
rm src/providers/soniox/soniox-types.ts
rm src/providers/types.ts
rm src/audio/audio-capture.ts
rm src/audio/pcm-worklet-processor.ts
rm src/hooks/use-microphone-permission.ts
rm src/store/session-store.ts
```

If `src/providers/soniox/` is now empty:
```bash
rm -rf src/providers/soniox/
rm -rf src/providers/   # only if also empty after removing types.ts
```

### 3. Move `TranscriptLine` + `buildTranscriptContent` into `transcript-fs.ts`

Append to `src/tauri/transcript-fs.ts`:

```ts
export interface TranscriptLine {
  originalText: string;
  translatedText: string;
  timestampMs: number;
}

/** Build a human-readable transcript string from finalized lines. */
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

### 4. Type-check to confirm deleted files are not needed yet

```bash
npx tsc --noEmit 2>&1 | head -40
```

Expected: many errors (Phase 03 and 04 will fix them). Confirm no *unexpected* missing modules.

## Todo

- [ ] `npm install @soniox/react @soniox/client`
- [ ] Delete the 7 TS files listed above
- [ ] Clean up empty `src/providers/` dirs if applicable
- [ ] Move `TranscriptLine` + `buildTranscriptContent` into `src/tauri/transcript-fs.ts`
- [ ] Run `npx tsc --noEmit` to take a baseline of remaining errors

## Success Criteria

SDK packages appear in `node_modules/@soniox/`. All 7 TS files deleted. `TranscriptLine` and `buildTranscriptContent` exported from `transcript-fs.ts`.
