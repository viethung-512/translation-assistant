// STTProvider interface — all translation providers must implement this contract.
// Enables swapping Soniox for Deepgram/Google without touching UI code.

export interface TranslationToken {
  text: string;
  isFinal: boolean;
  type: 'original' | 'translated';
  startMs: number;
  endMs: number;
}

export interface ProviderConfig {
  apiKey: string;
  sourceLanguage: string; // BCP-47, e.g. "en"
  targetLanguage: string; // BCP-47, e.g. "vi"
}

export type TokenHandler = (token: TranslationToken) => void;
export type ErrorHandler = (error: Error) => void;
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
export type StatusHandler = (status: ConnectionStatus) => void;

export interface STTProvider {
  connect(config: ProviderConfig): Promise<void>;
  sendAudio(chunk: ArrayBuffer): void;
  disconnect(): void;
  onToken(handler: TokenHandler): void;
  onError(handler: ErrorHandler): void;
  onStatus(handler: StatusHandler): void;
}
