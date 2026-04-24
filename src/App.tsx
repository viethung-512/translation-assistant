import { AppShellV2 } from "@/components/AppShell/app-shell-v2";
import { ROUTES } from "@/router/routes";
import { useV2SettingsStore } from "@/store/v2-settings-store";
import { ThemeProvider } from "@/tokens/tokens";
import { SonioxProvider } from "@soniox/react";
import { useEffect, useMemo, useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { getApiKey } from "./tauri/secure-storage";

function getSystemDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function AppV2Inner() {
  const theme = useV2SettingsStore((s) => s.theme);
  const setApiKeyToGlobal = useV2SettingsStore((s) => s.setApiKey);
  const [systemDark, setSystemDark] = useState(getSystemDark);
  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    if (!apiKey || apiKey.trim() === "") {
      getApiKey().then((data) => {
        if (data) {
          setApiKey(data);
          setApiKeyToGlobal(data);
        }
      });
    }
  }, [apiKey]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const dark = useMemo(
    () => (theme === "dark" ? true : theme === "light" ? false : systemDark),
    [theme, systemDark],
  );

  return (
    <ThemeProvider dark={dark}>
      <MemoryRouter initialEntries={[ROUTES.MAIN]}>
        <SonioxProvider apiKey={apiKey}>
          <AppShellV2 />
        </SonioxProvider>
      </MemoryRouter>
    </ThemeProvider>
  );
}

export default function AppV2() {
  return <AppV2Inner />;
}
