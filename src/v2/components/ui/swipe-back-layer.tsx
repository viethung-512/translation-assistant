import {
  ReactNode,
  TouchEvent as ReactTouchEvent,
  useCallback,
  useRef,
  useState,
} from "react";

/**
 * iOS-style edge-swipe-back gesture wrapper.
 * - Detects horizontal swipe starting from the left edge (within EDGE_PX).
 * - Translates the wrapped screen with finger; on release, commits if moved beyond
 *   COMMIT_RATIO of width OR velocity exceeds VELOCITY_PX_PER_MS.
 * - Falls back to spring-back on cancel.
 *
 * Usage: wrap any screen that has a back action.
 *   <SwipeBackLayer onBack={() => navigate('/prev')}>
 *     <SomeScreen />
 *   </SwipeBackLayer>
 */
interface Props {
  onBack: () => void;
  children: ReactNode;
  /** Disable the gesture (e.g. while a modal is open). */
  disabled?: boolean;
}

const EDGE_PX = 24; // Touch must START within this many px of left edge
const COMMIT_RATIO = 0.35; // Commit if dragged > 35% of viewport width
const VELOCITY_PX_PER_MS = 0.5; // Or fast flick (≈500 px/s)
const MAX_VERTICAL_DRIFT = 40; // Cancel if vertical movement exceeds this

export function SwipeBackLayer({ onBack, children, disabled }: Props) {
  const [tx, setTx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const widthRef = useRef(0);
  const lastRef = useRef<{ x: number; t: number } | null>(null);
  const trackingRef = useRef(false);

  const reset = useCallback(() => {
    setAnimating(true);
    setTx(0);
    startRef.current = null;
    lastRef.current = null;
    trackingRef.current = false;
    // Allow CSS transition to play, then re-enable instant updates
    window.setTimeout(() => setAnimating(false), 220);
  }, []);

  const commit = useCallback(() => {
    setAnimating(true);
    setTx(widthRef.current);
    startRef.current = null;
    lastRef.current = null;
    trackingRef.current = false;
    window.setTimeout(() => {
      setAnimating(false);
      setTx(0);
      onBack();
    }, 200);
  }, [onBack]);

  const handleTouchStart = useCallback(
    (e: ReactTouchEvent<HTMLDivElement>) => {
      if (disabled) return;
      const touch = e.touches[0];
      if (!touch) return;
      // Only initiate if touch starts near left edge
      if (touch.clientX > EDGE_PX) return;
      widthRef.current = e.currentTarget.clientWidth || window.innerWidth;
      startRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        t: performance.now(),
      };
      lastRef.current = { x: touch.clientX, t: performance.now() };
      trackingRef.current = true;
    },
    [disabled],
  );

  const handleTouchMove = useCallback(
    (e: ReactTouchEvent<HTMLDivElement>) => {
      if (!trackingRef.current || !startRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      const dx = touch.clientX - startRef.current.x;
      const dy = Math.abs(touch.clientY - startRef.current.y);
      // Bail on dominantly vertical swipe
      if (dy > MAX_VERTICAL_DRIFT && dy > Math.abs(dx)) {
        reset();
        return;
      }
      if (dx <= 0) {
        setTx(0);
        return;
      }
      setTx(dx);
      lastRef.current = { x: touch.clientX, t: performance.now() };
    },
    [reset],
  );

  const handleTouchEnd = useCallback(() => {
    if (!trackingRef.current || !startRef.current) {
      reset();
      return;
    }
    const start = startRef.current;
    const last = lastRef.current ?? start;
    const dx = last.x - start.x;
    const dt = Math.max(1, last.t - start.t);
    const velocity = dx / dt; // px / ms

    const widthCommit = dx > widthRef.current * COMMIT_RATIO;
    const flickCommit = velocity > VELOCITY_PX_PER_MS && dx > 40;

    if (widthCommit || flickCommit) commit();
    else reset();
  }, [commit, reset]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={reset}
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        transform: tx > 0 ? `translateX(${tx}px)` : undefined,
        transition: animating ? "transform 200ms ease-out" : "none",
        willChange: tx > 0 || animating ? "transform" : undefined,
        touchAction: "pan-y", // allow vertical scroll, intercept horizontal at edge
      }}
    >
      {children}
    </div>
  );
}
