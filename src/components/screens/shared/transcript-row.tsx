import { LangTag } from "@/components/ui/primitives";
import { useT, VT } from "@/tokens/tokens";
import { detectFlagCode, generateRealtimeTokenKey } from "@/utils/helper";
import { SpeakerAvatar } from "../main-screen-helpers";
import { FC, Fragment, PropsWithChildren } from "react";

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

type TextWrapperProps = {
  variant: "orig" | "trans";
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
      <Fragment key={generateRealtimeTokenKey(token, idx)}>
        <span
          style={{
            color,
            fontStyle: variant === "orig" ? "italic" : undefined,
            ...(variant === "trans" && { fontSize: 18 }),
          }}
        >
          {token.text}
        </span>
      </Fragment>
    );
  });
}

const TranscriptWrapper: FC<PropsWithChildren<TextWrapperProps>> = ({
  variant,
  children,
}) => {
  const t = useT();

  if (variant === "orig") {
    return (
      <div
        style={{
          fontSize: 12,
          lineHeight: 1.35,
          letterSpacing: -0.1,
          marginBottom: 4,
        }}
      >
        {children}
      </div>
    );
  }
  return (
    <div
      style={{
        fontSize: 14,
        fontWeight: 500,
        color: t.text,
        lineHeight: 1.35,
        letterSpacing: -0.3,
      }}
    >
      {children}
    </div>
  );
};

function formatTime(ms: number): string {
  const sec = Math.floor(ms / 1000);
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

export function TranscriptRow(props: TranscriptRowProps) {
  const t = useT();

  if (props.variant === "history") {
    const { s, flag, code, time, translatedText, originalText, isLast } = props;
    return (
      <div style={{ padding: "12px 14px", position: "relative" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <SpeakerAvatar idx={s} size={28} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 3,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: t.textMuted,
                  fontFamily: VT.fontMono,
                  letterSpacing: 0.3,
                }}
              >
                SPEAKER {s + 1}
              </span>
              <LangTag flag={flag} code={code} />
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  color: t.textDim,
                  fontFamily: VT.fontMono,
                }}
              >
                {time}
              </span>
            </div>
            <TranscriptWrapper variant="trans">
              {translatedText}
            </TranscriptWrapper>
            <TranscriptWrapper variant="orig">{originalText}</TranscriptWrapper>
          </div>
        </div>
        {!isLast && (
          <div
            style={{
              height: 1,
              background: t.hairline,
              marginTop: 10,
              marginLeft: 38,
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
  const time = rowEndMs != null ? formatTime(rowEndMs) : "–";

  return (
    <div style={{ padding: "12px 14px", position: "relative" }}>
      <div style={{ display: "flex", gap: 10 }}>
        <SpeakerAvatar idx={s} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 3,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: t.textMuted,
                fontFamily: VT.fontMono,
                letterSpacing: 0.3,
              }}
            >
              SPEAKER {s + 1}
            </span>
            <LangTag flag={flag} code={code} />
            <span
              style={{
                marginLeft: "auto",
                fontSize: 11,
                color: t.textDim,
                fontFamily: VT.fontMono,
              }}
            >
              {time}
            </span>
          </div>
          <TranscriptWrapper variant="trans">
            {renderTokens(translatedTokens, "trans", t)}
          </TranscriptWrapper>
          <TranscriptWrapper variant="orig">
            {renderTokens(originalTokens, "orig", t)}
          </TranscriptWrapper>
        </div>
      </div>
    </div>
  );
}
