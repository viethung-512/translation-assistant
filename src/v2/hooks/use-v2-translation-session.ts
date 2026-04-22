// Orchestrates recording session for v2 UI using @soniox/react SDK.
// Mirrors src/hooks/use-translation-session.ts but reads from v2 store.
import { TtsService } from "@/audio/tts-service";
import type { TranscriptLine } from "@/tauri/transcript-fs";
import { buildTranscriptContent, writeTranscript } from "@/tauri/transcript-fs";
import { useV2SettingsStore } from "@/v2/store/v2-settings-store";
import { useMicrophonePermission, useRecording } from "@soniox/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type RecordingStatus = "idle" | "recording" | "paused" | "stopping";
export type ConnectionStatus = "disconnected" | "connecting" | "connected";

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

export function useV2TranslationSession() {
  const { outputMode, languageA, languageB, autoDetect, autoSave } =
    useV2SettingsStore();
  const ttsRef = useRef(new TtsService());
  const sessionStartedAt = useRef(0);
  const spokenLinesCountRef = useRef(0);

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
    max_endpoint_delay_ms: 1000,
  });

  const allTokens = useMemo(
    () => [...recording.finalTokens, ...recording.partialTokens],
    [recording.finalTokens, recording.partialTokens],
  );

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

  const finalLines = useMemo<TranscriptLine[]>(() => {
    const lines: TranscriptLine[] = [];
    let origAcc = "";
    let transAcc = "";
    for (const token of recording.finalTokens) {
      const { translation_status } = token;

      const isOrig =
        translation_status === "original" ||
        translation_status === "none" ||
        translation_status == null;
      const isTrans = translation_status === "translation";

      if (isOrig) {
        origAcc += token.text;
      } else if (isTrans) {
        transAcc += token.text;
      }

      // if (isUserSpeakEnd) {
      //   lines.push({
      //     originalText: origAcc,
      //     translatedText: transAcc,
      //     timestampMs,
      //     detectedLanguage: autoDetect ? detectedLang : undefined,
      //   });
      //   origAcc = "";
      //   transAcc = "";
      //   detectedLang = undefined;
      //   // translated
      // }
    }
    return lines;
  }, [recording.finalTokens, autoDetect]);

  // v2 uses "voice" (not "tts") for TTS output mode
  useEffect(() => {
    if (outputMode !== "voice") return;
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

  const startSession = useCallback(async () => {
    spokenLinesCountRef.current = 0;
    sessionStartedAt.current = Date.now();
    ttsRef.current.setEnabled(outputMode === "voice");
    await recording.start();
  }, [outputMode, recording]);

  const pauseSession = useCallback(() => {
    ttsRef.current.stop();
    recording.stop();
    setIsPaused(true);
  }, [recording]);

  const resumeSession = useCallback(async () => {
    ttsRef.current.setEnabled(outputMode === "voice");
    await recording.start();
    setIsPaused(false);
  }, [outputMode, recording]);

  const stopSession = useCallback(async () => {
    setIsPaused(false);
    ttsRef.current.stop();
    recording.stop();
    // Only write transcript if autoSave is enabled
    if (autoSave && finalLines.length > 0) {
      const { languageA: la, languageB: lb } = useV2SettingsStore.getState();
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
  }, [recording, finalLines, autoSave]);

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
