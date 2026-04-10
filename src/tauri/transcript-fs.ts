// TypeScript wrappers for Tauri transcript filesystem commands.
import { invoke } from '@tauri-apps/api/core';

export interface TranscriptMeta {
  name: string;
  path: string;
  createdAt: string;
}

export const writeTranscript = (filename: string, content: string): Promise<void> =>
  invoke<void>('write_transcript', { filename, content });

export const listTranscripts = (): Promise<TranscriptMeta[]> =>
  invoke<TranscriptMeta[]>('list_transcripts');
