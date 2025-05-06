import { ReactNode, useMemo, useRef } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

import { useResponsiveValue, BreakpointValues } from '../hooks/useResponsiveValue';

type ColumnCountBreakPoints = BreakpointValues<number>;
interface Props<Data> {
  data: Data[];
  renderItem: (item: Data, index: number) => ReactNode;
  columnsCountBreakPoints?: ColumnCountBreakPoints;
  gutter?: number; // px
}

const DEFAULT_COLUMNS_COUNT = 4;

export function Masonry<Data = unknown>({
  data,
  renderItem,
  columnsCountBreakPoints = {
    350: 1,
    750: 2,
    900: 3,
  },
  gutter = 20,
}: Props<Data>) {
  const { getResponsiveValue } = useResponsiveValue<number>();

  const columnsCount = useMemo(
    () => getResponsiveValue(columnsCountBreakPoints, DEFAULT_COLUMNS_COUNT),
    [columnsCountBreakPoints, getResponsiveValue]
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const laneWidth = containerRef.current
    ? (containerRef.current.offsetWidth - (columnsCount - 1) * gutter) / columnsCount
    : 0;

  const virtualizer = useWindowVirtualizer({
    count: data.length,
    estimateSize: () => 700,
    overscan: 3,
    lanes: columnsCount,
    scrollMargin: containerRef.current?.offsetTop ?? 0,
    gap: gutter,
  });

  return (
    <div
      ref={containerRef}
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {virtualizer.getVirtualItems().map(({ lane, key, index, start }) => (
        <div
          ref={virtualizer.measureElement}
          key={key}
          data-index={index} // important for the measureElement to work
          style={{
            position: 'absolute',
            top: 0,
            left: `${(laneWidth + gutter) * lane}px`,
            width: `${laneWidth}px`,
            transform: `translateY(${start - virtualizer.options.scrollMargin}px)`,
          }}
        >
          {renderItem(data[index], index)}
        </div>
      ))}
    </div>
  );
}
