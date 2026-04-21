// i18n configuration — must be imported before any React component renders.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { vi } from "./locales/vi";

// Read persisted uiLanguage directly from localStorage to avoid circular
// imports (settings-store imports i18n; i18n must not import settings-store).
function getPersistedUiLanguage(): string {
  try {
    if (typeof localStorage === "undefined") return "en";
    const raw = localStorage.getItem("hey-gracie-settings");
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { uiLanguage?: string } };
      return parsed.state?.uiLanguage ?? "en";
    }
  } catch {
    // ignore access/parse errors, fall through to default
  }
  return "en";
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: getPersistedUiLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false }, // React handles XSS
});

export default i18n;
