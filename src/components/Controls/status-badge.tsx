// Connection status indicator: dot + label, themed via CSS variables.
import { useTranslation } from 'react-i18next';
import type { TranslationKeys } from '@/i18n/locales/en';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface Props {
  status: ConnectionStatus;
}

// Use CSS variable colors where possible; static hex for status dots (semantic meaning)
const STATUS_CONFIG: Record<ConnectionStatus, { color: string; labelKey: TranslationKeys }> = {
  disconnected: { color: '#94a3b8', labelKey: 'status_disconnected' },
  connecting:   { color: '#f59e0b', labelKey: 'status_connecting' },
  connected:    { color: '#22c55e', labelKey: 'status_connected' },
  error:        { color: '#ef4444', labelKey: 'status_error' },
};

export function StatusBadge({ status }: Props) {
  const { t } = useTranslation();
  const { color, labelKey } = STATUS_CONFIG[status];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
          flexShrink: 0,
          boxShadow: status === 'connected' ? `0 0 0 3px ${color}33` : 'none',
        }}
      />
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: 0.1 }}>
        {t(labelKey)}
      </span>
    </div>
  );
}
