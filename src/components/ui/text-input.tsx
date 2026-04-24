import React from "react";
import { useT, VT } from "@/tokens/tokens";
import { Icon } from "@/components/icons";

interface TextFieldProps {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  prefix?: React.ReactNode;
  focused?: boolean;
  height?: number;
  type?: React.HTMLInputTypeAttribute;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: React.CSSProperties;
}

export function TextField({
  value = "",
  onChange,
  placeholder,
  prefix,
  focused,
  height = 52,
  type,
  onFocus,
  onBlur,
  style = {},
}: TextFieldProps) {
  const t = useT();
  return (
    <div
      style={{
        height,
        borderRadius: t.radius.md,
        background: t.surfaceAlt,
        display: "flex",
        alignItems: "center",
        padding: `0 ${t.spacing.lg}px`,
        gap: t.spacing.sm,
        border: focused ? `2px solid ${VT.cyan}` : `1px solid ${t.divider}`,
        ...style,
      }}
    >
      {prefix}
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        type={type}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          fontSize: t.type.body.size,
          fontWeight: t.type.body.weight,
          color: t.text,
          letterSpacing: t.type.body.tracking,
        }}
      />
    </div>
  );
}

interface SearchInputProps {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  style,
}: SearchInputProps) {
  const t = useT();
  return (
    <TextField
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      prefix={<Icon.Search c={t.textDim} s={18} />}
      height={48}
      style={style}
    />
  );
}
