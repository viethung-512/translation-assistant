import React from "react";
import { Box, Flex, Text } from "@radix-ui/themes";
import { IconMicPlaceholder } from "@/components/icons";
import { Badge } from "@/components/ui";
import SpeakerLabel from "../speaker-label";
import { getLanguage } from "@/utils/speaker-colors";

interface Token {
  text: string;
  is_final: boolean;
  speaker?: string;
  language?: string;
  translation_status?: "none" | "original" | "translation";
}

interface RendererProps {
  originalTokens: readonly Token[];
  translatedTokens: readonly Token[];
  placeholder?: string;
}

// Renders a sequence of tokens with speaker/language labels and final vs interim styling.
function TokenBlock({ tokens, textSize, italic, showSpeakerLabel = true }: {
  tokens: readonly Token[];
  textSize?: "1" | "2" | "3" | "4" | "5";
  italic?: boolean;
  showSpeakerLabel?: boolean;
}) {
  let lastSpeaker: string | undefined;
  let lastLanguage: string | undefined;

  return (
    <>
      {tokens.map((token, idx) => {
        const isNewSpeaker = token.speaker && token.speaker !== lastSpeaker;
        const isNewLanguage = token.language && token.language !== lastLanguage;

        lastSpeaker = token.speaker;
        lastLanguage = token.language;

        return (
          <React.Fragment key={`token-${idx}`}>
            {showSpeakerLabel && isNewSpeaker && token.speaker && (
              <SpeakerLabel speakerNumber={token.speaker} />
            )}
            {isNewLanguage && !isNewSpeaker && <br />}
            {isNewLanguage && (
              <Badge color="gray" mr="1">{getLanguage(token.language!).name}</Badge>
            )}
            <Text
              as="span"
              size={textSize}
              color={token.is_final ? undefined : "gray"}
              style={italic ? { fontStyle: "italic" } : undefined}
            >
              {token.text}
            </Text>
          </React.Fragment>
        );
      })}
    </>
  );
}

// Pretty-displays translated tokens (large) and original tokens (small italic) in a unified view.
export default function Renderer({ originalTokens, translatedTokens, placeholder }: RendererProps) {
  const isEmpty = originalTokens.length === 0 && translatedTokens.length === 0;

  if (isEmpty) {
    return (
      <Flex direction="column" align="center" justify="center" height="100%" gap="3"
        style={{ paddingBottom: 24 }}
      >
        <IconMicPlaceholder />
        <Text color="gray" align="center" size="2">{placeholder}</Text>
      </Flex>
    );
  }

  const hasBoth = translatedTokens.length > 0 && originalTokens.length > 0;

  return (
    <Box>
      {/* Translated text — primary, larger font */}
      {translatedTokens.length > 0 && (
        <Box mb={hasBoth ? "3" : "0"}>
          <TokenBlock tokens={translatedTokens} textSize="4" />
        </Box>
      )}

      {/* Divider between translated and original */}
      {hasBoth && (
        <Box
          style={{
            height: 1,
            background: "var(--gray-4)",
            marginBottom: 10,
          }}
        />
      )}

      {/* Original text — secondary, small italic */}
      {originalTokens.length > 0 && (
        <Box>
          <TokenBlock
            tokens={originalTokens}
            textSize="2"
            italic
            showSpeakerLabel={false}
          />
        </Box>
      )}
    </Box>
  );
}
