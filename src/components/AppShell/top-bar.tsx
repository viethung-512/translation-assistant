import { StatusBadge } from "@/components/Controls/status-badge";
import { IconHistory, IconSettings, IconTheme } from "@/components/icons";
import { IconButton } from "@/components/ui";
import { ConnectionStatus } from "@/hooks/use-translation-session";
import { Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

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
    /* Full-width glass bar pinned to top edge with safe-area inset */
    <Flex
      justify="between"
      align="center"
      style={{
        paddingTop: 16,
        paddingBottom: 12,
        paddingLeft: 16,
        paddingRight: 16,
        minHeight: 56,
        borderRadius: 20,
        border: "none",
        flexShrink: 0,
      }}
      className="float-bar animate-slide-down"
    >
      <StatusBadge status={connectionStatus} />
      <Flex align="center" gap="5">
        <IconButton
          aria-label={t("aria_view_history")}
          onClick={onHistoryOpen}
          radius="full"
        >
          <IconHistory />
        </IconButton>
        <IconButton
          aria-label={
            theme === "dark" ? t("aria_switch_light") : t("aria_switch_dark")
          }
          onClick={onToggleTheme}
          radius="full"
        >
          <IconTheme isDark={theme === "dark"} />
        </IconButton>
        <IconButton
          aria-label={t("aria_open_settings")}
          onClick={onSettingsOpen}
          radius="full"
        >
          <IconSettings />
        </IconButton>
      </Flex>
    </Flex>
  );
}
