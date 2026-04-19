// Bottom sheet listing past transcript sessions. Fetches on open, refreshes after delete.
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Box, Flex, ScrollArea, Text } from "@radix-ui/themes";
import { openPath } from "@tauri-apps/plugin-opener";
import { IconClose } from "@/components/icons";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { IconButton } from "@/components/ui";
import { listTranscripts } from "@/tauri/transcript-fs";
import type { TranscriptMeta } from "@/tauri/transcript-fs";
import { SessionItem } from "./session-item";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function HistorySheet({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<TranscriptMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch list whenever sheet opens
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    listTranscripts()
      .then(setSessions)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleDeleted = useCallback((filename: string) => {
    setSessions((prev) => prev.filter((s) => s.name !== filename));
  }, []);

  const handleShare = useCallback(async (content: string, path: string) => {
    try {
      // openPath on iOS opens the file in the system document viewer which
      // includes the native share sheet — no extra plugin needed
      await openPath(path);
    } catch {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(content).catch(() => {});
    }
  }, []);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <Box pt="4" pb="2">
        {/* Sheet header */}
        <Flex
          justify="between"
          align="center"
          px="4"
          pb="3"
          style={{ borderBottom: "1px solid var(--gray-5)" }}
        >
          <Text size="3" weight="bold">
            {t("history_title")}
          </Text>
          <IconButton aria-label={t("aria_close_history")} onClick={onClose}>
            <IconClose size={16} />
          </IconButton>
        </Flex>

        {/* Content */}
        <ScrollArea style={{ maxHeight: "60dvh" }}>
          {loading && (
            <Box p="4">
              <Text as="p" size="2" color="gray" align="center">
                {t("history_loading")}
              </Text>
            </Box>
          )}
          {error && (
            <Box p="4">
              <Text as="p" size="2" color="red">
                {error}
              </Text>
            </Box>
          )}
          {!loading && !error && sessions.length === 0 && (
            <Box p="4">
              <Text as="p" size="2" color="gray" align="center">
                {t("history_empty")}
              </Text>
            </Box>
          )}
          {sessions.map((s) => (
            <SessionItem
              key={s.name}
              session={s}
              onDeleted={handleDeleted}
              onShare={handleShare}
            />
          ))}
        </ScrollArea>
      </Box>
    </BottomSheet>
  );
}
