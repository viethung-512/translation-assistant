import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface V2HistoryItem {
  id: string;
  date: string;
  time: string;
  flags: string[];
  speakers: number;
  preview: string;
  dur: string;
}

interface V2HistoryState {
  items: V2HistoryItem[];
  addItem: (item: V2HistoryItem) => void;
  removeItems: (ids: string[]) => void;
}

export const useV2HistoryStore = create<V2HistoryState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((s) => ({ items: [item, ...s.items] })),
      removeItems: (ids) =>
        set((s) => ({ items: s.items.filter((it) => !ids.includes(it.id)) })),
    }),
    { name: "v2-history" },
  ),
);
