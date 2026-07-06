import { ReactNode, useRef } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

import { useResponsiveValue, BreakpointValues } from '../hooks/useResponsiveValue';

const DEFAULT_COLUMNS_COUNT = 4;
const DEFAULT_OVERSCAN = 3;
const DEFAULT_GUTTER = 20;

type ColumnCountBreakPoints = BreakpointValues<number>;

/**
 * Server-side rendering configuration. Pass to opt into rendering positioned items in the
 * server HTML. The first paint on the client takes the same code path while
 * `containerRef.current` is null, so React hydration matches exactly.
 *
 * Layout shifts on/after `useEffect` (e.g. lane count changing because the actual viewport
 * crosses a breakpoint different from `columnsCount`) are post-mount reflows, not hydration
 * mismatches. Provide accurate hints to minimize them.
 */
export interface SSRConfig {
  /** Number of items to render in server HTML. Required to opt in. */
  itemCount: number;
  /**
   * Distance from document top to grid container — substitutes for
   * `containerRef.current.offsetTop` while ref is null. Defaults to 0.
   */
  scrollMargin?: number;
  /** Columns count used during SSR / first paint. Defaults to `DEFAULT_COLUMNS_COUNT`. */
  columnsCount?: number;
}

interface Props<Data> {
  data: Data[];
  renderItem: (props: { item: Data; index: number }) => ReactNode;
  columnsCountBreakPoints?: ColumnCountBreakPoints;
  gutter?: number; // px
  estimateSize?: (index: number) => number;
  overscan?: number;
  /**
   * SSR config. When unset, the server emits an empty container (default behavior). When set,
   * the first `ssr.itemCount` items render with positions computed from the same code path
   * the client uses.
   */
  ssr?: SSRConfig;
}

export function Masonry<Data = unknown>({
  data,
  renderItem,
  columnsCountBreakPoints = {},
  gutter = DEFAULT_GUTTER,
  estimateSize,
  overscan = DEFAULT_OVERSCAN,
  ssr,
}: Props<Data>) {
  'use no memo';

  const { getResponsiveValue } = useResponsiveValue<number>();

  const containerRef = useRef<HTMLDivElement>(null);

  // SSR/hydration: windowWidth=0 → DEFAULT. Post-mount / client-remount: real breakpoint.
  const responsiveColumns = getResponsiveValue(columnsCountBreakPoints, DEFAULT_COLUMNS_COUNT);
  // Pre-ref: ssr override → else responsive (DEFAULT on server, real on client-remount).
  const columnsCount = containerRef.current
    ? responsiveColumns
    : (ssr?.columnsCount ?? responsiveColumns);

  const virtualizer = useWindowVirtualizer({
    count: data.length,
    estimateSize: estimateSize ?? (() => 0),
    overscan,
    lanes: columnsCount,
    scrollMargin: containerRef.current?.offsetTop ?? ssr?.scrollMargin ?? 0,
    gap: gutter,
    laneAssignmentMode: 'measured',
  });

  // Calling getVirtualItems() triggers the internal getMeasurements() memo chain, populating
  // the public `measurementsCache` field as a side effect. We can't call getMeasurements()
  // directly because TanStack Virtual marks it private — `measurementsCache` is the public
  // surface for the same data. The two `visibleItems.length === 0` cases are: (a) server
  // (no rect), (b) client first paint (effect not yet fired). Both produce identical output
  // for hydration to match exactly. Slicing to `ssr.itemCount` is essential — without it we'd
  // emit one positioned <div> per data item and defeat virtualization at SSR time.
  const visibleItems = virtualizer.getVirtualItems();
  const itemsToRender =
    visibleItems.length === 0 && ssr && !containerRef.current
      ? virtualizer.measurementsCache.slice(0, ssr.itemCount)
      : visibleItems;

  // Lane width: (W - (n-1)*gutter) / n.
  //   width:  100/n% - (n-1)/n * gutter px
  //   left:   lane * (laneWidth + gutter) = lane * 100/n% + lane * gutter/n px
  // CSS calc handles unknown W identically on server, first paint, and post-mount, so there
  // is no SSR-vs-client drift. Items stay in the same flat parent — lane reassignment via
  // `laneAssignmentMode: 'measured'` updates only the `left` attribute, no remount.
  const laneWidthCalc = `calc(${100 / columnsCount}% - ${(gutter * (columnsCount - 1)) / columnsCount}px)`;

  return (
    <div
      ref={containerRef}
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {itemsToRender.map(({ lane, key, index, start }) => (
        <div
          ref={virtualizer.measureElement}
          key={key}
          data-index={index} // important for the measureElement to work
          style={{
            position: 'absolute',
            top: 0,
            left: `calc(${(100 * lane) / columnsCount}% + ${(gutter * lane) / columnsCount}px)`,
            width: laneWidthCalc,
            transform: `translateY(${start - virtualizer.options.scrollMargin}px)`,
          }}
        >
          {renderItem({ item: data[index], index })}
        </div>
      ))}
    </div>
  );
}
