import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-input";
import { Typography } from "@/components/ui/typography";
import { useV2T } from "@/i18n";
import { useV2SettingsStore } from "@/store/v2-settings-store";
import { deleteApiKey, saveApiKey } from "@/tauri/secure-storage";
import { useT, VT } from "@/tokens/tokens";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

interface ApiKeyDialogProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export function ApiKeyDialog({ isOpen, onDismiss }: ApiKeyDialogProps) {
  const t = useT();
  const { t: tr } = useV2T();
  const { apiKey, setApiKey } = useV2SettingsStore();
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState(false);

  const hasStoredKey = useMemo(() => apiKey && apiKey.trim() !== "", [apiKey]);

  useEffect(() => {
    if (!isOpen) {
      setInput("");
      return;
    }
  }, [isOpen]);

  const handleSave = useCallback(async () => {
    if (!input.trim()) return;
    setSaving(true);
    try {
      await saveApiKey(input.trim());
      setApiKey(input.trim());
      setInput("");
      onDismiss();
    } finally {
      setSaving(false);
    }
  }, [input, setApiKey, onDismiss]);

  const handleDelete = useCallback(async () => {
    await deleteApiKey();
    setApiKey("");
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
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          zIndex: 1,
          margin: "0 24px",
          width: "100%",
          maxWidth: 382,
          background: t.surface,
          borderRadius: 12,
          padding: "24px 20px 20px",
          boxShadow: `0 0 0 1px ${t.ringBorder}, 0 24px 48px rgba(0,0,0,0.24)`,
        }}
      >
        <div
          style={{
            fontFamily: VT.fontDisplay,
            fontSize: 18,
            fontWeight: 600,
            color: t.text,
            letterSpacing: -0.6,
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          {tr("v2_api_key_dialog_title")}
        </div>

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

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: hasStoredKey ? 10 : 0,
          }}
        >
          <Button
            variant="outlined"
            label={tr("v2_api_key_dialog_cancel")}
            flex={1}
            onPress={onDismiss}
          />
          <Button
            variant="primary"
            label={
              saving
                ? tr("v2_api_key_dialog_saving")
                : tr("v2_api_key_dialog_save")
            }
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
