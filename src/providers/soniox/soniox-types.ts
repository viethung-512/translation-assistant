// Soniox WebSocket API — request config and response token types.

export interface SonioxConfig {
  api_key: string;
  model: string;
  audio_format: {
    format: string;
    sample_rate: number;
    num_channels: number;
  };
  translation: {
    type: 'one_way';
    target_language: string;
  };
  enable_language_identification: boolean;
}

export interface SonioxToken {
  text: string;
  is_final: boolean;
  translation_status: 'original' | 'translated' | null;
  start_ms: number;
  end_ms: number;
  speaker?: string;
}
