import { useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";

import { DetailScreen } from "@/components/screens/detail-screen";
import { HistoryScreen } from "@/components/screens/history-screen";
import { MainScreen } from "@/components/screens/main-screen";
import { SettingsScreen } from "@/components/screens/settings-screen";
import { SwipeBackLayer } from "@/components/ui/swipe-back-layer";
import { ROUTES, detailPath } from "@/router/routes";
import { useT } from "@/tokens/tokens";

export function AppShellV2() {
  const t = useT();
  const navigate = useNavigate();
  const [settingsProps, setSettingsProps] = useState<{
    autoOpenApiKey?: boolean;
  }>({});

  const handleGoToSettings = (autoOpenApiKey = false) => {
    setSettingsProps({ autoOpenApiKey });
    navigate(ROUTES.SETTINGS);
  };

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
                onSettings={() => handleGoToSettings()}
                onHistory={() => navigate(ROUTES.HISTORY)}
              />
            }
          />
          <Route
            path={ROUTES.SETTINGS}
            element={
              <SwipeBackLayer onBack={() => navigate(ROUTES.MAIN)}>
                <SettingsScreen
                  onBack={() => navigate(ROUTES.MAIN)}
                  autoOpenApiKey={settingsProps.autoOpenApiKey}
                />
              </SwipeBackLayer>
            }
          />
          <Route
            path={ROUTES.HISTORY}
            element={
              <SwipeBackLayer onBack={() => navigate(ROUTES.MAIN)}>
                <HistoryScreen
                  onBack={() => navigate(ROUTES.MAIN)}
                  onSelectItem={(historyId) => navigate(detailPath(historyId))}
                />
              </SwipeBackLayer>
            }
          />
          <Route
            path={ROUTES.DETAIL}
            element={
              <SwipeBackLayer onBack={() => navigate(ROUTES.HISTORY)}>
                <DetailScreen onBack={() => navigate(ROUTES.HISTORY)} />
              </SwipeBackLayer>
            }
          />
        </Routes>
      </div>
    </div>
  );
}
