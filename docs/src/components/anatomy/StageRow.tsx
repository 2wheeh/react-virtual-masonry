import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react';
import { type UseMasonryReturn } from 'react-virtual-masonry';
import { css } from '../../../styled-system/css';
import type { Descriptor } from './data';
import { Minimap } from './Minimap';
import { Stage } from './Stage';

// ---------------------------------------------------------------------------
// Stage row — the minimap column + the resizable stage, laid out side by side.
// ---------------------------------------------------------------------------
export function StageRow({
  stageRowRef,
  stageColRef,
  stageRef,
  data,
  gutter,
  lanes,
  scrollOffset,
  viewportSize,
  visibleSet,
  mountedSet,
  stageW,
  dragBounds,
  onHandleDown,
  onHandleKey,
  xray,
  threshold,
  gridProps,
  getItemProps,
  items,
  skeletonFrom,
  loadMode,
  loading,
  loadMore,
}: {
  stageRowRef: RefObject<HTMLDivElement | null>;
  stageColRef: RefObject<HTMLDivElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  data: Descriptor[];
  gutter: number;
  lanes: number;
  scrollOffset: number;
  viewportSize: number;
  visibleSet: Set<number>;
  mountedSet: Set<number>;
  stageW: number | null;
  dragBounds: { w: number; min: number; max: number };
  onHandleDown: (e: ReactMouseEvent) => void;
  onHandleKey: (e: ReactKeyboardEvent) => void;
  xray: boolean;
  threshold: number;
  gridProps: UseMasonryReturn['gridProps'];
  getItemProps: UseMasonryReturn['getItemProps'];
  items: UseMasonryReturn['items'];
  skeletonFrom: number | null;
  loadMode: 'auto' | 'manual';
  loading: boolean;
  loadMore: () => void;
}) {
  return (
    <div
      ref={stageRowRef}
      className={css({ display: 'flex', gap: '14px', p: '16px', alignItems: 'stretch' })}
    >
      <Minimap
        data={data}
        gutter={gutter}
        lanes={lanes}
        scrollOffset={scrollOffset}
        viewportSize={viewportSize}
        visibleSet={visibleSet}
        mountedSet={mountedSet}
      />
      <Stage
        stageColRef={stageColRef}
        stageRef={stageRef}
        stageW={stageW}
        dragBounds={dragBounds}
        onHandleDown={onHandleDown}
        onHandleKey={onHandleKey}
        xray={xray}
        threshold={threshold}
        lanes={lanes}
        gridProps={gridProps}
        getItemProps={getItemProps}
        items={items}
        data={data}
        skeletonFrom={skeletonFrom}
        loadMode={loadMode}
        loading={loading}
        loadMore={loadMore}
      />
    </div>
  );
}
