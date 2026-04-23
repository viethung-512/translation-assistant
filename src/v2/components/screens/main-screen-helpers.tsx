import { Icon } from "@/v2/components/icons";
import { LangTag, SpeakerAvatar } from "@/v2/components/ui/primitives";
import { Typography } from "@/v2/components/ui/typography";
import { useV2T } from "@/v2/i18n";
import { useT, VT } from "@/v2/tokens/tokens";
import { detectFlagCode } from "@/v2/utils/helper";
import React, { useMemo } from "react";

export function IconBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const t = useT();
  return (
    <div
      onClick={onClick}
      style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        background: t.card,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${t.divider}`,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {children}
    </div>
  );
}

export function LangPill({
  flag,
  code,
  name,
  onClick,
}: {
  flag: string;
  code: string;
  name: string;
  onClick?: () => void;
}) {
  const t = useT();
  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 0,
        width: 0,
        height: 56,
        borderRadius: 999,
        background: t.card,
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: 8,
        border: `1.5px solid ${t.divider}`,
        boxSizing: "border-box",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <div style={{ fontSize: 20, flexShrink: 0 }}>{flag}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="micro" style={{ letterSpacing: 0.6 }}>
          {code}
        </Typography>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: t.text,
            letterSpacing: -0.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>
      </div>
      <Icon.ChevronDown s={14} c={t.textDim} />
    </div>
  );
}

export function Segmented({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <div
      style={{
        display: "flex",
        background: t.card,
        borderRadius: 999,
        padding: 4,
        gap: 2,
        border: `1px solid ${t.divider}`,
      }}
    >
      {children}
    </div>
  );
}

export function SegBtn({
  active,
  icon,
  children,
  onClick,
}: {
  active?: boolean;
  icon: React.ReactElement;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const t = useT();
  const iconColor = active
    ? t.mode === "dark"
      ? t.navy
      : "#fff"
    : t.textMuted;
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 16px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: -0.1,
        background: active
          ? t.mode === "dark"
            ? VT.cyan
            : t.text
          : "transparent",
        color: active ? (t.mode === "dark" ? t.navy : "#fff") : t.textMuted,
        cursor: onClick ? "pointer" : "default",
        transition: "background 0.15s, color 0.15s",
      }}
    >
      {React.cloneElement(icon, { c: iconColor, s: 15 })}
      {children}
    </div>
  );
}

interface Token {
  text: string;
  is_final: boolean;
  speaker?: string;
  language?: string;
  translation_status?: "none" | "original" | "translation";
  end_ms?: number;
}

export interface TranscriptRowProps {
  originalTokens: readonly Token[];
  translatedTokens: readonly Token[];
  speaker?: string;
  language?: string;
  endMs?: number;
}

function renderTokens(
  tokens: readonly Token[],
  variant: "orig" | "trans",
  t: ReturnType<typeof useT>,
): React.ReactNode {
  let lastLang: string | undefined;
  return tokens.map((token, idx) => {
    lastLang = token.language ?? lastLang;
    const color = !token.is_final
      ? t.textFaint
      : variant === "trans"
        ? t.cyanText
        : t.textMuted;

    return (
      <React.Fragment key={idx}>
        <span
          style={{
            color,
            fontStyle: variant === "orig" ? "italic" : undefined,
            ...(variant === "trans" && { fontSize: 18 }),
          }}
        >
          {token.text}
        </span>
      </React.Fragment>
    );
  });
}

export function TranscriptRow({
  originalTokens,
  translatedTokens,
  speaker,
  language,
  endMs,
}: TranscriptRowProps) {
  const t = useT();
  const { t: i18n } = useV2T();

  const speakerStr = speaker ?? originalTokens[0]?.speaker;
  const numericSpeaker = Number.parseInt(speakerStr ?? "", 10);
  const hasNumericSpeaker =
    Number.isFinite(numericSpeaker) && numericSpeaker > 0;
  const s = hasNumericSpeaker ? Math.max(0, numericSpeaker - 1) : 0;
  const { flag, code } = detectFlagCode(
    language ?? originalTokens[0]?.language,
  );

  const active =
    originalTokens.some((tok) => !tok.is_final) ||
    translatedTokens.some((tok) => !tok.is_final);

  const lastWithTime = [...originalTokens, ...translatedTokens]
    .slice()
    .reverse()
    .find((tok) => tok.end_ms != null);
  const rowEndMs = endMs ?? lastWithTime?.end_ms;
  const time =
    rowEndMs != null
      ? (() => {
          const sec = Math.floor(rowEndMs / 1000);
          return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
        })()
      : "–";

  const speakerLabel = useMemo(() => {
    if (!hasNumericSpeaker) {
      return i18n("v2_unknown_speaker");
    }
    return i18n("v2_speaker", { n: String(s + 1) });
  }, [i18n, hasNumericSpeaker, s]);

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 10,
        background: active ? t.cyanTint : "transparent",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", gap: 10 }}>
        <SpeakerAvatar idx={s} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: t.text,
                letterSpacing: -0.1,
              }}
            >
              {speakerLabel}
            </span>
            <LangTag flag={flag} code={code} />
            <span
              style={{
                marginLeft: "auto",
                fontSize: 11,
                color: t.textDim,
                fontWeight: 600,
              }}
            >
              {time}
            </span>
          </div>
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.35,
              letterSpacing: -0.1,
              marginBottom: 4,
            }}
          >
            {renderTokens(originalTokens, "orig", t)}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: -0.2,
            }}
          >
            {renderTokens(translatedTokens, "trans", t)}
            {active && <span style={{ color: VT.cyan, opacity: 0.6 }}>▎</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function pulseRingStyle(i: number): React.CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    borderRadius: 999,
    border: `2px solid ${VT.cyan}`,
    animation: `pulse-ring 1.6s cubic-bezier(0.22, 0.61, 0.36, 1) ${i * 0.53}s infinite`,
    zIndex: 1,
  };
}
