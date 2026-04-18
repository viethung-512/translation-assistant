// Bottom sheet listing past transcript sessions. Fetches on open, refreshes after delete.
// Share falls back to clipboard if tauri-plugin-share is unavailable (Phase 05).
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { openPath } from '@tauri-apps/plugin-opener';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { listTranscripts } from '@/tauri/transcript-fs';
import type { TranscriptMeta } from '@/tauri/transcript-fs';
import { SessionItem } from './session-item';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function HistorySheet({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
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

  const handleShare = useCallback(async (content: string, path: string) => {
    try {
      // openPath on iOS opens the file in the system document viewer which
      // includes the native share sheet — no extra plugin needed
      await openPath(path);
    } catch {
      // Fallback: copy to clipboard
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
          <span style={{ fontSize: 16, fontWeight: 600 }}>{t('history_title')}</span>
          <button
            onClick={onClose}
            aria-label={t('aria_close_history')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 20, color: 'var(--text-secondary)', lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {loading && (
            <p style={{ padding: '16px', fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>
              {t('history_loading')}
            </p>
          )}
          {error && (
            <p style={{ padding: '16px', fontSize: 14, color: 'var(--danger)' }}>{error}</p>
          )}
          {!loading && !error && sessions.length === 0 && (
            <p style={{ padding: '24px 16px', fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>
              {t('history_empty')}
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
