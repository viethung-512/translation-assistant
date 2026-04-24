import { Icon } from "@/components/icons";
import { useT, VT } from "@/tokens/tokens";
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
        width: 36,
        height: 36,
        borderRadius: 8,
        background: t.surface,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: VT.ring(t),
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
        height: 48,
        borderRadius: 8,
        background: t.surface,
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: 10,
        boxShadow: VT.ring(t),
        boxSizing: "border-box",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <div style={{ fontSize: 18, flexShrink: 0 }}>{flag}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: t.textDim,
            fontFamily: VT.fontMono,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {code}
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
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
      <Icon.ChevronDown s={12} c={t.textDim} />
    </div>
  );
}

export function SpeakerAvatar({
  idx,
  size = 28,
}: {
  idx: number;
  size?: number;
}) {
  const t = useT();
  const color = VT.s[idx % VT.s.length] ?? VT.s[5];
  const label = `S${idx + 1}`;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: size * 0.38,
        fontWeight: 600,
        letterSpacing: -0.4,
        flexShrink: 0,
        boxShadow: `0 0 0 2px ${t.bg}`,
        fontFamily: VT.font,
      }}
    >
      {label}
    </div>
  );
}
