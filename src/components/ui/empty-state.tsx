import React from "react";
import { useT } from "@/tokens/tokens";
import { Typography } from "./typography";

interface EmptyStateProps {
  icon: React.ReactElement;
  /** Container size for the icon circle. Default: 80 */
  iconSize?: number;
  /** Icon circle background. Default: t.cyanTint */
  iconBg?: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({
  icon,
  iconSize = 80,
  iconBg,
  title,
  subtitle,
}: EmptyStateProps) {
  const t = useT();
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 20,
      }}
    >
      <div
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: t.radius.full,
          background: iconBg ?? t.cyanTint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <Typography
        variant="subheading"
        align="center"
        style={{ fontWeight: 700 }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="action"
          color={t.textMuted}
          align="center"
          style={{ padding: "0 24px", lineHeight: 1.4 }}
        >
          {subtitle}
        </Typography>
      )}
    </div>
  );
}
