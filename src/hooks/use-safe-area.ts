// src/hooks/useSafeArea.ts
import { useState, useEffect } from "react";

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const getCSSInset = (side: string): number => {
  const el = document.createElement("div");
  el.style.cssText = `
    position: fixed;
    padding-${side}: env(safe-area-inset-${side});
    visibility: hidden;
    pointer-events: none;
  `;
  document.body.appendChild(el);
  const value = parseFloat(
    getComputedStyle(el)[
      `padding${side.charAt(0).toUpperCase() + side.slice(1)}` as any
    ],
  );
  document.body.removeChild(el);
  return isNaN(value) ? 0 : value;
};

export const useSafeArea = (): SafeAreaInsets => {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const update = () => {
      setInsets({
        top: getCSSInset("top"),
        bottom: getCSSInset("bottom"),
        left: getCSSInset("left"),
        right: getCSSInset("right"),
      });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return insets;
};
