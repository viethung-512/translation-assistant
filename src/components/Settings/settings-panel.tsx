// Slide-up settings sheet: API key, language pickers, output mode toggle.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Flex,
  Heading,
  ScrollArea,
  SegmentedControl,
  Switch,
  Text,
} from "@radix-ui/themes";
import { LanguagePicker } from "./language-picker";
import { useSettingsStore } from "@/store/settings-store";
import { saveApiKey, getApiKey, deleteApiKey } from "@/tauri/secure-storage";
import { BottomSheet, Button, IconButton, Input } from "@/components/ui";
import type { RecordingStatus } from "@/hooks/use-translation-session";

const UI_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "vi", label: "Tiếng Việt" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  recordingStatus: RecordingStatus;
}

// Close (X) icon
function IconClose() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// Check icon for "stored" indicator
function IconCheck() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function SettingsPanel({ isOpen, onClose, recordingStatus }: Props) {
  const { t } = useTranslation();
  const {
    languageA,
    languageB,
    autoDetect,
    outputMode,
    uiLanguage,
    setApiKey,
    setLanguageA,
    setLanguageB,
    setAutoDetect,
    setOutputMode,
    setUiLanguage,
  } = useSettingsStore();
  const [keyInput, setKeyInput] = useState("");
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const locked = recordingStatus !== "idle";

  useEffect(() => {
    if (!isOpen) return;
    getApiKey().then((k) => setHasStoredKey(!!k));
  }, [isOpen]);

  const handleSaveKey = async () => {
    if (!keyInput.trim()) return;
    setSaving(true);
    try {
      await saveApiKey(keyInput.trim());
      setApiKey(keyInput.trim());
      setHasStoredKey(true);
      setKeyInput("");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKey = async () => {
    await deleteApiKey();
    setApiKey("");
    setHasStoredKey(false);
    setKeyInput("");
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <ScrollArea style={{ maxHeight: "72vh" }}>
        <Box px="5" py="4">
          {/* Header */}
          <Flex justify="between" align="center" mb="5">
            <Heading size="4">{t("settings_title")}</Heading>
            <IconButton aria-label={t("aria_close_settings")} onClick={onClose}>
              <IconClose />
            </IconButton>
          </Flex>

          {/* Interface language */}
          <Box mb="5">
            <Text
              as="label"
              size="1"
              color="gray"
              weight="medium"
              mb="2"
              style={{ display: "block" }}
            >
              {t("settings_ui_language")}
            </Text>
            <SegmentedControl.Root
              value={uiLanguage}
              onValueChange={setUiLanguage}
            >
              {UI_LANGUAGES.map(({ code, label }) => (
                <SegmentedControl.Item key={code} value={code}>
                  {label}
                </SegmentedControl.Item>
              ))}
            </SegmentedControl.Root>
          </Box>

          {/* API Key */}
          <Box mb="5">
            <Flex align="center" gap="1" mb="2">
              <Text as="label" size="1" color="gray" weight="medium">
                {t("settings_api_key_label")}
              </Text>
              {hasStoredKey && (
                <Flex align="center" gap="1">
                  <Text size="1" color="green">
                    <IconCheck />
                  </Text>
                  <Text size="1" color="green">
                    {t("settings_api_key_stored")}
                  </Text>
                </Flex>
              )}
            </Flex>
            <Input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={
                hasStoredKey
                  ? t("settings_api_key_placeholder_stored")
                  : t("settings_api_key_placeholder_empty")
              }
              autoComplete="off"
            />
            <Flex gap="2" mt="2">
              <Button
                variant="primary"
                onClick={handleSaveKey}
                disabled={saving || !keyInput.trim()}
                style={{ flex: 1 }}
              >
                {saving ? t("settings_saving") : t("settings_save_key")}
              </Button>
              {hasStoredKey && (
                <Button variant="danger" onClick={handleDeleteKey}>
                  {t("settings_delete_key")}
                </Button>
              )}
            </Flex>
          </Box>

          {/* Language A picker */}
          <LanguagePicker
            label={t("settings_lang_a")}
            value={languageA}
            onChange={setLanguageA}
            disabled={locked}
          />

          {/* Auto-detect toggle */}
          <Box mb="3">
            <Flex align="center" justify="between" mb="1">
              <Text as="label" size="2" weight="medium">
                {t("settings_auto_detect")}
              </Text>
              <Switch
                checked={autoDetect}
                onCheckedChange={setAutoDetect}
                disabled={locked}
              />
            </Flex>
            <Text size="1" color="gray">
              {t("settings_auto_detect_hint")}
            </Text>
          </Box>

          {/* Language B picker */}
          <LanguagePicker
            label={t("settings_lang_b")}
            value={languageB}
            onChange={setLanguageB}
            disabled={locked}
          />

          {/* Output mode */}
          <Box mb="2">
            <Text
              as="label"
              size="1"
              color="gray"
              weight="medium"
              mb="2"
              style={{ display: "block" }}
            >
              {t("settings_output_mode")}
            </Text>
            <SegmentedControl.Root
              value={outputMode}
              onValueChange={(v) => setOutputMode(v as "text" | "tts")}
            >
              <SegmentedControl.Item value="text">
                {t("settings_text_only")}
              </SegmentedControl.Item>
              <SegmentedControl.Item value="tts">
                {t("settings_voice_output")}
              </SegmentedControl.Item>
            </SegmentedControl.Root>
          </Box>
        </Box>
      </ScrollArea>
    </BottomSheet>
  );
}
