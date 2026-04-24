import { useState, useMemo, useCallback } from "react";
import { useT, VT } from "@/tokens/tokens";
import { Icon } from "@/components/icons";
import {
  ALL_AVAILABLE_LANGUAGES,
  COMMON_LANGS,
  type Language,
} from "@/tokens/languages";
import { BottomSheet } from "./bottom-sheet";
import { SearchInput } from "./text-input";
import { Typography } from "./typography";
import { useV2T } from "@/i18n";

function LangRow({
  flag,
  code,
  name,
  native,
  sel,
  onPress,
}: Language & { sel?: boolean; onPress?: () => void }) {
  const t = useT();
  return (
    <div
      onClick={onPress}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 10px",
        minHeight: 48,
        borderRadius: 8,
        background: sel ? t.surfaceAlt : "transparent",
        cursor: "pointer",
        margin: "0 8px",
      }}
    >
      <div style={{ fontSize: 22 }}>{flag}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: t.text, letterSpacing: -0.3 }}>
            {name}
          </div>
          <span
            style={{
              fontFamily: VT.fontMono,
              fontSize: 10,
              color: t.textDim,
              letterSpacing: 0.4,
              textTransform: "uppercase",
            }}
          >
            {code.toUpperCase()}
          </span>
        </div>
        <div style={{ fontSize: 12, color: t.textDim, marginTop: 1 }}>{native}</div>
      </div>
      {sel && <Icon.Check c={t.text} s={16} />}
    </div>
  );
}

interface LangSheetProps {
  isOpen: boolean;
  onDismiss: () => void;
  selectedCode?: string;
  onSelect: (code: string) => void;
}

export function LangSheet({
  isOpen,
  onDismiss,
  selectedCode = "en",
  onSelect,
}: LangSheetProps) {
  const t = useT();
  const { t: i18n } = useV2T();
  const [query, setQuery] = useState("");

  const title = useMemo(() => i18n("v2_lang_select_title"), [i18n]);

  const handleQueryChange = useCallback((v: string) => setQuery(v), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_AVAILABLE_LANGUAGES;
    return ALL_AVAILABLE_LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) || l.native.toLowerCase().includes(q),
    );
  }, [query]);

  const pick = useCallback(
    (code: string) => {
      onSelect(code);
      onDismiss();
    },
    [onSelect, onDismiss],
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      title={title}
      heightPercent={85}
    >
      <div style={{ padding: `0 ${t.spacing.xl}px 14px` }}>
        <SearchInput
          placeholder={i18n("v2_lang_search_placeholder")}
          value={query}
          onChange={handleQueryChange}
        />
      </div>

      {!query && (
        <>
          <div style={{ padding: `0 ${t.spacing.xl}px 6px` }}>
            <Typography variant="caption" style={{ marginBottom: 8 }}>
              {i18n("v2_lang_section_common")}
            </Typography>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: `0 ${t.spacing.xl}px 14px`,
              overflowX: "auto",
              flexShrink: 0,
            }}
          >
            {COMMON_LANGS.map((lang) => {
              const active = lang.code === selectedCode;
              return (
                <div
                  key={lang.code}
                  onClick={() => pick(lang.code)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    flexShrink: 0,
                    padding: "9px 14px",
                    borderRadius: 999,
                    background: active ? t.text : t.surface,
                    color: active ? (t.mode === "dark" ? "#000" : "#fff") : t.text,
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: -0.1,
                    boxShadow: active ? "none" : VT.ring(t),
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{lang.flag}</span>
                  {lang.name}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div style={{ padding: `0 ${t.spacing.xl}px 8px` }}>
        <Typography variant="caption">
          {query
            ? i18n("v2_lang_section_results")
            : i18n("v2_lang_section_all")}
        </Typography>
      </div>

      <div
        style={{ flex: 1, overflowY: "auto", padding: `0 ${t.spacing.md}px` }}
      >
        {filtered.map((lang) => (
          <LangRow
            key={lang.code}
            {...lang}
            sel={lang.code === selectedCode}
            onPress={() => pick(lang.code)}
          />
        ))}
      </div>
    </BottomSheet>
  );
}
