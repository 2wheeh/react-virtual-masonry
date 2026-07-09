import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useMasonry, type UseMasonryOptions } from './useMasonry';

// Proves items virtualize against a 400px-tall `overflow:auto` element instead
// of the window when `scrollElementRef` is passed, that the visible range tracks
// that element's `scrollTop` (not `window.scrollY`), and that omitting the ref
// leaves window mode untouched.
describe('useMasonry — scrollElementRef', () => {
  let container: HTMLDivElement;
  let scrollTop = 0;

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

    container = document.createElement('div');
    // happy-dom has no layout engine — stub the rect/scroll surface the
    // virtualizer reads (mirrors the offsetTop stubbing in useOffsetTop.test.ts).
    Object.defineProperty(container, 'offsetHeight', { value: 400, configurable: true });
    Object.defineProperty(container, 'offsetWidth', { value: 800, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 400, configurable: true });
    Object.defineProperty(container, 'scrollHeight', { value: 100_000, configurable: true });
    scrollTop = 0;
    Object.defineProperty(container, 'scrollTop', {
      get: () => scrollTop,
      set: (v: number) => {
        scrollTop = v;
      },
      configurable: true,
    });
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.removeChild(container);
  });

  it('renders a windowed slice of a 1000-item list scoped to the container', () => {
    const data = Array.from({ length: 1000 }, (_, i) => i);
    const scrollElementRef = { current: container };

    const { result } = renderHook(() =>
      useMasonry({ data, estimateSize: () => 100, scrollElementRef })
    );

    // Virtualized: nowhere near all 1000 items are in the visible range.
    expect(result.current.items.length).toBeGreaterThan(0);
    expect(result.current.items.length).toBeLessThan(50);

    // Scoped to the container, not window.scrollY (which stays 0 throughout).
    const initialMaxIndex = Math.max(...result.current.items.map((item) => item.index));

    act(() => {
      container.scrollTop = 5000;
      container.dispatchEvent(new Event('scroll'));
    });

    const scrolledIndexes = result.current.items.map((item) => item.index);
    const scrolledMinIndex = Math.min(...scrolledIndexes);

    expect(scrolledMinIndex).toBeGreaterThan(initialMaxIndex);
  });

  it('leaves window scroll mode unaffected when scrollElementRef is omitted', () => {
    const data = Array.from({ length: 20 }, (_, i) => i);

    const { result } = renderHook(() => useMasonry({ data, estimateSize: () => 100 }));

    // `virtualizer.scrollElement` resolves to the window global, not the
    // (unused, disabled) element virtualizer's container.
    expect(result.current.virtualizer.scrollElement).toBe(window);
  });

  it('exposes the container scrollOffset and viewportSize, tracking scroll', () => {
    const data = Array.from({ length: 1000 }, (_, i) => i);
    const scrollElementRef = { current: container };

    const { result } = renderHook(() =>
      useMasonry({ data, estimateSize: () => 100, scrollElementRef })
    );

    // viewportSize mirrors the container's measured height (clientHeight: 400).
    expect(result.current.viewportSize).toBe(400);
    // Offset starts at the container's scrollTop (0), not window.scrollY.
    expect(result.current.scrollOffset).toBe(0);

    act(() => {
      container.scrollTop = 5000;
      container.dispatchEvent(new Event('scroll'));
    });

    // Reactive: the offset follows the container's scrollTop after a scroll.
    expect(result.current.scrollOffset).toBe(5000);
    expect(result.current.viewportSize).toBe(400);
  });

  it('rejects `ssr` + `scrollElementRef` together at the type level', () => {
    const scrollElementRef = { current: null as HTMLElement | null };
    // Container mode is client-only; SSR is window-only. Passing both must not
    // compile — `scrollElementRef` is typed `never` on the SSR arm, so the
    // object matches neither union member.
    // @ts-expect-error scrollElementRef is not allowed alongside ssr
    const invalid: UseMasonryOptions<number> = {
      data: [1, 2, 3],
      estimateSize: () => 100,
      ssr: { itemCount: 3 },
      scrollElementRef,
    };
    expect(invalid).toBeDefined();
  });
});
