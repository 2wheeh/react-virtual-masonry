import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react';

// Keyboard nudge step for the drag handle (px per Arrow key).
const HANDLE_STEP = 20;

export interface StageResize {
  // Attach to the stage column (the element that resizes) and its row wrapper.
  stageColRef: RefObject<HTMLDivElement | null>;
  stageRowRef: RefObject<HTMLDivElement | null>;
  // Explicit stage width (px) once the user has dragged the handle; null = flex.
  stageW: number | null;
  // Live drag-handle geometry so the keyboard resize and the ARIA range values
  // (valuemin/max/now) share the same clamp bounds the mouse drag uses.
  dragBounds: { w: number; min: number; max: number };
  onHandleDown: (e: ReactMouseEvent) => void;
  onHandleKey: (e: ReactKeyboardEvent) => void;
}

// Drag the right-edge handle to resize the stage; the @container query then
// recomputes `--lanes` live, so lane count visibly tracks the drag. Mouse drag
// and keyboard (←/→) share one clamp: min 280; max = available row width. Owns
// the column/row refs so its effects read stable (useRef) identities.
export function useStageResize(): StageResize {
  const stageColRef = useRef<HTMLDivElement>(null);
  const stageRowRef = useRef<HTMLDivElement>(null);
  const [stageW, setStageW] = useState<number | null>(null);
  const [dragBounds, setDragBounds] = useState({ w: 0, min: 280, max: 320 });

  // The active drag's teardown is parked in a ref so an unmount mid-drag can't
  // leak the window-level move/up listeners.
  const dragCleanup = useRef<(() => void) | null>(null);
  const onHandleDown = useCallback((e: ReactMouseEvent) => {
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
    (e: ReactKeyboardEvent) => {
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

  return { stageColRef, stageRowRef, stageW, dragBounds, onHandleDown, onHandleKey };
}
