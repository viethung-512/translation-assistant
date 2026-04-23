# V2 shared `transcript-row` — design spec

## Problem

`DetailRow` (`detail-screen.tsx`) and `TranscriptRow` (`main-screen-helpers.tsx`) both render one transcript line (speaker, lang, time, original, translation) with overlapping layout goals but **duplicated markup** and **divergent** chrome (padding, radius, hairline, active tint) and **header** (inline flag/code vs `LangTag`).

## User stories

- As a dev, I render one transcript line from **either** finalized strings (history) **or** streaming tokens (live) without copying styles.
- As a user on **History detail**, row **reading order** matches live: **translation first**, **original second** (intentional change from old `DetailRow` order).
- As a user, **live** rows still show interim token coloring + caret when `active`.

## Decisions (locked)

| Topic | Choice |
|--------|--------|
| Content API | **C — Dual:** strings **or** token arrays (discriminated / mutual exclusivity enforced in types + runtime guard) |
| Container | **A — `variant`:** `"history"` \| `"live"` drives padding, radius, hairline, active background |
| Vertical order | **B — Global:** translation block **above** original block (both variants) |

## Approaches considered

1. **Strings only** — rejected; cannot reuse interim/caret behavior for live without fake tokens.
2. **Tokens only** — rejected; forces adapters on every history row for little gain.
3. **Granular boolean chrome** — rejected; easy to misuse vs `variant`.
4. **Per-variant text order** — rejected; user chose single global order (B).

## Architecture

- **New file:** `src/v2/components/screens/shared/transcript-row.tsx` (export `TranscriptRow` **or** rename to e.g. `UnifiedTranscriptRow` in spec only — implementation plan should pick name that avoids clashing with existing `TranscriptRow` in `main-screen-helpers.tsx`; working name here: **`TranscriptRowShared`** export from `transcript-row.tsx`, then re-export/wrap as needed).
- **Extract** token rendering helper from `main-screen-helpers.tsx` into shared module **or** import from a tiny `transcript-tokens.tsx` next to it if circular deps appear — goal: **one** `renderTokens` implementation.
- **Callers:** `detail-screen.tsx` replaces local `DetailRow` body with shared row + `variant="history"` + string mode. `main-screen.tsx` (via helpers) uses `variant="live"` + token mode; remove duplicated row JSX from `main-screen-helpers.tsx` once wired.

### Props sketch (contract)

```ts
type TranscriptRowBase = {
  variant: "history" | "live";
  s: number; // speaker index for SpeakerLabel
  flag: string;
  code: string;
  time: string;
  isLast?: boolean; // history: hairline; live: typically omit or false
  active?: boolean;   // live: cyan tint; history: false
};

type StringMode = TranscriptRowBase & {
  mode: "strings";
  translatedText: string;
  originalText: string;
};

type TokenMode = TranscriptRowBase & {
  mode: "tokens";
  translatedTokens: readonly Token[]; // same shape as today
  originalTokens: readonly Token[];
};

type TranscriptRowProps = StringMode | TokenMode;
```

- **Header:** both variants use **`LangTag`** from `@/v2/components/ui/primitives` (align live + history; drop `DetailRow` inline flag/code spans).
- **String mode typography:** match **final** token styles from `renderTokens` — translation: 15px, weight 700, `t.cyanText` / `#00A8CC` pattern as today; original: 12px, italic, `t.textMuted`. No caret.
- **Token mode:** existing `renderTokens` + caret when `active` and any non-final token.

### Variant → chrome mapping

| | `history` | `live` |
|--|-----------|--------|
| Padding | `10px 16px` (match current `DetailRow`) | `12px 14px` (match current `TranscriptRow`) |
| Radius | none on outer | `10` |
| Background | transparent | `active ? t.cyanTint : transparent` |
| Hairline | yes when `!isLast`, `marginLeft: 50` | none (or optional later; default none) |

## Data flow

- **History:** `CommittedRow` / stored row → map to `flag`, `code`, `time`, `s`, `originalText`, `translatedText` → `mode: "strings"`, `variant: "history"`.
- **Live:** session buffers → existing `Token[]` → `mode: "tokens"`, `variant: "live"`, `active` from non-final tokens.

## Error handling / edge cases

- **Empty translation or original:** render empty block still reserved height **or** collapse — pick **collapse** (no extra gap) unless design wants rhythm; document in plan.
- **Invalid `mode` + missing fields:** TypeScript prevents; dev build optional `console.warn` if both string and token props passed.
- **`isLast` on live:** ignore or omit prop.

## Testing

- No automated tests today per `CLAUDE.md`. **Manual:** history list hairline + order; live interim colors + caret + tint; typecheck `npx tsc --noEmit`.

## Implementation risks

- **UX:** History detail **order flips** vs old `DetailRow` (translation on top). Accept per stakeholder choice (B).
- **Naming clash:** resolve `TranscriptRow` name vs new file export before merge (alias import in `main-screen-helpers` if re-export).

## Success criteria

- Single shared module under `shared/`; **no** duplicated token style logic.
- `DetailScreen` and live main list both consume it with correct `variant` + `mode`.

## Next steps

- User approves this spec → run **`/plan`** with path `docs/specs/v2-transcript-row-shared-component.md` as context.
