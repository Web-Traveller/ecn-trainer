import { useEffect } from 'react';

/**
 * A performance-optimized hook that updates a DOM element's inner text
 * with the elapsed milliseconds since startTime, accounting for paused offsets.
 * Bypasses React state updates to guarantee lag-free 60fps clock ticks.
 * Also supports optional direct-DOM updates for a time-limit progress bar.
 */
export function useLiveTimer(
  elementRef: React.RefObject<HTMLElement | null>,
  startTime: number | null,
  sessionState: 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'TERMINATED',
  accumulatedElapsedMs: number,
  currentTimeLimitMs?: number,
  progressBarRef?: React.RefObject<HTMLElement | null>
) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const resetProgressBar = () => {
      const pb = progressBarRef?.current;
      if (pb) {
        pb.style.width = '100%';
        pb.className = 'h-full bg-success-green transition-all duration-75';
      }
    };

    const updatePausedProgressBar = () => {
      const pb = progressBarRef?.current;
      if (pb && currentTimeLimitMs) {
        const pct = Math.max(0, Math.min(100, (1 - accumulatedElapsedMs / currentTimeLimitMs) * 100));
        pb.style.width = `${pct}%`;
        if (pct > 50) {
          pb.className = 'h-full bg-success-green';
        } else if (pct > 20) {
          pb.className = 'h-full bg-warning-amber';
        } else {
          pb.className = 'h-full bg-error-red';
        }
      }
    };

    if (sessionState === 'IDLE' || startTime === null) {
      element.innerText = '0.000s';
      resetProgressBar();
      return;
    }

    if (sessionState === 'PAUSED') {
      element.innerText = `${(accumulatedElapsedMs / 1000).toFixed(3)}s`;
      updatePausedProgressBar();
      return;
    }

    if (sessionState === 'COMPLETED' || sessionState === 'TERMINATED') {
      return;
    }

    let frameId: number;

    const tick = () => {
      const elapsed = accumulatedElapsedMs + (Date.now() - startTime);
      element.innerText = `${(elapsed / 1000).toFixed(3)}s`;

      const pb = progressBarRef?.current;
      if (pb && currentTimeLimitMs) {
        const pct = Math.max(0, Math.min(100, (1 - elapsed / currentTimeLimitMs) * 100));
        pb.style.width = `${pct}%`;

        if (pct > 50) {
          pb.className = 'h-full bg-success-green';
        } else if (pct > 20) {
          pb.className = 'h-full bg-warning-amber';
        } else {
          pb.className = 'h-full bg-error-red';
        }
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    const pbElement = progressBarRef?.current;

    return () => {
      cancelAnimationFrame(frameId);
      if (pbElement) {
        pbElement.style.width = '';
      }
    };
  }, [startTime, sessionState, accumulatedElapsedMs, elementRef, currentTimeLimitMs, progressBarRef]);
}
