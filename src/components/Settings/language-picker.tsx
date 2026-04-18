import { useMemo } from "react";
import { ALL_AVAILABLE_LANGUAGES } from "@/constants/languages";

interface Props {
  label: string;
  value: string;
  onChange: (code: string) => void;
  exclude?: string;
}

export function LanguagePicker({ label, value, onChange, exclude }: Props) {
  const options = useMemo(() =>
    ALL_AVAILABLE_LANGUAGES.filter((l) => l.code !== exclude),
  [exclude]);

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '9px 12px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          fontSize: 15,
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          appearance: 'auto',
        }}
      >
        {options.map((l) => (
          <option key={l.code} value={l.code}>{l.name}</option>
        ))}
      </select>
    </div>
  );
}
