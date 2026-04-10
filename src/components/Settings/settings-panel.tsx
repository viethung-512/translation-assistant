// Slide-up settings panel: API key management, language pickers, output mode toggle.
import { useEffect, useState } from 'react';
import { LanguagePicker } from './language-picker';
import { useSettingsStore } from '@/store/settings-store';
import { saveApiKey, getApiKey, deleteApiKey } from '@/tauri/secure-storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: Props) {
  const { sourceLanguage, targetLanguage, outputMode, setApiKey,
          setSourceLanguage, setTargetLanguage, setOutputMode } = useSettingsStore();
  const [keyInput, setKeyInput] = useState('');
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [saving, setSaving] = useState(false);

  // Check for existing stored key on panel open
  useEffect(() => {
    if (!isOpen) return;
    getApiKey().then((k) => setHasStoredKey(!!k));
  }, [isOpen]);

  const handleSaveKey = async () => {
    if (!keyInput.trim()) return;
    setSaving(true);
    try {
      await saveApiKey(keyInput.trim());
      setApiKey(keyInput.trim());
      setHasStoredKey(true);
      setKeyInput('');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKey = async () => {
    await deleteApiKey();
    setApiKey('');
    setHasStoredKey(false);
    setKeyInput('');
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'flex-end',
    background: isOpen ? 'rgba(0,0,0,0.4)' : 'transparent',
    pointerEvents: isOpen ? 'auto' : 'none',
    transition: 'background 0.2s',
    zIndex: 100,
  };

  const sheetStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 480,
    margin: '0 auto',
    background: '#fff',
    borderRadius: '16px 16px 0 0',
    padding: '20px 20px 32px',
    maxHeight: '70vh',
    overflowY: 'auto',
    transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 0.25s ease',
  };

  return (
    <div style={panelStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={sheetStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Settings</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {/* API Key */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>
            Soniox API Key {hasStoredKey && <span style={{ color: '#22c55e' }}>✓ Stored</span>}
          </label>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder={hasStoredKey ? '••••••••••••' : 'Enter your API key'}
            autoComplete="off"
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={handleSaveKey} disabled={saving || !keyInput.trim()}
              style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>
              {saving ? 'Saving…' : 'Save Key'}
            </button>
            {hasStoredKey && (
              <button onClick={handleDeleteKey}
                style={{ padding: '8px 14px', borderRadius: 8, background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Language pickers */}
        <LanguagePicker label="Source language" value={sourceLanguage}
          onChange={setSourceLanguage} exclude={targetLanguage} />
        <LanguagePicker label="Target language" value={targetLanguage}
          onChange={setTargetLanguage} exclude={sourceLanguage} />

        {/* Output mode */}
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 8 }}>Output mode</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['text', 'tts'] as const).map((mode) => (
              <button key={mode} onClick={() => setOutputMode(mode)}
                style={{
                  flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  background: outputMode === mode ? '#3b82f6' : '#f3f4f6',
                  color: outputMode === mode ? '#fff' : '#374151',
                  border: outputMode === mode ? '2px solid #3b82f6' : '2px solid transparent',
                }}>
                {mode === 'text' ? '📝 Text' : '🔊 Voice'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
