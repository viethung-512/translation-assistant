import React from "react";
import { useT, VT } from "@/tokens/tokens";

export type ButtonVariant =
  | "primary"
  | "destructive"
  | "secondary"
  | "outlined"
  | "card";
export type ButtonShape = "pill" | "rounded";

interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  /** pill = full radius, rounded = t.radius.lg (14px). Default: pill */
  shape?: ButtonShape;
  icon?: React.ReactElement;
  fullWidth?: boolean;
  height?: number;
  flex?: number;
  disabled?: boolean;
  onPress?: () => void;
  style?: React.CSSProperties;
}

export function Button({
  label,
  variant = "secondary",
  shape = "pill",
  icon,
  fullWidth,
  height = 52,
  flex,
  disabled,
  onPress,
  style = {},
}: ButtonProps) {
  const t = useT();
  const borderRadius = shape === "pill" ? t.radius.full : t.radius.lg;

  const variantStyle: Record<ButtonVariant, React.CSSProperties> = {
    primary: { background: VT.cyan, color: t.navy },
    destructive: {
      background: VT.error,
      color: "#fff",
      boxShadow: `0 4px 14px ${VT.error}55`,
    },
    secondary: { background: t.surfaceAlt, color: t.text },
    outlined: {
      background: "transparent",
      color: t.text,
      border: `1.5px solid ${t.divider}`,
    },
    card: {
      background: t.card,
      color: t.text,
      border: `1.5px solid ${t.divider}`,
    },
  };

  const vs = variantStyle[variant];
  const textColor = (vs as React.CSSProperties & { color: string }).color;

  return (
    <div
      onClick={disabled ? undefined : onPress}
      style={{
        height,
        borderRadius,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: -0.1,
        cursor: disabled ? "default" : onPress ? "pointer" : "default",
        opacity: disabled ? 0.45 : 1,
        ...(fullWidth ? { width: "100%" } : {}),
        ...(flex !== undefined ? { flex } : {}),
        ...vs,
        ...style,
      }}
    >
      {icon &&
        React.cloneElement(icon, {
          s: icon.props.s ?? 16,
          c: icon.props.c ?? textColor,
        })}
      {label}
    </div>
  );
}
