// Orchestrates the full recording session: AudioCapture → SonioxClient → SessionStore → TTS.
// The only file that holds references to all four layers simultaneously.
import { useRef, useEffect, useCallback } from 'react';
import { AudioCapture } from '@/audio/audio-capture';
import { SonioxClient } from '@/providers/soniox/soniox-client';
import { TtsService } from '@/audio/tts-service';
import { useSessionStore } from '@/store/session-store';
import { useSettingsStore } from '@/store/settings-store';
import { getApiKey } from '@/tauri/secure-storage';
import { writeTranscript } from '@/tauri/transcript-fs';
import { buildTranscriptContent } from '@/store/session-store';

export function useTranslationSession() {
  const audioCapture = useRef<AudioCapture | null>(null);
  const provider = useRef(new SonioxClient());
  const ttsService = useRef(new TtsService());
  const sessionStartedAt = useRef(0);

  const setRecordingStatus = useSessionStore((s) => s.setRecordingStatus);
  const setConnectionStatus = useSessionStore((s) => s.setConnectionStatus);
  const appendToken = useSessionStore((s) => s.appendToken);
  const resetSession = useSessionStore((s) => s.resetSession);
  const setError = useSessionStore((s) => s.setError);

  const outputMode = useSettingsStore((s) => s.outputMode);
  const targetLanguage = useSettingsStore((s) => s.targetLanguage);

  // Wire provider callbacks — re-register if outputMode/targetLanguage change
  useEffect(() => {
    provider.current.onStatus(setConnectionStatus);
    provider.current.onToken((token) => {
      appendToken(token.text, token.isFinal, token.type, token.endMs);
      if (token.type === 'translated' && token.isFinal && outputMode === 'tts') {
        ttsService.current.speak(token.text, targetLanguage);
      }
    });
    provider.current.onError((err) => setError(err.message));
  }, [outputMode, targetLanguage, setConnectionStatus, appendToken, setError]);

  const startSession = useCallback(async () => {
    // Prefer in-memory key (set on mount); fall back to secure storage
    const storedKey = await getApiKey();
    const { apiKey, sourceLanguage, targetLanguage: tgtLang } = useSettingsStore.getState();
    const key = apiKey || storedKey;

    if (!key) {
      setError('API key not configured. Open settings to add your Soniox key.');
      return;
    }

    resetSession();
    sessionStartedAt.current = Date.now();
    setRecordingStatus('recording');
    ttsService.current.setEnabled(outputMode === 'tts');

    try {
      await provider.current.connect({ apiKey: key, sourceLanguage, targetLanguage: tgtLang });
      audioCapture.current = new AudioCapture((chunk) => {
        provider.current.sendAudio(chunk);
      });
      await audioCapture.current.start();
    } catch (err) {
      setError((err as Error).message);
      setRecordingStatus('idle');
    }
  }, [outputMode, resetSession, setRecordingStatus, setError]);

  const stopSession = useCallback(async () => {
    setRecordingStatus('stopping');
    ttsService.current.stop();
    audioCapture.current?.stop();
    audioCapture.current = null;

    // Drain: allow final tokens to arrive before disconnecting
    await new Promise<void>((r) => setTimeout(r, 500));
    provider.current.disconnect();

    // Save transcript if any lines were recorded
    const { finalLines } = useSessionStore.getState();
    const { sourceLanguage, targetLanguage: tgtLang } = useSettingsStore.getState();
    if (finalLines.length > 0) {
      const content = buildTranscriptContent(finalLines, sourceLanguage, tgtLang, sessionStartedAt.current);
      const filename =
        new Date(sessionStartedAt.current).toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.txt';
      writeTranscript(filename, content).catch((e: unknown) =>
        console.error('Failed to save transcript:', e)
      );
    }

    setRecordingStatus('idle');
  }, [setRecordingStatus]);

  // Pause/resume audio capture on mobile app backgrounding
  useEffect(() => {
    const handleVisibility = () => {
      const { recordingStatus } = useSessionStore.getState();
      if (document.hidden && recordingStatus === 'recording') {
        audioCapture.current?.stop();
        audioCapture.current = null;
      } else if (!document.hidden && recordingStatus === 'recording') {
        audioCapture.current = new AudioCapture((chunk) =>
          provider.current.sendAudio(chunk)
        );
        audioCapture.current.start().catch((e: Error) => setError(e.message));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [setError]);

  return { startSession, stopSession };
}
