// Collapsible session row: date header + 80-char preview → expand to full text + actions.
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AlertDialog, Box, Flex, ScrollArea, Text } from "@radix-ui/themes";
import { readTranscript, deleteTranscript } from "@/tauri/transcript-fs";
import type { TranscriptMeta } from "@/tauri/transcript-fs";
import { Button } from "@/components/ui";

interface Props {
  session: TranscriptMeta;
  onDeleted: (filename: string) => void;
  // content: text to clipboard fallback; path: absolute file path for native share
  onShare: (content: string, path: string) => void;
}

function formatDate(unixSeconds: string, fallback: string): string {
  const ts = Number(unixSeconds) * 1000;
  if (!ts) return fallback;
  return new Intl.DateTimeFormat(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(ts));
}

function preview(text: string, emptyFallback: string): string {
  const first = text.split("\n").find((l) => l.trim().length > 0) ?? "";
  return first.length > 80 ? first.slice(0, 80) + "…" : first || emptyFallback;
}

export function SessionItem({ session, onDeleted, onShare }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleExpand = useCallback(async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (content !== null) return; // already loaded
    setLoading(true);
    try {
      setContent(await readTranscript(session.name));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [expanded, content, session.name]);

  const handleCopy = useCallback(async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteTranscript(session.name);
      onDeleted(session.name);
      setDeleteOpen(false);
    } catch (e) {
      setError((e as Error).message);
      setDeleteOpen(false);
    }
  }, [session.name, onDeleted]);

  return (
    <Box style={{ borderBottom: "1px solid var(--gray-5)" }}>
      {/* Row header — always visible */}
      <Button
        variant="ghost"
        onClick={handleExpand}
        style={{ width: "100%", justifyContent: "flex-start", textAlign: "left", borderRadius: 0 }}
      >
        <Box>
          <Text size="2" weight="bold" color="gray" mb="1" style={{ display: "block" }}>
            {formatDate(session.createdAt, t("session_unknown_date"))} {expanded ? "∧" : "∨"}
          </Text>
          {!expanded && (
            <Text size="2" color="gray">
              {content !== null
                ? preview(content, t("session_empty_preview"))
                : preview(session.name.replace(".txt", ""), t("session_empty_preview"))}
            </Text>
          )}
        </Box>
      </Button>

      {/* Expanded content */}
      {expanded && (
        <Box px="4" pb="3">
          {loading && (
            <Text as="p" size="2" color="gray">{t("session_loading")}</Text>
          )}
          {error && (
            <Text as="p" size="2" color="red">{error}</Text>
          )}
          {content !== null && (
            <ScrollArea style={{ maxHeight: 200 }} mb="3">
              <Text
                as="div"
                size="2"
                style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6 }}
              >
                {content}
              </Text>
            </ScrollArea>
          )}

          {content !== null && (
            <Flex gap="2" wrap="wrap">
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? t("session_copied") : t("session_copy")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => onShare(content, session.path)}>
                {t("session_share")}
              </Button>

              {/* Delete with AlertDialog confirmation */}
              <AlertDialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialog.Trigger>
                  <Button size="sm" variant="outline">
                    {t("session_delete")}
                  </Button>
                </AlertDialog.Trigger>
                <AlertDialog.Content maxWidth="320px">
                  <AlertDialog.Title>{t("session_delete_title")}</AlertDialog.Title>
                  <AlertDialog.Description size="2" color="gray">
                    {t("session_delete_description")}
                  </AlertDialog.Description>
                  <Flex gap="3" mt="4" justify="end">
                    <AlertDialog.Cancel>
                      <Button variant="outline">
                        {t("session_cancel")}
                      </Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action>
                      <Button variant="danger" onClick={handleDelete}>
                        {t("session_delete_confirm")}
                      </Button>
                    </AlertDialog.Action>
                  </Flex>
                </AlertDialog.Content>
              </AlertDialog.Root>
            </Flex>
          )}
        </Box>
      )}
    </Box>
  );
}
