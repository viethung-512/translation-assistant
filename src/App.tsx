// Root entry: error boundary wrapping the main app shell.
import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
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
        <div
          style={{
            padding: 24,
            fontFamily: "monospace",
            fontSize: 13,
            color: "var(--danger)",
          }}
        >
          <strong>App Error</strong>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              marginTop: 8,
            }}
          >
            {(this.state.error as Error).message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  
  return (
    <ErrorBoundary>
      <SonioxProvider
        apiKey={async () => {
          const result =  await getApiKey();
          if (result) {
            return result;
          }
          throw new Error('Please set soniox api-key!')
        }}
      >
        <AppShell />
      </SonioxProvider>
    </ErrorBoundary>
  );
}
