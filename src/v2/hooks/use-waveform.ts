import { useState, useEffect } from "react";

const BASE_HEIGHTS = [8, 14, 22, 10, 18, 28, 12, 20, 8, 16, 24, 14, 10, 20, 8, 16, 22, 10];
const FLAT = BASE_HEIGHTS.map(() => 4);

// Drives simulated waveform bar heights when active.
// Uses setInterval + CSS transition instead of rAF to avoid 60fps setState.
export function useWaveform(isActive: boolean): number[] {
  const [heights, setHeights] = useState(FLAT);

  useEffect(() => {
    if (!isActive) {
      setHeights(FLAT);
      return;
    }
    const id = setInterval(() => {
      setHeights(BASE_HEIGHTS.map((base) => base * (0.2 + Math.random() * 1.3)));
    }, 120);
    return () => clearInterval(id);
  }, [isActive]);

  return heights;
}
