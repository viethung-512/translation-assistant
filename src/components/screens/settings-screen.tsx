import { Icon } from "@/components/icons";
import { OptionSheet } from "@/components/ui/option-sheet";
import { Pill, Toggle } from "@/components/ui/primitives";
import { ScreenLayout } from "@/components/ui/screen-layout";
import { SectionGroup, SectionRow } from "@/components/ui/section-list";
import i18n, { useV2T } from "@/i18n";
import { useV2SettingsStore, type V2Theme } from "@/store/v2-settings-store";
import { deleteApiKey } from "@/tauri/secure-storage";
import { ALL_AVAILABLE_LANGUAGES } from "@/tokens/languages";
import { useT, VT } from "@/tokens/tokens";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ApiKeyDialog } from "../ui/api-key-dialog";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { FlagEmoji } from "../ui/flag-emoji";
import { LangSheet } from "../ui/lang-sheet";

type OpenSheet = "theme" | "appLanguage" | null;

// ─── Segmented control (3 options) ──────────────────────────────────────────
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
        borderRadius: 8,
        padding: 3,
        gap: 2,
        boxShadow: VT.ringSoft(t),
      }}
    >
      {options.map((o, idx) => {
        const isActive = idx === value;
        const iconColor = isActive ? t.text : t.textMuted;
        return (
          <div
            key={o.l}
            onClick={() => onChange?.(idx)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              padding: "7px 10px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: -0.2,
              cursor: "pointer",
              background: isActive ? t.surface : "transparent",
              color: isActive ? t.text : t.textMuted,
              boxShadow: isActive ? VT.ringSoft(t) : "none",
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

// ─── Language display helper ─────────────────────────────────────────────────
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

// ─── Icon action button (eye/copy) ───────────────────────────────────────────
function IconAction({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const t = useT();
  return (
    <div
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: t.surfaceAlt,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {children}
    </div>
  );
}

// ─── Inline API key field ────────────────────────────────────────────────────
function ApiKeyField({
  configured,
  apiKey,
  onAdd,
  onDelete,
}: {
  configured: boolean;
  apiKey: string;
  onAdd: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const { t: tr } = useV2T();
  const [showKey, setShowKey] = useState(false);

  const maskedKey = useMemo(() => {
    if (!apiKey) return "";
    const last4 = apiKey.slice(-4);
    return `•••• •••• •••• ${last4}`;
  }, [apiKey]);

  const copyKey = useCallback(() => {
    if (apiKey) navigator.clipboard.writeText(apiKey).catch(() => {});
  }, [apiKey]);

  if (!configured) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 8,
            background: t.warnTint,
            boxShadow: `0 0 0 1px ${VT.warning}55`,
            fontFamily: VT.fontMono,
            fontSize: 12,
            color: VT.warning,
            letterSpacing: 0.3,
          }}
        >
          <Icon.Alert s={14} c={VT.warning} />
          <span>NOT CONFIGURED</span>
        </div>
        <div
          onClick={onAdd}
          style={{
            height: 36,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 8,
            background: t.text,
            color: t.mode === "dark" ? "#000" : "#fff",
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: -0.2,
            alignSelf: "flex-start",
            boxShadow: VT.ringSoft(t),
            cursor: "pointer",
          }}
        >
          <Icon.Key s={14} c={t.mode === "dark" ? "#000" : "#fff"} />
          <span>{tr("v2_settings_api_key_add")}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          borderRadius: 8,
          background: t.surface,
          boxShadow: VT.ring(t),
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: VT.fontMono,
            fontSize: 13,
            color: t.text,
            letterSpacing: 0.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {showKey ? apiKey : maskedKey}
        </div>
        <IconAction onClick={() => setShowKey((v) => !v)}>
          {showKey ? (
            <Icon.EyeOff s={14} c={t.textMuted} />
          ) : (
            <Icon.Eye s={14} c={t.textMuted} />
          )}
        </IconAction>
        <IconAction onClick={copyKey}>
          <Icon.Copy s={14} c={t.textMuted} />
        </IconAction>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Pill tone="success">{tr("v2_settings_api_key_connected")}</Pill>
        <span
          onClick={onAdd}
          style={{
            marginLeft: "auto",
            fontSize: 12,
            fontWeight: 500,
            color: t.textMuted,
            cursor: "pointer",
          }}
        >
          {tr("v2_settings_api_key_edit")}
        </span>
        <span
          onClick={onDelete}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: VT.error,
            cursor: "pointer",
          }}
        >
          {tr("v2_settings_api_key_delete")}
        </span>
      </div>
    </div>
  );
}

// ─── Provider select (read-only) ─────────────────────────────────────────────
function SelectField({
  value,
  subtitle,
}: {
  value: string;
  subtitle?: string;
}) {
  const t = useT();
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 12px",
          borderRadius: 8,
          background: t.surface,
          boxShadow: VT.ring(t),
          fontSize: 14,
          fontWeight: 500,
          color: t.text,
          letterSpacing: -0.2,
        }}
      >
        <span style={{ flex: 1 }}>{value}</span>
        <Icon.ChevronDown s={14} c={t.textDim} />
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: 11,
            color: t.textDim,
            marginTop: 6,
            fontFamily: VT.fontMono,
            letterSpacing: 0.3,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
interface SettingsScreenProps {
  onBack?: () => void;
  autoOpenApiKey?: boolean;
}

export function SettingsScreen({
  onBack,
  autoOpenApiKey,
}: SettingsScreenProps) {
  const t = useT();
  const { t: tr } = useV2T();
  const {
    apiKey,
    languageA,
    languageB,
    autoDetect,
    theme,
    autoSave,
    uiLanguage,
    recordSessions,
    setAutoDetect,
    setTheme,
    setAutoSave,
    setUiLanguage,
    setLanguageA,
    setLanguageB,
    setRecordSessions,
    setApiKey,
  } = useV2SettingsStore();

  const [langSheetSlot, setLangSheetSlot] = useState<"A" | "B" | null>(null);
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [apiKeyOpen, setApiKeyOpen] = useState(false);

  useEffect(() => {
    if (autoOpenApiKey) setApiKeyOpen(true);
  }, [autoOpenApiKey]);

  const closeSheet = useCallback(() => setOpenSheet(null), []);
  const hasStoredKey = useMemo(() => apiKey && apiKey.trim() !== "", [apiKey]);

  const handleDeleteKey = useCallback(async () => {
    await deleteApiKey().catch(() => {});
    setApiKey("");
  }, [setApiKey]);

  const handleRecordSessionsChange = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          stream.getTracks().forEach((t) => t.stop());
        } catch {
          return;
        }
        setRecordSessions(true);
      } else {
        setRecordSessions(false);
      }
    },
    [setRecordSessions],
  );

  const themeIndex = useMemo(
    () => (theme === "light" ? 0 : theme === "dark" ? 1 : 2),
    [theme],
  );
  const themeSegOptions = useMemo(
    () => [
      { l: tr("v2_settings_theme_light"), i: <Icon.Sun /> },
      { l: tr("v2_settings_theme_dark"), i: <Icon.Moon /> },
      { l: tr("v2_settings_theme_system") },
    ],
    [tr],
  );
  const handleThemeChange = useCallback(
    (idx: number) => setTheme((["light", "dark", "system"] as V2Theme[])[idx]),
    [setTheme],
  );

  const appLangOptions = useMemo(
    () => [
      { label: "English", value: "en" },
      { label: "Tiếng Việt", value: "vi" },
    ],
    [],
  );
  const handleAppLangSelect = useCallback(
    (lang: string) => {
      setUiLanguage(lang);
      void i18n.changeLanguage(lang);
    },
    [setUiLanguage],
  );
  const currentAppLangLabel = useMemo(
    () =>
      appLangOptions.find((o) => o.value === uiLanguage)?.label ?? "English",
    [appLangOptions, uiLanguage],
  );

  const handleLangSelect = useCallback(
    (code: string) => {
      if (langSheetSlot === "A") setLanguageA(code);
      else if (langSheetSlot === "B") setLanguageB(code);
    },
    [langSheetSlot, setLanguageA, setLanguageB],
  );
  const closeLangSheet = useCallback(() => setLangSheetSlot(null), []);

  return (
    <ScreenLayout>
      {/* Back button — icon only */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "4px 8px 6px",
        }}
      >
        <div
          onClick={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: onBack ? "pointer" : "default",
          }}
        >
          <Icon.ChevronLeft c={t.text} s={20} />
        </div>
      </div>

      {/* Title */}
      <div style={{ padding: "0 20px 14px" }}>
        <div
          style={{
            fontFamily: VT.fontDisplay,
            fontSize: 32,
            fontWeight: 600,
            color: t.text,
            letterSpacing: -1.28,
            lineHeight: 1.1,
          }}
        >
          {tr("v2_settings_title")}
        </div>
      </div>

      <div
        style={{
          padding: "0 16px calc(24px + env(safe-area-inset-bottom))",
          overflowY: "auto",
          flex: 1,
        }}
      >
        {/* AI Provider */}
        <SectionGroup title={tr("v2_settings_section_provider")}>
          <SectionRow
            title="Provider"
            stacked
            control={
              <SelectField
                value={tr("v2_settings_provider_name")}
                subtitle={tr("v2_settings_provider_hint")}
              />
            }
          />
          <SectionRow
            title={tr("v2_settings_api_key")}
            stacked
            isLast
            control={
              <ApiKeyField
                configured={!!hasStoredKey}
                apiKey={apiKey}
                onAdd={() => setApiKeyOpen(true)}
                onDelete={handleDeleteKey}
              />
            }
          />
        </SectionGroup>

        {/* Languages */}
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

        {/* Data */}
        <SectionGroup title={tr("v2_settings_section_data")}>
          <SectionRow
            title={tr("v2_settings_auto_save_transcript")}
            subtitle={tr("v2_settings_auto_save_transcript_hint")}
            control={<Toggle on={autoSave} onChange={setAutoSave} />}
          />
          <SectionRow
            title={tr("v2_settings_record_sessions")}
            subtitle={tr("v2_settings_auto_save_recording_hint")}
            control={
              <Toggle
                on={recordSessions}
                onChange={handleRecordSessionsChange}
              />
            }
          />
          <SectionRow
            title={tr("v2_settings_clear_history")}
            destructive
            chevron={false}
            isLast
            onPress={() => setConfirmClearAll(true)}
          />
        </SectionGroup>

        {/* Appearance */}
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

        {/* About */}
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

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            padding: "16px 0 8px",
            fontSize: 11,
            color: t.textDim,
            fontWeight: 500,
            fontFamily: VT.fontMono,
            letterSpacing: 0.4,
            textTransform: "uppercase",
          }}
        >
          HEYGRACIE · BUILT FOR THE FACTORY FLOOR
        </div>
      </div>

      <OptionSheet
        isOpen={openSheet === "appLanguage"}
        onDismiss={closeSheet}
        title={tr("v2_settings_sheet_app_language")}
        options={appLangOptions}
        selected={uiLanguage}
        onSelect={handleAppLangSelect}
      />
      <LangSheet
        isOpen={langSheetSlot !== null}
        onDismiss={closeLangSheet}
        selectedCode={langSheetSlot === "A" ? languageA : languageB}
        onSelect={handleLangSelect}
      />
      {confirmClearAll && (
        <ConfirmDialog
          isOpen={confirmClearAll}
          onDismiss={() => setConfirmClearAll(false)}
          icon={<Icon.Trash c={VT.error} s={20} />}
          title={tr("v2_dialog_clear_title")}
          body={tr("v2_dialog_clear_body")}
          confirmLabel={tr("v2_dialog_delete")}
          destructive
          onConfirm={() => setConfirmClearAll(false)}
        />
      )}
      <ApiKeyDialog
        isOpen={apiKeyOpen}
        onDismiss={() => setApiKeyOpen(false)}
      />
    </ScreenLayout>
  );
}
