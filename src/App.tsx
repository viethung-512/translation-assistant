// Root entry: error boundary wrapping the main app shell.
import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { Box, Text } from "@radix-ui/themes";
import { AppShell } from "@/components/AppShell/app-shell";
import { SonioxProvider } from "@soniox/react";
import { getApiKey } from "@/tauri/secure-storage";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) {
    return { error: e };
  }
  componentDidCatch(e: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", e, info);
  }
  render() {
    if (this.state.error) {
      return (
        <Box p="5">
          <Text color="red" weight="bold">App Error</Text>
          <Text as="p" size="1" style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", marginTop: 8 }}>
            {(this.state.error as Error).message}
          </Text>
        </Box>
      );
    }
    return this.props.children;
  }
}

// AppRoot is a functional component so it can call hooks (ErrorBoundary is a class component).
// <Theme> lives inside AppShell so the same component that owns theme state also drives appearance.
function AppRoot() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default AppRoot;
