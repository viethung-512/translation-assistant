import { Icon } from "@/v2/components/icons";
import { Typography } from "@/v2/components/ui/typography";
import { useT, VT } from "@/v2/tokens/tokens";
import React from "react";

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
