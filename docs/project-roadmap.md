# Translation Assistant — Project Roadmap

**Version**: 0.1.0  
**Last Updated**: April 18 2026  
**Status**: MVP Complete → Radix UI Migration Complete → Beta Testing Phase

---

## Release Timeline

### v0.1.0 — MVP (Current) ✓ COMPLETE

**Release Date**: April 2026  
**Status**: Ready for beta testing  
**Focus**: Core real-time translation functionality

#### Completed Features

- [x] Real-time STT via Soniox WebSocket API
- [x] Live target language translation
- [x] AudioWorklet-based audio capture (16kHz PCM)
- [x] 15+ language pairs supported
- [x] Text-only and TTS voice output modes
- [x] Automatic transcript save to disk
- [x] Transcript history view
- [x] Settings panel (API key, language, output mode)
- [x] Light/dark theme with persistence
- [x] Accessibility: 44×44px touch targets, ARIA labels, keyboard nav
- [x] Cross-platform builds (macOS, Windows, Linux, iOS, Android)
- [x] Connection resilience (exponential backoff, 280min preemptive reconnect)
- [x] ErrorBoundary and error banner
- [x] Mobile-optimized UI (responsive layout, safe areas)
- [x] Radix UI Themes migration (zero Tailwind, all components modernized)
- [x] Recording controls (pause/resume, clear transcript, history delete modal)

#### Known Limitations (By Design)

- Offline mode not supported (requires live Soniox connection)
- No transcript search within app (user can access files via file manager)
- API key stored in localStorage (not encrypted; migrate to keychain v1.0)
- No batch processing (single recording at a time)
- TTS voice selection limited to browser defaults (no custom voice switching)
- No transcript editing or annotation

#### Metrics

- **App Size**: ~150MB (macOS), ~120MB (Windows), ~110MB (Linux)
- **Memory Idle**: ~90MB
- **Memory Recording**: ~100–200MB peak
- **Startup Time**: <2s
- **STT Latency**: 300–500ms (Soniox dependent)
- **Bundle Size**: ~200KB gzipped (React + Zustand + UI)

---

### v0.2.0 — Enhanced Features (Q3 2026)

**Estimated Duration**: 6–8 weeks  
**Status**: Planned  
**Focus**: Multi-provider support, improved UI, better transcript management

#### Planned Features

| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| Multi-provider support | High | Large | Add Google Cloud Speech-to-Text, AWS Transcribe options |
| Transcript history UI | High | Small | Search, filter, delete transcripts within app (not file manager) |
| Platform keychain integration | High | Small | Replace localStorage with Tauri `tauri-plugin-keychain` |
| Custom vocabulary | Medium | Medium | User-defined terms for improved STT accuracy |
| Batch processing queue | Medium | Large | Drag-drop audio files; process multiple at once |
| Export formats | Medium | Medium | PDF, SRT subtitles, Markdown transcripts |
| Recording quality indicator | Low | Small | Show confidence score and audio level meter |
| Transcript timestamp markers | Low | Small | Click to replay audio from specific timestamp |

#### Architecture Changes

- **Provider Factory**: Create `ProviderFactory` to instantiate appropriate provider (Soniox, Google, AWS)
- **Settings Expansion**: Add provider selection dropdown; store provider-specific API keys
- **Transcript Schema**: Add metadata (provider used, confidence, creation timestamp)
- **Keychain Plugin**: Replace localStorage with `tauri-plugin-keychain` for secure API key storage

#### Database (If Needed)

Consider adding local SQLite via Tauri if transcript history becomes complex:
```rust
// tauri-plugin-sql: query transcripts by date, language, provider
SELECT * FROM transcripts WHERE created_at > ? ORDER BY created_at DESC LIMIT 20;
```

---

### v0.3.0 — Offline & Automation (Q4 2026)

**Estimated Duration**: 8–10 weeks  
**Status**: Planned  
**Focus**: Offline transcription, automation, advanced features

#### Planned Features

| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| Offline transcription | High | Large | Embed local Whisper model; fallback if no internet |
| Scheduled recording | Medium | Medium | Record at specific times (meetings, events) |
| Noise reduction | Medium | Medium | Web Audio API filters; improve audio quality |
| Voice activity detection (VAD) | Medium | Medium | Auto-stop when silence detected |
| Transcript diff viewer | Low | Small | Compare two transcripts; highlight changes |
| Export to external services | Low | Medium | Send to Google Docs, Notion, Slack |

#### Technical Approach

- **Whisper.cpp**: Lightweight C++ Whisper implementation for Tauri
- **Web Audio Filters**: Implement high-pass filter, noise gate via AudioWorklet
- **WebRTC VAD**: Use `vosk` or similar for activity detection

---

### v1.0.0 — Production Release (2027)

**Estimated Duration**: 6 months of development + stabilization  
**Status**: Future  
**Focus**: Stability, performance, marketplace

#### Planned Features

- [x] All v0.2.0 features
- [x] All v0.3.0 features
- [ ] Plugin marketplace (community-contributed providers)
- [ ] Team collaboration (share transcripts, comments)
- [ ] Analytics dashboard (usage, language preferences)
- [ ] Mobile PWA fallback (for users without app)
- [ ] Accessibility audit (WCAG 2.1 AAA certification)
- [ ] Security audit (penetration testing, keychain audit)
- [ ] Localization (10+ UI languages)

#### Success Criteria for v1.0.0

- 10k+ active users
- NPS ≥ 50
- Crash rate < 0.1%
- P95 latency ≤ 1.2s
- 4.5+ star rating on all app stores
- Security audit passed

---

## Feature Backlog (Future Releases)

### High-Value, Lower-Priority

| Feature | Rationale | Estimated Effort |
|---------|-----------|------------------|
| Transcript summarization | Help users quickly grasp long conversations | Large |
| Real-time speaker diarization | Identify who is speaking (multi-speaker support) | Large |
| Custom accent models | Improve accuracy for regional accents | Medium |
| Transcript sentiment analysis | Gauge emotional tone of conversation | Small |
| Time-based transcript statistics | Show word count, speaking time, language distribution | Medium |
| Mobile offline recording | Record audio offline, transcribe later | Medium |
| Stronghold keychain (advanced) | Tauri Stronghold for encrypted storage | Small |
| Streaming to cloud storage | Auto-backup transcripts to S3, OneDrive, Dropbox | Medium |

### Lower-Priority, Nice-to-Have

- Real-time closed captions UI (floating overlay)
- Integration with video conferencing (Zoom, Teams, Google Meet)
- Voice cloning (synthesize output in user's voice)
- Multilingual input (detect source language automatically)
- Custom TTS voices (paid 3rd-party service)

---

## Current Sprint Status

### This Quarter (Q2 2026)

**Goal**: v0.1.0 MVP release and beta testing

| Phase | Status | Owner | Notes |
|-------|--------|-------|-------|
| Development | ✓ Complete | — | All features implemented; Radix UI migration complete |
| Radix UI Migration | ✓ Complete | Dev Team | Zero Tailwind; all 12+ components modernized; tsc --noEmit passes |
| Testing | ⏳ In Progress | QA | Manual testing on all 5 platforms |
| Documentation | ✓ Complete | Docs Manager | README, architecture, code standards, Radix Themes guide |
| Beta Signup | ⏳ Launching Soon | Marketing | Sign-up form for early testers |
| Bug Fixes | ⏳ Ongoing | Dev Team | Address issues from beta feedback |

### Next Sprint (Q3 2026)

**Goal**: v0.2.0 planning and design

| Phase | Status | Owner | Timeline |
|-------|--------|-------|----------|
| Requirements | ⏳ Pending | Product | Review user feedback from v0.1.0 beta |
| Design | ⏳ Pending | Design | Multi-provider UI mockups |
| Architecture Review | ⏳ Pending | Tech Lead | Keychain plugin integration |
| Development Kickoff | ⏳ Pending | Dev Team | Week of June 2026 |

---

## Risk Assessment & Mitigation

### High-Risk Items

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Soniox API deprecation | Low | High | Monitor changelog; maintain SDK version | 
| Multi-provider integration complexity | Medium | High | Spike research in v0.2.0 planning phase |
| iOS app store rejection | Low | High | Involve Apple compliance early; test with reviewers |
| User data privacy concerns | Low | High | Clear privacy policy; no telemetry without opt-in |

### Dependency Risks

| Dependency | Version | Risk | Mitigation |
|-----------|---------|------|-----------|
| Soniox API | Proprietary | API changes, cost increases | Monitor pricing; plan fallback provider |
| Tauri | 2.x | Framework bugs, security issues | Track releases; security patches on day 1 |
| React | 18.3.1 | Deprecated features, breaking changes | Follow React RFC; test majors before upgrade |
| Rust ecosystem | 1.70+ | crate instability, dependency conflicts | Audit dependencies quarterly; lock versions |

---

## Performance Roadmap

### Current State (v0.1.0)

- STT latency: 300–500ms (Soniox dependent)
- Memory: 90–200MB
- Bundle: 150–200MB per platform
- Startup: <2s

### v0.2.0 Goals

- Improve transcript search speed (indexed DB)
- Reduce memory for long sessions (stream-based approach)
- Keychain integration (faster API key retrieval)

### v0.3.0+ Goals

- Offline Whisper: sub-100ms latency (local)
- Reduce app size with code splitting (lazy-load providers)
- Optimize mobile battery usage (audio processing)

---

## Localization Roadmap

### v0.1.0 (Current)

- UI language: English (default)
- Languages supported: 15+ (for transcription, not UI)

### v0.2.0

- Add support for common UI languages:
  - Spanish, French, German, Mandarin, Japanese

### v1.0.0

- Expand to 20+ UI languages
- Localized help docs
- RTL language support (Arabic, Hebrew)

---

## Business Roadmap

### Go-to-Market (Post-MVP)

1. **Soft Launch** (May 2026)
   - Invite 50 beta users via private link
   - Gather feedback; fix critical bugs
   - Testimonials for marketing

2. **Public Beta** (June 2026)
   - Open beta signup
   - Press coverage (tech blogs, newsletters)
   - 500–1,000 beta testers

3. **General Availability** (July 2026)
   - Release on macOS, Windows, Linux (web download)
   - App Store submissions (iOS, Android) pending review

### Monetization (v0.2.0+)

- **Free Tier**: 50 min/month translation (Soniox credits)
- **Pro Tier**: $9.99/mo (500 min, multiple providers)
- **Enterprise**: Custom pricing (team collaboration, API access)

**Current** (v0.1.0): Free app with user-supplied Soniox API key (they pay Soniox directly).

---

## Documentation Roadmap

### Completed (v0.1.0)

- [x] README.md — Quick start and overview
- [x] System Architecture — Detailed design docs
- [x] Code Standards — Coding conventions
- [x] Codebase Summary — Module reference
- [x] Project Overview & PDR — Requirements and roadmap
- [x] Design System — UI tokens and accessibility

### Planned (v0.2.0+)

- [ ] API documentation (for plugin developers)
- [ ] Provider integration guide (add your own STT)
- [ ] User manual / tutorial videos
- [ ] Troubleshooting guide (expand from README)
- [ ] Mobile-specific setup guides

---

## Community & Feedback

### Feedback Channels (v0.1.0+)

- **Issue tracker**: GitHub Issues (feature requests, bugs)
- **User forum**: Discord or Reddit community
- **Email**: support@translation-assistant.app

### Feedback Goals

- Collect 100+ feature requests
- Prioritize v0.2.0 features based on demand
- Identify language accuracy pain points
- Measure user satisfaction (NPS surveys)

---

## Maintenance & Support

### Release Cadence

- **Patch releases** (v0.1.x): Weekly or as-needed (critical bugs)
- **Minor releases** (v0.2.0, v0.3.0): Quarterly
- **Major releases** (v1.0.0): Annually

### Support Plan

- **v0.1.0 beta**: Community support (GitHub Issues)
- **v0.2.0+**: Dedicated support team (email, Discord)
- **v1.0.0+**: SLA-based support for paid tiers

### Sunset Policy

Old versions supported for 6 months after next major release. Users encouraged to upgrade for security and performance.

---

## Success Metrics

### User Adoption

| Milestone | Target | Timeline |
|-----------|--------|----------|
| Beta testers | 100+ | End of April 2026 |
| Public beta users | 500+ | June 2026 |
| GA users | 1,000+ | August 2026 |
| 10k users | — | Q4 2026 |

### Engagement

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily active users | 40% of installs | Via Soniox API calls |
| Avg session length | 15+ min | UI telemetry |
| Transcript save frequency | 2+ per week | File system API calls |

### Quality

| Metric | Target | Measurement |
|--------|--------|-------------|
| Crash rate | <1% | Sentry or similar |
| STT accuracy | >95% on clear audio | User feedback |
| App store rating | 4.5+ stars | App stores |
| Bug resolution time | <1 week | Issue tracker |

---

## Technical Debt

### Known Issues (By Design for v0.1.0)

- [ ] API key stored in cleartext localStorage (migrate to keychain v0.2.0)
- [ ] No transcript search (add DB index v0.2.0)
- [ ] Monolithic settings panel (split components v0.2.0)
- [ ] Single Soniox provider (add abstraction v0.2.0)
- [ ] No analytics (add opt-in telemetry v0.3.0)

### Code Quality Improvements

- [ ] Add unit tests (aim for 80% coverage by v0.2.0)
- [ ] Refactor `use-translation-session.ts` if >150 LOC (currently 112)
- [ ] Add E2E tests via Tauri test runner
- [ ] Dependency audit quarterly

---

## Decision Log

### Why Soniox?

- Real-time streaming (not polling-based)
- High accuracy for accents
- Good pricing for startups
- Easy WebSocket API

**Alternative Considered**: Google Cloud Speech-to-Text (more expensive, overkill for MVP)

### Why Zustand (not Redux)?

- Lightweight (5KB vs Redux 50KB)
- Simple API (setState pattern, no boilerplate)
- Persist middleware built-in
- Good for cross-platform (Tauri + React Native compatible)

### Why AudioWorklet (not ScriptProcessorNode)?

- AudioWorklet runs off main thread (better performance)
- Lower latency (sample-accurate)
- Deprecated ScriptProcessorNode; future-proof

---

## Appendix: Language Support Matrix

### Supported Languages (v0.1.0)

| Code | Language | STT | Translation |
|------|----------|-----|-------------|
| en | English | ✓ | ✓ |
| es | Spanish | ✓ | ✓ |
| fr | French | ✓ | ✓ |
| de | German | ✓ | ✓ |
| it | Italian | ✓ | ✓ |
| pt | Portuguese | ✓ | ✓ |
| ja | Japanese | ✓ | ✓ |
| ko | Korean | ✓ | ✓ |
| zh | Mandarin | ✓ | ✓ |
| ru | Russian | ✓ | ✓ |
| ar | Arabic | ✓ | ✓ |
| hi | Hindi | ✓ | ✓ |
| vi | Vietnamese | ✓ | ✓ |
| th | Thai | ✓ | ✓ |
| pl | Polish | ✓ | ✓ |

**Total**: 15 languages (v0.1.0), expandable to 50+ via Soniox

---

## Contact & Ownership

| Role | Owner | Contact |
|------|-------|---------|
| Product Manager | — | (TBD) |
| Technical Lead | — | (TBD) |
| Documentation | — | (TBD) |
| QA | — | (TBD) |

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 0.1.0 | April 2026 | MVP release; Soniox integration |
| 0.2.0 | (Planned) Q3 2026 | Multi-provider, transcript history, keychain |
| 0.3.0 | (Planned) Q4 2026 | Offline, VAD, batch processing |
| 1.0.0 | (Planned) 2027 | Production release; plugin marketplace |

---

## How to Contribute to Roadmap

1. **Suggest features**: Open a GitHub Issue with `[FEATURE]` prefix
2. **Vote on priorities**: React to issues with thumbs up
3. **Provide feedback**: Join Discord community and discuss in #roadmap
4. **Contribute code**: Submit PR aligned with current sprint goals

See [Code Standards](./code-standards.md) for contribution guidelines.

---

## References

- [Project Overview & PDR](./project-overview-pdr.md) — Requirements and vision
- [System Architecture](./system-architecture.md) — Design details
- [Code Standards](./code-standards.md) — Development guidelines
