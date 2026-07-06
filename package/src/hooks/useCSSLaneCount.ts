import { RefObject, useCallback, useSyncExternalStore } from 'react';

const LANES_VAR = '--lanes';

interface UseCSSLaneCountOptions {
  /**
   * Value returned during SSR and before the container mounts. Should match the
   * SSR HTML's assumed lane count to minimize the Phase 1 → Phase 2 layout shift.
   */
  fallback: number;
}

/**
 * Reads a positive integer lane count from the `--lanes` CSS custom property on
 * `containerRef`, kept in sync via `ResizeObserver`. Lets a stylesheet rule
 * (`@container`, `@media`, or static) own responsive lane count while the
 * virtualizer handles lane assignment.
 *
 * - SSR / pre-mount: returns `fallback`.
 * - Post-mount: returns the layout-resolved value.
 * - Unset / non-numeric / non-positive: returns `fallback`.
 */
export const useCSSLaneCount = (
  containerRef: RefObject<HTMLElement | null>,
  { fallback }: UseCSSLaneCountOptions
): number => {
  // ResizeObserver fires once in a microtask on `observe()` — that initial pulse
  // promotes the snapshot from `fallback` to the layout-resolved value.
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const el = containerRef.current;
      if (!el || typeof ResizeObserver === 'undefined') return () => {};
      const observer = new ResizeObserver(onStoreChange);
      observer.observe(el);
      return () => observer.disconnect();
    },
    [containerRef]
  );

  const getSnapshot = useCallback((): number => {
    const el = containerRef.current;
    if (!el) return fallback;
    const raw = getComputedStyle(el).getPropertyValue(LANES_VAR).trim();
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }, [containerRef, fallback]);

  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
