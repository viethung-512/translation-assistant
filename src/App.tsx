// Root layout: top bar (status + settings), translation display, bottom controls.
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

// Error boundary to surface JS crashes instead of blank screen
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', fontSize: 13, color: '#dc2626' }}>
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

  useEffect(() => {
    // Load stored API key into in-memory store on mount
    getApiKey().then((key) => {
      if (key) setApiKey(key);
    });
    // Prime Web Speech voices so the first TTS call has voices ready
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
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: '#fff',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        <StatusBadge status={connectionStatus} />
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Open settings"
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
        >
          ⚙️
        </button>
      </div>

      {/* Error banner — tap to dismiss */}
      {errorMessage && (
        <div
          onClick={() => setError(null)}
          style={{
            background: '#fee2e2',
            padding: '10px 16px',
            color: '#dc2626',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {errorMessage} <span style={{ float: 'right' }}>✕</span>
        </div>
      )}

      {/* Scrollable translation area */}
      <TranslationDisplay />

      {/* Bottom controls */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid #f3f4f6',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: 12, fontSize: 12, color: '#6b7280' }}>
          {outputMode === 'tts' ? '🔊 Voice output' : '📝 Text only'}
          <button
            onClick={() => setOutputMode(outputMode === 'tts' ? 'text' : 'tts')}
            style={{
              marginLeft: 8,
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              background: '#f9fafb',
              cursor: 'pointer',
            }}
          >
            Switch
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
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
