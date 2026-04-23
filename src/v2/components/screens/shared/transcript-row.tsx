import { LangTag } from "@/v2/components/ui/primitives";
import { useT } from "@/v2/tokens/tokens";
import { detectFlagCode } from "@/v2/utils/helper";
import React from "react";
import { SpeakerLabel } from "./speaker-label";

export type TranscriptToken = {
  text: string;
  is_final: boolean;
  speaker?: string;
  language?: string;
  translation_status?: "none" | "original" | "translation";
  end_ms?: number;
};

export type TranscriptRowHistoryStrings = {
  variant: "history";
  s: number;
  flag: string;
  code: string;
  time: string;
  translatedText: string;
  originalText: string;
  isLast?: boolean;
};

export type TranscriptRowLiveTokens = {
  variant: "live";
  originalTokens: readonly TranscriptToken[];
  translatedTokens: readonly TranscriptToken[];
  speaker?: string;
  language?: string;
  endMs?: number;
};

export type TranscriptRowProps =
  | TranscriptRowHistoryStrings
  | TranscriptRowLiveTokens;

function renderTokens(
  tokens: readonly TranscriptToken[],
  variant: "orig" | "trans",
  t: ReturnType<typeof useT>,
): React.ReactNode {
  return tokens.map((token, idx) => {
    const color = !token.is_final
      ? t.textFaint
      : variant === "trans"
        ? t.cyanText
        : t.textMuted;

    return (
      <React.Fragment key={idx}>
        <span
          style={{
            color,
            fontStyle: variant === "orig" ? "italic" : undefined,
            ...(variant === "trans" && { fontSize: 18 }),
          }}
        >
          {token.text}
        </span>
      </React.Fragment>
    );
  });
}

export function TranscriptRow(props: TranscriptRowProps) {
  const t = useT();

  if (props.variant === "history") {
    const { s, flag, code, time, translatedText, originalText, isLast } = props;

    return (
      <div style={{ padding: "10px 16px", position: "relative" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 4,
              }}
            >
              <SpeakerLabel idx={s} />
              <LangTag flag={flag} code={code} />
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  color: t.textDim,
                  fontWeight: 600,
                }}
              >
                {time}
              </span>
            </div>

            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                lineHeight: 1.3,
                letterSpacing: -0.2,
              }}
            >
              {translatedText ? (
                <span style={{ color: t.cyanText, fontSize: 18 }}>
                  {translatedText}
                </span>
              ) : null}
            </div>
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.35,
                letterSpacing: -0.1,
                marginBottom: 4,
              }}
            >
              {originalText ? (
                <span
                  style={{
                    color: t.textMuted,
                    fontStyle: "italic",
                  }}
                >
                  {originalText}
                </span>
              ) : null}
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

  const { originalTokens, translatedTokens, speaker, language, endMs } = props;

  const speakerStr = speaker ?? originalTokens[0]?.speaker;
  const numericSpeaker = Number.parseInt(speakerStr ?? "", 10);
  const hasNumericSpeaker =
    Number.isFinite(numericSpeaker) && numericSpeaker > 0;
  const s = hasNumericSpeaker ? Math.max(0, numericSpeaker - 1) : 0;
  const { flag, code } = detectFlagCode(
    language ?? originalTokens[0]?.language,
  );

  const lastWithTime = [...originalTokens, ...translatedTokens]
    .slice()
    .reverse()
    .find((tok) => tok.end_ms != null);
  const rowEndMs = endMs ?? lastWithTime?.end_ms;
  const time =
    rowEndMs != null
      ? (() => {
          const sec = Math.floor(rowEndMs / 1000);
          return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
        })()
      : "–";

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 10,
        background: "transparent",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 6,
            }}
          >
            <SpeakerLabel idx={s} />
            <LangTag flag={flag} code={code} />
            <span
              style={{
                marginLeft: "auto",
                fontSize: 11,
                color: t.textDim,
                fontWeight: 600,
              }}
            >
              {time}
            </span>
          </div>

          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: -0.2,
            }}
          >
            {renderTokens(translatedTokens, "trans", t)}
          </div>
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.35,
              letterSpacing: -0.1,
              marginBottom: 4,
            }}
          >
            {renderTokens(originalTokens, "orig", t)}
          </div>
        </div>
      </div>
    </div>
  );
}
