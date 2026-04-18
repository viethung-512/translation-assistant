// Orchestrates recording session using @soniox/react SDK.
// Replaces: SonioxClient, AudioCapture, session-store, use-microphone-permission.
import { useRef, useState, useCallback, useMemo } from 'react';
import { useRecording, useMicrophonePermission } from '@soniox/react';
import { useSettingsStore } from '@/store/settings-store';
import { getApiKey } from '@/tauri/secure-storage';
import { writeTranscript, buildTranscriptContent } from '@/tauri/transcript-fs';
import type { TranscriptLine } from '@/tauri/transcript-fs';
import { TtsService } from '@/audio/tts-service';

export type RecordingStatus = "idle" | "recording" | "paused" | "stopping";
export type ConnectionStatus = "disconnected" | "connecting" | "connected";

// Map SDK recording state string to app status values.
// isPaused is tracked locally because the SDK has no pause concept.
function toRecordingStatus(state: string, isPaused: boolean): RecordingStatus {
  if (isPaused) return 'paused';
  if (state === 'recording') return 'recording';
  if (state === 'stopping') return 'stopping';
  return 'idle';
}

function toConnectionStatus(state: string): ConnectionStatus {
  if (state === 'starting' || state === 'connecting') return 'connecting';
  if (state === 'recording') return 'connected';
  return 'disconnected';
}

export function useTranslationSession() {
  const { outputMode, sourceLanguage, targetLanguage } = useSettingsStore();
  const ttsRef = useRef(new TtsService());
  const sessionStartedAt = useRef(0);

  // Hook-local accumulation state (replaces Zustand session-store)
  const [finalLines, setFinalLines] = useState<TranscriptLine[]>([]);
  const [interimOriginal, setInterimOriginal] = useState('');
  const [interimTranslated, setInterimTranslated] = useState('');
  // Mutable refs buffer inside onResult to avoid stale closure reads of state
  const interimOriginalRef = useRef('');
  const interimTranslatedRef = useRef('');

  // Pause state is local — SDK has no pause; pause = stop WS, resume = reconnect
  const [isPaused, setIsPaused] = useState(false);

  const { status: permissionStatus } = useMicrophonePermission({ autoCheck: true });

  const recording = useRecording({
    model: "stt-rt-v4",
    language_hints: [sourceLanguage],
    language_hints_strict: true,
    translation: {
      type: "two_way",
      language_a: sourceLanguage,
      language_b: targetLanguage
    },
    enable_language_identification: true,
    enable_speaker_diarization: true,
    enable_endpoint_detection: true,
    apiKey: async () => {
      const stored = await getApiKey();
      const mem = useSettingsStore.getState().apiKey;
      const key = mem || stored;
      if (!key)
        throw new Error(
          "API key not configured. Open settings to add your Soniox key.",
        );
      return key;
    },
    onResult: (result) => {
      result.tokens.forEach((token) => {
        const status = token.translation_status;
        // Tokens with 'original' or 'none' are source-language words
        const isOriginal =
          status === "original" || status === "none" || status == null;
        const isTranslation = status === "translation";
        if (isOriginal) {
          interimOriginalRef.current += token.text;
          setInterimOriginal(interimOriginalRef.current);
        } else if (isTranslation) {
          if (!token.is_final) {
            interimTranslatedRef.current += token.text;
            setInterimTranslated(interimTranslatedRef.current);
          } else {
            // Commit: pair accumulated original with this final translated text
            const line: TranscriptLine = {
              originalText: interimOriginalRef.current,
              translatedText: interimTranslatedRef.current + token.text,
              timestampMs: token.end_ms ?? Date.now(),
            };
            setFinalLines((prev) => [...prev, line]);
            interimOriginalRef.current = "";
            interimTranslatedRef.current = "";
            setInterimOriginal("");
            setInterimTranslated("");

            if (outputMode === "tts") {
              ttsRef.current.speak(token.text, targetLanguage);
            }
          }
        }
      });
    },
  });

  const allTokens = useMemo(() => [
    ...recording.finalTokens,
    ...recording.partialTokens,
  ], [recording.finalTokens, recording.partialTokens]);

  const startSession = useCallback(async () => {
    // Reset accumulation state
    setFinalLines([]);
    setInterimOriginal('');
    setInterimTranslated('');
    interimOriginalRef.current = '';
    interimTranslatedRef.current = '';
    sessionStartedAt.current = Date.now();
    ttsRef.current.setEnabled(outputMode === 'tts');
    await recording.start();
  }, [outputMode, recording]);

  // Pause: stop mic + WS without saving transcript. finalLines preserved.
  const pauseSession = useCallback(() => {
    ttsRef.current.stop();
    recording.stop();
    setIsPaused(true);
  }, [recording]);

  // Resume: reconnect as a new WS stream. Transcript continues appending.
  // isPaused is cleared only after start() succeeds — on failure, UI stays in paused state.
  const resumeSession = useCallback(async () => {
    ttsRef.current.setEnabled(outputMode === 'tts');
    await recording.start();
    setIsPaused(false);
  }, [outputMode, recording]);

  // Clear live transcript display without affecting recording state.
  const clearTranscript = useCallback(() => {
    setFinalLines([]);
    setInterimOriginal('');
    setInterimTranslated('');
    interimOriginalRef.current = '';
    interimTranslatedRef.current = '';
  }, []);

  const stopSession = useCallback(async () => {
    setIsPaused(false);
    ttsRef.current.stop();
    // SDK stop() signals graceful stop and drains pending final tokens.
    // If called from paused state, recording is already stopped — this is a no-op.
    // Any interim (uncommitted) tokens are intentionally dropped on stop.
    recording.stop();

    // Save transcript if any lines were finalized — capture state snapshot before async
    setFinalLines((currentLines) => {
      if (currentLines.length > 0) {
        const { sourceLanguage: src, targetLanguage: tgt } = useSettingsStore.getState();
        const content = buildTranscriptContent(currentLines, src, tgt, sessionStartedAt.current);
        const filename =
          new Date(sessionStartedAt.current).toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.txt';
        writeTranscript(filename, content).catch((e: unknown) =>
          console.error('Failed to save transcript:', e)
        );
      }
      return currentLines; // no mutation
    });
  }, [recording]);

  return {
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
    clearTranscript,
    finalLines,
    interimOriginal,
    interimTranslated,
    recordingStatus: toRecordingStatus(recording.state, isPaused),
    connectionStatus: toConnectionStatus(recording.state),
    error: recording.error?.message ?? null,
    permissionState: permissionStatus,
    needsPermission:
      permissionStatus === "denied" ||
      permissionStatus === "unavailable" ||
      permissionStatus === "unsupported",
    languageATokens: allTokens.filter((token) => token.language === sourceLanguage),
    languageBTokens: allTokens.filter((token) => token.language === targetLanguage),
  };
}
