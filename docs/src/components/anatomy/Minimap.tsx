import { useMemo } from 'react';
import { css } from '../../../styled-system/css';
import { MINIMAP_H } from './constants';
import { SectionLabel } from './SectionLabel';
import type { Descriptor } from './data';

// Minimap block tiers — colored by the REAL virtualizer window, not the data.
// visible: intersects the stage viewport (coral, solid) · mounted: in the
// virtualizer's window/overscan but off-screen (coral, dimmed) · ghost:
// unmounted (theme-neutral fill). Static classes; position/size stay inline.
const MM_VISIBLE = css({ position: 'absolute', borderRadius: '1px', bg: 'coral', opacity: '1' });
const MM_MOUNTED = css({ position: 'absolute', borderRadius: '1px', bg: 'coral', opacity: '0.42' });
const MM_GHOST = css({
  position: 'absolute',
  borderRadius: '1px',
  bg: '#e2e2e2',
  _dark: { bg: '#26242a' },
  opacity: '0.85',
});

// ---------------------------------------------------------------------------
// RANGE schematic — a scaled-down packing of the whole feed, tiered by the live
// virtualizer window, plus the viewport window box.
// ---------------------------------------------------------------------------
export function Minimap({
  data,
  gutter,
  lanes,
  scroll,
  visibleSet,
  mountedSet,
}: {
  data: Descriptor[];
  gutter: number;
  lanes: number;
  scroll: { top: number; h: number };
  visibleSet: Set<number>;
  mountedSet: Set<number>;
}) {
  // Minimap schematic — shortest-column packing across the CURRENT lane count
  // (not a fixed 3), so it mirrors the real layout the stage is showing. Sharing
  // the lane count means the minimap's content height tracks the virtualizer's,
  // which lets a single scale drive both the blocks and the viewport window.
  const minimap = useMemo(() => {
    const n = Math.max(lanes, 1);
    const cols = Array.from({ length: n }, () => 0);
    const blocks = data.map((d) => {
      let lane = 0;
      for (let l = 1; l < n; l++) if (cols[l] < cols[lane]) lane = l;
      const start = cols[lane];
      cols[lane] += d.height + gutter;
      return { lane, start, size: d.height };
    });
    return { blocks, lanes: n, total: Math.max(...cols, 1) };
  }, [data, gutter, lanes]);

  // ONE scale for the whole minimap. The window is in the virtualizer's real
  // coordinate space and the blocks are in the schematic's — but both are packed
  // with the same lane count / heights / gutter, so their totals agree and this
  // single px-per-unit factor keeps the window box locked onto the blocks.
  const scale = MINIMAP_H / minimap.total;
  const winTop = scroll.top * scale;
  const winH = Math.max(scroll.h * scale, 6);

  return (
    <div
      className={css({
        width: '60px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      })}
    >
      <SectionLabel>Range</SectionLabel>
      <div
        aria-hidden
        className={css({
          position: 'relative',
          flex: '1',
          minHeight: '544px',
          bg: 'surf',
          border: '1px solid',
          borderColor: 'border',
          borderRadius: '8px',
          overflow: 'hidden',
        })}
      >
        {minimap.blocks.map((b, i) => {
          const colW = 100 / minimap.lanes; // column fraction for the current lane count
          // Tier by the live virtualizer window: on-screen → solid coral,
          // mounted-but-off-screen (overscan) → dimmed coral, else ghost.
          const cls = visibleSet.has(i) ? MM_VISIBLE : mountedSet.has(i) ? MM_MOUNTED : MM_GHOST;
          return (
            <div
              key={i}
              className={cls}
              style={{
                left: `${b.lane * colW + colW * 0.12}%`,
                width: `${colW * 0.76}%`,
                top: b.start * scale,
                height: Math.max(b.size * scale, 1),
              }}
            />
          );
        })}
        {/* visible window box */}
        <div
          data-testid="mm-window"
          className={css({
            position: 'absolute',
            left: '2px',
            right: '2px',
            borderRadius: '3px',
            border: '1.5px solid',
            // Light box against the coral visible-blocks so the window
            // boundary reads clearly; coral glow keeps the x-ray feel.
            borderColor: '#eeeef0',
            _xray: {
              boxShadow: '0 0 10px rgba(244,112,103,0.4)',
              bg: 'rgba(244,112,103,0.08)',
            },
          })}
          style={{ top: winTop, height: winH }}
        />
      </div>
    </div>
  );
}
