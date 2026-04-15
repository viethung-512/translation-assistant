import { Button } from "@/components/ui";
import { RecordButton } from "@/components/Controls/record-button";
import { IconSpeaker, IconText } from "@/components/icons";
import { ConnectionStatus, RecordingStatus } from "@/hooks/use-translation-session";

interface Props {
  outputMode: "tts" | "text";
  recordingStatus: RecordingStatus;
  connectionStatus: ConnectionStatus;
  onToggleOutputMode: () => void;
  onRecordToggle: () => void;
}

export function BottomControls({
  outputMode,
  recordingStatus,
  connectionStatus,
  onToggleOutputMode,
  onRecordToggle,
}: Props) {
  return (
    <div
      style={{
        padding: "12px 16px",
        paddingBottom: `calc(12px + env(safe-area-inset-bottom, 0px))`,
        borderTop: "1px solid var(--border)",
        background: "var(--bg-primary)",
      }}
    >
      <div className="flex items-center justify-center gap-[6px] mb-[14px] text-[12px] text-text-secondary">
        <span className="flex items-center gap-1">
          {outputMode === "tts" ? <IconSpeaker /> : <IconText />}
          {outputMode === "tts" ? "Voice output" : "Text only"}
        </span>
        <Button variant="outline" size="sm" onClick={onToggleOutputMode}>
          Switch
        </Button>
      </div>
      <div className="flex justify-center">
        <RecordButton
          isRecording={recordingStatus === "recording"}
          isDisabled={
            recordingStatus === "stopping" || connectionStatus === "connecting"
          }
          onClick={onRecordToggle}
        />
      </div>
    </div>
  );
}
