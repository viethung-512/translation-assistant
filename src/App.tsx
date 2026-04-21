import React from "react";
import { AppShell } from "@/components/AppShell/app-shell";
import { getApiKey } from "@/tauri/secure-storage";
import { SonioxProvider } from "@soniox/react";

const AppV2 =
  import.meta.env.VITE_UI_VERSION === "v2"
    ? React.lazy(() => import("@/v2/app-v2"))
    : null;

// <Theme> lives inside AppShell so the same component that owns theme state also drives appearance.
function AppRoot() {
  if (AppV2) {
    return (
      <React.Suspense fallback={null}>
        <AppV2 />
      </React.Suspense>
    );
  }

  return (
    <SonioxProvider
      apiKey={async () => {
        const result = await getApiKey();
        if (result) {
          return result;
        }
        throw new Error("Please set soniox api-key!");
      }}
    >
      <AppShell />
    </SonioxProvider>
  );
}

export default AppRoot;
