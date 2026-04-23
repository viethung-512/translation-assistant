import { FC } from "react";
import { Typography } from "../../ui/typography";

type SpeakerLabelProps = {
  idx?: string | number;
};

export const SpeakerLabel: FC<SpeakerLabelProps> = ({ idx }) => {
  return <Typography>Speaker {idx}</Typography>;
};
