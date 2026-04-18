import { RecordingStatus } from "@/hooks/use-translation-session";
import type { TranscriptLine } from "@/tauri/transcript-fs";
import { RealtimeToken } from "@soniox/client";
import Renderer from "../TranslationDisplay/renderer";

interface Props {
  finalLines: TranscriptLine[];
  interimOriginal: string;
  interimTranslated: string;
  recordingStatus: RecordingStatus;
  originalTokens: RealtimeToken[]
  translatedTokens: RealtimeToken[]
}

export function ScrollableTranslationArea({ originalTokens, translatedTokens }: Props) {
  return (
    <div>
      <Renderer tokens={originalTokens} placeholder="Original language" />
      <Renderer tokens={translatedTokens} placeholder="Translated language" />
    </div>
  );
}
