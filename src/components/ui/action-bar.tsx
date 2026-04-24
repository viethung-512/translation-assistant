import React from "react";
import { useT } from "@/tokens/tokens";

interface ActionBarProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/** Bottom surface bar with a horizontal row of action buttons — sticks to the bottom of its scroll container. */
export function ActionBar({ children, style = {} }: ActionBarProps) {
  const t = useT();
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 10,
        padding: `${t.spacing.md}px ${t.spacing.lg}px calc(${t.spacing.xxl}px + env(safe-area-inset-bottom))`,
        background: t.surface,
        borderTop: `1px solid ${t.divider}`,
        display: "flex",
        gap: 10,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
