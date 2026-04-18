// Connection status indicator: dot + label using Radix Flex, Box, Text.
import { Box, Flex, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import type { TranslationKeys } from "@/i18n/locales/en";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface Props {
  status: ConnectionStatus;
}

// Static hex colors for semantic status dots — no Radix token equivalent
const STATUS_CONFIG: Record<ConnectionStatus, { color: string; labelKey: TranslationKeys }> = {
  disconnected: { color: "#94a3b8", labelKey: "status_disconnected" },
  connecting:   { color: "#f59e0b", labelKey: "status_connecting" },
  connected:    { color: "#22c55e", labelKey: "status_connected" },
  error:        { color: "#ef4444", labelKey: "status_error" },
};

export function StatusBadge({ status }: Props) {
  const { t } = useTranslation();
  const { color, labelKey } = STATUS_CONFIG[status];

  return (
    <Flex align="center" gap="2">
      <Box
        width="9px"
        height="9px"
        style={{
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
          boxShadow: status === "connected" ? `0 0 0 3px ${color}33` : "none",
        }}
      />
      <Text size="2" color="gray" weight="medium">
        {t(labelKey)}
      </Text>
    </Flex>
  );
}
