import { useEffect } from 'react';

/**
 * A performance-optimized hook that updates a DOM element's inner text
 * with the elapsed milliseconds since startTime, accounting for paused offsets.
 * Bypasses React state updates to guarantee lag-free 60fps clock ticks.
 */
export function useLiveTimer(
  elementRef: React.RefObject<HTMLElement | null>,
  startTime: number | null,
  sessionState: 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'TERMINATED',
  accumulatedElapsedMs: number
) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (sessionState === 'IDLE' || startTime === null) {
      element.innerText = '0.000s';
      return;
    }

    if (sessionState === 'PAUSED') {
      element.innerText = `${(accumulatedElapsedMs / 1000).toFixed(3)}s`;
      return;
    }

    if (sessionState === 'COMPLETED' || sessionState === 'TERMINATED') {
      // Keep static display
      return;
    }

    let frameId: number;

    const tick = () => {
      const elapsed = accumulatedElapsedMs + (Date.now() - startTime);
      element.innerText = `${(elapsed / 1000).toFixed(3)}s`;
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [startTime, sessionState, accumulatedElapsedMs, elementRef]);
}
