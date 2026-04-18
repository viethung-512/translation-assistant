// Persistent app settings (except apiKey — managed by Tauri secure storage).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';

export type OutputMode = 'text' | 'tts';

interface SettingsState {
  apiKey: string; // In-memory only — never written to localStorage
  sourceLanguage: string; // BCP-47 e.g. "en"
  targetLanguage: string; // BCP-47 e.g. "vi"
  outputMode: OutputMode;
  uiLanguage: string; // App interface language, BCP-47 e.g. "en" | "vi"
  // Actions
  setApiKey: (key: string) => void;
  setSourceLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
  setOutputMode: (mode: OutputMode) => void;
  setUiLanguage: (lang: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
      outputMode: 'text',
      uiLanguage: 'en',
      setApiKey: (key) => set({ apiKey: key }),
      setSourceLanguage: (lang) => set({ sourceLanguage: lang }),
      setTargetLanguage: (lang) => set({ targetLanguage: lang }),
      setOutputMode: (mode) => set({ outputMode: mode }),
      setUiLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ uiLanguage: lang });
      },
    }),
    {
      name: 'translation-assistant-settings',
      // Exclude apiKey — it lives in Tauri stronghold, not localStorage
      partialize: (state) => ({
        sourceLanguage: state.sourceLanguage,
        targetLanguage: state.targetLanguage,
        outputMode: state.outputMode,
        uiLanguage: state.uiLanguage,
      }),
    }
  )
);
