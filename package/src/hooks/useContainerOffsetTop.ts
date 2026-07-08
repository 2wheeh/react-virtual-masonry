import { RefObject, useCallback, useSyncExternalStore } from 'react';

interface UseContainerOffsetTopOptions {
  /** Value returned during SSR, before mount, and whenever a ref has no element. */
  fallback: number;
}

/**
 * Container-relative analogue of `useOffsetTop`: the distance from `containerRef`'s
 * content-box top (`scrollTop === 0`) to `elementRef`'s top, as a
 * `useSyncExternalStore` snapshot — used as `scrollMargin` in container mode.
 *
 * `containerRef` is optional so this can run unconditionally alongside `useOffsetTop`
 * (rules-of-hooks); omit it in window mode and it always returns `fallback`.
 */
export const useContainerOffsetTop = (
  elementRef: RefObject<HTMLElement | null>,
  containerRef: RefObject<HTMLElement | null> | undefined,
  { fallback }: UseContainerOffsetTopOptions
): number => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const el = elementRef.current;
      const container = containerRef?.current;
      if (!el || !container || typeof ResizeObserver === 'undefined') return () => {};
      const observer = new ResizeObserver(onStoreChange);
      observer.observe(el);
      observer.observe(container);
      return () => observer.disconnect();
    },
    [elementRef, containerRef]
  );

  const getSnapshot = useCallback((): number => {
    const el = elementRef.current;
    const container = containerRef?.current;
    if (!el || !container) return fallback;
    // rect `top`s move opposite to `scrollTop`, so this stays scroll-invariant.
    // `clientTop` drops the container's top border, making the result relative to the
    // padding-box top (where `scrollTop === 0`) that TanStack uses for `scrollMargin` —
    // same contract as `offsetTop` in the window case.
    return (
      el.getBoundingClientRect().top -
      container.getBoundingClientRect().top -
      container.clientTop +
      container.scrollTop
    );
  }, [elementRef, containerRef, fallback]);

  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
