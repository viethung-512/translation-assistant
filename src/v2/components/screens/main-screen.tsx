import { useState, useMemo, useCallback } from "react";
import { useT, VT } from "@/v2/tokens/tokens";
import { Typography } from "@/v2/components/ui/typography";
import { Icon } from "@/v2/components/icons";
import { Card, Toggle } from "@/v2/components/ui/primitives";
import { ScreenLayout } from "@/v2/components/ui/screen-layout";
import {
  IconBtn,
  LangPill,
  Segmented,
  SegBtn,
  TranscriptRow,
  pulseRingStyle,
} from "./main-screen-helpers";
import { EmptyState } from "@/v2/components/ui/empty-state";
import { LangSheet } from "@/v2/components/ui/lang-sheet";
import { ConfirmDialog } from "@/v2/components/ui/confirm-dialog";
import { useV2SettingsStore } from "@/v2/store/v2-settings-store";
import { useV2TranslationSession } from "@/v2/hooks/use-v2-translation-session";
import { ALL_AVAILABLE_LANGUAGES } from "@/v2/tokens/languages";
import { useV2T } from "@/v2/i18n";

type SessionState =
  | "ready"
  | "listening"
  | "paused"
  | "translating"
  | "stopped";

interface MainScreenProps {
  onSettings?: () => void;
  onHistory?: () => void;
}

export function MainScreen({ onSettings, onHistory }: MainScreenProps) {
  const t = useT();
  const { t: i18n } = useV2T();
  const {
    languageA: storeA,
    languageB: storeB,
    autoDetect,
    outputMode: storeOutputMode,
    setAutoDetect,
  } = useV2SettingsStore();
  const [localLangA, setLocalLangA] = useState(storeA);
  const [localLangB, setLocalLangB] = useState(storeB);
  const [outputMode, setOutputMode] = useState(storeOutputMode);

  const session = useV2TranslationSession();

  const [langSlot, setLangSlot] = useState<"A" | "B" | null>(null);
  const [showNoKeyDialog, setShowNoKeyDialog] = useState(false);

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

  const handleSetOutputText = useCallback(
    () => setOutputMode("text"),
    [setOutputMode],
  );
  const handleSetOutputVoice = useCallback(
    () => setOutputMode("voice"),
    [setOutputMode],
  );

  const handleMainBtn = useCallback(async () => {
    if (sessionState === "ready" || sessionState === "stopped") {
      try {
        await session.startSession();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("API key")) setShowNoKeyDialog(true);
      }
    } else if (sessionState === "listening") {
      session.pauseSession();
    } else if (sessionState === "paused") {
      await session.resumeSession();
    }
  }, [sessionState, session]);

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

  const mainBtn = useMemo(
    () =>
      isActive
        ? { bg: VT.warning, icon: <Icon.Pause s={30} /> }
        : isPaused
          ? { bg: VT.success, icon: <Icon.Play s={28} /> }
          : { bg: VT.cyan, icon: <Icon.Mic s={30} /> },
    [isActive, isPaused],
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
            padding: "8px 16px 14px",
          }}
        >
          <Typography variant="title">
            Hey<span style={{ color: VT.cyan }}>Gracie</span>
          </Typography>
          <div style={{ display: "flex", gap: 8 }}>
            <IconBtn onClick={onHistory}>
              <Icon.Clock c={t.text} />
            </IconBtn>
            <IconBtn onClick={onSettings}>
              <Icon.Gear c={t.text} />
            </IconBtn>
          </div>
        </div>
        <div style={{ padding: "0 16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
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
                width: 40,
                height: 40,
                borderRadius: 999,
                flexShrink: 0,
                background: t.card,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${t.divider}`,
                cursor: "pointer",
              }}
            >
              <Icon.Swap s={18} c={VT.cyan} />
            </div>
            <LangPill
              flag={langB.flag}
              code={langB.code.toUpperCase()}
              name={langB.name}
              onClick={openLangSlotB}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 10,
              padding: "0 4px",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: t.textMuted }}>
              {i18n("v2_main_auto_detect")}
            </div>
            <Toggle on={autoDetect} onChange={setAutoDetect} />
          </div>
        </div>
      </>
    ),
    [
      t,
      langA,
      langB,
      autoDetect,
      onHistory,
      onSettings,
      openLangSlotA,
      openLangSlotB,
      swapLocal,
      setAutoDetect,
      i18n,
    ],
  );

  const footer = useMemo(
    () => (
      <div
        style={{
          padding: "12px 20px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            width: "100%",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{ position: "relative", width: 76, height: 76 }}>
              {isActive &&
                [0, 1, 2].map((i) => <div key={i} style={pulseRingStyle(i)} />)}
              <div
                onClick={handleMainBtn}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 999,
                  background: mainBtn.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 8px 24px ${mainBtn.bg}66, 0 2px 4px rgba(10,22,40,0.12)`,
                  zIndex: 2,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                {mainBtn.icon}
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: t.text,
                letterSpacing: -0.1,
              }}
            >
              {mainLabel}
            </div>
          </div>
          {(isActive || isPaused) && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                onClick={handleStop}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  background: VT.error,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 4px 12px ${VT.error}55`,
                  cursor: "pointer",
                }}
              >
                <Icon.Stop s={18} />
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: t.text,
                  letterSpacing: -0.1,
                }}
              >
                {i18n("v2_btn_stop")}
              </div>
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: t.card,
            borderRadius: 999,
            padding: "7px 14px",
            marginTop: 12,
            border: `1px solid ${t.divider}`,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: status.dot,
              boxShadow: isActive ? `0 0 0 4px ${status.dot}33` : "none",
            }}
          />
          <Typography variant="action">{status.label}</Typography>
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
      i18n,
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
    const ot = session.originalTokens;
    const tt = session.translatedTokens;
    const derivedSpeaker = ot[0]?.speaker ?? "S1";
    const derivedLang = ot[0]?.language ?? "";
    const derivedOrigText = ot.map((t) => t.text).join("");
    const derivedTransText = tt.map((t) => t.text).join("");
    const combined = [...ot, ...tt];
    const derivedEndMs =
      [...combined].reverse().find((t) => t.end_ms != null)?.end_ms ?? 0;

    return (
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 4px" }}>
        {(ot.length > 0 || tt.length > 0) && (
          <div
            id="active-transcript-row"
            data-speaker={derivedSpeaker}
            data-lang={derivedLang}
            data-orig={derivedOrigText}
            data-trans={derivedTransText}
            data-end-ms={derivedEndMs}
          >
            <TranscriptRow
              originalTokens={session.originalTokens}
              translatedTokens={session.translatedTokens}
            />
          </div>
        )}
      </div>
    );
  }, [sessionState, i18n, session.originalTokens, session.translatedTokens]);

  return (
    <>
      <ScreenLayout variant="fixed" header={header} footer={footer}>
        <div
          style={{
            padding: "12px 16px 0",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <Card
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {bodyMarkup}
          </Card>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 10,
              marginBottom: 10,
            }}
          >
            <Segmented>
              <SegBtn
                active={outputMode === "text"}
                icon={<Icon.Text />}
                onClick={handleSetOutputText}
              >
                {i18n("v2_output_text")}
              </SegBtn>
              <SegBtn
                active={outputMode === "voice"}
                icon={<Icon.Speaker />}
                onClick={handleSetOutputVoice}
              >
                {i18n("v2_output_voice")}
              </SegBtn>
            </Segmented>
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
          onSettings?.();
        }}
      />
    </>
  );
}
