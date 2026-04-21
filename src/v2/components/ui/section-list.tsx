import React from "react";
import { useT, VT } from "@/v2/tokens/tokens";
import { Icon } from "@/v2/components/icons";
import { Card } from "./primitives";
import { Typography } from "./typography";

export function SectionGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const t = useT();
  return (
    <div style={{ marginBottom: t.spacing.lg }}>
      <Typography variant="caption" style={{ padding: "0 10px 8px" }}>
        {title}
      </Typography>
      <Card
        style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        {children}
      </Card>
    </div>
  );
}

export interface SectionRowProps {
  title: string;
  subtitle?: string;
  detail?: React.ReactNode;
  control?: React.ReactNode;
  destructive?: boolean;
  chevron?: boolean;
  isLast?: boolean;
  /** Stacked layout: title/subtitle above, detail/control below */
  stacked?: boolean;
  onPress?: () => void;
}

export function SectionRow({
  title,
  subtitle,
  detail,
  control,
  destructive,
  chevron = true,
  isLast,
  stacked,
  onPress,
}: SectionRowProps) {
  const t = useT();

  if (stacked) {
    return (
      <div style={{ position: "relative" }} onClick={onPress}>
        <div
          style={{
            padding: `14px ${t.spacing.lg}px`,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="label"
                color={destructive ? VT.error : t.text}
                style={{ fontWeight: 600 }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  variant="hint"
                  color={t.textDim}
                  style={{ marginTop: 3, lineHeight: 1.35 }}
                >
                  {subtitle}
                </Typography>
              )}
            </div>
            {chevron && !control && (
              <Icon.ChevronRight s={16} c={t.textFaint} />
            )}
          </div>
          {control && <div>{control}</div>}
          {detail && !control && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 14px",
                borderRadius: t.radius.md,
                background: t.surfaceAlt,
                border: `1px solid ${t.divider}`,
                fontSize: 15,
                fontWeight: 600,
                color: t.text,
                letterSpacing: -0.2,
              }}
            >
              {detail}
            </div>
          )}
        </div>
        {!isLast && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: t.spacing.lg,
              right: t.spacing.lg,
              height: 1,
              background: t.hairline,
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      style={{ position: "relative", cursor: onPress ? "pointer" : "default" }}
      onClick={onPress}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: subtitle ? `12px ${t.spacing.lg}px` : `0 ${t.spacing.lg}px`,
          minHeight: 56,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body"
            color={destructive ? VT.error : t.text}
            style={{ fontWeight: 600 }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="hint"
              color={t.textDim}
              style={{ marginTop: 3, lineHeight: 1.35, maxWidth: 240 }}
            >
              {subtitle}
            </Typography>
          )}
        </div>
        {detail && (
          <div style={{ fontSize: 15, color: t.textDim, fontWeight: 500 }}>
            {detail}
          </div>
        )}
        {control}
        {chevron && !control && !destructive && (
          <Icon.ChevronRight s={16} c={t.textFaint} />
        )}
      </div>
      {!isLast && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: t.spacing.lg,
            right: t.spacing.lg,
            height: 1,
            background: t.hairline,
          }}
        />
      )}
    </div>
  );
}
