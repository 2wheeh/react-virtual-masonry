import { CSSProperties, RefObject, useRef } from 'react';
import { useWindowVirtualizer, type VirtualItem, type Virtualizer } from '@tanstack/react-virtual';

import { useCSSLaneCount } from './useCSSLaneCount';

const DEFAULT_LANES = 4;
const DEFAULT_OVERSCAN = 3;
const DEFAULT_GUTTER = 20;

/** SSR rendering configuration. Pass to opt into server-rendered positioned items. */
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
  /** Underlying TanStack virtualizer (escape hatch for `scrollToIndex` etc.). */
  virtualizer: Virtualizer<Window, Element>;
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

  // Clamped to >= 1 — lane math divides by n, so a user-supplied 0/negative
  // `ssr.lanes` would emit Infinity/NaN CSS.
  const lanes = useCSSLaneCount(gridRef, {
    fallback: Math.max(1, ssr?.lanes ?? DEFAULT_LANES),
  });

  const virtualizer = useWindowVirtualizer({
    count: data.length,
    estimateSize: estimateSize ?? (() => 0),
    overscan,
    lanes,
    scrollMargin: gridRef.current?.offsetTop ?? ssr?.scrollMargin ?? 0,
    gap: gutter,
    laneAssignmentMode: 'measured',
  });

  // When no visible range yet (server, or client pre-effect), slice the cache
  // for SSR rendering. Gated on the ref so a transient empty range post-mount
  // never falls back to the top-of-list slice.
  const visibleItems = virtualizer.getVirtualItems();
  const items =
    visibleItems.length === 0 && ssr && !gridRef.current
      ? virtualizer.measurementsCache.slice(0, ssr.itemCount)
      : visibleItems;

  // Lane width = (W − (n−1)·gutter) / n, as `calc(% + px)` so the browser evaluates
  // against actual container width at paint time.
  const laneWidthCalc = `calc(${100 / lanes}% - ${(gutter * (lanes - 1)) / lanes}px)`;

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
  };
}
