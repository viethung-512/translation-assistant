// Slide-up settings sheet: API key, language pickers, output mode toggle.
import { useEffect, useState } from 'react';
import { LanguagePicker } from './language-picker';
import { useSettingsStore } from '@/store/settings-store';
import { saveApiKey, getApiKey, deleteApiKey } from '@/tauri/secure-storage';
import { BottomSheet, Button, IconButton } from '@/components/ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// Close (X) icon
function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// Check icon for "stored" indicator
function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function SettingsPanel({ isOpen, onClose }: Props) {
  const { sourceLanguage, targetLanguage, outputMode, setApiKey,
          setSourceLanguage, setTargetLanguage, setOutputMode } = useSettingsStore();
  const [keyInput, setKeyInput] = useState('');
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [saving, setSaving] = useState(false);

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

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="px-5 pb-0 max-h-[72vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-[22px]">
          <h2 className="m-0 text-heading text-text-primary">Settings</h2>
          <IconButton aria-label="Close settings" onClick={onClose} className="rounded-full bg-bg-tertiary">
            <IconClose />
          </IconButton>
        </div>

        {/* API Key */}
        <div className="mb-5">
          <label className="flex items-center gap-[6px] text-label text-text-muted mb-[6px]">
            Soniox API Key
            {hasStoredKey && (
              <span className="flex items-center gap-[3px] text-success text-[11px]">
                <IconCheck /> Stored
              </span>
            )}
          </label>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder={hasStoredKey ? '••••••••••••' : 'Enter your API key'}
            autoComplete="off"
            className="w-full px-3 py-[10px] rounded-[10px] border border-border text-[15px] bg-bg-secondary text-text-primary outline-none focus:border-accent"
          />
          <div className="flex gap-2 mt-2">
            <Button
              variant="primary"
              onClick={handleSaveKey}
              disabled={saving || !keyInput.trim()}
              className="flex-1 rounded-[10px] text-[14px] font-medium"
            >
              {saving ? 'Saving…' : 'Save Key'}
            </Button>
            {hasStoredKey && (
              <Button
                variant="danger"
                onClick={handleDeleteKey}
                className="rounded-[10px] text-[14px] font-medium px-4"
              >
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Language pickers */}
        <LanguagePicker label="Source language" value={sourceLanguage}
          onChange={setSourceLanguage} exclude={targetLanguage} />
        <LanguagePicker label="Target language" value={targetLanguage}
          onChange={setTargetLanguage} exclude={sourceLanguage} />

        {/* Output mode */}
        <div className="mb-2">
          <label className="block text-label text-text-muted mb-2">
            Output mode
          </label>
          <div className="flex gap-2">
            {(['text', 'tts'] as const).map((mode) => {
              const active = outputMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setOutputMode(mode)}
                  className={[
                    'flex-1 py-[10px] rounded-[10px] text-[14px] cursor-pointer min-h-touch',
                    'border-[1.5px] transition-colors duration-150',
                    active
                      ? 'bg-accent-dim text-accent border-accent font-semibold'
                      : 'bg-bg-secondary text-text-secondary border-border font-normal',
                  ].join(' ')}
                >
                  {mode === 'text' ? 'Text only' : 'Voice output'}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </BottomSheet>
  );
}
