// Connection status indicator dot + label.
import type { ConnectionStatus } from '@/providers/types';

interface Props {
  status: ConnectionStatus;
}

const STATUS_CONFIG: Record<ConnectionStatus, { color: string; label: string }> = {
  disconnected: { color: '#9ca3af', label: 'Disconnected' },
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
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
          boxShadow: status === 'connected' ? `0 0 0 3px ${color}33` : 'none',
        }}
      />
      <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{label}</span>
    </div>
  );
}
