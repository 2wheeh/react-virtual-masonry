import { RefObject, useCallback, useSyncExternalStore } from 'react';

interface UseOffsetTopOptions {
  /**
   * Value returned during SSR and before the element mounts. Should match the
   * distance from document top assumed by the SSR HTML.
   */
  fallback: number;
}

/**
 * Reads `offsetTop` from `elementRef` without touching `ref.current` during
 * render — the value lives in a `useSyncExternalStore` snapshot, re-read on
 * every render and on element resize via `ResizeObserver`.
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
