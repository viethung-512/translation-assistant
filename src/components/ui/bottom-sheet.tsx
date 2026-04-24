import React from "react";
import { createPortal } from "react-dom";
import { useT, VT } from "@/tokens/tokens";
import { Icon } from "@/components/icons";

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
          borderRadius: "16px 16px 0 0",
          boxShadow: `0 0 0 1px ${t.ringBorder}, 0 -8px 30px rgba(0,0,0,0.25)`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Grabber */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
          <div style={{ width: 32, height: 4, borderRadius: 999, background: t.divider }} />
        </div>
        {/* Header row */}
        <div
          style={{
            padding: "12px 20px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: VT.fontDisplay,
              fontSize: 20,
              fontWeight: 600,
              color: t.text,
              letterSpacing: -0.8,
            }}
          >
            {title}
          </div>
          {rightAction ?? (
            <div
              onClick={onDismiss}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: t.surfaceAlt,
                boxShadow: VT.ringSoft(t),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Icon.Close c={t.textMuted} s={14} />
            </div>
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
