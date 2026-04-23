import { Icon } from "@/v2/components/icons";
import { useV2T } from "@/v2/i18n";
import { useV2SettingsStore } from "@/v2/store/v2-settings-store";
import { Segmented, SegBtn } from "../main-screen-helpers";

export function OutputModeSegment() {
  const { t: i18n } = useV2T();
  const outputMode = useV2SettingsStore((s) => s.outputMode);
  const setOutputMode = useV2SettingsStore((s) => s.setOutputMode);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: 10,
        marginBottom: 10,
      }}
    >
      <Segmented>
        <SegBtn
          active={outputMode === "text"}
          icon={<Icon.Text />}
          onClick={() => setOutputMode("text")}
        >
          {i18n("v2_output_text")}
        </SegBtn>
        <SegBtn
          active={outputMode === "voice"}
          icon={<Icon.Speaker />}
          onClick={() => setOutputMode("voice")}
        >
          {i18n("v2_output_voice")}
        </SegBtn>
      </Segmented>
    </div>
  );
}
