import { useState, useMemo, useCallback } from "react";
import { useT, VT } from "@/tokens/tokens";
import { Icon } from "@/components/icons";
import { Pill } from "@/components/ui/primitives";
import { ScreenLayout } from "@/components/ui/screen-layout";
import { ActionBar } from "@/components/ui/action-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteTranscripts } from "@/storage/transcript-idb";
import {
  useV2HistoryStore,
  type V2HistoryItem,
} from "@/store/v2-history-store";
import { useV2T } from "@/i18n";
import { invoke } from "@tauri-apps/api/core";

function HistoryRow({
  time,
  flags,
  speakers,
  preview,
  dur,
  isLast,
  multiSelect,
  selected,
  onPress,
  onToggle,
}: V2HistoryItem & {
  isLast?: boolean;
  multiSelect?: boolean;
  selected?: boolean;
  onPress?: () => void;
  onToggle?: () => void;
}) {
  const t = useT();
  return (
    <div
      style={{ position: "relative", cursor: "pointer" }}
      onClick={multiSelect ? onToggle : onPress}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 14px",
        }}
      >
        {/* Square multi-select checkbox */}
        {multiSelect && (
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              flexShrink: 0,
              background: selected ? t.text : "transparent",
              boxShadow: selected ? "none" : VT.ring(t),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {selected && (
              <Icon.Check c={t.mode === "dark" ? "#000" : "#fff"} s={12} />
            )}
          </div>
        )}

        {/* Flag stack — 26×26 */}
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          {flags.slice(0, 4).map((f, i) => (
            <div
              key={i}
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                background: t.surfaceAlt,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                marginLeft: i === 0 ? 0 : -8,
                boxShadow: `0 0 0 2px ${t.surface}`,
                zIndex: 10 - i,
              }}
            >
              {f}
            </div>
          ))}
          {flags.length > 4 && (
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                background: t.surfaceAlt,
                color: t.textMuted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 500,
                marginLeft: -8,
                fontFamily: VT.fontMono,
                boxShadow: `0 0 0 2px ${t.surface}`,
              }}
            >
              +{flags.length - 4}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 8,
              marginBottom: 3,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: t.text,
                letterSpacing: -0.3,
              }}
            >
              {time}
            </div>
            <div
              style={{
                fontSize: 11,
                color: t.textDim,
                fontWeight: 400,
                whiteSpace: "nowrap",
                fontFamily: VT.fontMono,
              }}
            >
              {dur}
            </div>
          </div>
          <div style={{ marginBottom: 3 }}>
            <Pill tone="neutral">{speakers} speakers</Pill>
          </div>
          <div
            style={{
              fontSize: 12,
              color: t.textMuted,
              lineHeight: 1.4,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {preview}
          </div>
        </div>
        {!multiSelect && <Icon.ChevronRight s={14} c={t.textFaint} />}
      </div>
      {!isLast && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: multiSelect ? 72 : 52,
            right: 14,
            height: 1,
            background: t.hairline,
          }}
        />
      )}
    </div>
  );
}

export function HistoryScreen({
  empty = false,
  onBack,
  onSelectItem,
}: {
  empty?: boolean;
  onBack?: () => void;
  onSelectItem?: (historyId: string) => void;
}) {
  const t = useT();
  const { t: i18n } = useV2T();
  const { items, removeItems } = useV2HistoryStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [multiSelect, setMultiSelect] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);

  const groups = useMemo(() => {
    const g: Record<string, typeof items> = {};
    items.forEach((it) => {
      (g[it.date] ||= []).push(it);
    });
    return g;
  }, [items]);

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleDeletePress = useCallback(() => {
    if (selectedIds.size > 0) setPendingDelete(true);
  }, [selectedIds.size]);

  const handleConfirmDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      try {
        await invoke("delete_audio", { filename: `recording-${id}.webm` });
      } catch {
        // ignore missing files
      }
    }
    removeItems(ids);
    try {
      await deleteTranscripts(ids);
    } catch (firstError) {
      console.error("Failed to delete transcripts, retrying", firstError);
      try {
        await deleteTranscripts(ids);
      } catch (secondError) {
        console.error("Retry failed", secondError);
      }
    }
    setSelectedIds(new Set());
    setMultiSelect(false);
    setPendingDelete(false);
  }, [removeItems, selectedIds]);

  const handleCancelDelete = useCallback(() => setPendingDelete(false), []);

  const handleTrashPress = useCallback(() => {
    if (multiSelect && selectedIds.size > 0) handleDeletePress();
    else setMultiSelect(true);
  }, [multiSelect, selectedIds.size, handleDeletePress]);

  const handleCancelMultiSelect = useCallback(() => {
    setMultiSelect(false);
    setSelectedIds(new Set());
  }, []);

  const deleteLabel = useMemo(
    () =>
      selectedIds.size > 0
        ? i18n("v2_history_btn_delete_count", { count: selectedIds.size })
        : i18n("v2_history_btn_delete_selected"),
    [selectedIds.size, i18n],
  );

  const confirmTitle = useMemo(
    () => i18n("v2_history_confirm_title", { count: selectedIds.size }),
    [selectedIds.size, i18n],
  );

  // Bottom padding for the list when action bar is visible
  const listBottomPadding = multiSelect
    ? "calc(76px + env(safe-area-inset-bottom))"
    : "calc(8px + env(safe-area-inset-bottom))";

  return (
    <ScreenLayout>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 12px 6px",
        }}
      >
        <div
          onClick={onBack}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: t.surface,
            boxShadow: VT.ring(t),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: onBack ? "pointer" : "default",
          }}
        >
          <Icon.ChevronLeft c={t.text} s={18} />
        </div>
        <div
          onClick={handleTrashPress}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: t.surface,
            boxShadow: VT.ring(t),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Icon.Trash c={t.textMuted} s={16} />
        </div>
      </div>

      {/* Title */}
      <div style={{ padding: "4px 20px 14px" }}>
        <div
          style={{
            fontFamily: VT.fontDisplay,
            fontSize: 32,
            fontWeight: 600,
            color: t.text,
            letterSpacing: -1.28,
            lineHeight: 1.1,
          }}
        >
          {i18n("v2_history_title")}
        </div>
        <div
          style={{
            fontSize: 12,
            color: t.textDim,
            marginTop: 4,
            fontWeight: 500,
            fontFamily: VT.fontMono,
            letterSpacing: 0.3,
            textTransform: "uppercase",
          }}
        >
          {i18n("v2_history_sessions", { count: items.length })}
        </div>
      </div>

      {empty || items.length === 0 ? (
        <EmptyState
          icon={<Icon.Clock c={t.textMuted} s={26} />}
          iconSize={64}
          title={i18n("v2_history_empty_title")}
          subtitle={i18n("v2_history_empty_body")}
        />
      ) : (
        <div
          style={{
            padding: `0 16px ${listBottomPadding}`,
            flex: 1,
            overflowY: "auto",
          }}
        >
          {Object.entries(groups).map(([date, arr]) => (
            <div key={date} style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: 0.8,
                  color: t.textDim,
                  textTransform: "uppercase",
                  padding: "0 4px 8px",
                  fontFamily: VT.fontMono,
                }}
              >
                {date}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: t.surface,
                  borderRadius: 12,
                  boxShadow: VT.ring(t),
                  overflow: "hidden",
                }}
              >
                {arr.map((it, i) => (
                  <HistoryRow
                    key={it.id}
                    {...it}
                    multiSelect={multiSelect}
                    selected={selectedIds.has(it.id)}
                    isLast={i === arr.length - 1}
                    onPress={() => onSelectItem?.(it.id)}
                    onToggle={() => toggleItem(it.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action bar — pinned to device bottom */}
      {multiSelect && (
        <ActionBar>
          <div
            onClick={handleCancelMultiSelect}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 8,
              background: t.surface,
              boxShadow: VT.ring(t),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 500,
              color: t.text,
              letterSpacing: -0.2,
              cursor: "pointer",
            }}
          >
            {i18n("v2_history_btn_cancel")}
          </div>
          <div
            onClick={selectedIds.size > 0 ? handleDeletePress : undefined}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 8,
              background: selectedIds.size > 0 ? VT.error : t.surfaceAlt,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 14,
              fontWeight: 500,
              color: selectedIds.size > 0 ? "#fff" : t.textDim,
              letterSpacing: -0.2,
              cursor: selectedIds.size > 0 ? "pointer" : "default",
            }}
          >
            <Icon.Trash c={selectedIds.size > 0 ? "#fff" : t.textDim} s={14} />
            {deleteLabel}
          </div>
        </ActionBar>
      )}

      <ConfirmDialog
        isOpen={pendingDelete}
        onDismiss={handleCancelDelete}
        icon={<Icon.Trash c={VT.error} s={20} />}
        title={confirmTitle}
        body={i18n("v2_history_confirm_body")}
        confirmLabel={i18n("v2_history_confirm_delete")}
        destructive
        onConfirm={handleConfirmDelete}
      />
    </ScreenLayout>
  );
}
