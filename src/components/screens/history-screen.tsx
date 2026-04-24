import { useState, useMemo, useCallback } from "react";
import { useT, VT } from "@/tokens/tokens";
import { Typography } from "@/components/ui/typography";
import { Icon } from "@/components/icons";
import { Card } from "@/components/ui/primitives";
import { ScreenLayout } from "@/components/ui/screen-layout";
import { Button } from "@/components/ui/button";
import { ActionBar } from "@/components/ui/action-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteTranscripts } from "@/storage/transcript-idb";
import {
  useV2HistoryStore,
  type V2HistoryItem,
} from "@/store/v2-history-store";
import { useV2T } from "@/i18n";

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
  const { t: i18n } = useV2T();
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
          padding: "14px 12px",
        }}
      >
        {multiSelect && (
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 999,
              flexShrink: 0,
              background: selected ? VT.cyan : "transparent",
              border: `2px solid ${selected ? VT.cyan : t.divider}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {selected && <Icon.Check c={t.navy} s={14} />}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          {flags.slice(0, 4).map((f, i) => (
            <div
              key={i}
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                background: t.surfaceAlt,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                marginLeft: i === 0 ? 0 : -10,
                border: `2px solid ${t.card}`,
                zIndex: 10 - i,
              }}
            >
              {f}
            </div>
          ))}
          {flags.length > 4 && (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                background: t.surfaceAlt,
                color: t.textMuted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                marginLeft: -10,
                border: `2px solid ${t.card}`,
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
              marginBottom: 2,
            }}
          >
            <Typography variant="label">{time}</Typography>
            <div
              style={{
                fontSize: 11,
                color: t.textDim,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {dur}
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: VT.cyan,
              letterSpacing: 0.3,
              marginBottom: 2,
            }}
          >
            {i18n("v2_history_speakers", { count: speakers })}
          </div>
          <div
            style={{
              fontSize: 13,
              color: t.textMuted,
              lineHeight: 1.35,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {preview}
          </div>
        </div>
        {!multiSelect && <Icon.ChevronRight s={16} c={t.textFaint} />}
      </div>
      {!isLast && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: multiSelect ? 94 : 68,
            right: 12,
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
    removeItems(ids);
    try {
      await deleteTranscripts(ids);
    } catch (firstError) {
      console.error("Failed to delete transcript bodies, retrying once", firstError);
      try {
        await deleteTranscripts(ids);
      } catch (secondError) {
        console.error("Retry failed while deleting transcript bodies", secondError);
      }
    }
    setSelectedIds(new Set());
    setMultiSelect(false);
    setPendingDelete(false);
  }, [removeItems, selectedIds]);

  const handleCancelDelete = useCallback(() => setPendingDelete(false), []);

  const handleTrashPress = useCallback(() => {
    if (multiSelect) handleDeletePress();
    else setMultiSelect(true);
  }, [multiSelect, handleDeletePress]);

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

  return (
    <ScreenLayout>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 16px 8px",
        }}
      >
        <div
          onClick={onBack}
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: t.card,
            border: `1px solid ${t.divider}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: onBack ? "pointer" : "default",
          }}
        >
          <Icon.ChevronLeft c={t.text} />
        </div>
        <div
          onClick={handleTrashPress}
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: t.card,
            border: `1px solid ${t.divider}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Icon.Trash c={VT.error} s={20} />
        </div>
      </div>

      <div style={{ padding: "4px 20px 6px" }}>
        <Typography variant="display">{i18n("v2_history_title")}</Typography>
        <div
          style={{
            fontSize: 13,
            color: t.textDim,
            marginTop: 4,
            fontWeight: 500,
          }}
        >
          {i18n("v2_history_sessions", { count: items.length })}
        </div>
      </div>

      {empty || items.length === 0 ? (
        <EmptyState
          icon={<Icon.Clock c={VT.cyan} s={42} />}
          iconSize={96}
          title={i18n("v2_history_empty_title")}
          subtitle={i18n("v2_history_empty_body")}
        />
      ) : (
        <div style={{ padding: "14px 16px calc(8px + env(safe-area-inset-bottom))" }}>
          {Object.entries(groups).map(([date, arr]) => (
            <div key={date} style={{ marginBottom: 16 }}>
              <Typography variant="caption" style={{ padding: "0 8px 8px" }}>
                {date}
              </Typography>
              <Card style={{ padding: 4 }}>
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
              </Card>
            </div>
          ))}
        </div>
      )}

      {multiSelect && (
        <ActionBar>
          <Button
            variant="outlined"
            label={i18n("v2_history_btn_cancel")}
            flex={1}
            onPress={handleCancelMultiSelect}
          />
          <Button
            variant="destructive"
            icon={<Icon.Trash />}
            label={deleteLabel}
            flex={1}
            onPress={handleDeletePress}
          />
        </ActionBar>
      )}

      <ConfirmDialog
        isOpen={pendingDelete}
        onDismiss={handleCancelDelete}
        icon={<Icon.Trash c={VT.error} s={24} />}
        title={confirmTitle}
        body={i18n("v2_history_confirm_body")}
        confirmLabel={i18n("v2_history_confirm_delete")}
        destructive
        onConfirm={handleConfirmDelete}
      />
    </ScreenLayout>
  );
}
