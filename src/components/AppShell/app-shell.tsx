// Main app container: wires session hook to all UI sections.
import { useState, useCallback, useEffect } from "react";
import { useTranslationSession } from "@/hooks/use-translation-session";
import { useSettingsStore } from "@/store/settings-store";
import { getApiKey } from "@/tauri/secure-storage";
import { useTheme } from "@/theme/use-theme";
import { Button } from "@/components/ui";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { SettingsPanel } from "@/components/Settings/settings-panel";
import { HistorySheet } from "@/components/History/history-sheet";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { TopBar } from "./top-bar";
import { ErrorBannerSection } from "./error-banner-section";
import { ScrollableTranslationArea } from "./scrollable-translation-area";
import { BottomControls } from "./bottom-controls";

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
    finalLines,
    interimOriginal,
    interimTranslated,
    recordingStatus,
    connectionStatus,
    error,
    permissionState,
    needsPermission,
  } = useTranslationSession();

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

  const handleRecordToggle = useCallback(async () => {
    if (recordingStatus === "idle") {
      await startSession();
    } else if (recordingStatus === "recording") {
      stopSession();
    }
  }, [recordingStatus, startSession, stopSession]);

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "0 auto",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
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
        finalLines={finalLines}
        interimOriginal={interimOriginal}
        interimTranslated={interimTranslated}
        recordingStatus={recordingStatus}
      />

      <BottomControls
        outputMode={outputMode}
        recordingStatus={recordingStatus}
        connectionStatus={connectionStatus}
        onToggleOutputMode={() =>
          setOutputMode(outputMode === "tts" ? "text" : "tts")
        }
        onRecordToggle={handleRecordToggle}
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
        <div style={{ padding: "16px 24px 8px", textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--danger)"
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
          </div>

          {permissionState === "denied" && (
            <>
              <p style={{ fontSize: 17, fontWeight: 600, margin: "0 0 8px" }}>
                Microphone Access Denied
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  margin: "0 0 24px",
                  lineHeight: 1.5,
                }}
              >
                Microphone permission was denied. To use this app, enable
                microphone access in your device settings.
              </p>
              <Button style={{ width: "100%" }} onClick={handleOpenMicSettings}>
                Open Settings
              </Button>
            </>
          )}

          {(permissionState === "unavailable" ||
            permissionState === "unsupported") && (
            <>
              <p style={{ fontSize: 17, fontWeight: 600, margin: "0 0 8px" }}>
                Microphone Unavailable
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  margin: "0 0 24px",
                  lineHeight: 1.5,
                }}
              >
                No microphone device found. Please connect a microphone and try
                again.
              </p>
              <Button style={{ width: "100%" }} onClick={handleOpenMicSettings}>
                Open Settings
              </Button>
            </>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
