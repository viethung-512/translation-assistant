// Connection status indicator: dot + label, themed via CSS variables.
import type { ConnectionStatus } from '@/providers/types';

interface Props {
  status: ConnectionStatus;
}

// Use CSS variable colors where possible; static hex for status dots (semantic meaning)
const STATUS_CONFIG: Record<ConnectionStatus, { color: string; label: string }> = {
  disconnected: { color: '#94a3b8', label: 'Disconnected' },
  connecting:   { color: '#f59e0b', label: 'Connecting…' },
  connected:    { color: '#22c55e', label: 'Live' },
  error:        { color: '#ef4444', label: 'Error' },
};

export function StatusBadge({ status }: Props) {
  const { color, label } = STATUS_CONFIG[status];

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
        {label}
      </span>
    </div>
  );
}
