import React from "react";
import { useT, VT } from "@/tokens/tokens";
import { FlagEmoji } from "@/components/ui/flag-emoji";

export function Card({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const t = useT();
  return (
    <div
      style={{
        background: t.card,
        borderRadius: 12,
        boxShadow: VT.card(t),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange?: (v: boolean) => void;
}) {
  const t = useT();
  return (
    <div
      onClick={() => onChange?.(!on)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        background: on ? VT.cyan : (t.mode === "dark" ? "#2A2A2A" : "#E4E4E4"),
        position: "relative",
        flexShrink: 0,
        cursor: onChange ? "pointer" : "default",
        transition: "background 0.15s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: on ? 20 : 2,
          width: 22,
          height: 22,
          borderRadius: 999,
          background: "#fff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2), 0 0 0 0.5px rgba(0,0,0,0.04)",
          transition: "left 0.15s",
        }}
      />
    </div>
  );
}

export function LangTag({ flag, code }: { flag: string; code: string }) {
  const t = useT();
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 8px",
        borderRadius: 9999,
        background: t.surfaceAlt,
        boxShadow: VT.ringSoft(t),
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: 0.2,
        color: t.textMuted,
        fontFamily: VT.fontMono,
        textTransform: "uppercase",
      }}
    >
      <FlagEmoji flag={flag} size={12} />
      <span>{code}</span>
    </div>
  );
}

export type PillTone = "neutral" | "cyan" | "warn" | "error" | "success";

export function Pill({
  tone = "neutral",
  children,
}: {
  tone?: PillTone;
  children: React.ReactNode;
}) {
  const t = useT();
  const tones: Record<PillTone, { bg: string; fg: string }> = {
    neutral: { bg: t.surfaceAlt, fg: t.textMuted },
    cyan: { bg: t.cyanTint, fg: t.cyanText },
    warn: { bg: t.warnTint, fg: VT.warning },
    error: { bg: t.errorTint, fg: VT.error },
    success: {
      bg: t.mode === "dark" ? "rgba(13,159,110,0.18)" : "rgba(13,159,110,0.10)",
      fg: VT.success,
    },
  };
  const s = tones[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 10px",
        borderRadius: 9999,
        background: s.bg,
        color: s.fg,
        fontSize: 11,
        fontWeight: 500,
        fontFamily: VT.font,
      }}
    >
      {children}
    </span>
  );
}
