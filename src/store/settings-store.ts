// Persistent app settings (except apiKey — managed by Tauri secure storage).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';

export type OutputMode = 'text' | 'tts';

interface SettingsState {
  apiKey: string; // In-memory only — never written to localStorage
  languageA: string; // BCP-47 e.g. "en" (was sourceLanguage)
  languageB: string; // BCP-47 e.g. "vi" (was targetLanguage)
  autoDetect: boolean; // true = bidirectional auto-detect
  outputMode: OutputMode;
  uiLanguage: string; // App interface language, BCP-47 e.g. "en" | "vi"
  // Actions
  setApiKey: (key: string) => void;
  setLanguageA: (lang: string) => void;
  setLanguageB: (lang: string) => void;
  setAutoDetect: (v: boolean) => void;
  setOutputMode: (mode: OutputMode) => void;
  setUiLanguage: (lang: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      languageA: 'en',
      languageB: 'vi',
      autoDetect: false,
      outputMode: 'text',
      uiLanguage: 'en',
      setApiKey: (key) => set({ apiKey: key }),
      setLanguageA: (lang) => set({ languageA: lang }),
      setLanguageB: (lang) => set({ languageB: lang }),
      setAutoDetect: (v) => set({ autoDetect: v }),
      setOutputMode: (mode) => set({ outputMode: mode }),
      setUiLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ uiLanguage: lang });
      },
    }),
    {
      name: 'translation-assistant-settings',
      version: 1,
      migrate: (persisted: any, version) => {
        if (!persisted) return persisted;
        if (version < 1) {
          if (persisted.sourceLanguage && !persisted.languageA) {
            persisted.languageA = persisted.sourceLanguage;
          }
          if (persisted.targetLanguage && !persisted.languageB) {
            persisted.languageB = persisted.targetLanguage;
          }
          delete persisted.sourceLanguage;
          delete persisted.targetLanguage;
        }
        return persisted;
      },
      partialize: (state) => ({
        languageA: state.languageA,
        languageB: state.languageB,
        autoDetect: state.autoDetect,
        outputMode: state.outputMode,
        uiLanguage: state.uiLanguage,
      }),
    }
  )
);
