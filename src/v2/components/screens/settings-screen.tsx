import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useT, VT } from "@/v2/tokens/tokens";
import { Typography } from "@/v2/components/ui/typography";
import { Icon } from "@/v2/components/icons";
import { Toggle } from "@/v2/components/ui/primitives";
import { ScreenLayout } from "@/v2/components/ui/screen-layout";
import { SectionGroup, SectionRow } from "@/v2/components/ui/section-list";
import { OptionSheet } from "@/v2/components/ui/option-sheet";
import {
  useV2SettingsStore,
  type V2OutputMode,
  type V2Theme,
} from "@/v2/store/v2-settings-store";
import { ALL_AVAILABLE_LANGUAGES } from "@/v2/tokens/languages";
import { useV2T } from "@/v2/i18n";
import i18n from "@/v2/i18n";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { ApiKeyDialog } from "../ui/api-key-dialog";
import { FlagEmoji } from "../ui/flag-emoji";
import { LangSheet } from "../ui/lang-sheet";
import { getApiKey } from "@/tauri/secure-storage";

type OpenSheet =
  | "outputMode"
  | "speakingVoice"
  | "outputDevice"
  | "theme"
  | "appLanguage"
  | null;

function Segmented3({
  options,
  value,
  onChange,
}: {
  options: { l: string; i?: React.ReactElement }[];
  value: number;
  onChange?: (index: number) => void;
}) {
  const t = useT();
  return (
    <div
      style={{
        display: "flex",
        background: t.surfaceAlt,
        borderRadius: 10,
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((o, i) => {
        const isActive = i === value;
        const iconColor = isActive
          ? t.mode === "dark"
            ? t.navy
            : "#fff"
          : t.textMuted;
        return (
          <div
            key={o.l}
            onClick={() => onChange?.(i)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 10px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: -0.1,
              cursor: "pointer",
              background: isActive
                ? t.mode === "dark"
                  ? VT.cyan
                  : t.text
                : "transparent",
              color: isActive
                ? t.mode === "dark"
                  ? t.navy
                  : "#fff"
                : t.textMuted,
            }}
          >
            {o.i && React.cloneElement(o.i, { c: iconColor, s: 13 })}
            {o.l}
          </div>
        );
      })}
    </div>
  );
}

function LangDetail({ code }: { code: string }) {
  const lang = ALL_AVAILABLE_LANGUAGES.find((l) => l.code === code);
  if (!lang) return <span>{code.toUpperCase()}</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <FlagEmoji flag={lang.flag} size={16} />
      {lang.name}
    </span>
  );
}

interface SettingsScreenProps {
  onBack?: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const t = useT();
  const { t: tr } = useV2T();
  const {
    languageA,
    languageB,
    autoDetect,
    outputMode,
    speakingVoice,
    theme,
    autoSave,
    uiLanguage,
    setAutoDetect,
    setOutputMode,
    setSpeakingVoice,
    setTheme,
    setAutoSave,
    setUiLanguage,
    setLanguageA,
    setLanguageB,
  } = useV2SettingsStore();

  const [langSheetSlot, setLangSheetSlot] = useState<"A" | "B" | null>(null);
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const [confirmClearAllHistories, setConfirmClearAllHistories] =
    useState(false);
  const [apiKeyOpen, setApiKeyOpen] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const closeSheet = useCallback(() => setOpenSheet(null), []);

  useEffect(() => {
    getApiKey().then((k) => setHasStoredKey(!!k));
  }, []);

  const handleApiKeyDismiss = useCallback(() => {
    setApiKeyOpen(false);
    getApiKey().then((k) => setHasStoredKey(!!k));
  }, []);

  const themeIndex = useMemo(
    () => (theme === "light" ? 0 : theme === "dark" ? 1 : 2),
    [theme],
  );
  const outputModeIndex = useMemo(
    () => (outputMode === "text" ? 0 : 1),
    [outputMode],
  );

  const voiceOptions = useMemo(
    () => [
      { label: tr("v2_settings_voice_neutral"), value: "neutral" },
      { label: tr("v2_settings_voice_female"), value: "female" },
      { label: tr("v2_settings_voice_male"), value: "male" },
    ],
    [i18n],
  );

  const deviceOptions = useMemo(
    () => [
      { label: tr("v2_settings_device_speaker"), value: "speaker" },
      { label: tr("v2_settings_device_earpiece"), value: "earpiece" },
      { label: tr("v2_settings_device_bluetooth"), value: "bluetooth" },
    ],
    [i18n],
  );

  const appLangOptions = useMemo(
    () => [
      { label: "English", value: "en" },
      { label: "Tiếng Việt", value: "vi" },
    ],
    [],
  );

  const outputModeOptions = useMemo(
    () => [
      { label: tr("v2_output_text"), value: "text" as V2OutputMode },
      { label: tr("v2_output_voice"), value: "voice" as V2OutputMode },
    ],
    [i18n],
  );

  const themeSegOptions = useMemo(
    () => [
      { l: tr("v2_settings_theme_light"), i: <Icon.Sun /> },
      { l: tr("v2_settings_theme_dark"), i: <Icon.Moon /> },
      { l: tr("v2_settings_theme_system") },
    ],
    [i18n],
  );

  const outputSegOptions = useMemo(
    () => [
      { l: tr("v2_output_text"), i: <Icon.Text /> },
      { l: tr("v2_output_voice"), i: <Icon.Speaker /> },
    ],
    [i18n],
  );

  const handleThemeChange = useCallback(
    (i: number) => setTheme((["light", "dark", "system"] as V2Theme[])[i]),
    [setTheme],
  );
  const handleOutputModeChange = useCallback(
    (i: number) => setOutputMode(i === 0 ? "text" : "voice"),
    [setOutputMode],
  );
  const handleAppLangSelect = useCallback(
    (lang: string) => {
      setUiLanguage(lang);
      void i18n.changeLanguage(lang);
    },
    [setUiLanguage],
  );

  const handleLangSelect = useCallback(
    (code: string) => {
      if (langSheetSlot === "A") setLanguageA(code);
      else if (langSheetSlot === "B") setLanguageB(code);
    },
    [langSheetSlot, setLanguageA, setLanguageB],
  );
  const closeLangSheet = useCallback(() => setLangSheetSlot(null), []);

  const currentVoiceLabel = useMemo(
    () =>
      voiceOptions.find((o) => o.value === speakingVoice)?.label ??
      tr("v2_settings_voice_neutral"),
    [voiceOptions, speakingVoice, i18n],
  );
  const currentAppLangLabel = useMemo(
    () =>
      appLangOptions.find((o) => o.value === uiLanguage)?.label ?? "English",
    [appLangOptions, uiLanguage],
  );

  return (
    <ScreenLayout>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 12px 8px",
        }}
      >
        <div
          onClick={onBack}
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: onBack ? "pointer" : "default",
          }}
        >
          <Icon.ChevronLeft c={t.text} />
        </div>
      </div>
      <div style={{ padding: "0 20px 16px" }}>
        <Typography variant="display">{tr("v2_settings_title")}</Typography>
      </div>
      <div style={{ padding: "0 16px calc(24px + env(safe-area-inset-bottom))" }}>
        <SectionGroup title={tr("v2_settings_section_languages")}>
          <SectionRow
            title={tr("v2_settings_lang_a")}
            stacked
            detail={<LangDetail code={languageA} />}
            onPress={() => setLangSheetSlot("A")}
          />
          <SectionRow
            title={tr("v2_settings_lang_b")}
            stacked
            detail={<LangDetail code={languageB} />}
            onPress={() => setLangSheetSlot("B")}
          />
          <SectionRow
            title={tr("v2_settings_auto_detect")}
            subtitle={tr("v2_settings_auto_detect_hint")}
            control={<Toggle on={autoDetect} onChange={setAutoDetect} />}
            isLast
          />
        </SectionGroup>
        <SectionGroup title={tr("v2_settings_section_translation")}>
          <SectionRow
            title={tr("v2_settings_output_mode")}
            stacked
            control={
              <Segmented3
                options={outputSegOptions}
                value={outputModeIndex}
                onChange={handleOutputModeChange}
              />
            }
          />
          {outputMode === "voice" && (
            <SectionRow
              title={tr("v2_settings_speaking_voice")}
              stacked
              detail={currentVoiceLabel}
              onPress={() => setOpenSheet("speakingVoice")}
            />
          )}
          <SectionRow
            title={tr("v2_settings_output_device")}
            stacked
            detail={deviceOptions[0].label}
            onPress={() => setOpenSheet("outputDevice")}
            isLast
          />
        </SectionGroup>
        <SectionGroup title={tr("v2_settings_section_appearance")}>
          <SectionRow
            title={tr("v2_settings_theme")}
            stacked
            control={
              <Segmented3
                options={themeSegOptions}
                value={themeIndex}
                onChange={handleThemeChange}
              />
            }
          />
          <SectionRow
            title={tr("v2_settings_app_language")}
            stacked
            detail={currentAppLangLabel}
            onPress={() => setOpenSheet("appLanguage")}
            isLast
          />
        </SectionGroup>
        <SectionGroup title={tr("v2_settings_section_privacy")}>
          <SectionRow
            title={tr("v2_settings_auto_save")}
            control={<Toggle on={autoSave} onChange={setAutoSave} />}
          />
          <SectionRow
            title={tr("v2_settings_clear_history")}
            destructive
            chevron={false}
            isLast
            onPress={() => setConfirmClearAllHistories(true)}
          />
        </SectionGroup>
        <SectionGroup title={tr("v2_settings_section_api")}>
          <SectionRow
            title={tr("v2_settings_api_key")}
            detail={
              hasStoredKey
                ? tr("v2_settings_api_key_configured")
                : tr("v2_settings_api_key_not_set")
            }
            isLast
            onPress={() => setApiKeyOpen(true)}
          />
        </SectionGroup>
        <SectionGroup title={tr("v2_settings_section_about")}>
          <SectionRow
            title={tr("v2_settings_app_version")}
            stacked
            detail="v1.0.0"
            chevron={false}
          />
          <SectionRow title={tr("v2_settings_privacy_policy")} stacked />
          <SectionRow title={tr("v2_settings_terms")} stacked isLast />
        </SectionGroup>
        <Typography
          variant="hint"
          color={t.textDim}
          align="center"
          style={{ padding: "16px 0 8px", fontWeight: 600 }}
        >
          {tr("v2_settings_footer")}
        </Typography>
      </div>

      <OptionSheet
        isOpen={openSheet === "speakingVoice"}
        onDismiss={closeSheet}
        title={tr("v2_settings_sheet_speaking_voice")}
        options={voiceOptions}
        selected={speakingVoice}
        onSelect={setSpeakingVoice}
      />
      <OptionSheet
        isOpen={openSheet === "outputDevice"}
        onDismiss={closeSheet}
        title={tr("v2_settings_sheet_output_device")}
        options={deviceOptions}
        selected="speaker"
        onSelect={() => {}}
      />
      <OptionSheet
        isOpen={openSheet === "appLanguage"}
        onDismiss={closeSheet}
        title={tr("v2_settings_sheet_app_language")}
        options={appLangOptions}
        selected={uiLanguage}
        onSelect={handleAppLangSelect}
      />
      <OptionSheet
        isOpen={openSheet === "outputMode"}
        onDismiss={closeSheet}
        title={tr("v2_settings_sheet_output_mode")}
        options={outputModeOptions}
        selected={outputMode}
        onSelect={setOutputMode}
      />
      {/* Language sheet overlay — writes to global store */}
      <LangSheet
        isOpen={langSheetSlot !== null}
        onDismiss={closeLangSheet}
        selectedCode={langSheetSlot === "A" ? languageA : languageB}
        onSelect={handleLangSelect}
      />
      {confirmClearAllHistories && (
        <ConfirmDialog
          isOpen={confirmClearAllHistories}
          onDismiss={() => setConfirmClearAllHistories(false)}
          icon={<Icon.Trash c={VT.error} s={24} />}
          title={tr("v2_dialog_clear_title")}
          body={tr("v2_dialog_clear_body")}
          confirmLabel={tr("v2_dialog_delete")}
          destructive
          onConfirm={() => setConfirmClearAllHistories(false)}
        />
      )}
      <ApiKeyDialog isOpen={apiKeyOpen} onDismiss={handleApiKeyDismiss} />
    </ScreenLayout>
  );
}
