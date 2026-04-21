import React, { useState, useCallback } from "react";
import { useT, VT } from "@/v2/tokens/tokens";
import { Typography } from "@/v2/components/ui/typography";
import { Icon } from "@/v2/components/icons";
import { SpeakerAvatar } from "@/v2/components/ui/primitives";
import { ScreenLayout } from "@/v2/components/ui/screen-layout";
import { Button } from "@/v2/components/ui/button";
import { TextField } from "@/v2/components/ui/text-input";
import { ActionBar } from "@/v2/components/ui/action-bar";
import { useV2T } from "@/v2/i18n";

const TRANSCRIPT = [
  {
    s: 0,
    name: "John",
    flag: "🇺🇸",
    code: "EN",
    orig: "Hand me the torque wrench from the tool cart.",
    trans: "Đưa cho tôi cờ lê lực từ xe đẩy dụng cụ.",
    time: "2:14",
  },
  {
    s: 1,
    name: "Speaker 2",
    flag: "🇻🇳",
    code: "VI",
    orig: "Cái nào? Loại 10 hay 14 milimet?",
    trans: "Which one? The 10 or 14 millimeter?",
    time: "2:14",
  },
  {
    s: 2,
    name: "Speaker 3",
    flag: "🇯🇵",
    code: "JA",
    orig: "圧力計の値は8バールです",
    trans: "The pressure gauge reads 8 bar.",
    time: "2:15",
  },
  {
    s: 0,
    name: "John",
    flag: "🇺🇸",
    code: "EN",
    orig: "The 14 millimeter. Check line 3 alignment next.",
    trans: "Loại 14mm. Kiểm tra căn chỉnh dây chuyền 3.",
    time: "2:15",
  },
  {
    s: 3,
    name: "Speaker 4",
    flag: "🇰🇷",
    code: "KO",
    orig: "3번 라인 정렬 확인 완료했습니다.",
    trans: "Line 3 alignment check complete.",
    time: "2:16",
  },
  {
    s: 1,
    name: "Speaker 2",
    flag: "🇻🇳",
    code: "VI",
    orig: "Tốt. Báo cáo ca tiếp theo.",
    trans: "Good. Report on the next shift.",
    time: "2:16",
  },
];

function FilterChip({
  active,
  s,
  children,
}: {
  active?: boolean;
  s?: number;
  children: React.ReactNode;
}) {
  const t = useT();
  const sColor = s !== undefined ? VT.s[s] : null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
        padding: "8px 14px",
        borderRadius: 999,
        background: active ? (t.mode === "dark" ? VT.cyan : t.text) : t.card,
        color: active ? (t.mode === "dark" ? t.navy : "#fff") : t.text,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: -0.1,
        border: active ? "none" : `1px solid ${t.divider}`,
      }}
    >
      {sColor && (
        <div
          style={{ width: 8, height: 8, borderRadius: 999, background: sColor }}
        />
      )}
      {children}
    </div>
  );
}

function DetailRow({
  s,
  name,
  flag,
  code,
  orig,
  trans,
  time,
  isLast,
}: (typeof TRANSCRIPT)[0] & { isLast?: boolean }) {
  const t = useT();
  return (
    <div style={{ padding: "10px 16px", position: "relative" }}>
      <div style={{ display: "flex", gap: 12 }}>
        <SpeakerAvatar idx={s} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: t.text,
                letterSpacing: -0.2,
              }}
            >
              {name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13 }}>{flag}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: t.textDim,
                  letterSpacing: 0.4,
                }}
              >
                {code}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: t.textDim,
                  fontWeight: 600,
                  marginLeft: 4,
                }}
              >
                {time}
              </span>
            </div>
          </div>
          <Typography variant="body">{orig}</Typography>
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: t.mode === "dark" ? t.cyanText : "#00A8CC",
              lineHeight: 1.3,
              letterSpacing: -0.15,
              marginTop: 3,
            }}
          >
            {trans}
          </div>
        </div>
      </div>
      {!isLast && (
        <div
          style={{
            height: 1,
            background: t.hairline,
            marginTop: 10,
            marginLeft: 50,
          }}
        />
      )}
    </div>
  );
}

export function DetailScreen({ onBack }: { onBack?: () => void }) {
  const t = useT();
  const { t: i18n } = useV2T();
  const [renaming, setRenaming] = useState(false);

  const handleBack = useCallback(() => onBack?.(), [onBack]);
  const handleStopPropagation = useCallback(
    (e: React.MouseEvent) => e.stopPropagation(),
    [],
  );

  return (
    <ScreenLayout>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 12px 12px",
        }}
      >
        <div
          onClick={handleBack}
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: onBack ? "pointer" : "default",
          }}
        >
          <Icon.ChevronLeft c={t.text} />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: t.text,
              letterSpacing: -0.3,
            }}
          >
            Today, 2:14 PM
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 2,
            }}
          >
            {["🇺🇸", "🇻🇳", "🇯🇵", "🇰🇷"].map((f, i) => (
              <span key={i} style={{ fontSize: 13 }}>
                {f}
              </span>
            ))}
            <span
              style={{
                fontSize: 11,
                color: t.textDim,
                fontWeight: 700,
                marginLeft: 4,
                letterSpacing: 0.3,
              }}
            >
              EN · VI · JA · KO
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "0 16px 12px",
          overflowX: "auto",
          flexShrink: 0,
        }}
      >
        <FilterChip active>{i18n("v2_detail_filter_all")}</FilterChip>
        <FilterChip s={0}>John</FilterChip>
        <FilterChip s={1}>Speaker 2</FilterChip>
        <FilterChip s={2}>Speaker 3</FilterChip>
        <FilterChip s={3}>Speaker 4</FilterChip>
      </div>

      <div style={{ padding: "4px 0" }}>
        {TRANSCRIPT.map((r, i) => (
          <DetailRow key={i} {...r} isLast={i === TRANSCRIPT.length - 1} />
        ))}
      </div>

      <ActionBar>
        <Button
          variant="card"
          shape="rounded"
          icon={<Icon.Share s={17} />}
          label={i18n("v2_detail_share")}
          flex={1}
        />
        <Button
          variant="card"
          shape="rounded"
          icon={<Icon.Export s={17} />}
          label={i18n("v2_detail_export")}
          flex={1}
        />
      </ActionBar>

      {renaming && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(10,22,40,0.55)",
              zIndex: 100,
            }}
          />
          <div
            onClick={handleStopPropagation}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "calc(100% - 48px)",
              maxWidth: 382,
              background: t.card,
              borderRadius: 20,
              padding: "22px 20px 16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              border: t.mode === "dark" ? `1px solid ${t.hairline}` : "none",
              zIndex: 101,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <SpeakerAvatar idx={1} size={44} />
              <div>
                <Typography variant="subheading">
                  {i18n("v2_detail_rename_speaker")}
                </Typography>
                <Typography variant="hint" style={{ marginTop: 2 }}>
                  {i18n("v2_detail_rename_hint")}
                </Typography>
              </div>
            </div>
            <TextField
              value="Mai"
              focused
              placeholder={i18n("v2_detail_rename_placeholder")}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <Button
                variant="secondary"
                label={i18n("v2_detail_btn_cancel")}
                flex={1}
                height={48}
                onPress={() => setRenaming(false)}
              />
              <Button
                variant="primary"
                label={i18n("v2_detail_btn_save")}
                flex={1}
                height={48}
              />
            </div>
          </div>
        </>
      )}
    </ScreenLayout>
  );
}
