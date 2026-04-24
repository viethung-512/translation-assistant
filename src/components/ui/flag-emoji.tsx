import type { CSSProperties } from "react";

interface FlagEmojiProps {
  flag: string;
  size?: number;
  style?: CSSProperties;
}

// Explicit emoji font stack ensures flag glyphs render on iOS WKWebView,
// which may fall back to a non-emoji font on some OS versions.
const EMOJI_FONT = "Apple Color Emoji, Segoe UI Emoji, NotoColorEmoji, serif";

export function FlagEmoji({ flag, size = 16, style }: FlagEmojiProps) {
  return (
    <span
      role="img"
      aria-label={flag}
      style={{ fontSize: size, fontFamily: EMOJI_FONT, ...style }}
    >
      {flag}
    </span>
  );
}
