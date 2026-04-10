import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// @ts-expect-error process is a nodejs global
const devHost = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
// Physical iOS dev: TAURI_DEV_HOST is the LAN IP the device must use. Bind the dev server to
// 0.0.0.0 so it accepts traffic on all interfaces; binding only to devHost can fail to accept
// connections on some macOS/network setups while still advertising the correct IP for HMR.
export default defineConfig(async () => ({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: devHost ? "0.0.0.0" : false,
    hmr: devHost
      ? {
          protocol: "ws",
          host: devHost,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
