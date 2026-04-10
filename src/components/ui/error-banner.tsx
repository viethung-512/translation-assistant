// Dismissible error banner. Renders nothing when message is null/empty.
interface ErrorBannerProps {
  message: string | null;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      onClick={onDismiss}
      className="flex items-center justify-between gap-2 px-4 py-[10px] bg-danger-dim text-danger text-[13px] cursor-pointer"
    >
      <span>{message}</span>
      {/* X close icon */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" className="shrink-0">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </div>
  );
}
