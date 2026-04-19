import { useSafeArea } from "@/hooks/use-safe-area";
import React, { createContext, useContext } from "react";

const SafeAreaContext = createContext({ top: 0, bottom: 0, left: 0, right: 0 });

export const useSafeAreaContext = () => useContext(SafeAreaContext);

export const SafeAreaProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const insets = useSafeArea();

  return (
    <SafeAreaContext.Provider value={insets}>
      <div
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          minHeight: "100dvh",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </SafeAreaContext.Provider>
  );
};
