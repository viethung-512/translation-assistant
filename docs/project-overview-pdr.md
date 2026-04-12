# Translation Assistant — Project Overview & PDR

**Version**: 0.1.0 MVP  
**Last Updated**: April 2026  
**Status**: Complete — Ready for Beta Testing

---

## Executive Summary

Translation Assistant is a lightweight, distraction-free cross-platform app (Tauri 2 + React 18) that delivers real-time speech-to-text translation powered by Soniox WebSocket API. Users speak in their native language, and the app transcribes and translates to a target language in real-time, with optional voice playback.

**Target Users**: 
- Language learners needing live translation feedback
- Business professionals in multilingual meetings
- Content creators requiring quick multilingual subtitles

---

## Product Vision

Enable seamless real-time translation for anyone, anywhere—from mobile devices to desktop—without relying on cloud infrastructure or complicated setup. The app should feel native to the platform (iOS, Android, Windows, macOS, Linux) while remaining simple enough to use in a single meeting.

---

## User Personas

### Persona 1: Language Learner (Maria)
- **Goal**: Practice speaking Spanish; get instant feedback on what she said + translation
- **Pain Point**: Online services require account setup; mobile apps have lag
- **Ideal Solution**: Open app, select Spanish→English, speak, see real-time transcript + translation
- **Usage**: 15–30 min sessions, multiple times per week

### Persona 2: Business Professional (David)
- **Goal**: Transcribe client calls in German; auto-save for later reference
- **Pain Point**: Manual note-taking misses details; existing tools are enterprise-only
- **Ideal Solution**: One-click recording; transcripts saved locally for compliance
- **Usage**: Scheduled meetings, batch processing afterward

### Persona 3: Content Creator (Sofia)
- **Goal**: Generate subtitle data for TikTok videos in multiple languages
- **Pain Point**: Manual transcription is slow; automated tools have poor accuracy for her accent
- **Ideal Solution**: Bulk record short clips; get accurate timestamps + translations
- **Usage**: 1–2 hours per day, project-based

---

## Functional Requirements

### Core Features (MVP — v0.1.0)

| Feature | Description | Status |
|---------|-------------|--------|
| Real-time STT | Soniox WebSocket streaming with live token display | ✓ Complete |
| Translation | Live target language translation via Soniox | ✓ Complete |
| Audio Capture | AudioWorklet-based mic input (16kHz PCM) | ✓ Complete |
| Language Selection | 15+ languages; mutual exclusion (source ≠ target) | ✓ Complete |
| Output Modes | Text-only or TTS voice playback | ✓ Complete |
| Transcript Save | Atomic file writes to local disk | ✓ Complete |
| Transcript List | View/manage saved transcripts | ✓ Complete |
| Settings Panel | Configure API key, languages, output mode | ✓ Complete |
| Theme Toggle | Light/dark mode with persistence | ✓ Complete |
| Accessibility | ARIA labels, 44×44px touch targets, keyboard nav | ✓ Complete |

### Future Features (Post-MVP)

| Feature | Rationale | Estimated Effort |
|---------|-----------|------------------|
| Multi-provider support | Allow switching between Soniox, Google Cloud, AWS Transcribe | Medium |
| Transcript history UI | Search/filter/delete transcripts within app (vs file manager) | Small |
| Mobile offline caching | Store common phrases locally for offline lookup | Medium |
| Stronghold keychain | Replace localStorage with platform keychain (macOS Keychain, Windows Credential Manager) | Small |
| Batch transcript processing | Drag-and-drop audio files; queue processing | Large |
| Export formats | PDF, SRT subtitles, markdown transcripts | Medium |
| Advanced audio filters | Noise cancellation, voice activity detection (VAD) | Medium |
| Custom vocabulary | User-defined terms for improved STT accuracy | Small |

---

## Non-Functional Requirements

### Performance

| Metric | Target | Status |
|--------|--------|--------|
| STT latency (interim token) | ≤ 500ms from audio chunk | ✓ Met (Soniox typical ~300ms) |
| Translation latency | ≤ 800ms from STT finalization | ✓ Met |
| TTS playback lag | ≤ 1.5s from translation complete | ✓ Met |
| Startup time | ≤ 2s from app launch to ready state | ✓ Met |
| Memory usage (idle) | ≤ 100MB | ✓ Met |
| Memory usage (recording) | ≤ 200MB | ✓ Met |
| Bundle size (gzipped) | ≤ 300KB | ✓ ~200KB |

### Reliability

- **Connection Resilience**: Exponential backoff (2^n, max 30s) on WebSocket failure
- **Pre-emptive Reconnect**: Reset connection at 280 min to avoid 300min Soniox stream limit
- **Chunk Buffering**: Buffer audio chunks during reconnect; resume playback seamlessly
- **Error Recovery**: Clear error messages; automatic retry after 30s

### Security

- **API Key Storage**: Secure localStorage (future: platform keychain via Tauri)
- **Data at Rest**: Transcripts saved to local disk only; no cloud sync
- **Data in Transit**: TLS 1.3 for all WebSocket connections
- **No Phone Home**: App does not transmit user data outside Soniox API

### Accessibility (WCAG 2.1 AA)

- **Touch Targets**: All interactive elements ≥ 44×44px
- **Color Contrast**: Text ≥ 4.5:1 against background in both light/dark modes
- **Keyboard Navigation**: All controls operable via keyboard
- **Screen Readers**: ARIA labels on icon-only buttons; semantic HTML throughout
- **Motion**: Animations respect `prefers-reduced-motion` media query

### Compatibility

| Platform | Min Version | Status |
|----------|-------------|--------|
| iOS | 13.0 | ✓ Supported |
| Android | 8.0 | ✓ Supported |
| macOS | 10.15 | ✓ Supported |
| Windows | 10 (21H2) | ✓ Supported |
| Linux | Ubuntu 20.04+ | ✓ Supported |

---

## Technical Constraints

1. **Soniox Dependency**: App requires active Soniox API key and network connectivity. Offline mode not planned for MVP.
2. **Audio API**: Requires `getUserMedia` permission; not available in private/incognito windows on some browsers.
3. **Web Speech API Availability**: TTS via browser Web Speech API; quality varies by platform (best on macOS/iOS).
4. **WebSocket Limits**: Soniox enforces 300min max stream duration; app reconnects at 280min preemptively.
5. **File System Access**: Transcripts written to `~/Documents/TranslationAssistant/` via Tauri command; requires permissions on iOS/Android.

---

## Success Metrics

### User Adoption
- 100+ downloads in first month (post-launch)
- 30-day retention rate ≥ 40%

### Quality
- App crash rate < 1% (measured via error tracking, if added)
- Soniox API uptime > 99.9% (inherited from provider)

### User Satisfaction
- NPS ≥ 40 (measured via in-app survey)
- Zero major bugs reported in first week of beta

### Performance
- P95 transcript latency ≤ 1.5s end-to-end
- App memory usage < 150MB while recording

---

## Acceptance Criteria

### For v0.1.0 MVP (Complete)

- [x] User can record audio via microphone with permission prompt
- [x] Soniox WebSocket client connects with exponential backoff
- [x] Interim and final transcription tokens display in real-time
- [x] Translation appears live as tokens finalize
- [x] User can select source/target languages (15+ options)
- [x] User can toggle between text-only and TTS output modes
- [x] TTS plays via Web Speech API queue (non-blocking)
- [x] Transcript auto-saves to disk on recording stop
- [x] User can view list of saved transcripts
- [x] Settings panel allows API key entry + language selection
- [x] App theme toggles between light/dark modes
- [x] All touch targets ≥ 44×44px
- [x] ARIA labels on all icon-only buttons
- [x] No console errors in production build
- [x] App launches in ≤ 2s on target hardware
- [x] Builds successfully for all 5 platforms (macOS, Windows, Linux, iOS, Android)

### For Next Phase (v0.2.0)

- [ ] Transcript history searchable within app
- [ ] Multi-provider support (Google Cloud, AWS)
- [ ] Platform keychain integration for API key storage
- [ ] Offline transcription via local model (e.g., Whisper)

---

## Design Principles

The app follows **mobile-first, distraction-free design**:

1. **Simplicity**: Single recording button; settings hidden in bottom sheet
2. **Responsive**: Works on 320px mobile to 1920px desktop without horizontal scroll
3. **Native Feel**: System fonts, iOS-style spring animations, platform-appropriate gestures
4. **Accessibility**: No emojis; SVG icons; semantic colors (not gray-alone)
5. **Dark Mode**: Full support with CSS custom properties (no image duplication)

See [Design System](./design-system/design-principles.md) for detailed token reference.

---

## Competitive Landscape

| Product | Strengths | Weaknesses | Our Edge |
|---------|-----------|-----------|----------|
| Google Translate | Free, fast, multi-lingual | Cloud-only, privacy concerns | Local, cross-platform |
| Soniox Web | Real-time STT | UI minimal, expensive | Full-featured app, affordable |
| Otter AI | Transcript search, summaries | Subscription-based, cloud-dependent | Desktop-first, local |

**Differentiation**:
- Only true real-time translation (not polling-based)
- Cross-platform parity (iOS = macOS = Windows)
- Local transcript storage (no cloud lock-in)
- Lightweight and open (future: open-source consideration)

---

## Roadmap

### Q2 2026 (Current)
- v0.1.0: MVP launch
- Beta testing with 20+ users
- Bug fixes and stabilization

### Q3 2026
- v0.2.0: Multi-provider support
- Native transcript management UI
- Platform keychain integration
- Analytics dashboard (opt-in)

### Q4 2026
- v0.3.0: Offline transcription (local Whisper model)
- Batch processing for multiple files
- Custom vocabulary support

### 2027
- v1.0.0: Production release
- Marketplace for provider plugins
- Team collaboration (shared transcripts)

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Soniox API changes | Medium | High | Monitor API changelog; version endpoints |
| High Soniox costs at scale | Medium | High | Implement multi-provider; offer tier-based pricing |
| iOS app store rejection | Low | High | Early submission; review guidelines compliance |
| Poor STT accuracy for accents | Medium | Medium | Allow user feedback; improve via Soniox custom models |
| Battery drain on mobile | Low | Medium | Optimize audio chunk size; profile regularly |
| Privacy concerns (audio data) | Low | High | Transparent privacy policy; never persist audio |

---

## Glossary

- **STT**: Speech-to-Text
- **TTS**: Text-to-Speech
- **WebSocket**: Persistent bidirectional TCP connection for real-time streaming
- **AudioWorklet**: Modern Web Audio API for sample-accurate audio processing
- **Soniox**: Third-party real-time speech recognition and translation provider
- **Zustand**: Lightweight React state management library
- **Tauri**: Framework for building lightweight cross-platform desktop/mobile apps with Rust backend

---

## Appendix: Soniox API Overview

**Endpoint**: `wss://api.soniox.com/v1/listen`  
**Authentication**: Bearer token in WebSocket handshake  
**Streaming Format**: 16-bit signed PCM, 16kHz, mono  
**Response Format**: JSON streaming (interim + final tokens)

See [System Architecture](./system-architecture.md#soniox-provider) for connection details and error handling.
