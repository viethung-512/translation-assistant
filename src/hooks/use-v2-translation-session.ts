// Orchestrates recording session for v2 UI using @soniox/react SDK.
// Mirrors src/hooks/use-translation-session.ts but reads from v2 store.
import { putTranscript } from "@/storage/transcript-idb";
import { useV2HistoryStore } from "@/store/v2-history-store";
import { useV2SettingsStore } from "@/store/v2-settings-store";
import {
  buildHistoryFromSnapshot,
  type CommittedRow,
} from "@/utils/scrape-transcript";
import { useMicrophonePermission, useRecording } from "@soniox/react";
import { useCallback, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

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
function appendActiveTranscriptSnapshot(rows: CommittedRow[]): void {
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
}

export function useV2TranslationSession(props: {
  languageA?: string;
  languageB?: string;
}) {
  const {
    languageA: defaultLanguageA,
    languageB: defaultLanguageB,
    autoDetect,
    autoSave,
    recordSessions,
  } = useV2SettingsStore();
  const { languageA = defaultLanguageA, languageB = defaultLanguageB } = props;
  const sessionStartedAt = useRef(0);
  const rowSnapshotsRef = useRef<CommittedRow[]>([]);
  const languageBRef = useRef(languageB);
  languageBRef.current = languageB;

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
    onEndpoint() {
      appendActiveTranscriptSnapshot(rowSnapshotsRef.current);
    },
  });

  const startSession = useCallback(async () => {
    rowSnapshotsRef.current = [];
    sessionStartedAt.current = Date.now();
    setSaveError(null);

    // Start audio recording if enabled
    if (autoSave && recordSessions) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioStreamRef.current = stream;
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm",
        });
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          // All data is now available in audioChunksRef
        };

        mediaRecorder.start(100); // Collect data every 100ms
        mediaRecorderRef.current = mediaRecorder;
      } catch (err) {
        console.error("Failed to start audio recording:", err);
      }
    }

    await recording.start();
  }, [autoSave, recording, recordSessions]);

  const pauseSession = useCallback(() => {
    recording.stop();
    setIsPaused(true);
    // Pause audio recording
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
    }
  }, [recording]);

  const resumeSession = useCallback(async () => {
    await recording.start();
    setIsPaused(false);
    // Resume audio recording
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
    }
  }, [recording]);

  const stopSession = useCallback(async () => {
    setIsPaused(false);
    const startMs = sessionStartedAt.current;

    // Flush tail utterance BEFORE SDK stop (may clear tokens/DOM)
    appendActiveTranscriptSnapshot(rowSnapshotsRef.current);

    // Stop the translation recording
    recording.stop();
    if (!autoSave) {
      return;
    }

    const historyItem = buildHistoryFromSnapshot(
      rowSnapshotsRef.current,
      startMs,
    );
    if (!historyItem) {
      console.warn("There is no history item to save!");
      return;
    }
    const historyStore = useV2HistoryStore.getState();
    historyStore.addItem(historyItem);
    try {
      await putTranscript(historyItem.id, {
        v: 1,
        sessionStartMs: startMs,
        rows: rowSnapshotsRef.current,
      });
    } catch (error) {
      historyStore.removeItems([historyItem.id]);
      setSaveError("Failed to save transcript details.");
      console.error("Failed to persist transcript body", error);
    }

    // Stop and save audio recording
    if (mediaRecorderRef.current) {
      const mediaRecorder = mediaRecorderRef.current;

      if (mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }

      // Stop all tracks in the stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
      }

      // Create blob from collected chunks
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      console.log(
        "Audio recording chunks:",
        audioChunksRef.current.length,
        "blob size:",
        audioBlob.size,
      );

      // Save audio with historyItem ID if available
      if (audioBlob.size > 0) {
        console.log("Saving audio as:", `recording-${historyItem.id}.webm`);
        try {
          const arrayBuffer = await audioBlob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const filename = `recording-${historyItem.id}.webm`;
          await invoke("write_audio", {
            filename,
            data: Array.from(uint8Array),
          });
          console.log("Audio saved successfully");
        } catch (err) {
          console.error("Failed to save audio recording:", err);
        }
      } else {
        console.log(
          "No historyItemId, not saving audio. historyItemId:",
          historyItem,
        );
      }

      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
    }
  }, [recording, autoSave, recordSessions]);

  return {
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
    recordingStatus: toRecordingStatus(recording.state, isPaused),
    connectionStatus: toConnectionStatus(recording.state),
    error: recording.error?.message ?? saveError,
    permissionState: permissionStatus,
    needsPermission:
      permissionStatus === "denied" ||
      permissionStatus === "unavailable" ||
      permissionStatus === "unsupported",
    activeTokens: [...recording.tokens, ...recording.partialTokens],
  };
}
