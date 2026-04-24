import { Icon } from "@/components/icons";
import { useT, VT } from "@/tokens/tokens";
import React from "react";

export type BannerTone = "warn" | "error" | "info";

interface InlineBannerProps {
  tone?: BannerTone;
  title: string;
  subtitle?: string;
  onClick?: () => void;
}

const TONE_STYLES: Record<BannerTone, { bg: (t: ReturnType<typeof useT>) => string; border: string; icon: React.ReactElement }> = {
  warn: {
    bg: (t) => t.warnTint,
    border: `${VT.warning}33`,
    icon: <Icon.Alert s={18} c={VT.warning} />,
  },
  error: {
    bg: (t) => t.errorTint,
    border: `${VT.error}33`,
    icon: <Icon.Alert s={18} c={VT.error} />,
  },
  info: {
    bg: (t) => t.cyanTint,
    border: `${VT.cyan}33`,
    icon: <Icon.Alert s={18} c={VT.cyan} />,
  },
};

export function InlineBanner({ tone = "warn", title, subtitle, onClick }: InlineBannerProps) {
  const t = useT();
  const s = TONE_STYLES[tone];

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 8,
        background: s.bg(t),
        boxShadow: `0 0 0 1px ${s.border}`,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {s.icon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: t.text,
            letterSpacing: -0.2,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 11,
              color: t.textMuted,
              marginTop: 1,
              fontFamily: VT.fontMono,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {onClick && <Icon.ChevronRight s={14} c={t.textDim} />}
    </div>
  );
}
