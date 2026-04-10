// Root layout: top bar (status + settings + theme toggle), translation display, bottom controls.
import { Component, useEffect, useState } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { useTranslationSession } from '@/hooks/use-translation-session';
import { useSessionStore } from '@/store/session-store';
import { useSettingsStore } from '@/store/settings-store';
import { getApiKey } from '@/tauri/secure-storage';
import { TranslationDisplay } from '@/components/TranslationDisplay/translation-display';
import { RecordButton } from '@/components/Controls/record-button';
import { StatusBadge } from '@/components/Controls/status-badge';
import { SettingsPanel } from '@/components/Settings/settings-panel';
import { useTheme } from '@/theme/use-theme';
import { Button, ErrorBanner, IconButton } from '@/components/ui';

// Error boundary — surfaces JS crashes instead of blank screen
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  componentDidCatch(e: Error, info: ErrorInfo) { console.error('[ErrorBoundary]', e, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', fontSize: 13, color: 'var(--danger)' }}>
          <strong>App Error</strong>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: 8 }}>
            {(this.state.error as Error).message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Gear icon SVG
function IconSettings() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

// Sun / Moon theme toggle icon
function IconTheme({ isDark }: { isDark: boolean }) {
  return isDark ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// Speaker / Text mode icons
function IconSpeaker() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}
function IconText() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}

export default function App() {
  const { startSession, stopSession } = useTranslationSession();
  const recordingStatus = useSessionStore((s) => s.recordingStatus);
  const connectionStatus = useSessionStore((s) => s.connectionStatus);
  const errorMessage = useSessionStore((s) => s.errorMessage);
  const setError = useSessionStore((s) => s.setError);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const outputMode = useSettingsStore((s) => s.outputMode);
  const setOutputMode = useSettingsStore((s) => s.setOutputMode);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    getApiKey().then((key) => { if (key) setApiKey(key); });
    if (typeof window.speechSynthesis !== 'undefined' &&
        window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {};
    }
  }, [setApiKey]);

  const handleRecordToggle = () => {
    if (recordingStatus === 'idle') startSession();
    else if (recordingStatus === 'recording') stopSession();
  };

  return (
    <ErrorBoundary>
      <div style={{
        maxWidth: 500,
        margin: '0 auto',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}>

        {/* ── Top bar ─────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-primary)',
          minHeight: 52,
        }}>
          <StatusBadge status={connectionStatus} />
          <div className="flex items-center gap-1">
            <IconButton
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleTheme}
            >
              <IconTheme isDark={theme === 'dark'} />
            </IconButton>
            <IconButton aria-label="Open settings" onClick={() => setSettingsOpen(true)}>
              <IconSettings />
            </IconButton>
          </div>
        </div>

        {/* ── Error banner ─────────────────────────────────────────── */}
        <ErrorBanner message={errorMessage} onDismiss={() => setError(null)} />

        {/* ── Scrollable translation area ───────────────────────────── */}
        <TranslationDisplay />

        {/* ── Bottom controls ──────────────────────────────────────── */}
        <div style={{
          padding: '12px 16px',
          paddingBottom: `calc(12px + env(safe-area-inset-bottom, 0px))`,
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-primary)',
        }}>
          {/* Output mode toggle */}
          <div className="flex items-center justify-center gap-[6px] mb-[14px] text-[12px] text-text-secondary">
            <span className="flex items-center gap-1">
              {outputMode === 'tts' ? <IconSpeaker /> : <IconText />}
              {outputMode === 'tts' ? 'Voice output' : 'Text only'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOutputMode(outputMode === 'tts' ? 'text' : 'tts')}
            >
              Switch
            </Button>
          </div>

          <div className="flex justify-center">
            <RecordButton
              isRecording={recordingStatus === 'recording'}
              isDisabled={recordingStatus === 'stopping' || connectionStatus === 'connecting'}
              onClick={handleRecordToggle}
            />
          </div>
        </div>

        <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </ErrorBoundary>
  );
}
