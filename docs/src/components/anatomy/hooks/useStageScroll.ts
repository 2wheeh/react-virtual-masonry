import { useEffect, useRef, useState, type RefObject } from 'react';

export interface StageScroll {
  // Attach to the real scroll container (the library's `scrollElementRef`).
  stageRef: RefObject<HTMLDivElement | null>;
  // Stage scroll window (rAF-throttled): scrollTop + clientHeight.
  scroll: { top: number; h: number };
}

// Owns the stage scroll element ref and tracks its scroll window (rAF-throttled)
// — drives the VISIBLE stat and the minimap window box. Owning `stageRef` via
// useRef keeps the effect's dependency array honestly empty.
export function useStageScroll(): StageScroll {
  const stageRef = useRef<HTMLDivElement>(null);
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

  return { stageRef, scroll };
}
