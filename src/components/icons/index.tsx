export interface IconProps {
  c?: string;
  s?: number;
}

export const Icon = {
  Gear: ({ c = "currentColor", s = 22 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke={c} strokeWidth="2" />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={c}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Clock: ({ c = "currentColor", s = 22 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="2" />
      <path
        d="M12 7v5l3 2"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Swap: ({ c = "currentColor", s = 18 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path
        d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"
        stroke={c}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  ChevronDown: ({ c = "currentColor", s = 16 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path
        d="M6 9l6 6 6-6"
        stroke={c}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  ChevronRight: ({ c = "currentColor", s = 16 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path
        d="M9 6l6 6-6 6"
        stroke={c}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  ChevronLeft: ({ c = "currentColor", s = 22 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path
        d="M15 6l-6 6 6 6"
        stroke={c}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Mic: ({ c = "#fff", s = 32 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="12" rx="3" fill={c} />
      <path
        d="M5 11a7 7 0 0014 0M12 18v3M8 21h8"
        stroke={c}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Pause: ({ c = "#fff", s = 28 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="6" y="4" width="4" height="16" rx="1.2" fill={c} />
      <rect x="14" y="4" width="4" height="16" rx="1.2" fill={c} />
    </svg>
  ),
  Play: ({ c = "#fff", s = 28 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path
        d="M7 4.5v15a1 1 0 001.54.84l11.5-7.5a1 1 0 000-1.68l-11.5-7.5A1 1 0 007 4.5z"
        fill={c}
      />
    </svg>
  ),
  Stop: ({ c = "#fff", s = 20 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="5" width="14" height="14" rx="2" fill={c} />
    </svg>
  ),
  Trash: ({ c = "currentColor", s = 22 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13M10 11v7M14 11v7"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Search: ({ c = "currentColor", s = 20 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke={c} strokeWidth="2" />
      <path
        d="M21 21l-4.3-4.3"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Check: ({ c = "currentColor", s = 20 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12.5l5 5 9-11"
        stroke={c}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Close: ({ c = "currentColor", s = 18 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke={c}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  ),
  Speaker: ({ c = "currentColor", s = 18 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M11 5L6 9H3v6h3l5 4V5z" fill={c} />
      <path
        d="M16 8a5 5 0 010 8M19 5a9 9 0 010 14"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Text: ({ c = "currentColor", s = 16 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path
        d="M5 6V4h14v2M9 20h6M12 4v16"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Share: ({ c = "currentColor", s = 18 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3v12M12 3l-4 4M12 3l4 4M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Export: ({ c = "currentColor", s = 18 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path
        d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z"
        stroke={c}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v5h5M9 14h6M9 17h4"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Sun: ({ c = "currentColor", s = 16 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" fill={c} />
      <path
        d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Moon: ({ c = "currentColor", s = 16 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M20 14.5A8 8 0 119.5 4a6.5 6.5 0 0010.5 10.5z" fill={c} />
    </svg>
  ),
  Alert: ({ c = "currentColor", s = 24 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l10 18H2L12 3z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 10v5M12 18.5v.01" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Key: ({ c = "currentColor", s = 18 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="8" cy="15" r="4" stroke={c} strokeWidth="1.8" />
      <path d="M11 13l10-10M17 7l3 3" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Eye: ({ c = "currentColor", s = 18 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke={c} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" stroke={c} strokeWidth="1.8" />
    </svg>
  ),
  EyeOff: ({ c = "currentColor", s = 18 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M17.94 17.94A10.06 10.06 0 0112 20C5 20 1 12 1 12a19.27 19.27 0 014.22-5.19M9.9 4.24A10 10 0 0112 4c7 0 11 8 11 8a19.5 19.5 0 01-3.17 4.19M14.12 14.12a3 3 0 01-4.24-4.24" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M1 1l22 22" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Copy: ({ c = "currentColor", s = 16 }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="9" width="12" height="12" rx="2" stroke={c} strokeWidth="1.8" />
      <path d="M5 15V5a2 2 0 012-2h10" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};
