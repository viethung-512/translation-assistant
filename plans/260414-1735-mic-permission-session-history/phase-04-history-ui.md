# Phase 04 — History UI

## Status: pending
## Depends on: Phase 03 (read/delete commands must exist)

## Goal

Add a session history bottom sheet to the app. User taps a History icon in the top bar → sheet slides up → list of past sessions (newest first) → tap to expand → Copy / Share / Delete actions.

## Files

**Create:**
- `src/components/History/history-sheet.tsx`
- `src/components/History/session-item.tsx`

**Modify:**
- `src/App.tsx` — add History icon button + sheet state

---

## Step 1 — Create `session-item.tsx`

Single row in the history list. Handles expand/collapse and loads content lazily on first expand.

```tsx
// src/components/History/session-item.tsx
// Collapsible session row: date header + preview → expand to full text + actions.

import { useState, useCallback } from 'react';
import { readTranscript, deleteTranscript } from '@/tauri/transcript-fs';
import type { TranscriptMeta } from '@/tauri/transcript-fs';
import { Button } from '@/components/ui';

interface Props {
  session: TranscriptMeta;
  onDeleted: (filename: string) => void;
  onShare: (content: string) => void;
}

function formatDate(unixSeconds: string): string {
  const ts = Number(unixSeconds) * 1000;
  if (!ts) return 'Unknown date';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(ts));
}

function preview(text: string): string {
  const first = text.split('\n').find((l) => l.trim().length > 0) ?? '';
  return first.length > 80 ? first.slice(0, 80) + '…' : first;
}

export function SessionItem({ session, onDeleted, onShare }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleExpand = useCallback(async () => {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (content !== null) return; // already loaded
    setLoading(true);
    try {
      const text = await readTranscript(session.name);
      setContent(text);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [expanded, content, session.name]);

  const handleCopy = useCallback(async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try {
      await deleteTranscript(session.name);
      onDeleted(session.name);
    } catch (e) {
      setError((e as Error).message);
      setConfirmDelete(false);
    }
  }, [confirmDelete, session.name, onDeleted]);

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Row header — always visible */}
      <button
        onClick={handleExpand}
        style={{
          width: '100%', textAlign: 'left', padding: '12px 16px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-primary)',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>
          {formatDate(session.createdAt)} {expanded ? '∧' : '∨'}
        </div>
        {!expanded && content === null && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {preview(session.name.replace('.txt', '').replace('T', ' ').replace(/-/g, ':'))}
          </div>
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '0 16px 12px' }}>
          {loading && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading…</p>}
          {error && <p style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</p>}
          {content !== null && (
            <div
              style={{
                maxHeight: 200, overflowY: 'auto', fontSize: 13,
                lineHeight: 1.6, color: 'var(--text-primary)',
                marginBottom: 10, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}
            >
              {content}
            </div>
          )}

          {/* Action bar */}
          {content !== null && (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => onShare(content)}>
                Share
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                style={{ color: confirmDelete ? 'var(--danger)' : undefined }}
              >
                {confirmDelete ? 'Confirm delete?' : 'Delete'}
              </Button>
              {confirmDelete && (
                <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Step 2 — Create `history-sheet.tsx`

```tsx
// src/components/History/history-sheet.tsx
// Bottom sheet listing past transcript sessions. Fetches on open, refreshes after delete.

import { useState, useEffect, useCallback } from 'react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { listTranscripts } from '@/tauri/transcript-fs';
import type { TranscriptMeta } from '@/tauri/transcript-fs';
import { SessionItem } from './session-item';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function HistorySheet({ isOpen, onClose }: Props) {
  const [sessions, setSessions] = useState<TranscriptMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch list whenever sheet opens
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    listTranscripts()
      .then(setSessions)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleDeleted = useCallback((filename: string) => {
    setSessions((prev) => prev.filter((s) => s.name !== filename));
  }, []);

  const handleShare = useCallback(async (content: string) => {
    try {
      // Primary: tauri-plugin-share (added in Phase 05)
      const { share } = await import('@tauri-apps/plugin-share');
      await share({ text: content });
    } catch {
      // Fallback: clipboard
      await navigator.clipboard.writeText(content).catch(() => {});
    }
  }, []);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: '16px 0 8px' }}>
        {/* Sheet header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 16px 12px', borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Session History</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 20, color: 'var(--text-secondary)' }}
            aria-label="Close history"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {loading && (
            <p style={{ padding: '16px', fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>
              Loading…
            </p>
          )}
          {error && (
            <p style={{ padding: '16px', fontSize: 14, color: 'var(--danger)' }}>{error}</p>
          )}
          {!loading && !error && sessions.length === 0 && (
            <p style={{ padding: '24px 16px', fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>
              No sessions yet. Start a recording to create one.
            </p>
          )}
          {sessions.map((s) => (
            <SessionItem
              key={s.name}
              session={s}
              onDeleted={handleDeleted}
              onShare={handleShare}
            />
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
```

**Note on share:** `handleShare` dynamically imports `@tauri-apps/plugin-share` (added in Phase 05). Dynamic import means the build won't fail if the plugin isn't installed yet — it just falls back to clipboard. Install the plugin in Phase 05 before shipping.

---

## Step 3 — Add History icon + sheet to `App.tsx`

### 3a — Add the History icon SVG (inline, like existing icons)

```tsx
function IconHistory() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
    </svg>
  );
}
```

### 3b — Add state + button in `App()` (top bar, left of theme toggle)

```tsx
const [historyOpen, setHistoryOpen] = useState(false);

// In the top bar right-side div, before the theme toggle:
<IconButton aria-label="View session history" onClick={() => setHistoryOpen(true)}>
  <IconHistory />
</IconButton>
```

### 3c — Add sheet below `SettingsPanel`

```tsx
<HistorySheet isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
```

### 3d — Import at top of `App.tsx`

```tsx
import { HistorySheet } from '@/components/History/history-sheet';
```

---

## Step 4 — TypeScript compile check

```bash
npx tsc --noEmit
```

Expected: one TS error on `@tauri-apps/plugin-share` import (not installed yet) — this is acceptable and resolves in Phase 05. All other errors must be zero.

---

## Todo

- [ ] Create `src/components/History/session-item.tsx`
- [ ] Create `src/components/History/history-sheet.tsx`
- [ ] Add `IconHistory` to `App.tsx`
- [ ] Add `historyOpen` state + `HistorySheet` to `App.tsx`
- [ ] `npx tsc --noEmit` passes (plugin-share error acceptable until Phase 05)

## Risks

| Risk | Mitigation |
|---|---|
| `BottomSheet` doesn't support `maxHeight: 60vh` inner scroll | Check existing `bottom-sheet.tsx` impl; may need `overflow: hidden` on the sheet itself |
| Confirm-delete state persists if user scrolls away | `setConfirmDelete(false)` on collapse (`setExpanded(false)`) |
| Large session content (many lines) makes sheet laggy | `maxHeight: 200px` + inner scroll caps visible area |
