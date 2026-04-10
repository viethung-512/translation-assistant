# Phase 07 — UI Components

## Context Links
- Plan: `plans/260409-1858-ai-mobile-translator/plan.md`
- Phase 05: `phase-05-state-management.md` (stores consumed here)

## Overview
- **Priority:** P1
- **Status:** Complete
- **Effort:** 4h
- **Blocked by:** Phase 05
- **Description:** Build all React UI components: Settings screen (API key, language selection, output mode), Controls (record button, status), and TranslationDisplay (real-time subtitles). Mobile-first responsive layout.

## Key Insights
- No UI library for V1 — plain CSS modules or inline styles to keep deps minimal (KISS)
- Mobile-first: max-width 480px centered; desktop shows same layout with comfortable padding
- TranslationDisplay shows two rows: interim (faded, live) + final lines (solid, scrollable)
- Original text smaller/secondary; translated text larger/primary
- Record button is the primary affordance — large touch target (min 56px), clear active state
- Settings screen is a slide-up panel (not separate route) — keeps app single-screen
- Language codes: provide a curated list of ~20 common languages (not all 60+) for V1 picker
- Connection status badge visible at all times (connecting / live / error)
- Error messages shown inline, not modal — dismiss via tap
- Split into ≤200 line files: each component in its own folder with index.tsx + styles

## Requirements

### Functional
- Settings panel: API key input (password type), source lang picker, target lang picker, output mode toggle
- Controls: large record/stop button, connection status indicator, output mode display
- TranslationDisplay: interim tokens (live), final lines (scrollable), auto-scroll to bottom
- App shell: status bar, main content area, floating settings button

### Non-functional
- All touch targets ≥ 44px (iOS HIG minimum)
- No layout shift when tokens arrive
- Works without internet (shows error state gracefully)

## Related Code Files

### Create
- `src/components/Settings/settings-panel.tsx` — API key, lang pickers, output mode
- `src/components/Settings/language-picker.tsx` — reusable language selector
- `src/components/Controls/record-button.tsx` — large record/stop toggle
- `src/components/Controls/status-badge.tsx` — connection status indicator
- `src/components/TranslationDisplay/translation-display.tsx` — subtitle view
- `src/components/TranslationDisplay/transcript-line.tsx` — single finalized line
- `src/App.tsx` — root layout (replace boilerplate)

### Delete / Replace
- `src/App.tsx` (boilerplate) → rewrite
- `src/App.css` → delete; use component-level styles

## Implementation Steps

1. **Define language list** (inline constant, not a separate file):
   ```typescript
   // inside language-picker.tsx
   const LANGUAGES = [
     { code: 'en', label: 'English' },
     { code: 'vi', label: 'Tiếng Việt' },
     { code: 'zh', label: '中文' },
     { code: 'ja', label: '日本語' },
     { code: 'ko', label: '한국어' },
     { code: 'es', label: 'Español' },
     { code: 'fr', label: 'Français' },
     { code: 'de', label: 'Deutsch' },
     { code: 'pt', label: 'Português' },
     { code: 'ru', label: 'Русский' },
     { code: 'ar', label: 'العربية' },
     { code: 'hi', label: 'हिन्दी' },
     { code: 'th', label: 'ภาษาไทย' },
     { code: 'id', label: 'Bahasa Indonesia' },
     { code: 'ms', label: 'Bahasa Melayu' },
   ];
   ```

2. **`src/components/Settings/language-picker.tsx`:**
   ```tsx
   interface Props {
     label: string;
     value: string;
     onChange: (code: string) => void;
     exclude?: string; // prevent same lang on both sides
   }
   // renders <label> + <select> from LANGUAGES list, filtered by exclude
   ```

3. **`src/components/Settings/settings-panel.tsx`:**
   ```tsx
   // Props: isOpen, onClose
   // Contains: API key input + Save/Delete buttons, source/target lang pickers, output mode toggle
   // On Save API key: calls saveApiKey() from tauri/secure-storage + setApiKey() in settings store
   // On mount: calls getApiKey() and pre-fills masked input if key exists
   // Overlay with slide-up animation (CSS transform transition)
   ```

4. **`src/components/Controls/status-badge.tsx`:**
   ```tsx
   // Props: status: ConnectionStatus
   // Renders colored dot + label: grey=disconnected, yellow=connecting, green=connected, red=error
   // Positioned top-right of app shell
   ```

5. **`src/components/Controls/record-button.tsx`:**
   ```tsx
   // Props: isRecording, isDisabled, onClick
   // Large circular button (80px), red when recording (pulsing CSS animation), grey when idle
   // Shows mic icon (SVG inline) — no icon library needed
   // Disabled state when connectionStatus === 'connecting'
   ```

6. **`src/components/TranslationDisplay/transcript-line.tsx`:**
   ```tsx
   // Props: originalText, translatedText, timestampMs
   // Two-line layout: translated (large, primary color) on top, original (small, muted) below
   // Timestamp shown on hover/long-press
   ```

7. **`src/components/TranslationDisplay/translation-display.tsx`:**
   ```tsx
   // Reads from useSessionStore: interimOriginal, interimTranslated, finalLines
   // Renders scrollable list of <TranscriptLine> for finalLines
   // Renders interim row at bottom (faded/italic style)
   // Auto-scroll: useEffect watching finalLines.length → scrollRef.current?.scrollIntoView()
   // Empty state: centered message "Tap record to start translating"
   ```

8. **`src/App.tsx`** — root layout:
   ```tsx
   // Layout:
   // ┌─────────────────┐
   // │ StatusBadge  ⚙️  │  ← top bar (settings icon button)
   // ├─────────────────┤
   // │ TranslationDisplay (flex-grow, scrollable) │
   // ├─────────────────┤
   // │ OutputMode label │
   // │ [● RECORD btn]  │  ← bottom bar
   // └─────────────────┘
   // SettingsPanel overlays on top when open
   // Loads apiKey from Tauri secure storage on mount → setApiKey
   // Error banner shown when sessionStore.errorMessage is set
   ```

9. **CSS approach** — inline style objects per component; no external CSS file:
   - Mobile-first: all styles work at 320px width
   - Desktop: wraps in max-width 480px centered container

## Todo List

- [x] Create `src/components/Settings/language-picker.tsx`
- [x] Create `src/components/Settings/settings-panel.tsx`
- [x] Create `src/components/Controls/status-badge.tsx`
- [x] Create `src/components/Controls/record-button.tsx`
- [x] Create `src/components/TranslationDisplay/transcript-line.tsx`
- [x] Create `src/components/TranslationDisplay/translation-display.tsx`
- [x] Rewrite `src/App.tsx` with full layout
- [x] Delete `src/App.css`
- [x] Verify layout renders correctly at 375px (iPhone) and 1280px (desktop)

## Success Criteria

- App renders without errors; settings panel opens/closes
- Record button visually reflects `recordingStatus`
- Status badge reflects `connectionStatus`
- Translation display shows interim text live and scrolls to latest final line
- Language picker excludes the language selected on the other side
- API key save persists across reload (via Tauri storage)

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Auto-scroll causes layout jump | Use `scrollIntoView({ behavior: 'smooth' })` only when user is at bottom |
| API key input visible in password managers | Use `type="password"` + `autocomplete="off"` |
| Settings panel blocks content on small screens | Use bottom-sheet with max-height 70vh + scroll |
| TranslationDisplay re-renders on every token | Memoize `TranscriptLine` with `React.memo` |

## Security Considerations
- API key input uses `type="password"` — masked in UI
- API key not logged or included in error messages shown on screen

## Next Steps
→ Phase 08: Wire all pieces together in `useTranslationSession` hook
