import { ALL_AVAILABLE_LANGUAGES } from "@/tokens/languages";
import type { V2HistoryItem } from "@/store/v2-history-store";

export interface CommittedRow {
  id: string;
  speaker: string;
  lang: string;
  origText: string;
  transText: string;
  endMs: number;
}

export function formatRelativeDate(d: Date): string {
  const target = new Date(d);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((now.getTime() - target.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDur(ms: number): string {
  const s = Math.floor(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
}

function buildItem(
  langs: string[],
  speakerSet: Set<string>,
  preview: string,
  durMs: number,
  sessionStartMs: number,
): V2HistoryItem {
  const flags = langs.map(
    (code) =>
      ALL_AVAILABLE_LANGUAGES.find((l) => l.code === code)?.flag ?? "🌐",
  );
  const sessionStart = new Date(sessionStartMs);
  return {
    id: crypto.randomUUID(),
    date: formatRelativeDate(new Date(sessionStartMs)),
    time: sessionStart.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    flags: flags.length > 0 ? flags : ["🌐"],
    speakers: speakerSet.size || 1,
    preview: preview ? `"${preview}"` : "",
    dur: formatDur(durMs),
  };
}

export function buildHistoryFromSnapshot(
  rows: CommittedRow[],
  sessionStartMs: number,
): V2HistoryItem | null {
  if (rows.length === 0) return null;

  const langs = [...new Set(rows.map((r) => r.lang).filter(Boolean))];
  const speakerSet = new Set(rows.map((r) => r.speaker).filter(Boolean));
  const preview = rows[0]?.transText ?? "";
  const lastEndMs = rows[rows.length - 1]?.endMs ?? 0;
  const durMs = lastEndMs > 0 ? lastEndMs : Date.now() - sessionStartMs;

  return buildItem(langs, speakerSet, preview, durMs, sessionStartMs);
}
