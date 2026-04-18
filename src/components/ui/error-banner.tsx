// Dismissible error banner using Radix Callout. Renders nothing when message is null.
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
      style={{ cursor: "pointer", borderRadius: 0 }}
    >
      <Callout.Icon>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </Callout.Icon>
      <Callout.Text>{message}</Callout.Text>
    </Callout.Root>
  );
}
