'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMasonry, useEndReached, type UseMasonryReturn } from 'react-virtual-masonry';
import { css } from '../../styled-system/css';

// The library returns TanStack `VirtualItem`s but doesn't re-export the type;
// derive it from the return shape so docs needn't depend on @tanstack directly.
type VirtualItem = UseMasonryReturn['items'][number];

// Monospace stack for the instrument-panel numerals / code chips.
const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

// Slider fill (product mode) — not a semantic token; theme-flipped inline.
const FILL_LIGHT = '#a8a8ac';
const FILL_DARK = '#5b5860';
const KNOB_LIGHT = '#ffffff';
const KNOB_DARK = '#eeeef0';

// Lane accent colors (theme-invariant brand constants; mirror panda tokens).
const LANE_COLORS = ['#5B8DEF', '#3DA35D', '#B983FF'];

// ---------------------------------------------------------------------------
// Deterministic feed data — stable across re-renders (no Math.random). Two-seed
// sin hash so archetype / height / metadata vary independently but reproducibly.
// ---------------------------------------------------------------------------
const ARCHETYPES = ['image', 'short', 'tall', 'quote'] as const;
type Archetype = (typeof ARCHETYPES)[number];

interface Descriptor {
  height: number;
  archetype: Archetype;
  name: string;
  handle: string;
  time: string;
  replies: number;
  reposts: number;
  likes: number;
}

const NAMES = [
  'Ada Lovelace',
  'Grace Hopper',
  'Alan Kay',
  'Radia Perlman',
  'Linus T.',
  'Margaret H.',
  'Ken Thompson',
  'Barbara Liskov',
];
const HANDLES = ['ada', 'ghopper', 'alankay', 'radia', 'torvalds', 'mhamilton', 'ken', 'liskov'];

function hash(n: number, seed: number): number {
  const x = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const ITEM_COUNT = 72;
// One appended "page" of the infinite feed (AUTO end-reached / MANUAL load-more).
const PAGE_SIZE = 24;
// The `+10k` chip appends exactly this many items in a single click.
const BULK_COUNT = 10_000;

// A descriptor is a pure function of its absolute index, so appended pages and
// the +10k bulk keep every earlier item's height/archetype byte-for-byte stable
// — the measured layout never reflows out from under the user as the feed grows.
function makeItem(i: number): Descriptor {
  const archetype = ARCHETYPES[Math.floor(hash(i, 1) * ARCHETYPES.length) % ARCHETYPES.length];
  let height: number;
  switch (archetype) {
    case 'image':
      height = 200 + Math.round(hash(i, 2) * 90);
      break;
    case 'short':
      height = 96 + Math.round(hash(i, 2) * 44);
      break;
    case 'tall':
      height = 230 + Math.round(hash(i, 2) * 90);
      break;
    default:
      height = 130 + Math.round(hash(i, 2) * 60);
  }
  return {
    height,
    archetype,
    name: NAMES[i % NAMES.length],
    handle: `@${HANDLES[i % HANDLES.length]}`,
    time: `${1 + Math.floor(hash(i, 3) * 23)}h`,
    replies: Math.round(hash(i, 4) * 30),
    reposts: Math.round(hash(i, 5) * 40),
    likes: Math.round(hash(i, 6) * 200),
  };
}

function makeRange(start: number, count: number): Descriptor[] {
  return Array.from({ length: count }, (_, k) => makeItem(start + k));
}

// ---------------------------------------------------------------------------
// Header stat pod.
// ---------------------------------------------------------------------------
function StatPod({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className={css({ display: 'flex', flexDirection: 'column', gap: '3px' })}>
      <span
        data-testid={testId}
        className={css({
          fontFamily: MONO,
          fontSize: '19px',
          lineHeight: '1',
          fontVariantNumeric: 'tabular-nums',
          color: 'heading',
          _xray: { color: 'coral' },
        })}
      >
        {value}
      </span>
      <span
        className={css({
          fontSize: '9px',
          letterSpacing: '.09em',
          textTransform: 'uppercase',
          color: 't3',
        })}
      >
        {label}
      </span>
    </div>
  );
}

function Middot() {
  return (
    <span aria-hidden className={css({ color: 'border2', fontSize: '14px', userSelect: 'none' })}>
      ·
    </span>
  );
}

function AlignButton({
  num,
  sub,
  active,
  onClick,
}: {
  num: string;
  sub: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={css({
        flex: '1',
        minWidth: '0',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        alignItems: 'flex-start',
        px: '10px',
        py: '8px',
        borderRadius: '8px',
        border: '1px solid',
        borderColor: active ? 'coral' : 'border',
        bg: active ? 'rgba(244,112,103,0.08)' : 'card',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background .15s, border-color .15s',
        _xray: active ? { bg: 'coral', borderColor: 'coral' } : {},
        _focusVisible: { outline: '2px solid', outlineColor: 'coral', outlineOffset: '2px' },
      })}
    >
      <span
        className={css({
          fontFamily: MONO,
          fontSize: '15px',
          lineHeight: '1',
          fontVariantNumeric: 'tabular-nums',
          color: active ? 'heading' : 't2',
          _xray: active ? { color: 'markText' } : {},
        })}
      >
        {num} →
      </span>
      <span
        className={css({
          fontSize: '9px',
          letterSpacing: '.09em',
          textTransform: 'uppercase',
          color: 't3',
          _xray: active ? { color: 'markText' } : {},
        })}
      >
        {sub}
      </span>
    </button>
  );
}

function Segmented({
  value,
  onChange,
}: {
  value: 'auto' | 'manual';
  onChange?: (v: 'auto' | 'manual') => void;
}) {
  const seg = (v: 'auto' | 'manual', label: string) => {
    const active = value === v;
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={() => onChange?.(v)}
        className={css({
          px: '14px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          fontFamily: MONO,
          fontSize: '11px',
          letterSpacing: '.06em',
          border: 'none',
          cursor: 'pointer',
          bg: active ? 'sidebarActive' : 'transparent',
          color: active ? 'heading' : 't3',
          _xray: active ? { color: 'coral' } : {},
          _focusVisible: { outline: '2px solid', outlineColor: 'coral', outlineOffset: '-2px' },
        })}
      >
        {label}
      </button>
    );
  };
  return (
    <div
      className={css({
        display: 'inline-flex',
        border: '1px solid',
        borderColor: 'border',
        borderRadius: '8px',
        overflow: 'hidden',
        height: '30px',
      })}
    >
      {seg('auto', 'AUTO')}
      <div className={css({ width: '1px', bg: 'border' })} />
      {seg('manual', 'MANUAL')}
    </div>
  );
}

function Slider({
  label,
  value,
  fillPct,
  min,
  max,
  step = 1,
  numericValue,
  onChange,
}: {
  label: string;
  value: string;
  fillPct: number;
  min: number;
  max: number;
  step?: number;
  numericValue: number;
  onChange?: (v: number) => void;
}) {
  return (
    <div className={css({ display: 'flex', alignItems: 'center', gap: '12px' })}>
      <span
        className={css({
          fontFamily: MONO,
          fontSize: '11px',
          letterSpacing: '.06em',
          color: 't3',
          width: '78px',
          flexShrink: 0,
        })}
      >
        {label}
      </span>
      <div
        className={css({
          position: 'relative',
          flex: '1',
          height: '12px',
          borderRadius: '2px',
          // The real <input> is opacity:0, so surface its keyboard focus here.
          '&:has(input:focus-visible)': {
            outline: '2px solid',
            outlineColor: 'coral',
            outlineOffset: '4px',
          },
        })}
      >
        <div
          className={css({
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '4px',
            transform: 'translateY(-50%)',
            bg: 'track',
            borderRadius: 'full',
          })}
        />
        <div
          className={css({
            position: 'absolute',
            top: '50%',
            left: 0,
            height: '4px',
            transform: 'translateY(-50%)',
            bg: FILL_LIGHT,
            _dark: { bg: FILL_DARK },
            _xray: { bg: 'coral' },
            borderRadius: 'full',
          })}
          style={{ width: `${fillPct}%` }}
        />
        <div
          className={css({
            position: 'absolute',
            top: '50%',
            width: '12px',
            height: '12px',
            transform: 'translate(-50%, -50%)',
            borderRadius: 'full',
            bg: KNOB_LIGHT,
            border: '1px solid',
            borderColor: 'border',
            _dark: { bg: KNOB_DARK, borderColor: 'transparent' },
          })}
          style={{ left: `${fillPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={numericValue}
          onChange={(e) => onChange?.(Number(e.target.value))}
          aria-label={label}
          aria-valuetext={value}
          className={css({
            position: 'absolute',
            inset: 0,
            width: '100%',
            margin: 0,
            opacity: 0,
            cursor: 'pointer',
          })}
        />
      </div>
      <span
        className={css({
          fontFamily: MONO,
          fontSize: '11px',
          color: 't2',
          minWidth: '64px',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        })}
      >
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ children, width }: { children: ReactNode; width?: string }) {
  return (
    <span
      className={css({
        fontFamily: MONO,
        fontSize: '11px',
        letterSpacing: '.09em',
        textTransform: 'uppercase',
        color: 't3',
      })}
      style={width ? { width, flexShrink: 0 } : undefined}
    >
      {children}
    </span>
  );
}

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
function ArchetypeCard({ d, item, xray }: { d: Descriptor; item: VirtualItem; xray: boolean }) {
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
            fontFamily: MONO,
            fontSize: '10px',
            color: 't3',
          })}
        >
          <span>↩ {d.replies}</span>
          <span>⇄ {d.reposts}</span>
          <span>♡ {d.likes}</span>
        </div>
      </div>

      {/* x-ray overlay */}
      {xray && (
        <>
          <div
            className={css({
              position: 'absolute',
              inset: 0,
              borderRadius: '10px',
              border: '1px solid',
              borderColor: 'coral',
              boxShadow: '0 0 0 3px rgba(244,112,103,0.14), inset 0 0 12px rgba(244,112,103,0.10)',
              pointerEvents: 'none',
            })}
          />
          {/* lane stripe */}
          <div
            className={css({ position: 'absolute', top: 0, bottom: 0, left: 0, width: '3px' })}
            style={{ background: laneColor }}
          />
          {/* index · size chip (decorative annotation — hidden from AT) */}
          <span
            data-testid="xray-chip"
            aria-hidden
            className={css({
              position: 'absolute',
              top: '6px',
              left: '8px',
              fontFamily: MONO,
              fontSize: '9px',
              color: 'markText',
              bg: 'coral',
              borderRadius: '4px',
              px: '5px',
              py: '2px',
              fontVariantNumeric: 'tabular-nums',
            })}
          >
            #{item.index} · {Math.round(item.size)}px
          </span>
          {/* lane badge */}
          <span
            aria-hidden
            className={css({
              position: 'absolute',
              top: '6px',
              right: '8px',
              fontFamily: MONO,
              fontSize: '9px',
              color: 'markText',
              borderRadius: '4px',
              px: '5px',
              py: '2px',
            })}
            style={{ background: laneColor }}
          >
            L{item.lane}
          </span>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// In-flight page placeholder. Same descriptor height as the eventual real card
// (so lanes don't reflow when it resolves), a shimmering `skbg` fill, and no
// x-ray chip — a skeleton has no measured `item` identity worth annotating.
// The `data-rvm-anim` hook lets the reduced-motion `<style>` kill the shimmer.
// ---------------------------------------------------------------------------
function SkeletonCard({ height }: { height: number }) {
  return (
    <div
      className={css({
        boxSizing: 'border-box',
        border: '1px solid',
        borderColor: 'border',
        borderRadius: '10px',
        bg: 'card',
        overflow: 'hidden',
        p: '10px',
      })}
      style={{ height }}
    >
      <div
        data-rvm-anim
        className={css({
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          animation: 'rvmsk 1.2s ease-in-out infinite',
        })}
      >
        <div className={css({ display: 'flex', alignItems: 'center', gap: '8px' })}>
          <div
            className={css({
              width: '34px',
              height: '34px',
              borderRadius: 'full',
              bg: 'skbg',
              flexShrink: 0,
            })}
          />
          <div className={css({ display: 'flex', flexDirection: 'column', gap: '6px' })}>
            <div
              className={css({ width: '90px', height: '8px', borderRadius: '3px', bg: 'skbg' })}
            />
            <div
              className={css({ width: '60px', height: '6px', borderRadius: '3px', bg: 'skbg' })}
            />
          </div>
        </div>
        <div className={css({ flex: '1', borderRadius: '8px', bg: 'skbg' })} />
      </div>
    </div>
  );
}

// Three coral dots that pulse in sequence — the "fetching" tell in the footer.
function LoadingDots() {
  return (
    <span aria-hidden className={css({ display: 'inline-flex', gap: '4px', alignItems: 'center' })}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          data-rvm-anim
          className={css({
            width: '5px',
            height: '5px',
            borderRadius: 'full',
            bg: 'coral',
            animation: 'rvmdot 1s ease-in-out infinite',
          })}
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}

export function DemoPlayground() {
  const [xray] = useState(true);

  // The last `scrollToIndex` invocation, mirrored into the code chip + the
  // active (coral) align button. `btn` is the pressed control; `index/align`
  // are the *actual* arguments (random resolves to a live in-range index).
  const [scrollBtn, setScrollBtn] = useState<'start' | 'center' | 'end' | 'random'>('start');
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
  const [data, setData] = useState<Descriptor[]>(() => makeRange(0, ITEM_COUNT));
  // Trailing in-flight page: items at index ≥ skeletonFrom render as skeletons.
  const [skeletonFrom, setSkeletonFrom] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [touring, setTouring] = useState(false);
  // Explicit stage width (px) once the user has dragged the handle; null = flex.
  const [stageW, setStageW] = useState<number | null>(null);
  // Reflected `prefers-reduced-motion` — gates TOUR autoplay (the shimmer/dot
  // keyframes are handled purely in CSS by the reduced-motion `<style>` above).
  const [reduceMotion, setReduceMotion] = useState(false);
  // Live drag-handle geometry so the keyboard resize and the ARIA range values
  // (valuemin/max/now) share the same clamp bounds the mouse drag uses.
  const [dragBounds, setDragBounds] = useState({ w: 0, min: 280, max: 320 });

  // Refs the imperative callbacks read so they can stay identity-stable (the
  // end-reached effect depends on `loadMore`'s identity — a fresh closure each
  // render would re-arm it every commit).
  const dataRef = useRef(data);
  dataRef.current = data;
  const loadingRef = useRef(false);
  const randomRef = useRef(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const stageColRef = useRef<HTMLDivElement>(null);
  const stageRowRef = useRef<HTMLDivElement>(null);

  const { gridProps, getItemProps, items, lanes, scrollToIndex } = useMasonry({
    data,
    // Guard the lookup: the virtualizer can probe an index transiently out of
    // range (e.g. mid-`scrollToIndex`), and `data[i]` would then be undefined.
    estimateSize: (i) => data[i]?.height ?? 0,
    gutter,
    overscan,
    scrollElementRef: stageRef,
  });

  // Append one page. A `loading` flag both renders the skeletons and, wired to
  // useEndReached's `disabled`, hard-guards against a second fetch mid-flight —
  // set BEFORE the await, cleared in `finally`, so one scroll-to-end = one page.
  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    const from = dataRef.current.length;
    setSkeletonFrom(from);
    // Grow now so the placeholders mount immediately; they read as skeletons
    // until `loading` clears, then flip to real cards in place (same heights).
    setData((prev) => prev.concat(makeRange(prev.length, PAGE_SIZE)));
    try {
      await new Promise((r) => setTimeout(r, 700));
    } finally {
      setLoading(false);
      setSkeletonFrom(null);
      loadingRef.current = false;
    }
  }, []);

  // AUTO fires near the end; MANUAL never auto-fires (disabled). Either way a
  // fetch already in flight suppresses re-entry.
  useEndReached(items, data.length, loadMore, {
    threshold,
    disabled: loadMode === 'manual' || loading,
  });

  // `+10k` — one-shot bulk append (NOT a page/skeleton load). ITEMS jumps by
  // 10,000; MOUNTED stays bounded because the virtualizer only mounts the window.
  const appendBulk = useCallback(() => {
    setData((prev) => prev.concat(makeRange(prev.length, BULK_COUNT)));
  }, []);

  // Drive one align/scroll interaction and reflect it into the chip + buttons.
  const runScroll = useCallback(
    (btn: 'start' | 'center' | 'end' | 'random') => {
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
        randomRef.current += 1;
        index = Math.floor(hash(randomRef.current, 7) * dataRef.current.length);
        align = 'auto';
      }
      setScrollBtn(btn);
      setScrollArgs({ index, align });
      scrollToIndex(index, { align });
    },
    [scrollToIndex]
  );

  // TOUR — climb through the feed. With motion allowed it autoplays on an
  // interval; pause clears it. Under `prefers-reduced-motion` there is NO
  // repeating interval: each click performs a single deliberate jump instead,
  // so nothing moves unless the user asks for it.
  const tourTimer = useRef<number | null>(null);
  const tourStep = useRef(0);
  const stopTour = useCallback(() => {
    if (tourTimer.current !== null) {
      clearInterval(tourTimer.current);
      tourTimer.current = null;
    }
    setTouring(false);
  }, []);
  const toggleTour = useCallback(() => {
    if (tourTimer.current !== null) {
      stopTour();
      return;
    }
    // Reduced motion: one jump per click, no autoplay, no sustained `touring`.
    if (reduceMotion) {
      const len = dataRef.current.length;
      tourStep.current = (tourStep.current + 1) % Math.max(Math.ceil(len / 10), 1);
      const index = Math.min(tourStep.current * 10, len - 1);
      scrollToIndex(index, { align: 'center' });
      setScrollArgs({ index, align: 'center' });
      return;
    }
    setTouring(true);
    tourStep.current = 0;
    tourTimer.current = window.setInterval(() => {
      tourStep.current += 1;
      const len = dataRef.current.length;
      const index = Math.min(tourStep.current * 10, len - 1);
      scrollToIndex(index, { align: 'center' });
      setScrollArgs({ index, align: 'center' });
      if (index >= len - 1) tourStep.current = 0; // loop back to the top of the feed
    }, 1100);
  }, [scrollToIndex, stopTour, reduceMotion]);
  useEffect(() => () => stopTour(), [stopTour]); // clear the interval on unmount

  // Reflect `prefers-reduced-motion` into state (Playwright's emulateMedia and
  // OS-level changes both fire the `change` event).
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Drag the right-edge handle to resize the stage; the @container query then
  // recomputes `--lanes` live, so lane count visibly tracks the drag. The active
  // drag's teardown is parked in a ref so an unmount mid-drag can't leak the
  // window-level move/up listeners.
  const dragCleanup = useRef<(() => void) | null>(null);
  const onHandleDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const col = stageColRef.current;
    const row = stageRowRef.current;
    if (!col || !row) return;
    const startX = e.clientX;
    const startW = col.getBoundingClientRect().width;
    // Row content width (clientWidth − p:16×2) minus the 60px minimap + 14px gap.
    const avail = row.clientWidth - 32 - 60 - 14;
    const maxW = Math.max(320, avail);
    const move = (ev: MouseEvent) => {
      setStageW(Math.min(Math.max(startW + (ev.clientX - startX), 280), maxW));
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      document.body.style.userSelect = '';
      dragCleanup.current = null;
    };
    dragCleanup.current = up;
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }, []);
  // Dispose any in-flight drag if the component unmounts before mouseup.
  useEffect(() => () => dragCleanup.current?.(), []);

  // Keyboard-operable separator: ←/→ nudge the width by a fixed step, clamped to
  // the SAME [min, max] the mouse drag uses (min 280; max = available row width).
  const HANDLE_STEP = 20;
  const resizeStage = useCallback(
    (delta: number) => {
      setStageW((prev) => {
        const col = stageColRef.current;
        const cur = prev ?? (col ? col.getBoundingClientRect().width : dragBounds.w);
        return Math.min(Math.max(cur + delta, dragBounds.min), dragBounds.max);
      });
    },
    [dragBounds]
  );
  const onHandleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        resizeStage(-HANDLE_STEP);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        resizeStage(HANDLE_STEP);
      }
    },
    [resizeStage]
  );

  // Track the stage-column width + the clamp ceiling so the drag-handle ARIA
  // range values stay honest and the keyboard step clamps correctly. Same
  // arithmetic as `onHandleDown` (row content width − minimap 60 − gap 14 − p16×2).
  useEffect(() => {
    const col = stageColRef.current;
    const row = stageRowRef.current;
    if (!col || !row) return;
    const measure = () => {
      const avail = row.clientWidth - 32 - 60 - 14;
      setDragBounds({
        w: Math.round(col.getBoundingClientRect().width),
        min: 280,
        max: Math.max(320, avail),
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(col);
    ro.observe(row);
    return () => ro.disconnect();
  }, []);

  // Stage scroll window (rAF-throttled) drives VISIBLE + the minimap window box.
  const [scroll, setScroll] = useState({ top: 0, h: 0 });
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      setScroll({ top: el.scrollTop, h: el.clientHeight });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    // Scroll drives `top`; a ResizeObserver drives `h` — the stage's clientHeight
    // isn't constrained on the first commit (CSS applies async in dev), so a
    // one-shot read would capture a bogus content-height. The RO also fires when
    // the container narrows (lane changes), keeping the viewport window honest.
    el.addEventListener('scroll', schedule, { passive: true });
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', schedule);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // VISIBLE = mounted items whose [start, start+size] intersects the viewport.
  const visible = useMemo(
    () =>
      items.filter((it) => it.start < scroll.top + scroll.h && it.start + it.size > scroll.top)
        .length,
    [items, scroll]
  );

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

  const MINIMAP_H = 544;
  // ONE scale for the whole minimap. The window is in the virtualizer's real
  // coordinate space and the blocks are in the schematic's — but both are packed
  // with the same lane count / heights / gutter, so their totals agree and this
  // single px-per-unit factor keeps the window box locked onto the blocks.
  const scale = MINIMAP_H / minimap.total;
  const winTop = scroll.top * scale;
  const winH = Math.max(scroll.h * scale, 6);

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

      {/* ============================= HEADER ============================= */}
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          px: '16px',
          py: '14px',
          borderBottom: '1px solid',
          borderColor: 'border',
          bg: 'surf',
        })}
      >
        <div
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            rowGap: '10px',
          })}
        >
          <StatPod label="Items" value={data.length.toLocaleString()} testId="stat-items" />
          <Middot />
          <StatPod label="Mounted" value={`${items.length}`} testId="stat-mounted" />
          <Middot />
          <StatPod label="Visible" value={`${visible}`} testId="stat-visible" />
          <button
            type="button"
            onClick={appendBulk}
            aria-label="Append 10,000 items"
            className={css({
              fontFamily: MONO,
              fontSize: '11px',
              color: 't2',
              bg: 'panel',
              border: '1px solid',
              borderColor: 'border',
              borderRadius: '6px',
              px: '8px',
              py: '4px',
              cursor: 'pointer',
              _hover: { borderColor: 'border2', color: 'heading' },
              _focusVisible: { outline: '2px solid', outlineColor: 'coral', outlineOffset: '2px' },
            })}
          >
            +10k
          </button>
        </div>

        <div
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            rowGap: '10px',
          })}
        >
          <StatPod label="Container" value={`lanes: ${lanes}`} />
          <div className={css({ width: '1px', height: '28px', bg: 'border' })} />
          <button
            type="button"
            onClick={toggleTour}
            aria-pressed={touring}
            aria-label={touring ? 'Pause tour' : 'Play tour'}
            className={css({
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              px: '12px',
              height: '30px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: touring ? 'coral' : 'border',
              bg: touring ? 'rgba(244,112,103,0.08)' : 'card',
              color: touring ? 'coral' : 't2',
              cursor: 'pointer',
              fontFamily: MONO,
              fontSize: '11px',
              letterSpacing: '.06em',
              transition: 'background .15s, border-color .15s, color .15s',
              _focusVisible: { outline: '2px solid', outlineColor: 'coral', outlineOffset: '2px' },
            })}
          >
            <span aria-hidden>{touring ? '❚❚' : '▶'}</span> TOUR
          </button>
        </div>
      </div>

      {/* ========================= CONTROL PANEL ========================= */}
      <div
        className={css({
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          p: '16px',
          borderBottom: '1px solid',
          borderColor: 'border',
        })}
      >
        <div
          className={css({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          })}
        >
          <SectionLabel>Scroll API</SectionLabel>
          <code
            data-testid="scroll-api"
            className={css({
              fontFamily: MONO,
              fontSize: '12px',
              color: 't2',
              bg: 'panel',
              border: '1px solid',
              borderColor: 'border',
              borderRadius: '6px',
              px: '8px',
              py: '4px',
              // Narrow viewports: scroll the chip within itself rather than
              // letting the glyph string push the panel wider.
              maxWidth: '100%',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              _xray: {
                color: 'coral',
                bg: 'rgba(244,112,103,0.10)',
                borderColor: 'coral',
                boxShadow: '0 0 0 3px rgba(244,112,103,0.12)',
              },
            })}
          >
            scrollToIndex({scrollArgs.index}, {'{'} align: '{scrollArgs.align}' {'}'})
          </code>
        </div>

        <div className={css({ display: 'flex', gap: '10px' })}>
          <AlignButton
            num="184"
            sub="START"
            active={scrollBtn === 'start'}
            onClick={() => runScroll('start')}
          />
          <AlignButton
            num="198"
            sub="CENTER"
            active={scrollBtn === 'center'}
            onClick={() => runScroll('center')}
          />
          <AlignButton
            num="212"
            sub="END"
            active={scrollBtn === 'end'}
            onClick={() => runScroll('end')}
          />
          <AlignButton
            num="random"
            sub="AUTO"
            active={scrollBtn === 'random'}
            onClick={() => runScroll('random')}
          />
        </div>

        <div
          className={css({ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' })}
        >
          <SectionLabel width="78px">Load</SectionLabel>
          <Segmented value={loadMode} onChange={setLoadMode} />
          <code
            data-testid="load-caption"
            className={css({ fontFamily: MONO, fontSize: '11px', color: 't3' })}
          >
            endReachedDisabled: {loadMode === 'manual' ? 'true' : 'false'}
          </code>
        </div>

        <div className={css({ display: 'flex', flexDirection: 'column', gap: '10px' })}>
          <Slider
            label="GUTTER"
            value={`${gutter} px`}
            fillPct={Math.round((gutter / 40) * 100)}
            min={0}
            max={40}
            step={2}
            numericValue={gutter}
            onChange={setGutter}
          />
          <Slider
            label="OVERSCAN"
            value={`${overscan}`}
            fillPct={Math.round((overscan / 10) * 100)}
            min={0}
            max={10}
            numericValue={overscan}
            onChange={setOverscan}
          />
          <Slider
            label="THRESHOLD"
            value={`${threshold} items`}
            fillPct={Math.round((threshold / 10) * 100)}
            min={0}
            max={10}
            numericValue={threshold}
            onChange={setThreshold}
          />
        </div>
      </div>

      {/* ============================= STAGE ============================= */}
      <div
        ref={stageRowRef}
        className={css({ display: 'flex', gap: '14px', p: '16px', alignItems: 'stretch' })}
      >
        {/* minimap */}
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
              return (
                <div
                  key={i}
                  className={css({ position: 'absolute', borderRadius: '1px', opacity: '0.85' })}
                  style={{
                    left: `${b.lane * colW + colW * 0.12}%`,
                    width: `${colW * 0.76}%`,
                    top: b.start * scale,
                    height: Math.max(b.size * scale, 1),
                    background: xray ? LANE_COLORS[b.lane % LANE_COLORS.length] : 'currentColor',
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
                border: '1px solid',
                borderColor: 'coral',
                _xray: {
                  boxShadow: '0 0 0 2px rgba(244,112,103,0.25)',
                  bg: 'rgba(244,112,103,0.08)',
                },
              })}
              style={{ top: winTop, height: winH }}
            />
          </div>
        </div>

        {/* stage */}
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
            {xray && (
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
                    top: '-9px',
                    fontFamily: MONO,
                    fontSize: '9px',
                    color: 'markText',
                    bg: 'coral',
                    borderRadius: '3px',
                    px: '4px',
                    py: '1px',
                    fontVariantNumeric: 'tabular-nums',
                  })}
                >
                  endReachedThreshold: {threshold}
                </span>
              </div>
            )}

            {/* --lanes readout */}
            <div
              data-testid="lanes-readout"
              className={css({
                position: 'absolute',
                top: '10px',
                right: '18px',
                zIndex: 3,
                fontFamily: MONO,
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
            <div ref={stageRef} className={cssStage()}>
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
                        <ArchetypeCard d={d} item={item} xray={xray} />
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
                <>
                  <code
                    className={css({
                      fontFamily: MONO,
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
                  {loading && (
                    <span
                      className={css({
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontFamily: MONO,
                        fontSize: '11px',
                        color: 't3',
                      })}
                    >
                      <LoadingDots />
                      mounting {skeletonFrom === null ? 0 : data.length - skeletonFrom} skeletons
                    </span>
                  )}
                </>
              ) : (
                <>
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
                      fontFamily: MONO,
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
                  {loading && (
                    <span
                      className={css({
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontFamily: MONO,
                        fontSize: '11px',
                        color: 't3',
                      })}
                    >
                      <LoadingDots />
                      mounting {skeletonFrom === null ? 0 : data.length - skeletonFrom} skeletons
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <span className={css({ fontFamily: MONO, fontSize: '11px', color: 't4' })}>
            {'// heights are measured post-layout, never equalized · the feed only grows'}
          </span>
        </div>
      </div>
    </div>
  );
}

// The scroll container also establishes the `@container` context (class hook
// `rvm-stage`) that maps width → `--lanes` on `[data-rvm-grid]`.
function cssStage() {
  return `rvm-stage ${css({
    position: 'absolute',
    inset: 0,
    overflow: 'auto',
    p: '10px',
  })}`;
}
