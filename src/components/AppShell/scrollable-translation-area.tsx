import { TranslationDisplay } from "@/components/TranslationDisplay/translation-display";
import { RecordingStatus } from "@/hooks/use-translation-session";
import type { TranscriptLine } from "@/tauri/transcript-fs";

interface Props {
  finalLines: TranscriptLine[];
  interimOriginal: string;
  interimTranslated: string;
  recordingStatus: RecordingStatus;
}

export function ScrollableTranslationArea(props: Props) {
  return <TranslationDisplay {...props} />;
}
