import { VT } from "@/tokens/tokens";
import { FC, useMemo } from "react";
import { Typography } from "../../ui/typography";

type SpeakerLabelProps = {
  idx?: string | number;
};

export const SpeakerLabel: FC<SpeakerLabelProps> = ({ idx }) => {
  const index = useMemo(() => {
    if (!idx) {
      return 0;
    }
    try {
      return parseInt(idx?.toString());
    } catch {
      return 0;
    }
  }, [idx]);

  return (
    <Typography
      color={VT.s[index]}
      style={{
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: -0.1,
      }}
    >
      Speaker {index + 1}
    </Typography>
  );
};
