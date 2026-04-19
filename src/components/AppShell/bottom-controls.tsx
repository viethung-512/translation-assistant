import { Box, Flex, SegmentedControl } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { IconButton } from "@/components/ui";
import { RecordButton } from "@/components/Controls/record-button";
import type {
  ConnectionStatus,
  RecordingStatus,
} from "@/hooks/use-translation-session";
import { useSafeAreaContext } from "./safe-area-provider";

interface Props {
  outputMode: "tts" | "text";
  recordingStatus: RecordingStatus;
  connectionStatus: ConnectionStatus;
  onSetOutputMode: (mode: "tts" | "text") => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

// Square stop icon
function StopIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}

export function BottomControls({
  outputMode,
  recordingStatus,
  connectionStatus,
  onSetOutputMode,
  onStart,
  onPause,
  onResume,
  onStop,
}: Props) {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaContext();

  const isSessionActive =
    recordingStatus === "recording" || recordingStatus === "paused";
  const isDisabled =
    recordingStatus === "stopping" || connectionStatus === "connecting";

  const handleMainButton = () => {
    if (recordingStatus === "idle") return onStart();
    if (recordingStatus === "recording") return onPause();
    if (recordingStatus === "paused") return onResume();
  };

  return (
    /* Floating glass card anchored above the safe area */
    <Box
      style={{
        paddingTop: 16,
        paddingBottom: `calc(16px + ${bottom}px)`,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 20,
        border: "none",
        flexShrink: 0,
      }}
      className="float-bar animate-slide-up"
    >
      {/* Output mode — full-width segmented control, touch-friendly */}
      <Flex justify="center" mb="3">
        <SegmentedControl.Root
          value={outputMode}
          onValueChange={(v) => onSetOutputMode(v as "text" | "tts")}
          size="2"
          style={{ width: "100%" }}
        >
          <SegmentedControl.Item value="text" style={{ flex: 1 }}>
            {t("settings_text_only")}
          </SegmentedControl.Item>
          <SegmentedControl.Item value="tts" style={{ flex: 1 }}>
            {t("settings_voice_output")}
          </SegmentedControl.Item>
        </SegmentedControl.Root>
      </Flex>

      {/* Record button row — stop button appears alongside when session is active */}
      <Flex justify="center" align="center" gap="5">
        {/* Left spacer keeps main button centered when stop button is absent */}
        <div
          aria-hidden="true"
          style={{ width: 44, height: 44, visibility: "hidden" }}
        />

        <RecordButton
          recordingStatus={recordingStatus}
          isDisabled={isDisabled}
          onClick={handleMainButton}
        />

        {/* Stop button — only visible when session active */}
        {isSessionActive ? (
          <IconButton
            aria-label={t("aria_stop")}
            onClick={onStop}
            disabled={isDisabled}
            style={{ width: 44, height: 44 }}
          >
            <StopIcon />
          </IconButton>
        ) : (
          <Box style={{ width: 44 }} />
        )}
      </Flex>
    </Box>
  );
}
