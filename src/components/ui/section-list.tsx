import React from "react";
import { useT, VT } from "@/tokens/tokens";
import { Icon } from "@/components/icons";

export function SectionGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const t = useT();
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: 1,
          color: t.textDim,
          textTransform: "uppercase",
          padding: "0 4px 8px",
          fontFamily: VT.fontMono,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: t.surface,
          borderRadius: 12,
          boxShadow: VT.ring(t),
          overflow: "hidden",
        }}
      >
        {children}
      </div>
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
      <div
        style={{ position: "relative", cursor: onPress ? "pointer" : "default" }}
        onClick={onPress}
      >
        <div
          style={{
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: -0.3,
                  color: destructive ? VT.error : t.text,
                }}
              >
                {title}
              </div>
              {subtitle && (
                <div
                  style={{
                    fontSize: 12,
                    color: t.textMuted,
                    marginTop: 3,
                    lineHeight: 1.4,
                  }}
                >
                  {subtitle}
                </div>
              )}
            </div>
            {chevron && !control && (
              <Icon.ChevronRight s={14} c={t.textFaint} />
            )}
          </div>
          {control && <div>{control}</div>}
          {detail && !control && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 12px",
                borderRadius: 8,
                background: t.surfaceAlt,
                boxShadow: VT.ringSoft(t),
                fontSize: 14,
                fontWeight: 500,
                color: t.text,
                letterSpacing: -0.2,
              }}
            >
              <span style={{ flex: 1 }}>{detail}</span>
              <Icon.ChevronDown s={14} c={t.textDim} />
            </div>
          )}
        </div>
        {!isLast && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 16,
              right: 16,
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
          padding: subtitle ? "12px 16px" : "0 16px",
          minHeight: 52,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: -0.3,
              color: destructive ? VT.error : t.text,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 12,
                color: t.textMuted,
                marginTop: 3,
                lineHeight: 1.4,
                maxWidth: 240,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        {detail && (
          <div style={{ fontSize: 13, color: t.textMuted, fontWeight: 500 }}>
            {detail}
          </div>
        )}
        {control}
        {chevron && !control && !destructive && (
          <Icon.ChevronRight s={14} c={t.textFaint} />
        )}
      </div>
      {!isLast && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 16,
            right: 16,
            height: 1,
            background: t.hairline,
          }}
        />
      )}
    </div>
  );
}
