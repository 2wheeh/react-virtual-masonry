import { css } from '../../../styled-system/css';
import { LANE_COLORS } from './constants';
import type { Descriptor } from './data';
import type { VirtualItem } from 'kaskaid';

// Small bar primitive for the archetype card skeleton content.
function Bar({
  w,
  h,
  color,
}: {
  w: string;
  h: number;
  color: 'barName' | 'barHandle' | 'barLine';
}) {
  return (
    <div className={css({ borderRadius: '3px', bg: color })} style={{ width: w, height: h }} />
  );
}

// ---------------------------------------------------------------------------
// One masonry card — social-feed archetype. Explicit height = the descriptor's
// height so the measured `item.size` matches `estimateSize` (stable layout).
// x-ray content dims via the `_xray` condition; the coral overlay/chips read the
// live `item.index` / `item.size` / `item.lane`.
// ---------------------------------------------------------------------------
export function ArchetypeCard({ d, item }: { d: Descriptor; item: VirtualItem }) {
  const laneColor = LANE_COLORS[item.lane % LANE_COLORS.length];
  return (
    <div
      className={css({
        position: 'relative',
        boxSizing: 'border-box',
        border: '1px solid',
        borderColor: 'border',
        borderRadius: '10px',
        bg: 'card',
        overflow: 'hidden',
      })}
      style={{ height: d.height }}
    >
      {/* content (dims under x-ray) */}
      <div
        className={css({
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          p: '10px',
          _xray: { opacity: '0.2', _dark: { opacity: '0.14' } },
        })}
      >
        {/* author row */}
        <div className={css({ display: 'flex', alignItems: 'center', gap: '8px' })}>
          <div
            className={css({
              width: '34px',
              height: '34px',
              borderRadius: 'full',
              bg: 'avatar',
              flexShrink: 0,
            })}
          />
          <div className={css({ display: 'flex', flexDirection: 'column', gap: '5px' })}>
            <Bar w="90px" h={8} color="barName" />
            <Bar w="60px" h={6} color="barHandle" />
          </div>
        </div>

        {/* body by archetype */}
        {d.archetype === 'image' && (
          <div className={css({ flex: '1', borderRadius: '8px', bg: 'stripe2' })} />
        )}
        {d.archetype === 'short' && (
          <div className={css({ display: 'flex', flexDirection: 'column', gap: '6px' })}>
            <Bar w="100%" h={7} color="barLine" />
            <Bar w="85%" h={7} color="barLine" />
            <Bar w="55%" h={7} color="barLine" />
          </div>
        )}
        {d.archetype === 'tall' && (
          <>
            <div className={css({ display: 'flex', flexDirection: 'column', gap: '6px' })}>
              <Bar w="100%" h={7} color="barLine" />
              <Bar w="70%" h={7} color="barLine" />
            </div>
            <div className={css({ flex: '1', borderRadius: '8px', bg: 'stripe2' })} />
          </>
        )}
        {d.archetype === 'quote' && (
          <div
            className={css({
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              gap: '7px',
              justifyContent: 'center',
              pl: '10px',
              borderLeft: '3px solid',
              borderColor: 'border2',
            })}
          >
            <Bar w="90%" h={9} color="barName" />
            <Bar w="75%" h={9} color="barName" />
            <Bar w="50%" h={9} color="barName" />
          </div>
        )}

        {/* engagement */}
        <div
          className={css({
            display: 'flex',
            gap: '12px',
            mt: 'auto',
            fontFamily: 'mono',
            fontSize: '10px',
            color: 't3',
          })}
        >
          <span>↩ {d.replies}</span>
          <span>⇄ {d.reposts}</span>
          <span>♡ {d.likes}</span>
        </div>
      </div>

      {/* x-ray overlay (always on in this demo) — outlined coral card border +
          glow, outlined chips. The lane accent stripe renders UNDER the coral
          overlay so the lane color and the coral border layer/overlap (design
          look) instead of the solid stripe hard-covering the left edge. */}
      <div
        aria-hidden
        className={css({
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '3px',
          pointerEvents: 'none',
        })}
        style={{ background: laneColor }}
      />
      <div
        aria-hidden
        className={css({
          position: 'absolute',
          inset: 0,
          borderRadius: '8px',
          border: '1px solid',
          borderColor: 'coral',
          bg: 'rgba(244,112,103,0.05)',
          boxShadow: '0 0 0 1px rgba(244,112,103,0.15)',
          _dark: {
            bg: 'rgba(244,112,103,0.06)',
            boxShadow: 'inset 0 0 0 1px rgba(244,112,103,0.25), 0 0 14px rgba(244,112,103,0.14)',
          },
          pointerEvents: 'none',
        })}
      />
      {/* index · size chip — OUTLINED coral pill (decorative, hidden from AT) */}
      <span
        data-testid="xray-chip"
        aria-hidden
        className={css({
          position: 'absolute',
          top: '7px',
          left: '7px',
          fontFamily: 'mono',
          fontSize: '10px',
          fontWeight: '600',
          color: 'coral',
          bg: 'rgba(255,255,255,0.9)',
          _dark: { bg: 'rgba(14,13,15,0.86)' },
          border: '1px solid rgba(244,112,103,0.5)',
          borderRadius: '5px',
          px: '6px',
          py: '2px',
          letterSpacing: '.02em',
          fontVariantNumeric: 'tabular-nums',
        })}
      >
        #{item.index} · {Math.round(item.size)}px
      </span>
      {/* lane badge — OUTLINED lane-colored pill */}
      <span
        aria-hidden
        className={css({
          position: 'absolute',
          top: '7px',
          right: '7px',
          fontFamily: 'mono',
          fontSize: '10px',
          fontWeight: '600',
          bg: 'rgba(255,255,255,0.9)',
          _dark: { bg: 'rgba(14,13,15,0.86)' },
          border: '1px solid',
          borderRadius: '5px',
          px: '6px',
          py: '2px',
        })}
        style={{ color: laneColor, borderColor: laneColor }}
      >
        L{item.lane}
      </span>
    </div>
  );
}
