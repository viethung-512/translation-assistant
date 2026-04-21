import { create } from "zustand";

export interface V2HistoryItem {
  id: string;
  date: string;
  time: string;
  flags: string[];
  speakers: number;
  preview: string;
  dur: string;
}

const SEED: V2HistoryItem[] = [
  {
    id: "1",
    date: "Today",
    time: "2:14 PM",
    flags: ["🇺🇸", "🇻🇳", "🇯🇵"],
    speakers: 3,
    preview: '"Hand me the torque wrench from the tool cart."',
    dur: "4m 12s",
  },
  {
    id: "2",
    date: "Today",
    time: "11:32 AM",
    flags: ["🇺🇸", "🇨🇳"],
    speakers: 2,
    preview: '"Check conveyor belt alignment on line 3."',
    dur: "2m 08s",
  },
  {
    id: "3",
    date: "Yesterday",
    time: "4:47 PM",
    flags: ["🇺🇸", "🇻🇳", "🇰🇷", "🇯🇵"],
    speakers: 4,
    preview: '"Safety inspection for press B complete."',
    dur: "6m 51s",
  },
  {
    id: "4",
    date: "Yesterday",
    time: "9:15 AM",
    flags: ["🇯🇵", "🇺🇸"],
    speakers: 2,
    preview: '"圧力計の値を確認してください。"',
    dur: "1m 44s",
  },
  {
    id: "5",
    date: "Apr 17",
    time: "3:02 PM",
    flags: ["🇺🇸", "🇰🇷", "🇻🇳", "🇨🇳", "🇹🇭"],
    speakers: 6,
    preview: '"Weld seam on unit 42 needs rework."',
    dur: "3m 29s",
  },
];

interface V2HistoryState {
  items: V2HistoryItem[];
  removeItems: (ids: string[]) => void;
}

export const useV2HistoryStore = create<V2HistoryState>()((set) => ({
  items: SEED,
  removeItems: (ids) =>
    set((s) => ({ items: s.items.filter((it) => !ids.includes(it.id)) })),
}));
