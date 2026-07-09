import { useMemo } from 'react';
import type { VirtualItem } from 'kaskaid';

export interface VisibleRange {
  // The virtualizer's mounted set (window + overscan) — every rendered index.
  mountedSet: Set<number>;
  // Mounted items whose [start, start+size] intersects the viewport.
  visibleSet: Set<number>;
  // `visibleSet.size` — the VISIBLE stat.
  visible: number;
}

// Derives the mounted / visible index sets from the virtualizer's items and its
// scroll window. Pure (no refs/effects) — `scrollOffset` / `viewportSize` come
// straight off `useMasonry`, so the demo attaches no scroll listener of its own.
// Taken as primitives rather than a `{top, h}` object: the caller derives them
// each render, and an object literal would change identity every commit and
// defeat these memos.
export function useVisibleRange(
  items: VirtualItem[],
  scrollOffset: number,
  viewportSize: number
): VisibleRange {
  // The virtualizer's mounted set (window + overscan) — every index currently
  // rendered in the stage. Drives the minimap's "mounted" tier.
  const mountedSet = useMemo(() => new Set(items.map((it) => it.index)), [items]);

  // VISIBLE = mounted items whose [start, start+size] intersects the viewport.
  // The index set drives the minimap's "visible" tier; its size is the stat.
  const visibleSet = useMemo(
    () =>
      new Set(
        items
          .filter(
            (it) => it.start < scrollOffset + viewportSize && it.start + it.size > scrollOffset
          )
          .map((it) => it.index)
      ),
    [items, scrollOffset, viewportSize]
  );
  const visible = visibleSet.size;

  return { mountedSet, visibleSet, visible };
}
