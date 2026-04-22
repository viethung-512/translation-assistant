import { AppShell } from "@/components/AppShell/app-shell";
import { getApiKey } from "@/tauri/secure-storage";
import { SonioxClient } from "@soniox/client";
import { SonioxProvider } from "@soniox/react";
import React from "react";

const sonioxClient = new SonioxClient({
  async api_key() {
    const result = await getApiKey();
    if (result) {
      return result;
    }
    throw new Error("Please set soniox api-key!");
  },
});

const AppV2 =
  import.meta.env.VITE_UI_VERSION === "v2"
    ? React.lazy(() => import("@/v2/app-v2"))
    : null;

// <Theme> lives inside AppShell so the same component that owns theme state also drives appearance.
function AppRoot() {
  if (AppV2) {
    return (
      <React.Suspense fallback={null}>
        <SonioxProvider client={sonioxClient}>
          <AppV2 />
        </SonioxProvider>
      </React.Suspense>
    );
  }

  return (
    <SonioxProvider client={sonioxClient}>
      <AppShell />
    </SonioxProvider>
  );
}

export default AppRoot;
