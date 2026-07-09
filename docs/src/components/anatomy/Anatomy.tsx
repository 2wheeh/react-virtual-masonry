'use client';

import { useRef, useState } from 'react';
import { useMasonry, useEndReached } from 'kaskaid';
import { css } from '../../../styled-system/css';
import { HeaderStrip } from './HeaderStrip';
import { ControlPanel } from './ControlPanel';
import { StageRow } from './StageRow';
import { SCROLL_OFFSET_PX, SCROLL_TARGETS } from './data';
import type { ScrollBtn, ScrollCall } from './types';
import { useInfiniteFeed } from './hooks/useInfiniteFeed';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useStageResize } from './hooks/useStageResize';
import { useVisibleRange } from './hooks/useVisibleRange';

// ---------------------------------------------------------------------------
// The `/anatomy` instrument panel — orchestrator. Owns the demo's control
// state, wires the masonry + infinite-feed + viewport/resize hooks together, and
// composes the header, control panel, and stage row. Presentational subtrees
// and the derived-state hooks live in ./ (client graph is inherited from here).
// ---------------------------------------------------------------------------
export function Anatomy() {
  const [xray] = useState(true);

  // The last scroll invocation, mirrored into the code chip + the active (coral)
  // button. `btn` is the pressed control; `scrollCall` holds the *actual*
  // arguments, tagged by which API ran — END resolves against the live feed
  // length, and OFFSET calls `scrollToOffset` rather than `scrollToIndex`.
  const [scrollBtn, setScrollBtn] = useState<ScrollBtn>('start');
  const [scrollCall, setScrollCall] = useState<ScrollCall>({
    kind: 'index',
    index: SCROLL_TARGETS.start,
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

  // The stage is the scroll container; the library windows against it and hands
  // back its live scroll window, so the demo attaches no scroll listener.
  const stageRef = useRef<HTMLDivElement>(null);
  // Drag-handle resize (mouse + keyboard) + the column/row refs and clamp bounds.
  const { stageColRef, stageRowRef, stageW, dragBounds, onHandleDown, onHandleKey } =
    useStageResize();

  // `virtualizer` is the escape hatch: `useMasonry` returns `scrollToIndex` but
  // not `scrollToOffset`, which the OFFSET button needs.
  const {
    gridProps,
    getItemProps,
    items,
    lanes,
    scrollToIndex,
    scrollOffset,
    viewportSize,
    virtualizer,
  } = useMasonry({
    data,
    estimateSize: (i) => data[i].height,
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
  const { mountedSet, visibleSet, visible } = useVisibleRange(items, scrollOffset, viewportSize);

  // Drive one scroll interaction and reflect the real call into the chip +
  // buttons. Plain handler — only used as an onClick (ControlPanel), so no
  // useCallback stability is needed; it closes over the live `data` for END.
  const runScroll = (btn: ScrollBtn) => {
    const behavior = reduceMotion ? 'auto' : 'smooth';
    setScrollBtn(btn);

    // Raw px offset, not an index — goes through the virtualizer directly.
    if (btn === 'offset') {
      setScrollCall({ kind: 'offset', offset: SCROLL_OFFSET_PX, align: 'start' });
      virtualizer.scrollToOffset(SCROLL_OFFSET_PX, { align: 'start', behavior });
      return;
    }

    // START / CENTER target fixed indices inside the initial feed; END resolves
    // against the live (grown) feed, so it always lands on the true last item.
    const index =
      btn === 'start'
        ? SCROLL_TARGETS.start
        : btn === 'center'
          ? SCROLL_TARGETS.center
          : data.length - 1;
    const align = btn === 'center' ? 'center' : btn === 'start' ? 'start' : 'end';

    setScrollCall({ kind: 'index', index, align });
    scrollToIndex(index, { align, behavior });
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
      {/* container-query → --lanes, read by the library off [data-kaskaid-grid]. */}
      <style>{`
        .ksk-stage { container-type: inline-size; container-name: kskstage; }
        .ksk-stage [data-kaskaid-grid] { --lanes: 1; }
        @container kskstage (min-width: 380px) { .ksk-stage [data-kaskaid-grid] { --lanes: 2; } }
        @container kskstage (min-width: 560px) { .ksk-stage [data-kaskaid-grid] { --lanes: 3; } }
        @media (prefers-reduced-motion: reduce) {
          /* Unscoped: the skeleton shimmer (kskshimmer) lives inside .ksk-stage but the
             footer loading dots (kskdot) are a sibling of it — target every
             [data-kaskaid-anim] so BOTH keyframes are killed. */
          [data-kaskaid-anim] { animation: none !important; }
        }
      `}</style>

      <HeaderStrip items={data.length} mounted={items.length} visible={visible} lanes={lanes} />

      <ControlPanel
        scrollCall={scrollCall}
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
        scrollOffset={scrollOffset}
        viewportSize={viewportSize}
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
