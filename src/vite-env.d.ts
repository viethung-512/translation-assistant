/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UI_VERSION?: "v1" | "v2";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
