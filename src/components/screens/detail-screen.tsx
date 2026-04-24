import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useT, VT } from "@/tokens/tokens";
import { Icon } from "@/components/icons";
import { ScreenLayout } from "@/components/ui/screen-layout";
import { Button } from "@/components/ui/button";
import { ActionBar } from "@/components/ui/action-bar";
import { useV2T } from "@/i18n";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "@/router/routes";
import { useV2HistoryStore } from "@/store/v2-history-store";
import {
  getTranscript,
  type StoredSessionTranscript,
} from "@/storage/transcript-idb";
import type { CommittedRow } from "@/utils/scrape-transcript";
import { ALL_AVAILABLE_LANGUAGES } from "@/tokens/languages";
import { invoke } from "@tauri-apps/api/core";

// ─── Mini waveform bars for visual decoration ────────────────────────────────
const WAVEFORM_BARS = [5, 9, 14, 8, 22, 16, 11, 24, 18, 10, 20, 14, 28, 19, 13, 22, 10, 17, 25, 12, 8, 16, 20, 11];
const MINI_BARS = [4, 8, 12, 6, 14, 9, 11, 5, 13, 7, 10, 6, 12, 8];

function AudioPlayer({ url }: { url: string }) {
  const t = useT();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrentTime(el.currentTime);
    const onMeta = () => setDuration(el.duration || 0);
    const onEnd = () => setPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnd);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play().then(() => setPlaying(true)).catch(() => {}); }
  }, [playing]);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(1, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div style={{ padding: "0 16px 10px" }}>
      <audio ref={audioRef} src={url} preload="metadata" style={{ display: "none" }} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 10px 8px 8px",
          borderRadius: 10,
          background: t.surface,
          boxShadow: VT.ring(t),
        }}
      >
        {/* Play/Pause circle */}
        <div
          onClick={togglePlay}
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            background: t.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          {playing
            ? <Icon.Pause c={t.mode === "dark" ? "#000" : "#fff"} s={14} />
            : <Icon.Play  c={t.mode === "dark" ? "#000" : "#fff"} s={14} />}
        </div>

        {/* Waveform bars */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 2,
            height: 28,
          }}
        >
          {WAVEFORM_BARS.map((h, i) => {
            const barPct = (i / (WAVEFORM_BARS.length - 1)) * 100;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: h,
                  borderRadius: 1.5,
                  background: barPct <= pct ? VT.cyan : t.divider,
                  transition: "background 0.1s",
                }}
              />
            );
          })}
        </div>

        {/* Time */}
        <div
          style={{
            fontFamily: VT.fontMono,
            fontSize: 11,
            color: t.textMuted,
            letterSpacing: 0.3,
            flexShrink: 0,
            minWidth: 68,
            textAlign: "right",
          }}
        >
          {fmt(currentTime)} / {fmt(duration)}
        </div>

        {/* Speed badge */}
        <div
          style={{
            padding: "3px 7px",
            borderRadius: 6,
            background: t.surfaceAlt,
            boxShadow: VT.ringSoft(t),
            fontFamily: VT.fontMono,
            fontSize: 10,
            fontWeight: 500,
            color: t.text,
            letterSpacing: 0.3,
            flexShrink: 0,
          }}
        >
          1×
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  s,
  onClick,
  children,
}: {
  active?: boolean;
  s?: number;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const t = useT();
  const sColor = s !== undefined ? VT.s[s] : null;
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
        padding: "6px 12px",
        borderRadius: 9999,
        background: active ? t.text : t.surface,
        color: active ? (t.mode === "dark" ? "#000" : "#fff") : t.text,
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: -0.1,
        boxShadow: active ? "none" : VT.ring(t),
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {sColor && (
        <div style={{ width: 6, height: 6, borderRadius: 999, background: sColor }} />
      )}
      {children}
    </div>
  );
}

function DetailRow({
  s,
  flag,
  code,
  orig,
  trans,
  time,
  isLast,
}: {
  s: number;
  flag: string;
  code: string;
  orig: string;
  trans: string;
  time: string;
  isLast?: boolean;
}) {
  const t = useT();
  const color = VT.s[s % VT.s.length] ?? VT.s[5];

  return (
    <div style={{ padding: "12px 14px", position: "relative" }}>
      <div style={{ display: "flex", gap: 10 }}>
        {/* Speaker avatar */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            background: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
            boxShadow: `0 0 0 2px ${t.bg}`,
            fontFamily: VT.font,
          }}
        >
          S{s + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 3,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: t.text,
                fontFamily: VT.fontMono,
                textTransform: "uppercase",
                letterSpacing: 0.3,
              }}
            >
              Speaker {s + 1}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 11 }}>{flag}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: t.textDim,
                  fontFamily: VT.fontMono,
                  letterSpacing: 0.4,
                }}
              >
                {code}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: t.textDim,
                  fontWeight: 500,
                  marginLeft: 4,
                  fontFamily: VT.fontMono,
                }}
              >
                {time}
              </span>
            </div>
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: t.text,
              lineHeight: 1.35,
              letterSpacing: -0.3,
            }}
          >
            {orig}
          </div>
          {trans && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: t.cyanText,
                lineHeight: 1.35,
                letterSpacing: -0.2,
                marginTop: 2,
              }}
            >
              {trans}
            </div>
          )}

          {/* Per-utterance mini waveform row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                flexShrink: 0,
                background: t.surfaceAlt,
                boxShadow: VT.ringSoft(t),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon.Play c={t.textMuted} s={10} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 2, height: 14, flex: 1 }}>
              {MINI_BARS.map((h, i) => (
                <div
                  key={i}
                  style={{ flex: 1, height: h, borderRadius: 1, background: t.divider }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {!isLast && (
        <div
          style={{
            height: 1,
            background: t.hairline,
            marginTop: 10,
            marginLeft: 40,
          }}
        />
      )}
    </div>
  );
}

export function DetailScreen({ onBack }: { onBack?: () => void }) {
  const t = useT();
  const { t: i18n } = useV2T();
  const navigate = useNavigate();
  const { historyId } = useParams<{ historyId: string }>();
  const items = useV2HistoryStore((s) => s.items);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [loadingBody, setLoadingBody] = useState(true);
  const [storedTranscript, setStoredTranscript] =
    useState<StoredSessionTranscript | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(
    useV2HistoryStore.persist.hasHydrated(),
  );
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const historyItem = useMemo(
    () => items.find((item) => item.id === historyId),
    [items, historyId],
  );

  useEffect(() => {
    const unsubHydrate = useV2HistoryStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    return () => { unsubHydrate(); };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    if (!historyId) {
      navigate(ROUTES.HISTORY, { replace: true });
      return;
    }
    setLoadingBody(true);
    setLoadError(null);
    getTranscript(historyId)
      .then((result) => { if (!isCancelled) setStoredTranscript(result); })
      .catch((error) => {
        if (!isCancelled) {
          console.error("Failed to load transcript body", error);
          setLoadError("Failed to load transcript.");
        }
      })
      .finally(() => { if (!isCancelled) setLoadingBody(false); });
    return () => { isCancelled = true; };
  }, [historyId, navigate]);

  useEffect(() => {
    if (!historyId) return;
    let cancelled = false;
    async function loadAudio() {
      try {
        const data = await invoke<number[]>("read_audio", {
          filename: `recording-${historyId}.webm`,
        });
        if (cancelled) return;
        const blob = new Blob([new Uint8Array(data)], { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
      } catch {
        if (!cancelled) setAudioUrl(null);
      }
    }
    loadAudio();
    return () => {
      cancelled = true;
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [historyId]);

  const speakerOrder = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const row of storedTranscript?.rows ?? []) {
      if (!row.speaker || seen.has(row.speaker)) continue;
      seen.add(row.speaker);
      out.push(row.speaker);
    }
    return out;
  }, [storedTranscript]);

  const rowsToRender = useMemo(() => {
    const rows = storedTranscript?.rows ?? [];
    if (!activeSpeaker) return rows;
    return rows.filter((row) => row.speaker === activeSpeaker);
  }, [storedTranscript, activeSpeaker]);

  const detailRows = useMemo(() => {
    const sessionStart = storedTranscript?.sessionStartMs ?? 0;
    const speakerIndexMap = new Map<string, number>();
    const getSpeakerIndex = (speaker: string): number => {
      const existing = speakerIndexMap.get(speaker);
      if (existing != null) return existing;
      const parsed = Number.parseInt(speaker.replace(/\D+/g, ""), 10);
      const next = Number.isFinite(parsed) && parsed > 0 ? parsed - 1 : speakerIndexMap.size;
      speakerIndexMap.set(speaker, next);
      return next;
    };
    const formatTime = (row: CommittedRow): string => {
      const elapsed = new Date(sessionStart + Math.max(0, row.endMs));
      return elapsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };
    return rowsToRender.map((row) => {
      const lang = ALL_AVAILABLE_LANGUAGES.find((l) => l.code === row.lang);
      return {
        s: getSpeakerIndex(row.speaker),
        flag: lang?.flag ?? "🌐",
        code: row.lang ? row.lang.toUpperCase() : "UNK",
        orig: row.origText,
        trans: row.transText,
        time: formatTime(row),
      };
    });
  }, [rowsToRender, storedTranscript]);

  const headerLangCodes = useMemo(() => {
    if (!historyItem) return [];
    return historyItem.flags
      .map((flag) => ALL_AVAILABLE_LANGUAGES.find((l) => l.flag === flag)?.code ?? "")
      .filter(Boolean)
      .map((code) => code.toUpperCase());
  }, [historyItem]);

  const handleBack = useCallback(() => onBack?.(), [onBack]);

  if (!historyId) return null;

  if (!hydrated || loadingBody) {
    return (
      <ScreenLayout>
        <div style={{ padding: "20px 16px", color: t.textDim }}>Loading...</div>
      </ScreenLayout>
    );
  }

  if (!historyItem) {
    return (
      <ScreenLayout>
        <div style={{ padding: "20px 16px", color: t.textDim }}>Session not found.</div>
        <ActionBar>
          <Button variant="primary" label="Back to history" onPress={() => navigate(ROUTES.HISTORY)} />
        </ActionBar>
      </ScreenLayout>
    );
  }

  if (!storedTranscript || loadError) {
    return (
      <ScreenLayout>
        <div style={{ padding: "20px 16px", color: t.textDim }}>Transcript unavailable.</div>
        <ActionBar>
          <Button variant="primary" label="Back to history" onPress={() => navigate(ROUTES.HISTORY)} />
        </ActionBar>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 12px 10px",
        }}
      >
        <div
          onClick={handleBack}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: onBack ? "pointer" : "default",
          }}
        >
          <Icon.ChevronLeft c={t.text} s={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: t.text,
              letterSpacing: -0.4,
            }}
          >
            {historyItem.date}, {historyItem.time}
          </div>
          <div
            style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}
          >
            {historyItem.flags.map((f, i) => (
              <span key={i} style={{ fontSize: 12 }}>{f}</span>
            ))}
            {headerLangCodes.length > 0 && (
              <span
                style={{
                  fontSize: 10,
                  color: t.textDim,
                  fontWeight: 500,
                  marginLeft: 4,
                  fontFamily: VT.fontMono,
                  letterSpacing: 0.4,
                }}
              >
                {headerLangCodes.join(" · ")}
              </span>
            )}
          </div>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: t.surface,
            boxShadow: VT.ring(t),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon.Export c={t.text} s={15} />
        </div>
      </div>

      {/* Audio player — shown only when recording exists */}
      {audioUrl && <AudioPlayer url={audioUrl} />}

      {/* Filter chips */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "0 16px 10px",
          overflowX: "auto",
          flexShrink: 0,
        }}
      >
        <FilterChip active={activeSpeaker === null} onClick={() => setActiveSpeaker(null)}>
          {i18n("v2_detail_filter_all")}
        </FilterChip>
        {speakerOrder.map((speakerId, idx) => (
          <FilterChip
            key={speakerId}
            s={idx}
            active={activeSpeaker === speakerId}
            onClick={() => setActiveSpeaker(speakerId)}
          >
            {`Speaker ${idx + 1}`}
          </FilterChip>
        ))}
      </div>

      {/* Transcript container */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          margin: "0 16px",
          background: t.surface,
          borderRadius: 12,
          boxShadow: VT.ring(t),
          overflowY: "auto",
          paddingBottom: "calc(64px + env(safe-area-inset-bottom))",
        }}
      >
        <div style={{ padding: "4px 0" }}>
          {detailRows.map((r, i) => (
            <DetailRow
              key={`${r.s}-${i}`}
              s={r.s}
              flag={r.flag}
              code={r.code}
              orig={r.orig}
              trans={r.trans}
              time={r.time}
              isLast={i === detailRows.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Action bar — pinned to device bottom via ActionBar */}
      <ActionBar>
        <Button
          variant="card"
          icon={<Icon.Share s={14} />}
          label={i18n("v2_detail_share")}
          height={40}
          flex={1}
          disabled
        />
        <Button
          variant="card"
          icon={<Icon.Export s={14} />}
          label={i18n("v2_detail_export")}
          height={40}
          flex={1}
          disabled
        />
      </ActionBar>
    </ScreenLayout>
  );
}
