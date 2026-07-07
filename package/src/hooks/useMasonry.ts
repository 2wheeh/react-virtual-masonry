import { CSSProperties, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
  useWindowVirtualizer,
  type ScrollToOptions,
  type VirtualItem,
  type Virtualizer,
} from '@tanstack/react-virtual';

import { useCSSLaneCount } from './useCSSLaneCount';
import { useOffsetTop } from './useOffsetTop';

const DEFAULT_LANES = 4;
const DEFAULT_OVERSCAN = 3;
const DEFAULT_GUTTER = 20;

/** SSR rendering configuration. Pass to opt into server-rendered positioned items.
 *  Server-side layout cost scales with `data.length`, not `itemCount` — lane
 *  assignment is order-dependent, so the whole list is laid out per request. */
export interface SSRConfig {
  /** Number of items to render in server HTML. */
  itemCount: number;
  /** Distance from document top to the grid container. @default 0 */
  scrollMargin?: number;
  /** Lane count used during SSR / first paint. @default DEFAULT_LANES */
  lanes?: number;
}

interface BaseOptions<Data> {
  data: Data[];
  gutter?: number;
  overscan?: number;
}

interface ClientOnlyOptions<Data> extends BaseOptions<Data> {
  ssr?: undefined;
  /** Optional in client-only mode — items get measured post-mount. Recommended for
   *  large lists so off-screen sizes contribute to `getTotalSize()` and lane balance. */
  estimateSize?: (index: number) => number;
}

interface SSROptions<Data> extends BaseOptions<Data> {
  ssr: SSRConfig;
  /** Required with `ssr` — server has no DOM to measure, so this is the only height
   *  source for SSR HTML. Without it every item collapses to 0 and the server output
   *  is broken. */
  estimateSize: (index: number) => number;
}

/**
 * Options for {@link useMasonry}. Discriminated on `ssr`: opting into SSR makes
 * `estimateSize` required so server output is well-formed.
 */
export type UseMasonryOptions<Data> = ClientOnlyOptions<Data> | SSROptions<Data>;

/** Spread onto the grid root element. */
export interface MasonryGridProps {
  ref: RefObject<HTMLDivElement | null>;
  style: CSSProperties;
  'data-rvm-grid': '';
  'data-rvm-lanes': number;
}

/** Spread onto an item element. Pass `key={item.key}` separately. */
export interface MasonryItemProps {
  ref: (el: HTMLElement | null) => void;
  'data-index': number;
  'data-rvm-item': '';
  style: CSSProperties;
}

export interface UseMasonryReturn {
  gridProps: MasonryGridProps;
  /** Returns props for a single item — spread the result; pass `key` separately. */
  getItemProps: (item: VirtualItem) => MasonryItemProps;
  /**
   * Items to render this frame. SSR / pre-mount: first `ssr.itemCount` from
   * `measurementsCache`. Post-mount: real visible window from the virtualizer.
   */
  items: VirtualItem[];
  /** Current lane count — `--lanes` post-mount, fallback pre-mount. */
  lanes: number;
  /** Underlying TanStack virtualizer (escape hatch for imperative APIs beyond
   *  `scrollToIndex`). Stable identity + mutable internals — deriving render
   *  values from it in a compiled component caches stale. Prefer `items`/`lanes`,
   *  or `'use no memo'`. */
  virtualizer: Virtualizer<Window, Element>;
  /**
   * Scrolls so `index` is positioned per `align` (default `'auto'`: nearest edge,
   * no-op if already visible). Referentially stable — safe in effect deps.
   *
   * A thin forward to TanStack Virtual's
   * {@link https://tanstack.com/virtual/latest/docs/api/virtualizer#scrolltoindex scrollToIndex}
   * (`options` is its `ScrollToOptions`). Cold-jump accuracy is bounded by
   * `estimateSize` — inherent to estimate-based virtualization, not specific to
   * this library; see the docs for the error model.
   */
  scrollToIndex: (index: number, options?: ScrollToOptions) => void;
}

/**
 * Headless masonry hook. Owns the virtualizer, lane-count tracking, and the SSR
 * fallback chain; returns prop bags you spread onto your own JSX.
 *
 * Selector contract emitted via the returned props:
 * - `[data-rvm-grid]` on the root, with `data-rvm-lanes="<n>"`
 * - `[data-rvm-item]` on each rendered item
 *
 * The grid root never declares `container-type`. For `@container` responsiveness,
 * wrap externally with your own `container-type: inline-size` element.
 */
export function useMasonry<Data>({
  data,
  gutter = DEFAULT_GUTTER,
  estimateSize,
  overscan = DEFAULT_OVERSCAN,
  ssr,
}: UseMasonryOptions<Data>): UseMasonryReturn {
  // `getVirtualItems()` side-effects `measurementsCache` every render — auto-memo
  // would starve the SSR fallback slice.
  'use no memo';

  const gridRef = useRef<HTMLDivElement>(null);

  // Clamp to >= 1 — lane math divides by n; 0/negative would emit Infinity/NaN CSS.
  const lanes = useCSSLaneCount(gridRef, {
    fallback: Math.max(1, ssr?.lanes ?? DEFAULT_LANES),
  });

  const scrollMargin = useOffsetTop(gridRef, { fallback: ssr?.scrollMargin ?? 0 });

  // Explicit mount signal — reading `gridRef.current` during render is impure.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const virtualizer = useWindowVirtualizer({
    count: data.length,
    estimateSize: estimateSize ?? (() => 0),
    overscan,
    lanes,
    scrollMargin,
    gap: gutter,
    laneAssignmentMode: 'measured',
  });

  // Workaround: gap changes don't invalidate virtual-core's measurement cache.
  // https://github.com/TanStack/virtual/issues/1222
  const prevGutter = useRef(gutter);
  useEffect(() => {
    if (prevGutter.current !== gutter) {
      prevGutter.current = gutter;
      virtualizer.measure();
    }
  }, [gutter, virtualizer]);

  // When no visible range yet (server, or client pre-effect), slice the cache
  // for SSR rendering. The `mounted` gate keeps post-mount empty ranges empty.
  const visibleItems = virtualizer.getVirtualItems();
  const items =
    visibleItems.length === 0 && ssr && !mounted
      ? virtualizer.measurementsCache.slice(0, ssr.itemCount)
      : visibleItems;

  // Lane width = (W − (n−1)·gutter) / n, as `calc(% + px)` so the browser evaluates
  // against actual container width at paint time.
  const laneWidthCalc = `calc(${100 / lanes}% - ${(gutter * (lanes - 1)) / lanes}px)`;

  // `virtualizer` is a stable class instance (TanStack re-`setOptions`s it in
  // place), so closing over it keeps this wrapper's identity stable too.
  const scrollToIndex = useCallback(
    (index: number, options?: ScrollToOptions) => virtualizer.scrollToIndex(index, options),
    [virtualizer]
  );

  return {
    gridProps: {
      ref: gridRef,
      style: {
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      },
      'data-rvm-grid': '',
      'data-rvm-lanes': lanes,
    },
    getItemProps: ({ lane, index, start }: VirtualItem) => ({
      ref: virtualizer.measureElement,
      'data-index': index,
      'data-rvm-item': '',
      style: {
        position: 'absolute',
        top: 0,
        left: `calc(${(100 * lane) / lanes}% + ${(gutter * lane) / lanes}px)`,
        width: laneWidthCalc,
        transform: `translateY(${start - virtualizer.options.scrollMargin}px)`,
      },
    }),
    items,
    lanes,
    virtualizer,
    scrollToIndex,
  };
}
