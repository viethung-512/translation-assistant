import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useT, VT } from "@/tokens/tokens";
import { Typography } from "@/components/ui/typography";
import { Icon } from "@/components/icons";
import { ScreenLayout } from "@/components/ui/screen-layout";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-input";
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
import { TranscriptRow } from "./shared/transcript-row";

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
        padding: "8px 14px",
        borderRadius: 999,
        background: active ? (t.mode === "dark" ? VT.cyan : t.text) : t.card,
        color: active ? (t.mode === "dark" ? t.navy : "#fff") : t.text,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: -0.1,
        border: active ? "none" : `1px solid ${t.divider}`,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {sColor && (
        <div
          style={{ width: 8, height: 8, borderRadius: 999, background: sColor }}
        />
      )}
      {children}
    </div>
  );
}

export function DetailScreen({ onBack }: { onBack?: () => void }) {
  const t = useT();
  const { t: i18n } = useV2T();
  const navigate = useNavigate();
  const { historyId } = useParams<{ historyId: string }>();
  const items = useV2HistoryStore((s) => s.items);
  const [renaming, setRenaming] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [loadingBody, setLoadingBody] = useState(true);
  const [storedTranscript, setStoredTranscript] =
    useState<StoredSessionTranscript | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(
    useV2HistoryStore.persist.hasHydrated(),
  );
  const historyItem = useMemo(
    () => items.find((item) => item.id === historyId),
    [items, historyId],
  );

  useEffect(() => {
    const unsubHydrate = useV2HistoryStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    return () => {
      unsubHydrate();
    };
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
      .then((result) => {
        if (isCancelled) return;
        setStoredTranscript(result);
      })
      .catch((error) => {
        if (isCancelled) return;
        console.error("Failed to load transcript body", error);
        setLoadError("Failed to load transcript.");
      })
      .finally(() => {
        if (!isCancelled) setLoadingBody(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [historyId, navigate]);

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
      const next =
        Number.isFinite(parsed) && parsed > 0
          ? parsed - 1
          : speakerIndexMap.size;
      speakerIndexMap.set(speaker, next);
      return next;
    };

    const formatTime = (row: CommittedRow): string => {
      const elapsedMs = Math.max(0, row.endMs);
      const elapsed = new Date(sessionStart + elapsedMs);
      return elapsed.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
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
    if (historyItem) {
      return historyItem.flags
        .map(
          (flag) =>
            ALL_AVAILABLE_LANGUAGES.find((l) => l.flag === flag)?.code ?? "",
        )
        .filter(Boolean)
        .map((code) => code.toUpperCase());
    }
    return [];
  }, [historyItem]);

  const handleBack = useCallback(() => onBack?.(), [onBack]);
  const handleStopPropagation = useCallback(
    (e: React.MouseEvent) => e.stopPropagation(),
    [],
  );

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
        <div style={{ padding: "20px 16px", color: t.textDim }}>
          Session not found.
        </div>
        <ActionBar>
          <Button
            variant="primary"
            label="Back to history"
            onPress={() => navigate(ROUTES.HISTORY)}
          />
        </ActionBar>
      </ScreenLayout>
    );
  }

  if (!storedTranscript || loadError) {
    return (
      <ScreenLayout>
        <div style={{ padding: "20px 16px", color: t.textDim }}>
          Transcript unavailable.
        </div>
        <ActionBar>
          <Button
            variant="primary"
            label="Back to history"
            onPress={() => navigate(ROUTES.HISTORY)}
          />
        </ActionBar>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 12px 12px",
        }}
      >
        <div
          onClick={handleBack}
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: onBack ? "pointer" : "default",
          }}
        >
          <Icon.ChevronLeft c={t.text} />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: t.text,
              letterSpacing: -0.3,
            }}
          >
            {historyItem.date}, {historyItem.time}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 2,
            }}
          >
            {historyItem.flags.map((f, i) => (
              <span key={i} style={{ fontSize: 13 }}>
                {f}
              </span>
            ))}
            <span
              style={{
                fontSize: 11,
                color: t.textDim,
                fontWeight: 700,
                marginLeft: 4,
                letterSpacing: 0.3,
              }}
            >
              {headerLangCodes.join(" · ")}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "0 16px 12px",
          overflowX: "auto",
          flexShrink: 0,
        }}
      >
        <FilterChip
          active={activeSpeaker === null}
          onClick={() => setActiveSpeaker(null)}
        >
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

      <div style={{ padding: "4px 0" }}>
        {detailRows.map((r, i) => (
          <TranscriptRow
            key={`${r.s}-${i}`}
            variant="history"
            s={r.s}
            flag={r.flag}
            code={r.code}
            time={r.time}
            translatedText={r.trans}
            originalText={r.orig}
            isLast={i === detailRows.length - 1}
          />
        ))}
      </div>

      <ActionBar>
        <Button
          variant="card"
          shape="rounded"
          icon={<Icon.Share s={17} />}
          label={i18n("v2_detail_share")}
          flex={1}
          disabled
        />
        <Button
          variant="card"
          shape="rounded"
          icon={<Icon.Export s={17} />}
          label={i18n("v2_detail_export")}
          flex={1}
          disabled
        />
      </ActionBar>

      {renaming && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(10,22,40,0.55)",
              zIndex: 100,
            }}
          />
          <div
            onClick={handleStopPropagation}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "calc(100% - 48px)",
              maxWidth: 382,
              background: t.card,
              borderRadius: 20,
              padding: "22px 20px 16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              border: t.mode === "dark" ? `1px solid ${t.hairline}` : "none",
              zIndex: 101,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div>
                <Typography variant="subheading">
                  {i18n("v2_detail_rename_speaker")}
                </Typography>
                <Typography variant="hint" style={{ marginTop: 2 }}>
                  {i18n("v2_detail_rename_hint")}
                </Typography>
              </div>
            </div>
            <TextField
              value="Mai"
              focused
              placeholder={i18n("v2_detail_rename_placeholder")}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <Button
                variant="secondary"
                label={i18n("v2_detail_btn_cancel")}
                flex={1}
                height={48}
                onPress={() => setRenaming(false)}
              />
              <Button
                variant="primary"
                label={i18n("v2_detail_btn_save")}
                flex={1}
                height={48}
              />
            </div>
          </div>
        </>
      )}
    </ScreenLayout>
  );
}
