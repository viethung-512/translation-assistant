import { useTranslation } from "react-i18next";
import { IconButton } from "@/components/ui";
import { StatusBadge } from "@/components/Controls/status-badge";
import { IconSettings, IconHistory, IconTheme } from "@/components/icons";
import { ConnectionStatus } from "@/hooks/use-translation-session";

interface Props {
  connectionStatus: ConnectionStatus;
  theme: string;
  onToggleTheme: () => void;
  onHistoryOpen: () => void;
  onSettingsOpen: () => void;
}

export function TopBar({
  connectionStatus,
  theme,
  onToggleTheme,
  onHistoryOpen,
  onSettingsOpen,
}: Props) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-primary)",
        minHeight: 52,
      }}
    >
      <StatusBadge status={connectionStatus} />
      <div className="flex items-center gap-1">
        <IconButton aria-label={t('aria_view_history')} onClick={onHistoryOpen}>
          <IconHistory />
        </IconButton>
        <IconButton
          aria-label={theme === "dark" ? t('aria_switch_light') : t('aria_switch_dark')}
          onClick={onToggleTheme}
        >
          <IconTheme isDark={theme === "dark"} />
        </IconButton>
        <IconButton aria-label={t('aria_open_settings')} onClick={onSettingsOpen}>
          <IconSettings />
        </IconButton>
      </div>
    </div>
  );
}
