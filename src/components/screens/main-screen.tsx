import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useT, VT } from "@/tokens/tokens";
import { Icon } from "@/components/icons";
import { ScreenLayout } from "@/components/ui/screen-layout";
import { IconBtn, LangPill } from "./main-screen-helpers";
import { InlineBanner } from "@/components/ui/inline-banner";
import { Button } from "@/components/ui/button";
import { TranscriptRow } from "./shared/transcript-row";
import { EmptyState } from "@/components/ui/empty-state";
import { LangSheet } from "@/components/ui/lang-sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useV2SettingsStore } from "@/store/v2-settings-store";
import { useV2TranslationSession } from "@/hooks/use-v2-translation-session";
import { ALL_AVAILABLE_LANGUAGES } from "@/tokens/languages";
import { useV2T } from "@/i18n";
import type { RealtimeToken } from "@soniox/client";

type SessionState =
  | "ready"
  | "listening"
  | "paused"
  | "translating"
  | "stopped";

interface MainScreenProps {
  onSettings?: (autoOpenApiKey?: boolean) => void;
  onHistory?: () => void;
}

interface CommittedTranscriptRow {
  rowKey: string;
  originalTokens: RealtimeToken[];
  translatedTokens: RealtimeToken[];
  speaker?: string;
  language?: string;
  endMs?: number;
}

function splitActiveTokens(tokens: readonly RealtimeToken[]) {
  const originalTokens: RealtimeToken[] = [];
  const translatedTokens: RealtimeToken[] = [];
  for (const tok of tokens) {
    if (tok.translation_status === "translation") {
      translatedTokens.push(tok);
    } else {
      originalTokens.push(tok);
    }
  }
  return { originalTokens, translatedTokens };
}

function deriveRowMeta(
  tokens: readonly RealtimeToken[],
  split: ReturnType<typeof splitActiveTokens>,
) {
  const firstOrig = split.originalTokens[0];
  const firstTrans = split.translatedTokens[0];
  const lastTok = tokens[tokens.length - 1];
  return {
    speaker: firstOrig?.speaker ?? firstTrans?.speaker,
    language: firstOrig?.language ?? firstTrans?.language,
    endMs: lastTok?.end_ms,
  };
}

export function MainScreen({ onSettings, onHistory }: MainScreenProps) {
  const t = useT();
  const { t: i18n } = useV2T();
  const { languageA: storeA, languageB: storeB, apiKey } = useV2SettingsStore();

  const [localLangA, setLocalLangA] = useState(storeA);
  const [localLangB, setLocalLangB] = useState(storeB);

  const session = useV2TranslationSession({
    languageA: localLangA,
    languageB: localLangB,
  });

  const [langSlot, setLangSlot] = useState<"A" | "B" | null>(null);
  const [showNoKeyDialog, setShowNoKeyDialog] = useState(false);
  const [isFollowingLive, setIsFollowingLive] = useState(true);
  const [committedRows, setCommittedRows] = useState<CommittedTranscriptRow[]>(
    [],
  );
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  const liveRowAnchorRef = useRef<HTMLDivElement | null>(null);
  const lastLiveSplitRef = useRef<{
    originalTokens: RealtimeToken[];
    translatedTokens: RealtimeToken[];
    speaker?: string;
    language?: string;
    endMs?: number;
  } | null>(null);
  const prevActiveLenRef = useRef(0);

  const langA = useMemo(
    () =>
      ALL_AVAILABLE_LANGUAGES.find((l) => l.code === localLangA) ?? {
        flag: "🇺🇸",
        code: "EN",
        name: "English",
      },
    [localLangA],
  );
  const langB = useMemo(
    () =>
      ALL_AVAILABLE_LANGUAGES.find((l) => l.code === localLangB) ?? {
        flag: "🇻🇳",
        code: "VI",
        name: "Vietnamese",
      },
    [localLangB],
  );

  const swapLocal = useCallback(() => {
    setLocalLangA((a) => {
      setLocalLangB(a);
      return localLangB;
    });
  }, [localLangB]);

  const sessionState = useMemo<SessionState>(() => {
    switch (session.recordingStatus) {
      case "recording":
        return "listening";
      case "paused":
        return "paused";
      case "stopping":
        return "stopped";
      default:
        return "ready";
    }
  }, [session.recordingStatus]);

  const isActive =
    sessionState === "listening" || sessionState === "translating";
  const isPaused = sessionState === "paused";

  const handleLangSelect = useCallback(
    (code: string) => {
      if (langSlot === "A") setLocalLangA(code);
      else if (langSlot === "B") setLocalLangB(code);
      setLangSlot(null);
    },
    [langSlot],
  );

  const openLangSlotA = useCallback(() => setLangSlot("A"), []);
  const openLangSlotB = useCallback(() => setLangSlot("B"), []);
  const closeLangSlot = useCallback(() => setLangSlot(null), []);

  const handleMainBtn = useCallback(async () => {
    if (sessionState === "ready" || sessionState === "stopped") {
      // Check API key before starting
      if (!apiKey.trim()) {
        setShowNoKeyDialog(true);
        return;
      }
      try {
        await session.startSession();
        setCommittedRows([]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("API key")) setShowNoKeyDialog(true);
      }
    } else if (sessionState === "listening") {
      session.pauseSession();
    } else if (sessionState === "paused") {
      await session.resumeSession();
    }
  }, [apiKey, sessionState, session]);

  const handleStop = useCallback(() => {
    session.stopSession();
  }, [session]);

  const statusMap = useMemo<
    Record<SessionState, { label: string; dot: string }>
  >(
    () => ({
      ready: { label: i18n("v2_status_ready"), dot: "#94A3B8" },
      listening: { label: i18n("v2_status_listening"), dot: VT.cyan },
      paused: { label: i18n("v2_status_paused_label"), dot: VT.warning },
      translating: { label: i18n("v2_status_translating"), dot: VT.cyan },
      stopped: { label: i18n("v2_status_stopped"), dot: VT.error },
    }),
    [i18n],
  );

  const status = statusMap[sessionState];

  const liveSplit = useMemo(() => {
    if (session.activeTokens.length === 0) return null;
    const split = splitActiveTokens(session.activeTokens);
    return {
      originalTokens: split.originalTokens,
      translatedTokens: split.translatedTokens,
      ...deriveRowMeta(session.activeTokens, split),
    };
  }, [session.activeTokens]);

  useEffect(() => {
    const tokens = session.activeTokens;
    const prevLen = prevActiveLenRef.current;

    if (prevLen > 0 && tokens.length === 0) {
      const snap = lastLiveSplitRef.current;
      if (
        snap &&
        (snap.originalTokens.length > 0 || snap.translatedTokens.length > 0)
      ) {
        setCommittedRows((rows) => [
          ...rows,
          {
            rowKey: crypto.randomUUID(),
            originalTokens: snap.originalTokens,
            translatedTokens: snap.translatedTokens,
            speaker: snap.speaker,
            language: snap.language,
            endMs: snap.endMs,
          },
        ]);
      }
    }

    if (tokens.length > 0) {
      const split = splitActiveTokens(tokens);
      const meta = deriveRowMeta(tokens, split);
      lastLiveSplitRef.current = {
        originalTokens: [...split.originalTokens],
        translatedTokens: [...split.translatedTokens],
        ...meta,
      };
    }

    prevActiveLenRef.current = tokens.length;
  }, [session.activeTokens]);

  const displayRowCount =
    committedRows.length + (session.activeTokens.length > 0 ? 1 : 0);
  const hasTranscriptRows = displayRowCount > 0;

  const scrollToLiveRow = useCallback((behavior: ScrollBehavior = "smooth") => {
    liveRowAnchorRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  const handleJumpToLive = useCallback(() => {
    setIsFollowingLive(true);
    scrollToLiveRow();
  }, [scrollToLiveRow]);

  const handleTranscriptScroll = useCallback(() => {
    const el = transcriptScrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const shouldFollow = distanceFromBottom < 56;
    setIsFollowingLive((prev) => (prev === shouldFollow ? prev : shouldFollow));
  }, []);

  useEffect(() => {
    if (!hasTranscriptRows || !isFollowingLive) return;
    scrollToLiveRow("auto");
  }, [hasTranscriptRows, isFollowingLive, scrollToLiveRow, displayRowCount]);

  const mainBtn = useMemo(
    () =>
      isActive
        ? {
            bg: VT.warning,
            color: "#fff",
            icon: <Icon.Pause s={26} c="#fff" />,
          }
        : isPaused
          ? {
              bg: VT.success,
              color: "#fff",
              icon: <Icon.Play s={26} c="#fff" />,
            }
          : {
              bg: t.text,
              color: t.mode === "dark" ? "#000" : "#fff",
              icon: <Icon.Mic s={26} c={t.mode === "dark" ? "#000" : "#fff"} />,
            },
    [isActive, isPaused, t.text, t.mode],
  );

  const mainLabel = useMemo(
    () =>
      isActive
        ? i18n("v2_btn_pause")
        : isPaused
          ? i18n("v2_btn_resume")
          : i18n("v2_btn_start"),
    [isActive, isPaused, i18n],
  );

  const header = useMemo(
    () => (
      <>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 16px 10px",
          }}
        >
          <div
            style={{
              fontFamily: VT.fontDisplay,
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: -1.2,
              color: t.text,
            }}
          >
            Hey<span style={{ color: VT.cyan }}>Gracie</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <IconBtn onClick={onHistory}>
              <Icon.Clock c={t.text} s={18} />
            </IconBtn>
            <IconBtn onClick={onSettings}>
              <Icon.Gear c={t.text} s={18} />
            </IconBtn>
          </div>
        </div>
        <div style={{ padding: "0 16px 10px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              width: "100%",
            }}
          >
            <LangPill
              flag={langA.flag}
              code={langA.code.toUpperCase()}
              name={langA.name}
              onClick={openLangSlotA}
            />
            <div
              onClick={swapLocal}
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                flexShrink: 0,
                background: t.surface,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: VT.ring(t),
                cursor: "pointer",
              }}
            >
              <Icon.Swap s={15} c={t.text} />
            </div>
            <LangPill
              flag={langB.flag}
              code={langB.code.toUpperCase()}
              name={langB.name}
              onClick={openLangSlotB}
            />
          </div>
        </div>
        {!apiKey.trim() && (
          <div style={{ padding: "0 16px 8px" }}>
            <InlineBanner
              tone="warn"
              title={i18n("v2_status_missing_key")}
              subtitle={i18n("v2_status_missing_key_hint")}
              onClick={() => onSettings?.()}
            />
          </div>
        )}
      </>
    ),
    [
      t,
      langA,
      langB,
      apiKey,
      onHistory,
      onSettings,
      openLangSlotA,
      openLangSlotB,
      swapLocal,
      i18n,
    ],
  );

  const footer = useMemo(
    () => (
      <div
        style={{
          padding: "14px 20px calc(22px + env(safe-area-inset-bottom))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        {/* Status chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "6px 12px",
            borderRadius: 9999,
            background: t.surface,
            boxShadow: VT.ring(t),
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: status.dot,
              boxShadow: isActive ? `0 0 0 3px ${status.dot}33` : "none",
            }}
          />
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: t.textMuted,
              fontFamily: VT.fontMono,
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            {status.label}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {(isActive || isPaused) && (
            <div
              onClick={handleStop}
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: t.surface,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: VT.ring(t),
                cursor: "pointer",
              }}
            >
              <Icon.Stop s={16} c={VT.error} />
            </div>
          )}
          <Button
            variant="primary"
            icon={mainBtn.icon}
            label={mainLabel}
            height={44}
            onPress={handleMainBtn}
            style={{
              width: 150,
              background: mainBtn.bg,
              color: mainBtn.color,
              transition: "background 0.15s",
            }}
          />
        </div>
      </div>
    ),
    [
      t,
      isActive,
      isPaused,
      mainBtn,
      mainLabel,
      status,
      handleMainBtn,
      handleStop,
    ],
  );

  const bodyMarkup = useMemo(() => {
    if (sessionState === "stopped" || sessionState === "ready") {
      return (
        <EmptyState
          icon={<Icon.Mic s={34} c={VT.cyan} />}
          title={i18n("v2_empty_start_title")}
          subtitle={i18n("v2_empty_start_body")}
        />
      );
    }
    return (
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        <div
          ref={transcriptScrollRef}
          onScroll={handleTranscriptScroll}
          style={{
            height: "100%",
            overflowY: "auto",
            padding: "6px 4px",
            border: `1px solid red`,
          }}
        >
          {committedRows.map((row, idx) => {
            const isLatest =
              idx === committedRows.length - 1 && liveSplit === null;
            const derivedOrigText = row.originalTokens
              .map((tok) => tok.text)
              .join("");
            const derivedTransText = row.translatedTokens
              .map((tok) => tok.text)
              .join("");

            return (
              <div
                key={row.rowKey}
                ref={isLatest ? liveRowAnchorRef : null}
                id={isLatest ? "active-transcript-row" : undefined}
                data-speaker={isLatest ? row.speaker : undefined}
                data-lang={isLatest ? row.language : undefined}
                data-orig={isLatest ? derivedOrigText : undefined}
                data-trans={isLatest ? derivedTransText : undefined}
                data-end-ms={isLatest ? row.endMs : undefined}
              >
                <TranscriptRow
                  variant="live"
                  originalTokens={row.originalTokens}
                  translatedTokens={row.translatedTokens}
                  speaker={row.speaker}
                  language={row.language}
                  endMs={row.endMs}
                />
              </div>
            );
          })}
          {liveSplit && (
            <div
              key="live"
              ref={liveRowAnchorRef}
              id="active-transcript-row"
              data-speaker={liveSplit.speaker}
              data-lang={liveSplit.language}
              data-orig={liveSplit.originalTokens
                .map((tok) => tok.text)
                .join("")}
              data-trans={liveSplit.translatedTokens
                .map((tok) => tok.text)
                .join("")}
              data-end-ms={liveSplit.endMs}
            >
              <TranscriptRow
                variant="live"
                originalTokens={liveSplit.originalTokens}
                translatedTokens={liveSplit.translatedTokens}
                speaker={liveSplit.speaker}
                language={liveSplit.language}
                endMs={liveSplit.endMs}
              />
            </div>
          )}
        </div>
        {hasTranscriptRows && !isFollowingLive && (
          <div
            onClick={handleJumpToLive}
            style={{
              position: "absolute",
              right: 10,
              bottom: 10,
              padding: "8px 12px",
              borderRadius: 999,
              background: VT.cyan,
              color: t.navy,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: -0.1,
              cursor: "pointer",
              boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
            }}
          >
            {i18n("v2_jump_to_live")}
          </div>
        )}
      </div>
    );
  }, [
    sessionState,
    i18n,
    t.navy,
    committedRows,
    liveSplit,
    hasTranscriptRows,
    isFollowingLive,
    handleJumpToLive,
    handleTranscriptScroll,
  ]);

  return (
    <>
      <ScreenLayout variant="fixed" header={header} footer={footer}>
        <div
          style={{
            padding: "12px 16px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: t.surface,
              borderRadius: 12,
              boxShadow: VT.ring(t),
            }}
          >
            {bodyMarkup}
          </div>
        </div>
      </ScreenLayout>

      <LangSheet
        isOpen={langSlot !== null}
        onDismiss={closeLangSlot}
        selectedCode={langSlot === "A" ? localLangA : localLangB}
        onSelect={handleLangSelect}
      />
      <ConfirmDialog
        isOpen={showNoKeyDialog}
        onDismiss={() => setShowNoKeyDialog(false)}
        icon={<Icon.Gear c={VT.cyan} s={24} />}
        title={i18n("v2_no_key_dialog_title")}
        body={i18n("v2_no_key_dialog_body")}
        confirmLabel={i18n("v2_no_key_dialog_go_settings")}
        cancelLabel={i18n("v2_no_key_dialog_cancel")}
        onConfirm={() => {
          setShowNoKeyDialog(false);
          onSettings?.(true);
        }}
      />
    </>
  );
}
