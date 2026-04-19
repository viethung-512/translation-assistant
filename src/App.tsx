import { AppShell } from "@/components/AppShell/app-shell";
import { getApiKey } from "@/tauri/secure-storage";
import { SonioxProvider } from "@soniox/react";

// <Theme> lives inside AppShell so the same component that owns theme state also drives appearance.
function AppRoot() {
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
