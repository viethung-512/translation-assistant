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
        <IconButton aria-label="View session history" onClick={onHistoryOpen}>
          <IconHistory />
        </IconButton>
        <IconButton
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          onClick={onToggleTheme}
        >
          <IconTheme isDark={theme === "dark"} />
        </IconButton>
        <IconButton aria-label="Open settings" onClick={onSettingsOpen}>
          <IconSettings />
        </IconButton>
      </div>
    </div>
  );
}
