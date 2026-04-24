import React from "react";
import { useT, VT } from "@/tokens/tokens";

interface ScreenLayoutProps {
  /**
   * fixed — header/footer pinned, body scrolls (main screen)
   * scroll — entire content is one scrollable column (all other screens)
   */
  variant?: "fixed" | "scroll";
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function ScreenLayout({
  variant = "scroll",
  header,
  footer,
  children,
}: ScreenLayoutProps) {
  const t = useT();
  const base: React.CSSProperties = {
    width: "100%",
    flex: 1,
    minHeight: 0,
    background: t.bg,
    fontFamily: VT.font,
    color: t.text,
    display: "flex",
    flexDirection: "column",
  };

  if (variant === "fixed") {
    return (
      <div style={base}>
        {header && <div style={{ flexShrink: 0 }}>{header}</div>}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </div>
        {footer && <div style={{ flexShrink: 0 }}>{footer}</div>}
      </div>
    );
  }

  return (
    <div style={{ ...base, overflowY: "auto", position: "relative" }}>
      {children}
    </div>
  );
}
