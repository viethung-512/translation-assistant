import { Text } from "@radix-ui/themes";
import { getSpeakerColor } from "../utils/speaker-colors";

interface SpeakerLabelProps {
  speakerNumber: string | number;
}

export default function SpeakerLabel({ speakerNumber }: SpeakerLabelProps) {
  const speakerColor = getSpeakerColor(speakerNumber);

  return (
    <Text
      as="div"
      size="2"
      weight="bold"
      style={{ textTransform: "uppercase", marginTop: "var(--space-2)", color: speakerColor }}
    >
      Speaker {speakerNumber}:
    </Text>
  );
}
