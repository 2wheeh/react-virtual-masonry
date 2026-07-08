import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useContainerOffsetTop } from './useContainerOffsetTop';

describe('useContainerOffsetTop', () => {
  beforeEach(() => {
    class ImmediateResizeObserver {
      constructor(private cb: (entries: ResizeObserverEntry[]) => void) {}
      observe(target: Element) {
        this.cb([{ target } as ResizeObserverEntry]);
      }
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ImmediateResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns fallback when either ref has no element', () => {
    const { result } = renderHook(() =>
      useContainerOffsetTop({ current: null }, { current: null }, { fallback: 7 })
    );
    expect(result.current).toBe(7);
  });

  it('is relative to the container padding-box top (excludes the top border)', () => {
    const container = document.createElement('div');
    const el = document.createElement('div');
    container.appendChild(el);
    document.body.appendChild(container);

    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({ top: 100 } as DOMRect);
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ top: 150 } as DOMRect);
    // 10px top border: padding-box top is at 110, so the grid sits 40px into the
    // scroll content — not 50px. Dropping `clientTop` is what keeps items aligned.
    Object.defineProperty(container, 'clientTop', { value: 10, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 0, writable: true, configurable: true });

    const { result } = renderHook(() =>
      useContainerOffsetTop({ current: el }, { current: container }, { fallback: 0 })
    );

    expect(result.current).toBe(40);

    document.body.removeChild(container);
  });
});
