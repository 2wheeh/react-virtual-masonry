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

// Stage-width clamp: MIN_W keeps at least one usable lane; MAX_FLOOR guards the
// ceiling against a not-yet-measured row. Mouse drag, keyboard nudge, and the
// ARIA range values all share these bounds.
const MIN_W = 280;
const MAX_FLOOR = 320;

// Width available to the stage column: row content width (clientWidth − p:16×2)
// minus the 60px minimap column and the 14px flex gap. Mirrors the stage-row
// css literals in Anatomy.tsx / Minimap.tsx.
function availWidth(row: HTMLElement): number {
  return row.clientWidth - 32 - 60 - 14;
}

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
  const [dragBounds, setDragBounds] = useState({ w: 0, min: MIN_W, max: MAX_FLOOR });

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
    const maxW = Math.max(MAX_FLOOR, availWidth(row));
    const move = (ev: MouseEvent) => {
      setStageW(Math.min(Math.max(startW + (ev.clientX - startX), MIN_W), maxW));
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

  // Keyboard-operable separator: ←/→ nudge the width by a fixed step, clamped
  // to the same [min, max] the mouse drag uses.
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
  // range values stay honest and the keyboard step clamps correctly.
  useEffect(() => {
    const col = stageColRef.current;
    const row = stageRowRef.current;
    if (!col || !row) return;
    const measure = () => {
      setDragBounds({
        w: Math.round(col.getBoundingClientRect().width),
        min: MIN_W,
        max: Math.max(MAX_FLOOR, availWidth(row)),
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
