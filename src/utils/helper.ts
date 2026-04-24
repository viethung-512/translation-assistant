import { ALL_AVAILABLE_LANGUAGES } from "../tokens/languages";

export function detectFlagCode(langCode?: string) {
  const lang = langCode
    ? ALL_AVAILABLE_LANGUAGES.find((l) => l.code === langCode)
    : undefined;
  const flag = lang?.flag ?? "🌐";
  const code = langCode?.toUpperCase() ?? "…";

  return { flag, code };
}
