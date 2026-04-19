import { Box, ScrollArea } from "@radix-ui/themes";
import type { RealtimeToken } from "@soniox/client";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Renderer from "../TranslationDisplay/renderer";

interface Props {
  originalTokens: RealtimeToken[];
  translatedTokens: RealtimeToken[];
}

export function ScrollableTranslationArea({
  originalTokens,
  translatedTokens,
}: Props) {
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest content whenever tokens update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [originalTokens, translatedTokens]);

  return (
    <Box
      className="glass-card animate-fade-in"
      style={{
        overflow: "hidden",
        overflowY: "scroll",
        display: "flex",
        flexDirection: "column",
        flex: 1,
      }}
    >
      <ScrollArea>
        <Box p="3">
          <Renderer
            originalTokens={originalTokens}
            translatedTokens={translatedTokens}
            placeholder={t("renderer_placeholder_translated")}
          />
          {/* Sentinel — scrolled into view on every token update */}
          <div ref={bottomRef} />
        </Box>
      </ScrollArea>
    </Box>
  );
}
