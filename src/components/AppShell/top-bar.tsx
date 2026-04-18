import { Flex } from "@radix-ui/themes";
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
    /* Floating glass pill pinned to top with safe-area padding */
    <Flex
      justify="between"
      align="center"
      px="4"
      style={{
        margin: "16px 16px 0",
        minHeight: 56,
        borderRadius: 28,
        paddingTop: "max(14px, env(safe-area-inset-top))",
        paddingBottom: 14,
        flexShrink: 0,
      }}
      className="float-bar animate-slide-down"
    >
      <StatusBadge status={connectionStatus} />
      <Flex align="center" gap="2">
        <IconButton aria-label={t("aria_view_history")} onClick={onHistoryOpen}>
          <IconHistory />
        </IconButton>
        <IconButton
          aria-label={theme === "dark" ? t("aria_switch_light") : t("aria_switch_dark")}
          onClick={onToggleTheme}
        >
          <IconTheme isDark={theme === "dark"} />
        </IconButton>
        <IconButton aria-label={t("aria_open_settings")} onClick={onSettingsOpen}>
          <IconSettings />
        </IconButton>
      </Flex>
    </Flex>
  );
}
