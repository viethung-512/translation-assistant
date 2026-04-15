---
title: Soniox SDK Migration
status: complete
created: 2026-04-15
completed: 2026-04-15
spec: plans/reports/brainstorm-260415-1616-soniox-sdk-migration.md
---

# Soniox SDK Migration

Replace ~694 LOC of hand-rolled WebSocket, audio capture, and token state with `@soniox/react`.

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Rust Audio Layer Removal](phase-01-rust-cleanup.md) | complete | small |
| 2 | [Delete TS Files + Install SDK](phase-02-delete-ts-and-install.md) | complete | small |
| 3 | [Rewrite use-translation-session.ts](phase-03-rewrite-session-hook.md) | complete | medium |
| 4 | [Update App.tsx + TranslationDisplay](phase-04-update-components.md) | complete | small |

## Key Dependencies

- Phase 1 and 2 can run in either order or simultaneously
- Phase 3 depends on Phase 2 (SDK installed, old files gone)
- Phase 4 depends on Phase 3 (hook contract finalized)

## Net Change Estimate

- **Deleted:** ~694 LOC across 9 files/dirs
- **New/rewritten:** ~120 LOC
- **Net:** −574 LOC

## Spec

[brainstorm-260415-1616-soniox-sdk-migration.md](../reports/brainstorm-260415-1616-soniox-sdk-migration.md)
