// Main app container: wires session hook to all UI sections.
import { Box, Flex, Text, Theme } from "@radix-ui/themes";
import { HistorySheet } from "@/components/History/history-sheet";
import { SettingsPanel } from "@/components/Settings/settings-panel";
import { Button } from "@/components/ui";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useTranslationSession } from "@/hooks/use-translation-session";
import { useSettingsStore } from "@/store/settings-store";
import { getApiKey } from "@/tauri/secure-storage";
import { useTheme } from "@/theme/use-theme";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BottomControls } from "./bottom-controls";
import { ErrorBannerSection } from "./error-banner-section";
import { ScrollableTranslationArea } from "./scrollable-translation-area";
import { TopBar } from "./top-bar";

function guessHostOsFromUa(): string {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Mac/i.test(ua)) return "macos";
  if (/Win/i.test(ua)) return "windows";
  if (/Android/i.test(ua)) return "android";
  if (/Linux/i.test(ua)) return "linux";
  return "other";
}

async function resolveHostOsId(): Promise<string> {
  try {
    return await invoke<string>("host_os_id");
  } catch {
    return guessHostOsFromUa();
  }
}

/** System URLs for opening microphone-related privacy settings (platform-specific). */
function urlsForMicrophonePrivacy(host: string): string[] {
  switch (host) {
    case "macos":
      return [
        "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone",
        "x-apple.systemsettings:com.apple.preference.security?Privacy_Microphone",
      ];
    case "windows":
      return ["ms-settings:privacy-microphone"];
    case "ios":
      return ["app-settings:", "App-Prefs:"];
    case "android":
      return ["app-settings:"];
    default:
      return ["app-settings:", "App-Prefs:"];
  }
}

export function AppShell() {
  const {
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
    clearTranscript,
    finalLines,
    interimOriginal,
    interimTranslated,
    recordingStatus,
    connectionStatus,
    error,
    permissionState,
    needsPermission,
    languageATokens,
    languageBTokens,
  } = useTranslationSession();

  const hasContent = finalLines.length > 0 || interimOriginal.length > 0 || interimTranslated.length > 0;

  const { t } = useTranslation();
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const outputMode = useSettingsStore((s) => s.outputMode);
  const setOutputMode = useSettingsStore((s) => s.setOutputMode);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    getApiKey().then((key) => {
      if (key) setApiKey(key);
    });
    if (
      typeof window.speechSynthesis !== "undefined" &&
      window.speechSynthesis.onvoiceschanged !== undefined
    ) {
      window.speechSynthesis.onvoiceschanged = () => {};
    }
    // Tag the root element with the host OS so CSS can enable
    // platform-specific effects (e.g. liquid glass on iOS/macOS only).
    resolveHostOsId().then((os) => {
      document.documentElement.dataset.platform = os;
    });
  }, [setApiKey]);

  const handleOpenMicSettings = async () => {
    const host = await resolveHostOsId();
    const targets = urlsForMicrophonePrivacy(host);
    for (const target of targets) {
      try {
        await openUrl(target);
        return;
      } catch (e) {
        console.log(e, target);
      }
    }
  };


  return (
    <Theme appearance={theme} accentColor="blue" grayColor="slate">
      {/* Full-viewport liquid glass layout — background from global.css */}
      <Box
        style={{
          maxWidth: 500,
          margin: "0 auto",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <TopBar
          connectionStatus={connectionStatus}
          theme={theme}
          onToggleTheme={toggleTheme}
          onHistoryOpen={() => setHistoryOpen(true)}
          onSettingsOpen={() => setSettingsOpen(true)}
        />

        <ErrorBannerSection error={error} />

        <ScrollableTranslationArea
          originalTokens={languageATokens}
          translatedTokens={languageBTokens}
          hasContent={hasContent}
          onClearTranscript={clearTranscript}
        />

        <BottomControls
          outputMode={outputMode}
          recordingStatus={recordingStatus}
          connectionStatus={connectionStatus}
          onSetOutputMode={setOutputMode}
          onStart={startSession}
          onPause={pauseSession}
          onResume={resumeSession}
          onStop={stopSession}
        />

        <SettingsPanel
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
        <HistorySheet
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
        />

        {/* ── Microphone permission sheet ── */}
        <BottomSheet isOpen={needsPermission} onClose={() => {}}>
          <Box p="4" style={{ textAlign: "center" }}>
            <Flex justify="center" mb="4">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--red-9)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            </Flex>

            {permissionState === "denied" && (
              <>
                <Text as="p" size="4" weight="bold" mb="2">
                  {t("mic_denied_title")}
                </Text>
                <Text as="p" size="2" color="gray" mb="5">
                  {t("mic_denied_body")}
                </Text>
                <Button style={{ width: "100%" }} onClick={handleOpenMicSettings}>
                  {t("mic_open_settings")}
                </Button>
              </>
            )}

            {(permissionState === "unavailable" ||
              permissionState === "unsupported") && (
              <>
                <Text as="p" size="4" weight="bold" mb="2">
                  {t("mic_unavailable_title")}
                </Text>
                <Text as="p" size="2" color="gray" mb="5">
                  {t("mic_unavailable_body")}
                </Text>
                <Button style={{ width: "100%" }} onClick={handleOpenMicSettings}>
                  {t("mic_open_settings")}
                </Button>
              </>
            )}
          </Box>
        </BottomSheet>
      </Box>
    </Theme>
  );
}
