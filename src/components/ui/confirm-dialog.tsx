import React from "react";
import { createPortal } from "react-dom";
import { useT, VT } from "@/tokens/tokens";

interface ConfirmDialogProps {
  isOpen: boolean;
  onDismiss: () => void;
  icon: React.ReactElement;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void;
}

export function ConfirmDialog({
  isOpen,
  onDismiss,
  icon,
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
}: ConfirmDialogProps) {
  const t = useT();
  if (!isOpen) return null;

  const iconBg = destructive ? t.errorTint : t.cyanTint;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={onDismiss}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          zIndex: 1,
          margin: "0 24px",
          width: "100%",
          maxWidth: 360,
          background: t.surface,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: `0 0 0 1px ${t.ringBorder}, 0 24px 48px rgba(0,0,0,0.24)`,
        }}
      >
        {/* Content */}
        <div style={{ padding: "24px 20px 18px", textAlign: "center" }}>
          {/* Tinted icon circle */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              background: iconBg,
              margin: "0 auto 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </div>
          <div
            style={{
              fontFamily: VT.fontDisplay,
              fontSize: 18,
              fontWeight: 600,
              color: t.text,
              letterSpacing: -0.6,
              marginBottom: 6,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 13,
              color: t.textMuted,
              lineHeight: 1.45,
              letterSpacing: -0.1,
            }}
          >
            {body}
          </div>
        </div>

        {/* Grid button row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            boxShadow: `inset 0 1px 0 ${t.ringBorder}`,
          }}
        >
          <div
            onClick={onDismiss}
            style={{
              padding: "14px 0",
              textAlign: "center",
              fontSize: 14,
              fontWeight: 500,
              color: t.textMuted,
              letterSpacing: -0.2,
              boxShadow: `inset -1px 0 0 ${t.ringBorder}`,
              cursor: "pointer",
            }}
          >
            {cancelLabel}
          </div>
          <div
            onClick={onConfirm}
            style={{
              padding: "14px 0",
              textAlign: "center",
              fontSize: 14,
              fontWeight: 600,
              color: destructive ? VT.error : t.text,
              letterSpacing: -0.2,
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
