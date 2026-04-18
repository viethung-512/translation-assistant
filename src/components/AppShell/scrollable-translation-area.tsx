import { useTranslation } from "react-i18next";
import type { RealtimeToken } from "@soniox/client";
import Renderer from "../TranslationDisplay/renderer";

interface Props {
  originalTokens: RealtimeToken[];
  translatedTokens: RealtimeToken[];
}

export function ScrollableTranslationArea({ originalTokens, translatedTokens }: Props) {
  const { t } = useTranslation();
  return (
    <div>
      <Renderer tokens={originalTokens} placeholder={t('renderer_placeholder_original')} />
      <Renderer tokens={translatedTokens} placeholder={t('renderer_placeholder_translated')} />
    </div>
  );
}
