import { RefObject, useCallback, useSyncExternalStore } from 'react';

interface UseOffsetTopOptions {
  /** Value returned during SSR and before the element mounts. */
  fallback: number;
}

/**
 * Reads `offsetTop` from `elementRef` as a `useSyncExternalStore` snapshot
 * (re-read every render, refreshed on element resize) — no ref reads in render.
 *
 * - SSR / pre-mount: returns `fallback`.
 * - Post-mount: returns the layout-resolved `offsetTop`.
 */
export const useOffsetTop = (
  elementRef: RefObject<HTMLElement | null>,
  { fallback }: UseOffsetTopOptions
): number => {
  // ResizeObserver fires once in a microtask on `observe()` — that initial pulse
  // promotes the snapshot from `fallback` to the layout-resolved value.
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const el = elementRef.current;
      if (!el || typeof ResizeObserver === 'undefined') return () => {};
      const observer = new ResizeObserver(onStoreChange);
      observer.observe(el);
      return () => observer.disconnect();
    },
    [elementRef]
  );

  const getSnapshot = useCallback((): number => {
    const el = elementRef.current;
    return el ? el.offsetTop : fallback;
  }, [elementRef, fallback]);

  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
