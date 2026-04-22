import { useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";

import { DetailScreen } from "@/v2/components/screens/detail-screen";
import { HistoryScreen } from "@/v2/components/screens/history-screen";
import { MainScreen } from "@/v2/components/screens/main-screen";
import { SettingsScreen } from "@/v2/components/screens/settings-screen";
import { ROUTES } from "@/v2/router/routes";
import { useT } from "@/v2/tokens/tokens";
import { getApiKey } from "@/tauri/secure-storage";
import { useV2SettingsStore } from "@/v2/store/v2-settings-store";

export function AppShellV2() {
  const t = useT();
  const navigate = useNavigate();

  // Populate in-memory apiKey from localStorage on mount (mirrors v1 app-shell pattern)
  useEffect(() => {
    getApiKey().then((key) => {
      if (key) useV2SettingsStore.getState().setApiKey(key);
    });
  }, []);

  return (
    <div
      className="v2-app"
      style={{
        height: "100dvh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: t.bg,
      }}
    >
      {/* Phone-width column; position:relative anchors overlay siblings */}
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <Routes>
          <Route
            path={ROUTES.MAIN}
            element={
              <MainScreen
                onSettings={() => navigate(ROUTES.SETTINGS)}
                onHistory={() => navigate(ROUTES.HISTORY)}
              />
            }
          />
          <Route
            path={ROUTES.SETTINGS}
            element={<SettingsScreen onBack={() => navigate(-1)} />}
          />
          <Route
            path={ROUTES.HISTORY}
            element={
              <HistoryScreen
                onBack={() => navigate(-1)}
                onSelectItem={() => navigate(ROUTES.DETAIL)}
              />
            }
          />
          <Route
            path={ROUTES.DETAIL}
            element={<DetailScreen onBack={() => navigate(-1)} />}
          />
        </Routes>
      </div>
    </div>
  );
}
