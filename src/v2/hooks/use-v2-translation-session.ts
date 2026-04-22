// Orchestrates recording session for v2 UI using @soniox/react SDK.
// Mirrors src/hooks/use-translation-session.ts but reads from v2 store.
import { TtsService } from "@/audio/tts-service";
import { useV2SettingsStore } from "@/v2/store/v2-settings-store";
import { useV2HistoryStore } from "@/v2/store/v2-history-store";
import {
  buildHistoryFromSnapshot,
  type CommittedRow,
} from "@/v2/utils/scrape-transcript";
import { useMicrophonePermission, useRecording } from "@soniox/react";
import { useCallback, useMemo, useRef, useState } from "react";

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

/** Read `#active-transcript-row` and append if non-empty and not duplicate of last row. */
function appendActiveTranscriptSnapshot(
  rows: CommittedRow[],
  opts: { speak: boolean; tts: TtsService; languageB: string },
): void {
  const el = document.getElementById(
    "active-transcript-row",
  ) as HTMLElement | null;
  if (!el) return;
  const {
    speaker = "S1",
    lang = "",
    orig = "",
    trans = "",
    endMs = "0",
  } = el.dataset;
  if (!orig && !trans) return;
  const last = rows[rows.length - 1];
  if (last && last.origText === orig && last.transText === trans) return;
  rows.push({
    id: crypto.randomUUID(),
    speaker,
    lang,
    origText: orig,
    transText: trans,
    endMs: Number(endMs),
  });
  if (opts.speak && trans) {
    opts.tts.speak(trans, opts.languageB);
  }
}

export function useV2TranslationSession() {
  const { outputMode, languageA, languageB, autoDetect, autoSave } =
    useV2SettingsStore();
  const ttsRef = useRef(new TtsService());
  const sessionStartedAt = useRef(0);
  const rowSnapshotsRef = useRef<CommittedRow[]>([]);
  const outputModeRef = useRef(outputMode);
  const languageBRef = useRef(languageB);
  outputModeRef.current = outputMode;
  languageBRef.current = languageB;

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
    onEndpoint() {
      appendActiveTranscriptSnapshot(rowSnapshotsRef.current, {
        speak: outputModeRef.current === "voice",
        tts: ttsRef.current,
        languageB: languageBRef.current,
      });
    },
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

  const startSession = useCallback(async () => {
    rowSnapshotsRef.current = [];
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
    const startMs = sessionStartedAt.current;

    if (autoSave) {
      // Flush tail utterance before SDK stop may clear tokens / DOM.
      appendActiveTranscriptSnapshot(rowSnapshotsRef.current, {
        speak: false,
        tts: ttsRef.current,
        languageB: languageBRef.current,
      });
    }

    recording.stop();

    if (autoSave) {
      const historyItem = buildHistoryFromSnapshot(
        rowSnapshotsRef.current,
        startMs,
      );
      if (historyItem) {
        useV2HistoryStore.getState().addItem(historyItem);
      }
    }
  }, [recording, autoSave]);

  return {
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
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
