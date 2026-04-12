# System Architecture

**Version**: 0.1.0  
**Last Updated**: April 2026

Detailed architecture documentation covering design patterns, data flow, and resilience strategies.

## Contents

- [Overview & Diagram](./overview.md) — System architecture diagram and component breakdown
- [Audio Pipeline](./audio-pipeline.md) — Microphone capture, PCM processing, streaming to Soniox
- [Soniox Provider](./soniox-provider.md) — WebSocket client, token handling, error recovery
- [State Management](./state-management.md) — Zustand stores, data persistence, lifecycle
- [Connection Resilience](./connection-resilience.md) — Exponential backoff, preemptive reconnect, chunk buffering
- [Tauri Integration](./tauri-integration.md) — IPC commands, file I/O, path handling
- [Security Architecture](./security-architecture.md) — API key storage, data protection, CSP
- [Performance & Scaling](./performance-scaling.md) — Memory, CPU, bandwidth, optimization strategies

## Quick Start

**New to the codebase?** Start with [Overview & Diagram](./overview.md), then dive into specific topics.

**Looking for specific answers?**
- How does audio get captured? → [Audio Pipeline](./audio-pipeline.md)
- How does connection recovery work? → [Connection Resilience](./connection-resilience.md)
- Where is my API key stored? → [Security Architecture](./security-architecture.md)
- How much memory does the app use? → [Performance & Scaling](./performance-scaling.md)

## Architecture Principles

1. **Provider Abstraction**: STTProvider interface allows swappable providers (Soniox, Google, AWS)
2. **State Isolation**: SessionStore (ephemeral) separate from SettingsStore (persistent)
3. **Non-blocking Audio**: AudioWorklet prevents main-thread blocking
4. **Graceful Degradation**: Connection loss → buffer chunks → auto-reconnect
5. **Platform Parity**: Same code runs on iOS, Android, macOS, Windows, Linux

## Cross-Reference

- [Codebase Summary](../codebase-summary.md) — Module-by-module breakdown
- [Code Standards](../code-standards.md) — Implementation guidelines
- [Project Overview](../project-overview-pdr.md) — Requirements and roadmap
