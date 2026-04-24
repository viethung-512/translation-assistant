import React from "react";

export type Platform = "ios" | "android" | "desktop";

export interface Theme {
  mode: "light" | "dark";
  platform: Platform;
  // Colors
  bg: string;
  surface: string;
  surfaceAlt: string;
  card: string;
  elevated: string;
  text: string;
  textMuted: string;
  textDim: string;
  textFaint: string;
  divider: string;
  hairline: string;
  cyan: string;
  cyanTint: string;
  cyanText: string;
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
  display: { size: 34, weight: 800, tracking: -0.8 },
  title: { size: 21, weight: 800, tracking: -0.6 },
  body: { size: 16, weight: 600, tracking: -0.2 },
  label: { size: 13, weight: 600, tracking: -0.1 },
  caption: { size: 11, weight: 700, tracking: 0.4 },
} as const;

export function makeTheme(dark: boolean, platform: Platform = "ios"): Theme {
  const colors = dark
    ? {
        mode: "dark" as const,
        bg: "#05090F",
        surface: "#0F1929",
        surfaceAlt: "#142238",
        card: "#142238",
        elevated: "#1B2D49",
        text: "#FFFFFF",
        textMuted: "rgba(255,255,255,0.65)",
        textDim: "rgba(255,255,255,0.45)",
        textFaint: "rgba(255,255,255,0.25)",
        divider: "rgba(255,255,255,0.10)",
        hairline: "rgba(255,255,255,0.06)",
        cyan: "#00D4FF",
        cyanTint: "rgba(0, 212, 255, 0.14)",
        cyanText: "#5DE5FF",
        navy: "#0A1628",
        statusBarGlyph: "#fff",
        frameBg: "#05090F",
        bezel: "#1A1F2A",
      }
    : {
        mode: "light" as const,
        bg: "#F6F8FB",
        surface: "#FFFFFF",
        surfaceAlt: "#EEF2F7",
        card: "#FFFFFF",
        elevated: "#FFFFFF",
        text: "#0A1628",
        textMuted: "rgba(10, 22, 40, 0.70)",
        textDim: "rgba(10, 22, 40, 0.50)",
        textFaint: "rgba(10, 22, 40, 0.30)",
        divider: "rgba(10, 22, 40, 0.10)",
        hairline: "rgba(10, 22, 40, 0.06)",
        cyan: "#00D4FF",
        cyanTint: "#E6FAFF",
        cyanText: "#00A8CC",
        navy: "#0A1628",
        statusBarGlyph: "#0A1628",
        frameBg: "#F6F8FB",
        bezel: "#0A1628",
      };
  return { ...colors, platform, spacing: SPACING, radius: RADIUS, type: TYPE };
}

// Static brand / semantic tokens (not theme-dependent)
export const VT = {
  cyan: "#00D4FF",
  cyanText: "#00A8CC",
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
  s: ["#00D4FF", "#F97316", "#22C55E", "#A855F7", "#EAB308", "#94A3B8"],
  font: '-apple-system, "SF Pro Text", "Inter", system-ui, sans-serif',
  fontDisplay:
    '-apple-system, "SF Pro Display", "Inter", system-ui, sans-serif',
} as const;

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
