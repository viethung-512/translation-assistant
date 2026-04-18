// Collapsible session row: date header + 80-char preview → expand to full text + actions.
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { readTranscript, deleteTranscript } from '@/tauri/transcript-fs';
import type { TranscriptMeta } from '@/tauri/transcript-fs';
import { Button } from '@/components/ui';

interface Props {
  session: TranscriptMeta;
  onDeleted: (filename: string) => void;
  // content: text to clipboard fallback; path: absolute file path for native share
  onShare: (content: string, path: string) => void;
}

function formatDate(unixSeconds: string, fallback: string): string {
  const ts = Number(unixSeconds) * 1000;
  if (!ts) return fallback;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(ts));
}

function preview(text: string, emptyFallback: string): string {
  const first = text.split('\n').find((l) => l.trim().length > 0) ?? '';
  return first.length > 80 ? first.slice(0, 80) + '…' : first || emptyFallback;
}

export function SessionItem({ session, onDeleted, onShare }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleExpand = useCallback(async () => {
    if (expanded) {
      setExpanded(false);
      setConfirmDelete(false);
      return;
    }
    setExpanded(true);
    if (content !== null) return; // already loaded
    setLoading(true);
    try {
      setContent(await readTranscript(session.name));
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
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
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
          {formatDate(session.createdAt, t('session_unknown_date'))} {expanded ? '∧' : '∨'}
        </div>
        {!expanded && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {content !== null
              ? preview(content, t('session_empty_preview'))
              : preview(session.name.replace('.txt', ''), t('session_empty_preview'))}
          </div>
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '0 16px 12px' }}>
          {loading && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('session_loading')}</p>
          )}
          {error && (
            <p style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</p>
          )}
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

          {content !== null && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? t('session_copied') : t('session_copy')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => onShare(content, session.path)}>
                {t('session_share')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                style={{ color: confirmDelete ? 'var(--danger)' : undefined }}
              >
                {confirmDelete ? t('session_confirm') : t('session_delete')}
              </Button>
              {confirmDelete && (
                <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>
                  {t('session_cancel')}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
