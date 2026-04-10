// Persistent app settings (except apiKey — managed by Tauri secure storage).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OutputMode = 'text' | 'tts';

interface SettingsState {
  apiKey: string; // In-memory only — never written to localStorage
  sourceLanguage: string; // BCP-47 e.g. "en"
  targetLanguage: string; // BCP-47 e.g. "vi"
  outputMode: OutputMode;
  // Actions
  setApiKey: (key: string) => void;
  setSourceLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
  setOutputMode: (mode: OutputMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
      outputMode: 'text',
      setApiKey: (key) => set({ apiKey: key }),
      setSourceLanguage: (lang) => set({ sourceLanguage: lang }),
      setTargetLanguage: (lang) => set({ targetLanguage: lang }),
      setOutputMode: (mode) => set({ outputMode: mode }),
    }),
    {
      name: 'translation-assistant-settings',
      // Exclude apiKey — it lives in Tauri stronghold, not localStorage
      partialize: (state) => ({
        sourceLanguage: state.sourceLanguage,
        targetLanguage: state.targetLanguage,
        outputMode: state.outputMode,
      }),
    }
  )
);
