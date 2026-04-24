import React from "react";
import { useT } from "@/tokens/tokens";

interface ActionBarProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/** Fixed bottom action bar — always visible above the device chrome. */
export function ActionBar({ children, style = {} }: ActionBarProps) {
  const t = useT();
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        padding: `12px 16px calc(12px + env(safe-area-inset-bottom))`,
        background: t.surface,
        boxShadow: `inset 0 1px 0 ${t.ringBorder}`,
        display: "flex",
        gap: 8,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
