// Dismissible error banner using Radix Callout. Renders nothing when message is null.
import { IconClose } from "@/components/icons";
import { Callout } from "@radix-ui/themes";

interface ErrorBannerProps {
  message: string | null;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <Callout.Root
      color="red"
      onClick={onDismiss}
      style={{ cursor: "pointer", borderRadius: 12 }}
    >
      <Callout.Icon>
        <IconClose size={14} />
      </Callout.Icon>
      <Callout.Text>{message}</Callout.Text>
    </Callout.Root>
  );
}
