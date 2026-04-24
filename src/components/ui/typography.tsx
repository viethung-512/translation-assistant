import React from "react";
import { useT, VT } from "@/tokens/tokens";

// ─── Variant definitions ────────────────────────────────────────────────────
// Mapped from observed text patterns across all v2 screens.

export type TypographyVariant =
  | "display" // 34/800/-0.8/1.1 fontDisplay  — page titles (Settings, History)
  | "title" // 21/800/-0.6     fontDisplay  — app bar brand text
  | "heading" // 22/800/-0.4     fontDisplay  — sheet / dialog titles
  | "subheading" // 17/800/-0.3                  — detail dates, modal sub-headers
  | "body" // 16/700/-0.2/1.3              — primary transcript / content
  | "label" // 15/700/-0.2                  — list row primary text
  | "action" // 13/700/-0.1                  — buttons, chips, segment tabs
  | "hint" // 12/500/0                     — helper text, section subtitles
  | "caption" // 11/700/1.2  uppercase         — section group headers
  | "micro"; // 10/800/0.4                   — language codes, compact badges

interface StyleDef {
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  lineHeight?: number;
  fontFamily?: string;
  textTransform?: "uppercase";
}

const VARIANTS: Record<TypographyVariant, StyleDef> = {
  display: {
    fontSize: 32,
    fontWeight: 600,
    letterSpacing: -1.28,
    lineHeight: 1.1,
    fontFamily: VT.fontDisplay,
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: -0.8,
    fontFamily: VT.fontDisplay,
  },
  heading: {
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: -0.8,
    fontFamily: VT.fontDisplay,
  },
  subheading: { fontSize: 17, fontWeight: 600, letterSpacing: -0.6 },
  body: { fontSize: 16, fontWeight: 400, letterSpacing: -0.2, lineHeight: 1.5 },
  label: { fontSize: 14, fontWeight: 500, letterSpacing: -0.3 },
  action: { fontSize: 13, fontWeight: 500, letterSpacing: -0.1 },
  hint: { fontSize: 12, fontWeight: 400, letterSpacing: 0 },
  caption: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontFamily: VT.fontMono,
  },
  micro: { fontSize: 10, fontWeight: 500, letterSpacing: 0.4, fontFamily: VT.fontMono },
};

// Default color per variant — resolved at render time using theme tokens
type ColorKey = "text" | "textMuted" | "textDim";
const DEFAULT_COLORS: Record<TypographyVariant, ColorKey> = {
  display: "text",
  title: "text",
  heading: "text",
  subheading: "text",
  body: "text",
  label: "text",
  action: "text",
  hint: "textDim",
  caption: "textDim",
  micro: "textDim",
};

// ─── Component ───────────────────────────────────────────────────────────────

export interface TypographyProps {
  variant?: TypographyVariant;
  /** Override color — accepts any CSS color or theme token value */
  color?: string;
  /** Rendered HTML element. Defaults to 'div' for block variants, 'span' for inline usage */
  as?: React.ElementType;
  align?: "left" | "center" | "right";
  /** Clamp to one line with ellipsis */
  truncate?: boolean;
  italic?: boolean;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export function Typography({
  variant = "body",
  color,
  as: Tag = "div",
  align,
  truncate,
  italic,
  style,
  className,
  children,
  onClick,
}: TypographyProps) {
  const t = useT();
  const def = VARIANTS[variant];
  const defaultColor = t[DEFAULT_COLORS[variant]];

  const computed: React.CSSProperties = {
    fontSize: def.fontSize,
    fontWeight: def.fontWeight,
    letterSpacing: def.letterSpacing,
    ...(def.lineHeight && { lineHeight: def.lineHeight }),
    ...(def.fontFamily && { fontFamily: def.fontFamily }),
    ...(def.textTransform && { textTransform: def.textTransform }),
    color: color ?? defaultColor,
    ...(align && { textAlign: align }),
    ...(italic && { fontStyle: "italic" }),
    ...(truncate && {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    }),
    ...(onClick && { cursor: "pointer" }),
    ...style,
  };

  return (
    <Tag className={className} style={computed} onClick={onClick}>
      {children}
    </Tag>
  );
}
