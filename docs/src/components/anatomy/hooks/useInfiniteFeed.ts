import { useCallback, useRef, useState } from 'react';
import { ITEM_COUNT, PAGE_SIZE, makeRange, type Descriptor } from '../data';

export interface InfiniteFeed {
  data: Descriptor[];
  // Trailing in-flight page: items at index ≥ skeletonFrom render as skeletons.
  skeletonFrom: number | null;
  loading: boolean;
  loadMore: () => Promise<void>;
}

// Data state + one-page append for the infinite feed. The feed only grows;
// deterministic per-index generation keeps heights stable so appended pages
// never reflow earlier items.
export function useInfiniteFeed(): InfiniteFeed {
  const [data, setData] = useState<Descriptor[]>(() => makeRange(0, ITEM_COUNT));
  const [skeletonFrom, setSkeletonFrom] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // `loadMore` must stay identity-stable (useEndReached's effect depends on its
  // identity — a fresh closure each render would re-arm it every commit), so it
  // can't close over `data`/`loading`; it reads them off these internal refs.
  const dataRef = useRef(data);
  dataRef.current = data;
  const loadingRef = useRef(false);

  // Append one page. A `loading` flag both renders the skeletons and, wired to
  // useEndReached's `disabled`, hard-guards against a second fetch mid-flight —
  // set BEFORE the await, cleared in `finally`, so one scroll-to-end = one page.
  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    const from = dataRef.current.length;
    setSkeletonFrom(from);
    // Grow now so the placeholders mount immediately; they read as skeletons
    // until `loading` clears, then flip to real cards in place (same heights).
    setData((prev) => prev.concat(makeRange(prev.length, PAGE_SIZE)));
    try {
      await new Promise((r) => setTimeout(r, 700));
    } finally {
      setLoading(false);
      setSkeletonFrom(null);
      loadingRef.current = false;
    }
  }, []);

  return { data, skeletonFrom, loading, loadMore };
}
