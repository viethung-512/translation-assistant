import { Box, ScrollArea } from "@radix-ui/themes";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { RealtimeToken } from "@soniox/client";
import { IconButton } from "@/components/ui";
import Renderer from "../TranslationDisplay/renderer";

interface Props {
  originalTokens: RealtimeToken[];
  translatedTokens: RealtimeToken[];
  hasContent: boolean;
  onClearTranscript: () => void;
}

// Trash icon for clearing the live transcript
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

export function ScrollableTranslationArea({ originalTokens, translatedTokens, hasContent, onClearTranscript }: Props) {
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest content whenever tokens update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [originalTokens, translatedTokens]);

  return (
    /* Grows to fill space between top bar and bottom controls */
    <Box className="animate-fade-in" style={{ flex: 1, overflow: "hidden", padding: "10px 16px", display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
      {/* Clear transcript button — top-right corner, only when content exists */}
      {hasContent && (
        <Box style={{ position: "absolute", top: 18, right: 24, zIndex: 10 }}>
          <IconButton
            aria-label={t("aria_clear_transcript")}
            onClick={onClearTranscript}
            size="1"
          >
            <TrashIcon />
          </IconButton>
        </Box>
      )}

      {/* Combined translation card — translated (large) above original (small italic) */}
      <Box
        className="glass-card"
        style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        <ScrollArea style={{ flex: 1 }}>
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
    </Box>
  );
}
