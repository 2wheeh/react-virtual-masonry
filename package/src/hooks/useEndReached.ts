import { useEffect } from 'react';
import type { VirtualItem } from '@tanstack/react-virtual';

export interface UseEndReachedOptions {
  /** Items-from-end distance at which `onEndReached` fires. `items` already
   *  includes overscan, so for prefetch-ahead set this ≥ your `overscan`.
   *  @default 0 */
  threshold?: number;
  /** Hard-suppresses firing, e.g. while a fetch is in flight or no page remains. */
  disabled?: boolean;
}

/**
 * Fires `onEndReached` once the last rendered item nears the end of `dataLength`.
 * Fetching-agnostic — pass `fetchNextPage` / `setSize` / a loader directly.
 *
 * Depends on the primitive last index, not the `items` array: `useMasonry().items`
 * has a fresh identity every render (`'use no memo'`), so depending on the array
 * would re-fire the effect every render instead of only when the window changes.
 */
export function useEndReached(
  items: Pick<VirtualItem, 'index'>[],
  dataLength: number,
  onEndReached: () => void,
  options?: UseEndReachedOptions
): void {
  const { threshold = 0, disabled = false } = options ?? {};
  const lastRenderedIndex = items.length > 0 ? items[items.length - 1]!.index : -1;

  useEffect(() => {
    if (lastRenderedIndex < 0 || disabled) return;
    if (lastRenderedIndex >= dataLength - 1 - threshold) {
      onEndReached();
    }
  }, [lastRenderedIndex, dataLength, threshold, disabled, onEndReached]);
}
