import React from "react";
import { useT, VT } from "@/tokens/tokens";

export type ButtonVariant =
  | "primary"
  | "destructive"
  | "secondary"
  | "outlined"
  | "card";

interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
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
  icon,
  fullWidth,
  height = 44,
  flex,
  disabled,
  onPress,
  style = {},
}: ButtonProps) {
  const t = useT();

  const variantStyle: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: t.text,
      color: t.mode === "dark" ? "#000" : "#fff",
      boxShadow: VT.ringSoft(t),
    },
    destructive: {
      background: VT.error,
      color: "#fff",
    },
    secondary: {
      background: t.surfaceAlt,
      color: t.text,
      boxShadow: VT.ringSoft(t),
    },
    outlined: {
      background: t.surface,
      color: t.text,
      boxShadow: VT.ring(t),
    },
    card: {
      background: t.surface,
      color: t.text,
      boxShadow: VT.ring(t),
    },
  };

  const vs = variantStyle[variant];
  const textColor = (vs as React.CSSProperties & { color: string }).color;

  return (
    <div
      onClick={disabled ? undefined : onPress}
      style={{
        height,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: -0.2,
        fontFamily: VT.font,
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
