import { useEffect, useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@/v2/tokens/tokens";
import { AppShellV2 } from "@/v2/components/AppShell/app-shell-v2";
import { ROUTES } from "@/v2/router/routes";
import { useV2SettingsStore } from "@/v2/store/v2-settings-store";

function getSystemDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function AppV2Inner() {
  const theme = useV2SettingsStore((s) => s.theme);
  const [systemDark, setSystemDark] = useState(getSystemDark);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const dark = theme === "dark" ? true : theme === "light" ? false : systemDark;

  return (
    <ThemeProvider dark={dark}>
      <MemoryRouter initialEntries={[ROUTES.MAIN]}>
        <AppShellV2 />
      </MemoryRouter>
    </ThemeProvider>
  );
}

export default function AppV2() {
  return <AppV2Inner />;
}
