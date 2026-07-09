import { useMemo } from 'react';
import type { VirtualItem } from '../types';

export interface VisibleRange {
  // The virtualizer's mounted set (window + overscan) — every rendered index.
  mountedSet: Set<number>;
  // Mounted items whose [start, start+size] intersects the viewport.
  visibleSet: Set<number>;
  // `visibleSet.size` — the VISIBLE stat.
  visible: number;
}

// Derives the mounted / visible index sets from the virtualizer's items and the
// stage scroll window. Pure (no refs/effects) — the scroll window is supplied by
// useStageScroll.
export function useVisibleRange(
  items: VirtualItem[],
  scroll: { top: number; h: number }
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
          .filter((it) => it.start < scroll.top + scroll.h && it.start + it.size > scroll.top)
          .map((it) => it.index)
      ),
    [items, scroll]
  );
  const visible = visibleSet.size;

  return { mountedSet, visibleSet, visible };
}
