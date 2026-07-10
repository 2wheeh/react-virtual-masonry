import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react';
import { type UseMasonryReturn } from 'kaskaid';
import { css } from '../../../styled-system/css';
import type { Descriptor } from './data';
import { ArchetypeCard } from './Card';
import { SkeletonCard, LoadingDots } from './SkeletonCard';

// ---------------------------------------------------------------------------
// The stage — the real `scrollElementRef` container with the masonry grid, the
// x-ray blueprint/threshold/lanes overlays, the resize handle, and the AUTO/
// MANUAL load footer.
// ---------------------------------------------------------------------------
export function Stage({
  stageColRef,
  stageRef,
  stageW,
  dragBounds,
  onHandleDown,
  onHandleKey,
  threshold,
  lanes,
  gridProps,
  getItemProps,
  items,
  data,
  skeletonFrom,
  loadMode,
  loading,
  loadMore,
}: {
  stageColRef: RefObject<HTMLDivElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  stageW: number | null;
  dragBounds: { w: number; min: number; max: number };
  onHandleDown: (e: ReactMouseEvent) => void;
  onHandleKey: (e: ReactKeyboardEvent) => void;
  threshold: number;
  lanes: number;
  gridProps: UseMasonryReturn['gridProps'];
  getItemProps: UseMasonryReturn['getItemProps'];
  items: UseMasonryReturn['items'];
  data: Descriptor[];
  skeletonFrom: number | null;
  loadMode: 'auto' | 'manual';
  loading: boolean;
  loadMore: () => void;
}) {
  return (
    <div
      ref={stageColRef}
      className={css({
        flex: '1',
        minWidth: '0',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      })}
      style={stageW === null ? undefined : { flex: '0 0 auto', width: stageW }}
    >
      <div
        className={css({
          position: 'relative',
          height: '544px',
          border: '1px solid',
          borderColor: 'border',
          borderRadius: '8px',
          overflow: 'hidden',
          bg: 'page',
        })}
      >
        {/* blueprint grid — faint graph-paper lattice on the stage bg, shown
            only in LIGHT + x-ray (driven by the Panda `_xray` condition with a
            nested `_dark` opt-out, so it never paints in dark). */}
        <div
          aria-hidden
          className={css({
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            display: 'none',
            _xray: {
              display: 'block',
              backgroundImage:
                'repeating-linear-gradient(0deg,#fbfbfc,#fbfbfc 23px,#f1f1f3 23px,#f1f1f3 24px), repeating-linear-gradient(90deg,#fbfbfc,#fbfbfc 23px,#f1f1f3 23px,#f1f1f3 24px)',
              _dark: { display: 'none' },
            },
          })}
        />

        {/* x-ray endReachedThreshold trigger line — a dashed coral marker near
            the stage bottom; the caption reflects the live THRESHOLD slider. */}
        <div
          aria-hidden
          className={css({
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '54px',
            zIndex: 2,
            pointerEvents: 'none',
            borderTop: '1px dashed',
            borderColor: 'coral',
          })}
        >
          <span
            className={css({
              position: 'absolute',
              right: '10px',
              top: '-13px',
              fontFamily: 'mono',
              fontSize: '12px',
              fontWeight: '600',
              color: 'markText',
              bg: 'coral',
              borderRadius: '5px',
              px: '7px',
              py: '3px',
              letterSpacing: '.02em',
              fontVariantNumeric: 'tabular-nums',
            })}
          >
            endReachedThreshold: {threshold}
          </span>
        </div>

        {/* --lanes readout */}
        <div
          data-testid="lanes-readout"
          className={css({
            position: 'absolute',
            top: '10px',
            right: '18px',
            zIndex: 3,
            fontFamily: 'mono',
            fontSize: '11px',
            color: 'coral',
            bg: 'panel',
            border: '1px solid',
            borderColor: 'border',
            borderRadius: '6px',
            px: '8px',
            py: '3px',
          })}
        >
          --lanes: {lanes}
        </div>

        {/* drag handle — resizes the stage; @container recomputes --lanes live */}
        <div
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label="Resize stage (changes lane count)"
          aria-valuemin={dragBounds.min}
          aria-valuemax={dragBounds.max}
          aria-valuenow={Math.round(stageW ?? dragBounds.w)}
          title="Drag or use ← / → to resize · lanes recompute live"
          onMouseDown={onHandleDown}
          onKeyDown={onHandleKey}
          className={css({
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            cursor: 'ew-resize',
            zIndex: 4,
            _hover: { bg: 'rgba(244,112,103,0.06)' },
            _focusVisible: {
              outline: '2px solid',
              outlineColor: 'coral',
              outlineOffset: '-2px',
              bg: 'rgba(244,112,103,0.06)',
            },
          })}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              aria-hidden
              className={css({
                width: '3px',
                height: '3px',
                borderRadius: 'full',
                bg: 'border2',
              })}
            />
          ))}
        </div>

        {/* scroll container (the real scrollElementRef) */}
        <div ref={stageRef} className={STAGE_SCROLL_CLASS}>
          <div {...gridProps}>
            {items.map((item) => {
              const d = data[item.index];
              if (!d) return null;
              const isSkeleton = skeletonFrom !== null && item.index >= skeletonFrom;
              return (
                <div key={item.key} {...getItemProps(item)}>
                  {isSkeleton ? (
                    <SkeletonCard height={d.height} />
                  ) : (
                    <ArchetypeCard d={d} item={item} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* footer — fades in over the stage; AUTO end-reached vs MANUAL load-more */}
        <div
          className={css({
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            px: '12px',
            py: '10px',
            pointerEvents: 'none',
            background: 'linear-gradient(to top, token(colors.page) 55%, transparent)',
          })}
        >
          {loadMode === 'auto' ? (
            <code
              className={css({
                fontFamily: 'mono',
                fontSize: '11px',
                color: 'coral',
                bg: 'rgba(244,112,103,0.10)',
                border: '1px solid',
                borderColor: 'coral',
                borderRadius: '6px',
                px: '8px',
                py: '4px',
              })}
            >
              useEndReached → fetchNextPage()
            </code>
          ) : (
            <button
              type="button"
              onClick={loadMore}
              disabled={loading}
              className={css({
                pointerEvents: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                px: '14px',
                height: '30px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: 'coral',
                bg: 'rgba(244,112,103,0.10)',
                color: 'coral',
                cursor: loading ? 'default' : 'pointer',
                fontFamily: 'mono',
                fontSize: '11px',
                letterSpacing: '.04em',
                opacity: loading ? '0.6' : '1',
                _focusVisible: {
                  outline: '2px solid',
                  outlineColor: 'coral',
                  outlineOffset: '2px',
                },
              })}
            >
              <span aria-hidden>↓</span> Load more
            </button>
          )}
          {loading && (
            <span
              className={css({
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'mono',
                fontSize: '11px',
                color: 't3',
              })}
            >
              <LoadingDots />
              mounting {skeletonFrom === null ? 0 : data.length - skeletonFrom} skeletons
            </span>
          )}
        </div>
      </div>

      <span className={css({ fontFamily: 'mono', fontSize: '11px', color: 't4' })}>
        {'// heights are measured post-layout, never equalized · the feed only grows'}
      </span>
    </div>
  );
}

// The scroll container also establishes the `@container` context (class hook
// `ksk-stage`) that maps width → `--lanes` on `[data-kaskaid-grid]`.
const STAGE_SCROLL_CLASS = `ksk-stage ${css({
  position: 'absolute',
  inset: 0,
  overflow: 'auto',
  p: '10px',
})}`;
