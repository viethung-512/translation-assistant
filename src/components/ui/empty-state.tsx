import React from "react";
import { useT, VT } from "@/tokens/tokens";

interface EmptyStateProps {
  icon: React.ReactElement;
  iconSize?: number;
  title: string;
  subtitle?: string;
}

export function EmptyState({
  icon,
  iconSize = 56,
  title,
  subtitle,
}: EmptyStateProps) {
  const t = useT();
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: 24,
      }}
    >
      <div
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: 999,
          background: t.surfaceAlt,
          boxShadow: VT.ringSoft(t),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: t.text,
          letterSpacing: -0.6,
          textAlign: "center",
          fontFamily: VT.fontDisplay,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: 13,
            color: t.textMuted,
            textAlign: "center",
            lineHeight: 1.5,
            maxWidth: 280,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
