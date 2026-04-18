import { Box, Flex, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { Button, IconButton } from "@/components/ui";
import { RecordButton } from "@/components/Controls/record-button";
import { IconSpeaker, IconText } from "@/components/icons";
import type { ConnectionStatus, RecordingStatus } from "@/hooks/use-translation-session";

interface Props {
  outputMode: "tts" | "text";
  recordingStatus: RecordingStatus;
  connectionStatus: ConnectionStatus;
  onToggleOutputMode: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

// Square stop icon
function StopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}

export function BottomControls({
  outputMode,
  recordingStatus,
  connectionStatus,
  onToggleOutputMode,
  onStart,
  onPause,
  onResume,
  onStop,
}: Props) {
  const { t } = useTranslation();

  const isSessionActive = recordingStatus === 'recording' || recordingStatus === 'paused';
  const isDisabled = recordingStatus === 'stopping' || connectionStatus === 'connecting';

  const handleMainButton = () => {
    if (recordingStatus === 'idle')      return onStart();
    if (recordingStatus === 'recording') return onPause();
    if (recordingStatus === 'paused')    return onResume();
  };

  return (
    /* Floating glass card anchored above the safe area */
    <Box
      style={{
        margin: "0 16px 16px",
        paddingTop: 20,
        paddingBottom: `max(24px, env(safe-area-inset-bottom))`,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 32,
        flexShrink: 0,
      }}
      className="float-bar animate-slide-up"
    >
      {/* Output mode row */}
      <Flex align="center" justify="center" gap="3" mb="5">
        <Flex align="center" gap="2">
          <Text size="2" color="gray">
            {outputMode === "tts" ? <IconSpeaker /> : <IconText />}
          </Text>
          <Text size="2" color="gray">
            {outputMode === "tts" ? t("settings_voice_output") : t("settings_text_only")}
          </Text>
        </Flex>
        <Button variant="outline" size="sm" onClick={onToggleOutputMode}>
          {t("controls_switch")}
        </Button>
      </Flex>

      {/* Record button row — stop button appears alongside when session is active */}
      <Flex justify="center" align="center" gap="5">
        {/* Left spacer keeps main button centered when stop button is absent */}
        <div aria-hidden="true" style={{ width: 44, height: 44, visibility: "hidden" }} />

        <RecordButton
          recordingStatus={recordingStatus}
          isDisabled={isDisabled}
          onClick={handleMainButton}
        />

        {/* Stop button — only visible when session active */}
        {isSessionActive ? (
          <IconButton
            aria-label={t('aria_stop')}
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
