# V2 Main Screen Live Focus + Sentence Segmentation

## Problem statement

`main-screen` currently renders only one active `TranscriptRow` from the in-flight token buffers. This causes two UX gaps:

- The currently translating content is not managed as a persistent "live focus" area while users review history.
- Multi-sentence speech from one speaker is collapsed into one row instead of sentence-level rows.

## User stories

- As a user, I can always return to live translation quickly while still reviewing older transcript history.
- As a user, when a speaker says multiple sentences, I see one `TranscriptRow` per sentence.
- As a user, each row remains compact and readable (target: maximum 2 visible lines), with continuation rows when needed.

## Scope and constraints

- In scope: `src/v2/components/screens/main-screen.tsx` and transcript row rendering helpers used by this screen.
- In scope: active/live transcript list behavior during an ongoing session.
- Out of scope: persistence schema changes, historical transcript migrations, backend/API changes.
- Must keep existing core row identity visuals (speaker identity, transcript readability, translation emphasis).

## Brainstorm decisions

- Live focus behavior: **Hybrid** (`auto-scroll when near live`; if user scrolls up, pause auto-scroll and expose `Jump to live`).
- Sentence boundary rule: **Option C** (primary punctuation/time-gap boundaries, plus deterministic size fallback chunking when punctuation is absent).
- Max-2-line behavior: **Option C** (overflow creates continuation rows for same speaker, instead of clipping).
- Bonus row trigger: create a new row when `token.speaker !== latestSpeaker` **or** accumulated row words `>= ROW_WORD_SPLIT_THRESHOLD`.
- `ROW_WORD_SPLIT_THRESHOLD` default value: `18` (defined as a constant for easy tuning).

## Evaluated approaches

### Approach A: Keep current single active row + add minor scrolling tweaks

- Pros: smallest code diff
- Cons: does not satisfy per-sentence rows; poor long-session readability
- Verdict: rejected

### Approach B: Add sentence splitting directly inside `TranscriptRow`

- Pros: fast initial implementation
- Cons: heavy component responsibility; weak reuse/testability; harder to evolve
- Verdict: rejected

### Approach C: Segment into row view-models in screen layer, keep rows presentational

- Pros: explicit data/view boundary, easier testing, easier future transcript reuse
- Cons: moderate refactor in `main-screen`
- Verdict: selected

## Final design

### Architecture and components

- Introduce a segmentation pipeline that transforms active token streams into ordered "display rows".
- Keep `TranscriptRow` presentational for one rendered row.
- `main-screen` owns:
  - live vs history scroll state
  - row model generation
  - rendering list + `Jump to live` control

### Data flow and interfaces

1. Inputs:
   - `originalTokens`
   - `translatedTokens`
2. Build normalized timeline events with deterministic sort keys.
3. Group events by contiguous speaker runs.
4. Inside each speaker run, split by sentence boundaries:
   - punctuation boundary (`.`, `?`, `!`, `…`) when final enough to commit
   - time gap boundary when silence threshold exceeded
   - fallback chunking boundary to enforce compact row length (`ROW_WORD_SPLIT_THRESHOLD`)
5. For each resulting sentence unit, create one row view-model:
   - `speaker`
   - `language metadata`
   - `originalTokens[]`
   - `translatedTokens[]`
   - `end_ms`
   - `isActive`
   - `isContinuation` (for overflow continuation rows)
6. Render rows in order; newest row is live target.

### Live focus and scrolling behavior

- Auto-follow behavior enabled when user is near bottom of transcript container.
- If user scrolls upward beyond threshold:
  - suspend auto-follow
  - keep live row updating off-screen
  - show a `Jump to live` affordance
- Clicking `Jump to live`:
  - scrolls to live row anchor
  - re-enables auto-follow
- This preserves both live interpretation and history review without fighting user scroll intent.

### Sentence and continuation rules

- Primary goal: one sentence per row when detectable.
- Hard row split triggers (priority):
  - speaker change (`token.speaker !== latestSpeaker`)
  - accumulated words in current row `>= ROW_WORD_SPLIT_THRESHOLD`
- If sentence text exceeds compact display target:
  - split into continuation rows for the same speaker
  - no content loss
  - continuation rows remain adjacent and ordered
- When punctuation is missing for long stretches:
  - deterministic fallback chunking prevents unbounded row growth.

## Error handling and edge cases

- No tokens -> preserve existing empty-state behavior.
- Missing/invalid speaker -> map to `Unknown Speaker`.
- Missing `end_ms` -> stable fallback ordering based on stream index.
- Mixed-language tokens in one row -> neutral language tag (`🌐`, `…`) when needed.
- Rows containing only one side (orig/trans) remain renderable.

## Testing strategy

- Unit tests for row-model segmentation:
  - same speaker, two clear sentences -> two rows
  - same speaker without punctuation, row reaches `ROW_WORD_SPLIT_THRESHOLD` words -> forced new row
  - speaker switch before punctuation -> immediate new row
  - same speaker, long no-punctuation speech -> fallback continuation rows
  - multi-speaker alternation + repeated speaker re-entry
  - missing `end_ms` deterministic ordering
  - unknown speaker normalization
- UI integration checks:
  - auto-follow when near live bottom
  - user scroll-up disables auto-follow
  - `Jump to live` restores live focus
  - each row stays compact while preserving full text across continuation rows

## Risks and mitigations

- Risk: row churn while tokens are interim/final.
  - Mitigation: finalize boundaries conservatively; keep stable row keys.
- Risk: language-agnostic sentence splitting is imperfect.
  - Mitigation: prefer deterministic chunk fallback over aggressive NLP assumptions.
- Risk: scroll jitter from rapid updates.
  - Mitigation: thresholded auto-follow + requestAnimationFrame batched scroll updates.

## Success metrics

- Active translation is always recoverable instantly via `Jump to live`.
- Same-speaker multi-sentence input produces multiple rows.
- No transcript clipping; overflow is represented via continuation rows.
- Users can inspect history without forced snapping during live updates.

## Next steps

1. Implement row-model segmentation utility used by `main-screen`.
2. Refactor live transcript body to render row list instead of single row.
3. Add hybrid auto-follow + `Jump to live` interaction.
4. Define and use a single constant (`ROW_WORD_SPLIT_THRESHOLD = 18`) instead of magic numbers.
5. Validate with manual streaming sessions and targeted unit tests.
