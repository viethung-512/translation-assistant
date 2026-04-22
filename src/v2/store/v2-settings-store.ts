import { create } from "zustand";
import { persist } from "zustand/middleware";

export type V2OutputMode = "text" | "voice";
export type V2Theme = "light" | "dark" | "system";

interface V2SettingsState {
  languageA: string;
  languageB: string;
  autoDetect: boolean;
  outputMode: V2OutputMode;
  speakingVoice: string;
  theme: V2Theme;
  autoSave: boolean;
  uiLanguage: string;
  apiKey: string; // in-memory only — never written to localStorage
  // actions
  setLanguageA: (code: string) => void;
  setLanguageB: (code: string) => void;
  swapLanguages: () => void;
  setAutoDetect: (v: boolean) => void;
  setOutputMode: (mode: V2OutputMode) => void;
  setSpeakingVoice: (voice: string) => void;
  setTheme: (theme: V2Theme) => void;
  setAutoSave: (v: boolean) => void;
  setUiLanguage: (lang: string) => void;
  setApiKey: (key: string) => void;
}

export const useV2SettingsStore = create<V2SettingsState>()(
  persist(
    (set) => ({
      languageA: "en",
      languageB: "vi",
      autoDetect: true,
      outputMode: "text",
      speakingVoice: "neutral",
      theme: "system",
      autoSave: true,
      uiLanguage: "en",
      apiKey: "",
      setLanguageA: (code) => set({ languageA: code }),
      setLanguageB: (code) => set({ languageB: code }),
      swapLanguages: () =>
        set((s) => ({ languageA: s.languageB, languageB: s.languageA })),
      setAutoDetect: (v) => set({ autoDetect: v }),
      setOutputMode: (mode) => set({ outputMode: mode }),
      setSpeakingVoice: (voice) => set({ speakingVoice: voice }),
      setTheme: (theme) => set({ theme }),
      setAutoSave: (v) => set({ autoSave: v }),
      setUiLanguage: (lang) => set({ uiLanguage: lang }),
      setApiKey: (key) => set({ apiKey: key }),
    }),
    {
      name: "hey-gracie-v2-settings",
      partialize: (s) => ({
        languageA: s.languageA,
        languageB: s.languageB,
        autoDetect: s.autoDetect,
        outputMode: s.outputMode,
        speakingVoice: s.speakingVoice,
        theme: s.theme,
        autoSave: s.autoSave,
        uiLanguage: s.uiLanguage,
      }),
    },
  ),
);
