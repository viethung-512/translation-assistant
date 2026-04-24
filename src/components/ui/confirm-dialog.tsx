import React from "react";
import { createPortal } from "react-dom";
import { useT } from "@/tokens/tokens";
import { Button } from "./button";
import { Typography } from "./typography";

interface ConfirmDialogProps {
  isOpen: boolean;
  onDismiss: () => void;
  icon: React.ReactElement;
  iconBg?: string;
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
  iconBg,
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
}: ConfirmDialogProps) {
  const t = useT();
  if (!isOpen) return null;
  const bg = iconBg ?? (destructive ? "rgba(239,68,68,0.15)" : t.cyanTint);

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
          background: "rgba(10,22,40,0.6)",
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          zIndex: 1,
          margin: "0 24px",
          width: "100%",
          maxWidth: 382,
        }}
      >
        <div
          style={{
            background: t.card,
            borderRadius: t.radius.xl,
            padding: `28px ${t.spacing.xxl}px 16px`,
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            border: t.mode === "dark" ? `1px solid ${t.hairline}` : "none",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: t.radius.full,
              background: bg,
              margin: `0 auto ${t.spacing.lg}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </div>
          <Typography
            variant="heading"
            align="center"
            style={{ marginBottom: t.spacing.sm }}
          >
            {title}
          </Typography>
          <Typography
            variant="action"
            color={t.textMuted}
            align="center"
            style={{ lineHeight: 1.4, padding: `0 ${t.spacing.sm}px` }}
          >
            {body}
          </Typography>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <Button
              variant="outlined"
              label={cancelLabel}
              flex={1}
              onPress={onDismiss}
            />
            <Button
              variant={destructive ? "destructive" : "primary"}
              label={confirmLabel}
              flex={1}
              onPress={onConfirm}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
