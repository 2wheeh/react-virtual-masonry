'use client';

import { useState } from 'react';
import { useMasonry, useEndReached } from 'react-virtual-masonry';
import { css } from '../../../styled-system/css';
import { HeaderStrip } from './HeaderStrip';
import { ControlPanel } from './ControlPanel';
import { StageRow } from './StageRow';
import { useInfiniteFeed } from './hooks/useInfiniteFeed';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useStageResize } from './hooks/useStageResize';
import { useStageScroll } from './hooks/useStageScroll';
import { useVisibleRange } from './hooks/useVisibleRange';

// ---------------------------------------------------------------------------
// The `/anatomy` instrument panel — orchestrator. Owns the demo's control
// state, wires the masonry + infinite-feed + viewport/resize hooks together, and
// composes the header, control panel, and stage row. Presentational subtrees
// and the derived-state hooks live in ./ (client graph is inherited from here).
// ---------------------------------------------------------------------------
export function Anatomy() {
  const [xray] = useState(true);

  // The last `scrollToIndex` invocation, mirrored into the code chip + the
  // active (coral) align button. `btn` is the pressed control; `index/align`
  // are the *actual* arguments (last resolves to the live final index).
  const [scrollBtn, setScrollBtn] = useState<'start' | 'center' | 'end' | 'last'>('start');
  const [scrollArgs, setScrollArgs] = useState<{
    index: number;
    align: 'start' | 'center' | 'end' | 'auto';
  }>({
    index: 184,
    align: 'start',
  });
  const [loadMode, setLoadMode] = useState<'auto' | 'manual'>('auto');
  const [gutter, setGutter] = useState(16);
  const [overscan, setOverscan] = useState(3);
  const [threshold, setThreshold] = useState(6);

  // The feed only grows. Deterministic per-index generation keeps heights stable.
  const { data, skeletonFrom, loading, loadMore } = useInfiniteFeed();
  // Reflected `prefers-reduced-motion` — gates the smooth scroll animation.
  const reduceMotion = useReducedMotion();

  // Stage scroll element ref + its rAF-throttled scroll window.
  const { stageRef, scroll } = useStageScroll();
  // Drag-handle resize (mouse + keyboard) + the column/row refs and clamp bounds.
  const { stageColRef, stageRowRef, stageW, dragBounds, onHandleDown, onHandleKey } =
    useStageResize();

  const { gridProps, getItemProps, items, lanes, scrollToIndex } = useMasonry({
    data,
    // Guard the lookup: the virtualizer can probe an index transiently out of
    // range (e.g. mid-`scrollToIndex`), and `data[i]` would then be undefined.
    estimateSize: (i) => data[i]?.height ?? 0,
    gutter,
    overscan,
    scrollElementRef: stageRef,
  });

  // AUTO fires near the end; MANUAL never auto-fires (disabled). Either way a
  // fetch already in flight suppresses re-entry.
  useEndReached(items, data.length, loadMore, {
    threshold,
    disabled: loadMode === 'manual' || loading,
  });

  // Derived mounted/visible index sets from the virtualizer items + scroll window.
  const { mountedSet, visibleSet, visible } = useVisibleRange(items, scroll);

  // Drive one align/scroll interaction and reflect it into the chip + buttons.
  // Plain handler — only used as an onClick (ControlPanel), so no useCallback
  // stability is needed; it closes over the live `data` for the 'last' index.
  const runScroll = (btn: 'start' | 'center' | 'end' | 'last') => {
    let index: number;
    let align: 'start' | 'center' | 'end' | 'auto';
    if (btn === 'start') {
      index = 184;
      align = 'start';
    } else if (btn === 'center') {
      index = 198;
      align = 'center';
    } else if (btn === 'end') {
      index = 212;
      align = 'end';
    } else {
      // scroll to the very end of the (growing) feed — the last item.
      index = data.length - 1;
      align = 'end';
    }
    setScrollBtn(btn);
    setScrollArgs({ index, align });
    scrollToIndex(index, { align, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <div
      data-xray={xray}
      data-testid="demo-panel"
      className={css({
        maxWidth: '100%',
        border: '1px solid',
        borderColor: 'border',
        borderRadius: '12px',
        bg: 'page',
        overflow: 'hidden',
        color: 'text',
      })}
    >
      {/* container-query → --lanes, read by the library off [data-rvm-grid]. */}
      <style>{`
        .rvm-stage { container-type: inline-size; container-name: rvmstage; }
        .rvm-stage [data-rvm-grid] { --lanes: 1; }
        @container rvmstage (min-width: 380px) { .rvm-stage [data-rvm-grid] { --lanes: 2; } }
        @container rvmstage (min-width: 560px) { .rvm-stage [data-rvm-grid] { --lanes: 3; } }
        @media (prefers-reduced-motion: reduce) {
          /* Unscoped: the skeleton shimmer (rvmsk) lives inside .rvm-stage but the
             footer loading dots (rvmdot) are a sibling of it — target every
             [data-rvm-anim] so BOTH keyframes are killed. */
          [data-rvm-anim] { animation: none !important; }
        }
      `}</style>

      <HeaderStrip items={data.length} mounted={items.length} visible={visible} lanes={lanes} />

      <ControlPanel
        scrollArgs={scrollArgs}
        scrollBtn={scrollBtn}
        runScroll={runScroll}
        loadMode={loadMode}
        setLoadMode={setLoadMode}
        gutter={gutter}
        setGutter={setGutter}
        overscan={overscan}
        setOverscan={setOverscan}
        threshold={threshold}
        setThreshold={setThreshold}
      />

      <StageRow
        stageRowRef={stageRowRef}
        stageColRef={stageColRef}
        stageRef={stageRef}
        data={data}
        gutter={gutter}
        lanes={lanes}
        scroll={scroll}
        visibleSet={visibleSet}
        mountedSet={mountedSet}
        stageW={stageW}
        dragBounds={dragBounds}
        onHandleDown={onHandleDown}
        onHandleKey={onHandleKey}
        xray={xray}
        threshold={threshold}
        gridProps={gridProps}
        getItemProps={getItemProps}
        items={items}
        skeletonFrom={skeletonFrom}
        loadMode={loadMode}
        loading={loading}
        loadMore={loadMore}
      />
    </div>
  );
}
