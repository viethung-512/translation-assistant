import React from "react";
import { useT, VT } from "@/v2/tokens/tokens";
import { FlagEmoji } from "@/v2/components/ui/flag-emoji";

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
        borderRadius: 16,
        boxShadow:
          t.mode === "light"
            ? "0 1px 2px rgba(10,22,40,0.04), 0 6px 20px rgba(10,22,40,0.06)"
            : "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.4)",
        border: t.mode === "dark" ? `1px solid ${t.hairline}` : "none",
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
  return (
    <div
      onClick={() => onChange?.(!on)}
      style={{
        width: 52,
        height: 32,
        borderRadius: 999,
        background: on ? VT.cyan : "rgba(120,120,128,0.30)",
        position: "relative",
        flexShrink: 0,
        cursor: onChange ? "pointer" : "default",
        transition: "background 0.2s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: on ? 22 : 2,
          width: 28,
          height: 28,
          borderRadius: 999,
          background: "#fff",
          boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
          transition: "left 0.2s",
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
        padding: "3px 8px 3px 6px",
        borderRadius: 999,
        background: t.surfaceAlt,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.4,
        color: t.textMuted,
      }}
    >
      <FlagEmoji flag={flag} size={13} />
      <span>{code}</span>
    </div>
  );
}
