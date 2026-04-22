// TypeScript wrappers for Tauri transcript filesystem commands.
// Also owns TranscriptLine shape and buildTranscriptContent (moved from session-store).
import { invoke } from "@tauri-apps/api/core";

export interface TranscriptLine {
  originalText: string;
  translatedText: string;
  timestampMs: number;
  detectedLanguage?: string; // populated in auto-detect mode from token.language
}

export interface INewTranscriptLine extends TranscriptLine {
  provisionalText: string;
}

/** Build a human-readable transcript string from finalized lines. */
export function buildTranscriptContent(
  lines: TranscriptLine[],
  langA: string,
  langB: string,
  startedAt: number,
): string {
  const date = new Date(startedAt).toISOString().replace("T", " ").slice(0, 19);
  const header = `[${date}] Session: ${langA.toUpperCase()} ↔ ${langB.toUpperCase()}\n${"─".repeat(50)}\n`;
  const body = lines
    .map((l) => {
      const t = new Date(l.timestampMs).toISOString().slice(11, 19);
      return `[${t}] ${l.translatedText}\n         ${l.originalText}`;
    })
    .join("\n");
  return header + body;
}

export interface TranscriptMeta {
  name: string;
  path: string;
  createdAt: string;
}

export const writeTranscript = (
  filename: string,
  content: string,
): Promise<void> => invoke<void>("write_transcript", { filename, content });

export const listTranscripts = (): Promise<TranscriptMeta[]> =>
  invoke<TranscriptMeta[]>("list_transcripts");

export const readTranscript = (filename: string): Promise<string> =>
  invoke<string>("read_transcript", { filename });

export const deleteTranscript = (filename: string): Promise<void> =>
  invoke<void>("delete_transcript", { filename });
