import React from "react";

export type Platform = "ios" | "android" | "desktop";

export interface Theme {
  mode: "light" | "dark";
  platform: Platform;
  // Surfaces
  bg: string;
  surface: string;
  surfaceAlt: string;
  card: string;
  elevated: string;
  // Text
  text: string;
  textMuted: string;
  textDim: string;
  textFaint: string;
  // Lines
  divider: string;
  hairline: string;
  // Shadow-as-border
  ringBorder: string;
  ringBorderSoft: string;
  // Accent
  cyan: string;
  cyanTint: string;
  cyanText: string;
  // Status tints
  warnTint: string;
  errorTint: string;
  // Device frame
  navy: string;
  statusBarGlyph: string;
  frameBg: string;
  bezel: string;
  // Spacing scale (px)
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  // Border radius scale (px)
  radius: { sm: number; md: number; lg: number; xl: number; full: number };
  // Typography scale
  type: {
    display: { size: number; weight: number; tracking: number };
    title: { size: number; weight: number; tracking: number };
    body: { size: number; weight: number; tracking: number };
    label: { size: number; weight: number; tracking: number };
    caption: { size: number; weight: number; tracking: number };
  };
}

const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;
const RADIUS = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 } as const;
const TYPE = {
  display: { size: 32, weight: 600, tracking: -1.28 },
  title: { size: 20, weight: 600, tracking: -0.8 },
  body: { size: 16, weight: 400, tracking: -0.2 },
  label: { size: 14, weight: 500, tracking: -0.3 },
  caption: { size: 11, weight: 500, tracking: 0.4 },
} as const;

export function makeTheme(dark: boolean, platform: Platform = "ios"): Theme {
  const colors = dark
    ? {
        mode: "dark" as const,
        bg: "#000000",
        surface: "#0A0A0A",
        surfaceAlt: "#111111",
        card: "#0A0A0A",
        elevated: "#171717",
        text: "#FAFAFA",
        textMuted: "#A1A1A1",
        textDim: "#737373",
        textFaint: "#525252",
        divider: "rgba(255,255,255,0.10)",
        hairline: "rgba(255,255,255,0.06)",
        ringBorder: "rgba(255,255,255,0.10)",
        ringBorderSoft: "rgba(255,255,255,0.06)",
        cyan: "#00D4FF",
        cyanTint: "rgba(0, 212, 255, 0.12)",
        cyanText: "#5DE5FF",
        warnTint: "rgba(245,158,11,0.14)",
        errorTint: "rgba(239,68,68,0.14)",
        navy: "#0A1628",
        statusBarGlyph: "#FAFAFA",
        frameBg: "#000000",
        bezel: "#111111",
      }
    : {
        mode: "light" as const,
        bg: "#FFFFFF",
        surface: "#FFFFFF",
        surfaceAlt: "#FAFAFA",
        card: "#FFFFFF",
        elevated: "#FFFFFF",
        text: "#171717",
        textMuted: "#4D4D4D",
        textDim: "#666666",
        textFaint: "#808080",
        divider: "#EBEBEB",
        hairline: "#F0F0F0",
        ringBorder: "rgba(0,0,0,0.08)",
        ringBorderSoft: "#EBEBEB",
        cyan: "#00D4FF",
        cyanTint: "#E6FAFF",
        cyanText: "#0088A8",
        warnTint: "#FFF4E5",
        errorTint: "#FFEDEC",
        navy: "#171717",
        statusBarGlyph: "#171717",
        frameBg: "#FFFFFF",
        bezel: "#171717",
      };
  return { ...colors, platform, spacing: SPACING, radius: RADIUS, type: TYPE };
}

// Static brand / semantic tokens (not theme-dependent)
export const VT = {
  cyan: "#00D4FF",
  cyanText: "#0088A8",
  success: "#0D9F6E",
  error: "#E5484D",
  warning: "#F5A623",
  s: ["#00D4FF", "#F5A623", "#0D9F6E", "#7C3AED", "#E5484D", "#737373"],
  font: '"Geist Variable", -apple-system, "SF Pro Text", "Inter", system-ui, Arial, sans-serif',
  fontDisplay: '"Geist Variable", -apple-system, "SF Pro Display", "Inter", system-ui, Arial, sans-serif',
  fontMono: '"Geist Mono Variable", ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace',
  ring: (t: Theme) => `0 0 0 1px ${t.ringBorder}`,
  ringSoft: (t: Theme) => `0 0 0 1px ${t.ringBorderSoft}`,
  card: (t: Theme) =>
    t.mode === "dark"
      ? `0 0 0 1px ${t.ringBorder}, 0 2px 2px rgba(0,0,0,0.3), 0 8px 8px -8px rgba(0,0,0,0.3)`
      : `0 0 0 1px ${t.ringBorder}, 0 2px 2px rgba(0,0,0,0.04), 0 8px 8px -8px rgba(0,0,0,0.04)`,
};

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

export const ThemeCtx = React.createContext<Theme>(makeTheme(false));
export const useT = () => React.useContext(ThemeCtx);

export function ThemeProvider({
  dark,
  children,
}: {
  dark: boolean;
  children: React.ReactNode;
}) {
  const platform = React.useMemo(() => detectPlatform(), []);
  const t = React.useMemo(() => makeTheme(dark, platform), [dark, platform]);
  return React.createElement(ThemeCtx.Provider, { value: t }, children);
}
