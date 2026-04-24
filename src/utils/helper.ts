import { RealtimeToken } from "@soniox/client";
import { ALL_AVAILABLE_LANGUAGES } from "../tokens/languages";

export function detectFlagCode(langCode?: string) {
  const lang = langCode
    ? ALL_AVAILABLE_LANGUAGES.find((l) => l.code === langCode)
    : undefined;
  const flag = lang?.flag ?? "🌐";
  const code = langCode?.toUpperCase() ?? "…";

  return { flag, code };
}

export const generateRealtimeTokenKey = (
  token: Pick<
    RealtimeToken,
    "speaker" | "language" | "translation_status" | "is_final"
  >,
  index?: number,
) =>
  `${token.speaker}-${token.language}-${token.translation_status}-${token.is_final ? "final" : "non_final"}-${index}`;
