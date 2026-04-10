# Translation Assistant — Design System

## Overview

Mobile-first Tauri/React app (iOS + Android). Design goals: distraction-free real-time translation UI, full light/dark support, safe-area awareness across all device sizes.

---

## Theme System

Implemented via CSS custom properties on `<html data-theme="light|dark">`.  
Toggle persists to `localStorage`; initial value set from `prefers-color-scheme` before first paint (no flash).

### Token Reference

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--bg-primary` | `#ffffff` | `#0d0d14` | Page background |
| `--bg-secondary` | `#f8fafc` | `#13131f` | Input, select backgrounds |
| `--bg-tertiary` | `#f1f5f9` | `#1c1c2e` | Subtle surface (close button) |
| `--text-primary` | `#0f172a` | `#f1f5f9` | Body text |
| `--text-secondary` | `#475569` | `#94a3b8` | Labels, status |
| `--text-muted` | `#94a3b8` | `#64748b` | Timestamps, placeholders |
| `--border` | `#e2e8f0` | `#1e293b` | Dividers, card borders |
| `--border-light` | `#f1f5f9` | `#1e293b` | Transcript line separators |
| `--accent` | `#3b82f6` | `#60a5fa` | Buttons, active states |
| `--accent-dim` | `#dbeafe` | `#1e3a5f` | Active mode bg (settings) |
| `--danger` | `#ef4444` | `#f87171` | Errors, stop/delete |
| `--danger-dim` | `#fee2e2` | `#3b1010` | Error banner background |
| `--success` | `#22c55e` | `#4ade80` | "Live" status, stored key |
| `--warning` | `#f59e0b` | `#fbbf24` | "Connecting" status |
| `--overlay` | `rgba(0,0,0,0.45)` | `rgba(0,0,0,0.65)` | Modal backdrop |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.08)` | `0 1px 3px rgba(0,0,0,0.3)` | Subtle shadow |
| `--shadow-md` | `0 4px 20px rgba(0,0,0,0.12)` | `0 4px 20px rgba(0,0,0,0.4)` | Sheet, card shadow |

### Hook

```ts
import { useTheme } from '@/theme/use-theme';
const { theme, toggleTheme } = useTheme(); // theme: 'light' | 'dark'
```

---

## Responsive Layout

- **Max-width**: `500px` centered — comfortable on all mobile widths (320px → 430px+)
- **Safe areas**: `#root` consumes `env(safe-area-inset-*)` for iOS notch/home bar
- **Bottom controls**: `padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px))`
- **Settings sheet**: `padding-bottom: calc(28px + env(safe-area-inset-bottom, 0px))`

---

## Touch & Accessibility

- All interactive elements: `min-width: 44px; min-height: 44px` (Apple HIG / WCAG 2.5.5)
- All icon-only buttons have `aria-label`
- No emojis as icons — SVG inline with `aria-hidden="true"` on decorative marks
- `WebkitTapHighlightColor: transparent` on record button
- `prefers-color-scheme` respected on first load

---

## Typography

System font stack for native feel across iOS and Android:

```
-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif
```

| Use | Size | Weight | Color token |
|-----|------|--------|-------------|
| Section heading | 18px | 600 | `--text-primary` |
| Body / transcript | 16px | 500 | `--text-primary` |
| Labels | 12px | 500 | `--text-muted` |
| Timestamps | 12px | 400 | `--text-muted` |
| Status badge | 13px | 500 | `--text-secondary` |

---

## Animation

- **Theme transition**: `background-color 0.2s ease, border-color 0.2s ease, color 0.15s ease`
- **Settings sheet**: `transform 0.28s cubic-bezier(0.32,0.72,0,1)` (iOS-style spring)
- **Overlay fade**: `background 0.25s`
- **Record pulse**: `pulse-ring 1.2s ease-out infinite` (defined in `index.html` global CSS)
- Transition override excluded on `.record-btn-pulse::before` to avoid animation conflicts

---

## Icon System

All icons are inline SVG, `viewBox="0 0 24 24"`, `stroke="currentColor"`, `strokeWidth="2"`.  
Lucide-style: rounded linecaps and joins.

| Icon | Component | Usage |
|------|-----------|-------|
| Gear | `<IconSettings>` in `App.tsx` | Open settings |
| Sun / Moon | `<IconTheme>` in `App.tsx` | Toggle theme |
| Speaker | `<IconSpeaker>` in `App.tsx` | TTS mode indicator |
| Text lines | `<IconText>` in `App.tsx` | Text mode indicator |
| X close | inline SVG | Error banner dismiss, settings close |
| Check | `<IconCheck>` in `settings-panel` | API key stored |

---

## Component Notes

### `RecordButton`
- 76×76px circle; idle = `--accent`, recording = `--danger`, disabled = `--text-muted`
- Pulse ring defined in global CSS (not scoped `<style>`) to survive HMR

### `StatusBadge`
- Dot colors are semantic (not themed): disconnected gray, connecting amber, live green, error red

### `SettingsPanel`
- Bottom sheet with drag handle pill
- `z-index: 100` for overlay layer
- Backdrop click closes sheet

---

## Pre-Delivery Checklist

- [x] No emojis as icons — all SVG
- [x] `cursor-pointer` on all interactive elements
- [x] Smooth transitions (150–280ms)
- [x] Light mode text contrast ≥ 4.5:1 (`#0f172a` on `#ffffff`)
- [x] Focus states (browser default preserved)
- [x] `prefers-color-scheme` respected on load
- [x] `prefers-reduced-motion` — animations use CSS; browser respects media query
- [x] Responsive: 320px → 430px+
- [x] No horizontal scroll
- [x] Safe area insets applied (iOS notch + home bar)
- [x] Touch targets ≥ 44×44px
- [x] `aria-label` on all icon-only buttons
