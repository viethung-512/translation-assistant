import React from "react";
import { createPortal } from "react-dom";
import { useT } from "@/tokens/tokens";
import { Icon } from "@/components/icons";
import { Typography } from "./typography";

interface BottomSheetProps {
  isOpen: boolean;
  onDismiss: () => void;
  title: string;
  /** Max height as % of viewport. Default: 80 */
  heightPercent?: number;
  /** Replaces the default close button when provided */
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}

export function BottomSheet({
  isOpen,
  onDismiss,
  title,
  heightPercent = 80,
  rightAction,
  children,
}: BottomSheetProps) {
  const t = useT();
  if (!isOpen) return null;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
      {/* Backdrop */}
      <div
        onClick={onDismiss}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(10,22,40,0.55)",
        }}
      />
      {/* Sheet panel */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: `${heightPercent}%`,
          maxHeight: "90%",
          background: t.surface,
          borderRadius: `${t.radius.xl}px ${t.radius.xl}px 0 0`,
          boxShadow: "0 -8px 30px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: t.mode === "dark" ? `1px solid ${t.hairline}` : "none",
          borderBottom: "none",
        }}
      >
        {/* Drag handle */}
        <div
          style={{ display: "flex", justifyContent: "center", paddingTop: 10 }}
        >
          <div
            style={{
              width: 44,
              height: 5,
              borderRadius: t.radius.full,
              background:
                t.mode === "dark"
                  ? "rgba(255,255,255,0.25)"
                  : "rgba(10,22,40,0.3)",
            }}
          />
        </div>
        {/* Header row */}
        <div
          style={{
            padding: `14px ${t.spacing.xl}px 12px`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="heading">{title}</Typography>
          {rightAction ?? (
            <div
              onClick={onDismiss}
              style={{
                width: 36,
                height: 36,
                borderRadius: t.radius.full,
                background: t.surfaceAlt,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Icon.Close c={t.textMuted} />
            </div>
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
