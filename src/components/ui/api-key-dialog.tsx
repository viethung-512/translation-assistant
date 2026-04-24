import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useT, VT } from "@/tokens/tokens";
import { useV2SettingsStore } from "@/store/v2-settings-store";
import { getApiKey, saveApiKey, deleteApiKey } from "@/tauri/secure-storage";
import { TextField } from "@/components/ui/text-input";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { useV2T } from "@/i18n";

interface ApiKeyDialogProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export function ApiKeyDialog({ isOpen, onDismiss }: ApiKeyDialogProps) {
  const t = useT();
  const { t: tr } = useV2T();
  const { setApiKey } = useV2SettingsStore();
  const [input, setInput] = useState("");
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setInput("");
      return;
    }
    getApiKey().then((k) => setHasStoredKey(!!k));
  }, [isOpen]);

  const handleSave = useCallback(async () => {
    if (!input.trim()) return;
    setSaving(true);
    try {
      await saveApiKey(input.trim());
      setApiKey(input.trim());
      setHasStoredKey(true);
      setInput("");
      onDismiss();
    } finally {
      setSaving(false);
    }
  }, [input, setApiKey, onDismiss]);

  const handleDelete = useCallback(async () => {
    await deleteApiKey();
    setApiKey("");
    setHasStoredKey(false);
    setInput("");
    onDismiss();
  }, [setApiKey, onDismiss]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={onDismiss}
        style={{ position: "absolute", inset: 0, background: "rgba(10,22,40,0.6)" }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          zIndex: 1,
          margin: "0 24px",
          width: "100%",
          maxWidth: 382,
          background: t.card,
          borderRadius: t.radius.xl,
          padding: "28px 24px 20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          border: t.mode === "dark" ? `1px solid ${t.hairline}` : "none",
        }}
      >
        <Typography variant="heading" align="center" style={{ marginBottom: 6 }}>
          {tr("v2_api_key_dialog_title")}
        </Typography>

        {hasStoredKey && (
          <Typography
            variant="hint"
            color={VT.success}
            align="center"
            style={{ marginBottom: 16 }}
          >
            ✓ {tr("v2_settings_api_key_configured")}
          </Typography>
        )}

        <TextField
          value={input}
          onChange={setInput}
          placeholder={
            hasStoredKey
              ? tr("v2_api_key_dialog_placeholder_stored")
              : tr("v2_api_key_dialog_placeholder_empty")
          }
          type="password"
          focused={focused}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ marginBottom: 16 }}
        />

        <div style={{ display: "flex", gap: 10, marginBottom: hasStoredKey ? 10 : 0 }}>
          <Button
            variant="outlined"
            label={tr("v2_api_key_dialog_cancel")}
            flex={1}
            onPress={onDismiss}
          />
          <Button
            variant="primary"
            label={saving ? tr("v2_api_key_dialog_saving") : tr("v2_api_key_dialog_save")}
            flex={1}
            disabled={saving || !input.trim()}
            onPress={handleSave}
          />
        </div>

        {hasStoredKey && (
          <Button
            variant="destructive"
            label={tr("v2_api_key_dialog_delete")}
            fullWidth
            onPress={handleDelete}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
