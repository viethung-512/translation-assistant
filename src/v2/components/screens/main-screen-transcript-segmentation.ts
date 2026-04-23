export const ROW_WORD_SPLIT_THRESHOLD = 18;

interface TokenLike {
  text: string;
  is_final: boolean;
  speaker?: string;
  language?: string;
  end_ms?: number;
}

type TokenStream = "original" | "translated";

interface TimelineToken {
  token: TokenLike;
  stream: TokenStream;
  sourceIndex: number;
}

export interface SegmentedTranscriptRow {
  rowKey: string;
  speaker: string;
  language: string;
  endMs: number;
  isActive: boolean;
  originalTokens: TokenLike[];
  translatedTokens: TokenLike[];
}

export interface BuildTranscriptRowsInput {
  originalTokens: readonly TokenLike[];
  translatedTokens: readonly TokenLike[];
}

function countWords(text: string): number {
  const words = text.trim().match(/\S+/g);
  return words?.length ?? 0;
}

function normalizeSpeaker(rawSpeaker?: string): string {
  if (!rawSpeaker) return "unknown";
  const trimmed = rawSpeaker.trim();
  return trimmed.length > 0 ? trimmed : "unknown";
}

function buildTimelineTokens({
  originalTokens,
  translatedTokens,
}: BuildTranscriptRowsInput): TimelineToken[] {
  const timeline: TimelineToken[] = [];
  for (let i = 0; i < originalTokens.length; i += 1) {
    timeline.push({
      token: originalTokens[i],
      stream: "original",
      sourceIndex: i,
    });
  }
  for (let i = 0; i < translatedTokens.length; i += 1) {
    timeline.push({
      token: translatedTokens[i],
      stream: "translated",
      sourceIndex: i,
    });
  }

  timeline.sort((a, b) => {
    const aEnd = a.token.end_ms;
    const bEnd = b.token.end_ms;
    if (aEnd != null && bEnd != null && aEnd !== bEnd) return aEnd - bEnd;
    if (aEnd == null && bEnd != null) return 1;
    if (aEnd != null && bEnd == null) return -1;
    if (a.sourceIndex !== b.sourceIndex) return a.sourceIndex - b.sourceIndex;
    if (a.stream === b.stream) return 0;
    return a.stream === "original" ? -1 : 1;
  });

  return timeline;
}

function hasRowContent(row: SegmentedTranscriptRow): boolean {
  return row.originalTokens.length > 0 || row.translatedTokens.length > 0;
}

export function buildTranscriptRows(
  input: BuildTranscriptRowsInput,
): SegmentedTranscriptRow[] {
  const timeline = buildTimelineTokens(input);
  const rows: SegmentedTranscriptRow[] = [];

  let currentRow: SegmentedTranscriptRow | null = null;
  let rowWordCount = 0;
  let rowCounter = 0;

  const pushCurrentRow = () => {
    if (!currentRow || !hasRowContent(currentRow)) return;
    rows.push(currentRow);
  };

  for (const event of timeline) {
    const speaker = normalizeSpeaker(event.token.speaker);
    const tokenWordCount = countWords(event.token.text);

    const needsNewRow =
      currentRow == null ||
      currentRow.speaker !== speaker ||
      rowWordCount >= ROW_WORD_SPLIT_THRESHOLD;

    if (needsNewRow) {
      pushCurrentRow();
      rowCounter += 1;
      rowWordCount = 0;
      currentRow = {
        rowKey: `${speaker}-${rowCounter}`,
        speaker,
        language: event.token.language ?? "",
        endMs: event.token.end_ms ?? 0,
        isActive: !event.token.is_final,
        originalTokens: [],
        translatedTokens: [],
      };
    }

    if (!currentRow) continue;

    if (event.stream === "original") currentRow.originalTokens.push(event.token);
    else currentRow.translatedTokens.push(event.token);

    if (!currentRow.language && event.token.language) {
      currentRow.language = event.token.language;
    }
    if ((event.token.end_ms ?? 0) > currentRow.endMs) {
      currentRow.endMs = event.token.end_ms ?? currentRow.endMs;
    }
    currentRow.isActive = currentRow.isActive || !event.token.is_final;
    rowWordCount += tokenWordCount;
  }

  pushCurrentRow();
  return rows;
}
