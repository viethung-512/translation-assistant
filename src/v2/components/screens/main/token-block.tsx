import { useT } from "@/v2/tokens/tokens";
import { detectFlagCode } from "@/v2/utils/helper";
import { RealtimeToken } from "@soniox/client";
import { FC, Fragment } from "react";
import { LangTag } from "../../ui/primitives";
import { SpeakerLabel } from "../shared/speaker-label";

type TokenBlockProps = {
  tokens: RealtimeToken[];
  blockType: "original" | "translation";
};

const END_SENTENCE_CHARACTERS = [",", ".", "?", "!", ":", ";"];
const MAX_TOTAL_CHARACTERS = 50;

export const TokenBlock: FC<TokenBlockProps> = ({ tokens, blockType }) => {
  const t = useT();
  let lastSpeaker: string | undefined;
  let lastLanguage: string | undefined;
  let currentText: string = "";

  return (
    <>
      {tokens
        .filter(({ translation_status: s }) =>
          blockType === "translation"
            ? s === "translation"
            : s === "original" || s === "none" || s === null,
        )
        .map(({ speaker, language, text, is_final }, idx) => {
          const isNewSpeaker = speaker && speaker !== lastSpeaker;
          const isNewLanguage = language && language !== lastLanguage;
          let shouldBreakNewLine = isNewSpeaker || isNewLanguage; // TODO: Add more condition here

          currentText += text;
          if (
            END_SENTENCE_CHARACTERS.some((c) => text.endsWith(c)) &&
            currentText.length >= MAX_TOTAL_CHARACTERS
          ) {
            console.log({ currentText, text });
            // reset currentText
            currentText = "";
            shouldBreakNewLine = true;
          }

          const shouldRenderSpeaker =
            speaker && shouldBreakNewLine && blockType === "translation";

          lastSpeaker = speaker;
          lastLanguage = language;
          const { flag, code } = detectFlagCode(language);
          const typographyColor = !is_final
            ? t.textFaint
            : blockType === "translation"
              ? t.cyanText
              : t.textMuted;

          return (
            <Fragment key={`token-${speaker}-${idx}`}>
              {shouldRenderSpeaker && <SpeakerLabel idx={speaker} />}
              {shouldBreakNewLine && <br />}
              {isNewLanguage && <LangTag flag={flag} code={code} />}
              <span
                style={{
                  color: typographyColor,
                  ...(blockType === "original" && {
                    fontStyle: "italic",
                    fontSize: 11,
                  }),
                  ...(blockType === "translation" && {
                    fontWeight: "bold",
                    fontSize: 16,
                  }),
                }}
              >
                {text}
              </span>
            </Fragment>
          );
        })}
    </>
  );
};
