// Wraps ErrorBanner with local dismiss state so app-shell stays clean.
import { useEffect, useState } from "react";
import { ErrorBanner } from "@/components/ui";

interface Props {
  error: string | null;
}

export function ErrorBannerSection({ error }: Props) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (error) setDismissed(false);
  }, [error]);

  return (
    <ErrorBanner
      message={dismissed ? null : error}
      onDismiss={() => setDismissed(true)}
    />
  );
}
