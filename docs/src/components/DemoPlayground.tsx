'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Masonry } from 'react-virtual-masonry';

const ITEM_COUNT_OPTIONS = [50, 500, 5000, 20000] as const;

const MIN_HEIGHT = 80;
const MAX_HEIGHT = 320;

// Deterministic pseudo-random height per index (no `Math.random` — heights must
// stay stable across re-renders and mode changes).
function heightForIndex(index: number): number {
  const x = Math.sin(index * 12.9898) * 43758.5453;
  const frac = x - Math.floor(x);
  return Math.round(MIN_HEIGHT + frac * (MAX_HEIGHT - MIN_HEIGHT));
}

const PALETTE = ['#F47067', '#5B8DEF', '#3DA35D', '#B983FF', '#E0A526'];

function Cell({ item, index }: { item: number; index: number }) {
  return (
    <div
      style={{
        height: item,
        background: PALETTE[index % PALETTE.length],
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {index}
    </div>
  );
}

// Capped to fit vocs's prose column (`max-w-content`, ~790-840px on desktop) so
// every breakpoint below is actually reachable by dragging the slider to its max.
const CONTAINER_MIN = 260;
const CONTAINER_MAX = 820;
const CONTAINER_DEFAULT = 640;

export function DemoPlayground() {
  const [containerWidth, setContainerWidth] = useState(CONTAINER_DEFAULT);
  const [gutter, setGutter] = useState(20);
  const [overscan, setOverscan] = useState(3);
  const [itemCount, setItemCount] = useState<(typeof ITEM_COUNT_OPTIONS)[number]>(500);
  const [lanes, setLanes] = useState(0);
  const [renderedCount, setRenderedCount] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const data = useMemo(
    () => Array.from({ length: itemCount }, (_, i) => heightForIndex(i)),
    [itemCount]
  );

  // One observer on the (never-remounted) wrapper tracks both the lane count
  // reflected on `[data-rvm-grid]` and how many `[data-rvm-item]` nodes are
  // actually mounted — survives the inner `<Masonry key={itemCount}>` remount.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const sync = () => {
      const grid = wrapper.querySelector('[data-rvm-grid]');
      if (!grid) return;
      const laneAttr = grid.getAttribute('data-rvm-lanes');
      setLanes(laneAttr ? Number.parseInt(laneAttr, 10) : 0);
      setRenderedCount(grid.querySelectorAll('[data-rvm-item]').length);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(wrapper, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-rvm-lanes'],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="vocs:flex vocs:flex-col vocs:gap-4">
      <style>{`
        .rvm-playground { container-type: inline-size; container-name: rvm-demo; }
        .rvm-playground [data-rvm-grid] { --lanes: 1; }
        @container rvm-demo (min-width: 360px) { .rvm-playground [data-rvm-grid] { --lanes: 2; } }
        @container rvm-demo (min-width: 540px) { .rvm-playground [data-rvm-grid] { --lanes: 3; } }
        @container rvm-demo (min-width: 700px) { .rvm-playground [data-rvm-grid] { --lanes: 4; } }
      `}</style>

      <div className="vocs:flex vocs:flex-col vocs:gap-3 vocs:rounded-lg vocs:border vocs:border-primary vocs:bg-surface vocs:p-4 vocs:text-sm">
        <div
          className="vocs:grid vocs:gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
        >
          <label className="vocs:flex vocs:flex-col vocs:gap-1">
            <span className="vocs:text-secondary">Container width: {containerWidth}px</span>
            <input
              type="range"
              min={CONTAINER_MIN}
              max={CONTAINER_MAX}
              step={10}
              value={containerWidth}
              onChange={(e) => setContainerWidth(Number(e.target.value))}
            />
          </label>

          <label className="vocs:flex vocs:flex-col vocs:gap-1">
            <span className="vocs:text-secondary">Gutter: {gutter}px</span>
            <input
              type="range"
              min={0}
              max={48}
              step={2}
              value={gutter}
              onChange={(e) => setGutter(Number(e.target.value))}
            />
          </label>

          <label className="vocs:flex vocs:flex-col vocs:gap-1">
            <span className="vocs:text-secondary">Overscan: {overscan}</span>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={overscan}
              onChange={(e) => setOverscan(Number(e.target.value))}
            />
          </label>

          <label className="vocs:flex vocs:flex-col vocs:gap-1">
            <span className="vocs:text-secondary">Item count</span>
            <select
              value={itemCount}
              onChange={(e) =>
                setItemCount(Number(e.target.value) as (typeof ITEM_COUNT_OPTIONS)[number])
              }
              className="vocs:rounded-md vocs:border vocs:border-primary vocs:bg-surface vocs:px-2 vocs:py-1.5"
            >
              {ITEM_COUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n.toLocaleString()}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="vocs:flex vocs:flex-wrap vocs:gap-x-6 vocs:gap-y-1 vocs:text-secondary">
          <span>
            Lanes (<code>data-rvm-lanes</code>):{' '}
            <strong className="vocs:text-heading">{lanes}</strong>
          </span>
          <span>
            Mounted <code>[data-rvm-item]</code> nodes:{' '}
            <strong className="vocs:text-heading">{renderedCount}</strong> /{' '}
            {itemCount.toLocaleString()}
          </span>
          <span>
            Breakpoints: 1 lane &lt;360px &middot; 2 lanes 360&ndash;539px &middot; 3 lanes
            540&ndash;699px &middot; 4 lanes &ge;700px
          </span>
        </div>
      </div>

      <div
        ref={wrapperRef}
        className="rvm-playground vocs:rounded-lg vocs:border vocs:border-primary vocs:p-2"
        style={{ width: containerWidth, maxWidth: '100%' }}
      >
        <Masonry
          key={itemCount}
          data={data}
          renderItem={Cell}
          estimateSize={heightForIndex}
          gutter={gutter}
          overscan={overscan}
        />
      </div>
    </div>
  );
}
