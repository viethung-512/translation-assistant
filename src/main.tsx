import "@/i18n"; // must be first — initializes i18n before any component renders
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./tailwind.css";

function clearPreLoad() {
  const el = document.getElementById("pre-load");
  if (el) el.remove();
}

function showFatalError(err: unknown) {
  clearPreLoad();
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  document.body.innerHTML = `<pre style="padding:24px;color:#dc2626;font-size:12px;white-space:pre-wrap;word-break:break-all;font-family:monospace"><strong>Fatal startup error</strong>\n\n${msg}</pre>`;
}

try {
  clearPreLoad();
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      

      <App />
      
    </React.StrictMode>,
  );
} catch (err) {
  showFatalError(err);
}
