import { ReactNode, useRef } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

import { useResponsiveValue, BreakpointValues } from '../hooks/useResponsiveValue';

const DEFAULT_COLUMNS_COUNT = 4;
const DEFAULT_OVERSCAN = 3;
const DEFAULT_GUTTER = 20;

type ColumnCountBreakPoints = BreakpointValues<number>;
interface Props<Data> {
  data: Data[];
  renderItem: (props: { item: Data; index: number }) => ReactNode;
  columnsCountBreakPoints?: ColumnCountBreakPoints;
  gutter?: number; // px
  estimateSize?: (index: number) => number;
  overscan?: number;
}

export function Masonry<Data = unknown>({
  data,
  renderItem,
  columnsCountBreakPoints = {},
  gutter = DEFAULT_GUTTER,
  estimateSize,
  overscan = DEFAULT_OVERSCAN,
}: Props<Data>) {
  const { getResponsiveValue } = useResponsiveValue<number>();

  const columnsCount = getResponsiveValue(columnsCountBreakPoints, DEFAULT_COLUMNS_COUNT);

  const containerRef = useRef<HTMLDivElement>(null);

  const laneWidth = containerRef.current
    ? (containerRef.current.offsetWidth - (columnsCount - 1) * gutter) / columnsCount
    : 0;

  const virtualizer = useWindowVirtualizer({
    count: data.length,
    estimateSize: estimateSize ?? (() => 0),
    overscan,
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
          {renderItem({ item: data[index], index })}
        </div>
      ))}
    </div>
  );
}
