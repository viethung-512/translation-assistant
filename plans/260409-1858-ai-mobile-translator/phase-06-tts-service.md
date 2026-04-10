# Phase 06 — TTS Service

## Context Links
- Plan: `plans/260409-1858-ai-mobile-translator/plan.md`
- Phase 05: `phase-05-state-management.md`
- MDN SpeechSynthesis: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis

## Overview
- **Priority:** P2
- **Status:** Complete
- **Effort:** 1h
- **Blocked by:** Phase 05
- **Description:** Web Speech API wrapper that queues translated final tokens for speech synthesis. Prevents audio overlap, drops stale items if queue grows too large.

## Key Insights
- `speechSynthesis.speak()` queues utterances natively — but queue can grow unbounded if translation is fast
- Drop stale items if queue exceeds 3 pending utterances (≈3s of speech) to keep audio in sync
- `SpeechSynthesisUtterance.lang` must match target language BCP-47 — voice availability varies by OS
- iOS WebView: `speechSynthesis.speak()` requires user gesture to init (same session as mic gesture — already satisfied by record button)
- Cancel all on `stop()` — `speechSynthesis.cancel()` clears queue and stops current speech
- Voice selection: use first voice matching `lang` prefix; fallback to default voice
- TTS service is a plain class, not a React hook — instantiated once and passed down or held in store

## Requirements

### Functional
- `speak(text, lang)` — enqueue utterance; drop if queue > 3
- `stop()` — cancel all pending and current speech immediately
- `setEnabled(bool)` — toggle TTS on/off without stopping session

### Non-functional
- No audio overlap
- Stale queue items dropped silently (no error thrown)
- Works in all Tauri WebView targets (iOS, Android, Desktop)

## Related Code Files

### Create
- `src/audio/tts-service.ts` — TTS queue wrapper

## Implementation Steps

1. **Create `src/audio/tts-service.ts`:**
   ```typescript
   const MAX_QUEUE_SIZE = 3;

   export class TtsService {
     private enabled = true;
     private pendingCount = 0;

     setEnabled(enabled: boolean): void {
       this.enabled = enabled;
       if (!enabled) this.stop();
     }

     speak(text: string, lang: string): void {
       if (!this.enabled || !text.trim()) return;
       if (this.pendingCount >= MAX_QUEUE_SIZE) return; // drop stale

       const utterance = new SpeechSynthesisUtterance(text);
       utterance.lang = lang;
       utterance.voice = this.findVoice(lang);
       utterance.rate = 1.0;
       utterance.pitch = 1.0;

       this.pendingCount++;
       utterance.onend = () => { this.pendingCount = Math.max(0, this.pendingCount - 1); };
       utterance.onerror = () => { this.pendingCount = Math.max(0, this.pendingCount - 1); };

       window.speechSynthesis.speak(utterance);
     }

     stop(): void {
       window.speechSynthesis.cancel();
       this.pendingCount = 0;
     }

     private findVoice(lang: string): SpeechSynthesisVoice | null {
       const voices = window.speechSynthesis.getVoices();
       // exact match first, then prefix match (e.g. "vi" matches "vi-VN")
       return (
         voices.find(v => v.lang === lang) ??
         voices.find(v => v.lang.startsWith(lang.split('-')[0])) ??
         null
       );
     }
   }
   ```

2. **Voices async loading** — `getVoices()` may return empty on first call; use `onvoiceschanged`:
   ```typescript
   // In App init (phase 08):
   if (window.speechSynthesis.onvoiceschanged !== undefined) {
     window.speechSynthesis.onvoiceschanged = () => {
       // voices now loaded — TtsService.findVoice() will work correctly
     };
   }
   ```

3. **Integration point** — TtsService instance created once in `useTranslationSession` hook (phase 08):
   ```typescript
   const ttsService = useRef(new TtsService());
   // On each final translated token:
   if (outputMode === 'tts') ttsService.current.speak(text, targetLanguage);
   // On stop:
   ttsService.current.stop();
   ```

## Todo List

- [x] Create `src/audio/tts-service.ts` (speak, stop, setEnabled, findVoice)
- [x] Document `onvoiceschanged` init requirement for phase 08

## Success Criteria

- `ttsService.speak('Hello', 'en')` produces audible speech on desktop
- Rapid calls with queue full silently drop excess utterances
- `ttsService.stop()` cuts audio immediately
- No overlapping speech

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| No matching voice for target language | Fall back to `null` (browser default voice); log warning |
| Android WebView `speechSynthesis` limited support | Test on Android emulator; document fallback (text-only mode) |
| `pendingCount` desync if utterance errors silently | Reset to 0 on `stop()` always |

## Security Considerations
- No sensitive data processed here — text only

## Next Steps
→ Phase 07: UI components (Controls toggle for TTS/text mode)
→ Phase 08: Wire TtsService into translation session hook
