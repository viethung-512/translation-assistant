// Orchestrates recording session using @soniox/react SDK.
// Replaces: SonioxClient, AudioCapture, session-store, use-microphone-permission.
import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useRecording, useMicrophonePermission } from "@soniox/react";
import { useSettingsStore } from "@/store/settings-store";
import { getApiKey } from "@/tauri/secure-storage";
import { writeTranscript, buildTranscriptContent } from "@/tauri/transcript-fs";
import type { TranscriptLine } from "@/tauri/transcript-fs";
import { TtsService } from "@/audio/tts-service";

export type RecordingStatus = "idle" | "recording" | "paused" | "stopping";
export type ConnectionStatus = "disconnected" | "connecting" | "connected";

// Map SDK recording state string to app status values.
// isPaused is tracked locally because the SDK has no pause concept.
function toRecordingStatus(state: string, isPaused: boolean): RecordingStatus {
  if (isPaused) return "paused";
  if (state === "recording") return "recording";
  if (state === "stopping") return "stopping";
  return "idle";
}

function toConnectionStatus(state: string): ConnectionStatus {
  if (state === "starting" || state === "connecting") return "connecting";
  if (state === "recording") return "connected";
  return "disconnected";
}

export function useTranslationSession() {
  const { outputMode, languageA, languageB, autoDetect } = useSettingsStore();
  const ttsRef = useRef(new TtsService());
  const sessionStartedAt = useRef(0);
  // Tracks how many finalLines have already been spoken to avoid re-speaking on rerender.
  const spokenLinesCountRef = useRef(0);

  // Pause state is local — SDK has no pause; pause = stop WS, resume = reconnect
  const [isPaused, setIsPaused] = useState(false);

  const { status: permissionStatus } = useMicrophonePermission({
    autoCheck: true,
  });

  const recording = useRecording({
    model: "stt-rt-v4",
    language_hints: autoDetect ? [languageA, languageB] : [languageA],
    language_hints_strict: !autoDetect,
    translation: {
      type: "two_way",
      language_a: languageA,
      language_b: languageB,
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
  });

  // Derive transcript lines from finalTokens: original tokens accumulate until
  // a translation token appears, which commits the pair as a line.
  const finalLines = useMemo<TranscriptLine[]>(() => {
    const lines: TranscriptLine[] = [];
    let origAcc = "";
    let transAcc = "";
    let detectedLang: string | undefined;
    let timestampMs = 0;

    for (const token of recording.finalTokens) {
      const s = token.translation_status;
      const isOrig = s === "original" || s === "none" || s == null;
      if (isOrig) {
        origAcc += token.text;
        if (token.language) detectedLang = token.language;
      } else if (s === "translation") {
        transAcc += token.text;
        timestampMs = token.end_ms ?? Date.now();
        lines.push({
          originalText: origAcc,
          translatedText: transAcc,
          timestampMs,
          detectedLanguage: autoDetect ? detectedLang : undefined,
        });
        origAcc = "";
        transAcc = "";
        detectedLang = undefined;
      }
    }
    return lines;
  }, [recording.finalTokens, autoDetect]);

  // Trigger TTS for newly committed lines only.
  useEffect(() => {
    if (outputMode !== "tts") return;
    const newLines = finalLines.slice(spokenLinesCountRef.current);
    newLines.forEach((line) => {
      const ttsLang = autoDetect
        ? line.detectedLanguage === languageA
          ? languageB
          : line.detectedLanguage === languageB
            ? languageA
            : languageB
        : languageB;
      ttsRef.current.speak(line.translatedText, ttsLang);
    });
    spokenLinesCountRef.current = finalLines.length;
  }, [finalLines, outputMode, autoDetect, languageA, languageB]);

  const allTokens = useMemo(
    () => [...recording.finalTokens, ...recording.partialTokens],
    [recording.finalTokens, recording.partialTokens],
  );

  // Split tokens by translation_status — works correctly in both manual and auto-detect modes
  const originalTokens = useMemo(
    () =>
      allTokens.filter((t) => {
        const s = t.translation_status;
        return s === "original" || s === "none" || s == null;
      }),
    [allTokens],
  );

  const translatedTokens = useMemo(
    () => allTokens.filter((t) => t.translation_status === "translation"),
    [allTokens],
  );

  const startSession = useCallback(async () => {
    spokenLinesCountRef.current = 0;
    sessionStartedAt.current = Date.now();
    ttsRef.current.setEnabled(outputMode === "tts");
    await recording.start();
  }, [outputMode, recording]);

  // Pause: stop mic + WS without saving transcript.
  const pauseSession = useCallback(() => {
    ttsRef.current.stop();
    recording.stop();
    setIsPaused(true);
  }, [recording]);

  // Resume: reconnect as a new WS stream. Transcript continues appending.
  // isPaused is cleared only after start() succeeds — on failure, UI stays in paused state.
  const resumeSession = useCallback(async () => {
    ttsRef.current.setEnabled(outputMode === "tts");
    await recording.start();
    setIsPaused(false);
  }, [outputMode, recording]);

  const stopSession = useCallback(async () => {
    setIsPaused(false);
    ttsRef.current.stop();
    // SDK stop() signals graceful stop and drains pending final tokens.
    // If called from paused state, recording is already stopped — this is a no-op.
    recording.stop();

    if (finalLines.length > 0) {
      const { languageA: la, languageB: lb } = useSettingsStore.getState();
      const content = buildTranscriptContent(
        finalLines,
        la,
        lb,
        sessionStartedAt.current,
      );
      const filename =
        new Date(sessionStartedAt.current)
          .toISOString()
          .replace(/[:.]/g, "-")
          .slice(0, 19) + ".txt";
      writeTranscript(filename, content).catch((e: unknown) =>
        console.error("Failed to save transcript:", e),
      );
    }
  }, [recording, finalLines]);

  return {
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
    finalLines,
    recordingStatus: toRecordingStatus(recording.state, isPaused),
    connectionStatus: toConnectionStatus(recording.state),
    error: recording.error?.message ?? null,
    permissionState: permissionStatus,
    needsPermission:
      permissionStatus === "denied" ||
      permissionStatus === "unavailable" ||
      permissionStatus === "unsupported",
    originalTokens,
    translatedTokens,
  };
}
