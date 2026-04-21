import React, { useMemo } from "react";
import { useT, VT } from "@/v2/tokens/tokens";
import { Icon } from "@/v2/components/icons";
import { SpeakerAvatar, LangTag } from "@/v2/components/ui/primitives";
import { useV2T } from "@/v2/i18n";
import { Typography } from "@/v2/components/ui/typography";

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

export interface TranscriptRowProps {
  s: number;
  flag: string;
  code: string;
  orig: string;
  trans: string;
  time: string;
  active?: boolean;
  isLast?: boolean;
}

export function TranscriptRow({
  s,
  flag,
  code,
  orig,
  trans,
  time,
  active,
  isLast,
}: TranscriptRowProps) {
  const t = useT();
  const { t: i18n } = useV2T();
  const speakerLabel = useMemo(
    () => i18n("v2_speaker", { n: String(s + 1) }),
    [i18n, s],
  );

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
          {/* original: small, italic, dimmed — source text */}
          <Typography
            variant="hint"
            color={t.textMuted}
            italic
            style={{
              opacity: 0.7,
              lineHeight: 1.35,
              letterSpacing: -0.1,
              marginBottom: 4,
            }}
          >
            {orig}
          </Typography>
          {/* translated: bold, prominent — the meaningful output */}
          <Typography
            variant="subheading"
            style={{ fontWeight: 700, lineHeight: 1.3, letterSpacing: -0.2 }}
          >
            {trans}
            {active && <span style={{ color: VT.cyan, opacity: 0.6 }}>▎</span>}
          </Typography>
        </div>
      </div>
      {!isLast && (
        <div
          style={{ height: 1, background: t.hairline, margin: "4px 0 0 48px" }}
        />
      )}
    </div>
  );
}

export function pulseRingStyle(i: number): React.CSSProperties {
  return {
    position: "absolute",
    top: -8 - i * 6,
    left: -8 - i * 6,
    right: -8 - i * 6,
    bottom: -8 - i * 6,
    borderRadius: 999,
    border: `2px solid ${VT.cyan}`,
    opacity: 0.5 - i * 0.15,
    zIndex: 1,
  };
}
